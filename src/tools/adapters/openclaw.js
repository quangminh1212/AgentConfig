import path from "path";
import {
  home, pathExists, readJson, writeJson, commandExists, ensureV1,
} from "../fsutil.js";

const settingsPath = () => path.join(home(), ".openclaw", "openclaw.json");
const PROVIDER = "agentconfig";

export async function getStatus() {
  const installed = (await commandExists("openclaw")) || (await pathExists(settingsPath()));
  if (!installed) return { installed: false, configured: false, configPath: settingsPath() };
  const settings = await readJson(settingsPath());
  const p = settings?.models?.providers?.[PROVIDER] || settings?.models?.providers?.["9router"];
  return {
    installed: true,
    configured: !!p,
    configPath: settingsPath(),
    baseUrl: p?.baseUrl || null,
    apiKeyMasked: p?.apiKey ? mask(p.apiKey) : null,
    model: settings?.agents?.defaults?.model?.primary || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !model) throw new Error("baseUrl and model are required");
  const url = ensureV1(baseUrl);
  let settings = (await readJson(settingsPath())) || {};
  if (!settings.agents) settings.agents = {};
  if (!settings.agents.defaults) settings.agents.defaults = {};
  if (!settings.agents.defaults.model) settings.agents.defaults.model = {};
  if (!settings.agents.defaults.models) settings.agents.defaults.models = {};
  if (!settings.models) settings.models = {};
  if (!settings.models.providers) settings.models.providers = {};

  const fullId = `${PROVIDER}/${model}`;
  Object.keys(settings.agents.defaults.models)
    .filter((k) => /^(agentconfig|9router)\//.test(k))
    .forEach((k) => delete settings.agents.defaults.models[k]);

  settings.agents.defaults.model.primary = fullId;
  settings.agents.defaults.models[fullId] = {};
  settings.models.providers[PROVIDER] = {
    baseUrl: url,
    apiKey: apiKey || "your_api_key",
    api: "openai-completions",
    models: [{ id: model, name: model.split("/").pop() || model }],
  };
  delete settings.models.providers["9router"];
  await writeJson(settingsPath(), settings);
  return { success: true, configPath: settingsPath() };
}

export async function reset() {
  const settings = await readJson(settingsPath());
  if (!settings) return { success: true };
  if (settings.models?.providers) {
    delete settings.models.providers[PROVIDER];
    delete settings.models.providers["9router"];
  }
  if (settings.agents?.defaults?.models) {
    Object.keys(settings.agents.defaults.models)
      .filter((k) => /^(agentconfig|9router)\//.test(k))
      .forEach((k) => delete settings.agents.defaults.models[k]);
  }
  if (settings.agents?.defaults?.model?.primary &&
      /^(agentconfig|9router)\//.test(settings.agents.defaults.model.primary)) {
    delete settings.agents.defaults.model.primary;
  }
  await writeJson(settingsPath(), settings);
  return { success: true, configPath: settingsPath() };
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
