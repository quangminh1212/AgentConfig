import path from "path";
import {
  home, pathExists, readJson, writeJson, commandExists, ensureV1,
} from "../fsutil.js";

const configPath = () => path.join(home(), ".config", "opencode", "opencode.json");
const PROVIDER = "agentconfig";

export async function getStatus() {
  const installed = (await commandExists("opencode")) || (await pathExists(configPath()));
  if (!installed) return { installed: false, configured: false, configPath: configPath() };
  const config = await readJson(configPath());
  const p = config?.provider?.[PROVIDER] || config?.provider?.["9router"];
  return {
    installed: true,
    configured: !!p,
    configPath: configPath(),
    baseUrl: p?.options?.baseURL || null,
    apiKeyMasked: p?.options?.apiKey ? mask(p.options.apiKey) : null,
    model: config?.model || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !model) throw new Error("baseUrl and model are required");
  const url = ensureV1(baseUrl);
  const key = apiKey || "sk-agentconfig";
  let config = (await readJson(configPath())) || {};
  if (!config.provider) config.provider = {};
  const existing = config.provider[PROVIDER] || config.provider["9router"] || {
    pnpm: "@ai-sdk/openai-compatible",
    options: {},
    models: {},
  };
  existing.options = { ...existing.options, baseURL: url, apiKey: key };
  existing.models = existing.models || {};
  existing.models[model] = {
    name: model,
    modalities: { input: ["text", "image"], output: ["text"] },
  };
  config.provider[PROVIDER] = existing;
  delete config.provider["9router"];
  config.model = `${PROVIDER}/${model}`;
  if (!config.agent) config.agent = {};
  config.agent.explorer = {
    description: "Fast explorer subagent",
    mode: "subagent",
    model: `${PROVIDER}/${model}`,
  };
  await writeJson(configPath(), config);
  return { success: true, configPath: configPath() };
}

export async function reset() {
  const config = await readJson(configPath());
  if (!config) return { success: true };
  if (config.provider) {
    delete config.provider[PROVIDER];
    delete config.provider["9router"];
  }
  if (typeof config.model === "string" && /^(agentconfig|9router)\//.test(config.model)) {
    delete config.model;
  }
  await writeJson(configPath(), config);
  return { success: true, configPath: configPath() };
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
