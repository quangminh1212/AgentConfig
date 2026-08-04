import path from "path";
import {
  home, pathExists, readText, writeText, readJson, writeJson, commandExists, ensureV1,
} from "../fsutil.js";

const dir = () => path.join(home(), ".codex");
const configPath = () => path.join(dir(), "config.toml");
const authPath = () => path.join(dir(), "auth.json");
const PROVIDER = "agentconfig";

export async function getStatus() {
  const installed = (await commandExists("codex")) || (await pathExists(configPath()));
  if (!installed) return { installed: false, configured: false, configPath: configPath() };
  const config = await readText(configPath());
  const auth = await readJson(authPath());
  const configured = !!(config && (
    config.includes(`model_provider = "${PROVIDER}"`) ||
    config.includes("[model_providers.agentconfig]") ||
    config.includes('model_provider = "9router"') ||
    config.includes("[model_providers.9router]")
  ));
  const baseMatch = config?.match(/base_url\s*=\s*"([^"]+)"/);
  return {
    installed: true,
    configured,
    configPath: configPath(),
    baseUrl: baseMatch?.[1] || null,
    apiKeyMasked: auth?.OPENAI_API_KEY ? mask(auth.OPENAI_API_KEY) : null,
    model: config?.match(/^model\s*=\s*"([^"]+)"/m)?.[1] || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !apiKey || !model) throw new Error("baseUrl, apiKey and model are required");
  const url = ensureV1(baseUrl);
  let config = (await readText(configPath())) || "";

  // Remove old agentconfig / 9router provider blocks
  config = stripProviderBlocks(config);
  // Update root model / provider
  config = upsertTomlRoot(config, "model", model);
  config = upsertTomlRoot(config, "model_provider", PROVIDER);

  const block = `\n[model_providers.${PROVIDER}]\nname = "AgentConfig"\nbase_url = "${url}"\nwire_api = "responses"\n`;
  config = config.trimEnd() + "\n" + block;

  if (!config.includes("[agents.subagent]")) {
    config += `\n[agents.subagent]\nmodel = "${model}"\n`;
  }

  await writeText(configPath(), config.endsWith("\n") ? config : config + "\n");

  let auth = (await readJson(authPath())) || {};
  auth.OPENAI_API_KEY = apiKey;
  auth.auth_mode = "apikey";
  await writeJson(authPath(), auth);

  return { success: true, configPath: configPath() };
}

export async function reset() {
  let config = await readText(configPath());
  if (config) {
    config = stripProviderBlocks(config);
    if (/model_provider\s*=\s*"(agentconfig|9router)"/.test(config)) {
      config = config.replace(/^model_provider\s*=\s*".*"\r?\n?/m, "");
      config = config.replace(/^model\s*=\s*".*"\r?\n?/m, "");
    }
    await writeText(configPath(), config);
  }
  const auth = await readJson(authPath());
  if (auth?.OPENAI_API_KEY) {
    delete auth.OPENAI_API_KEY;
    await writeJson(authPath(), auth);
  }
  return { success: true, configPath: configPath() };
}

function stripProviderBlocks(toml) {
  return toml
    .replace(/\n?\[model_providers\.(agentconfig|9router)\][^\[]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function upsertTomlRoot(toml, key, value) {
  const re = new RegExp(`^${key}\\s*=\\s*".*"`, "m");
  const line = `${key} = "${value}"`;
  if (re.test(toml)) return toml.replace(re, line);
  return `${line}\n${toml}`;
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
