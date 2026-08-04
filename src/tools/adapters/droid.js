import path from "path";
import {
  home, pathExists, readJson, writeJson, commandExists, ensureV1,
} from "../fsutil.js";

const settingsPath = () => path.join(home(), ".factory", "settings.json");

export async function getStatus() {
  const installed = (await commandExists("droid")) || (await pathExists(settingsPath()));
  if (!installed) return { installed: false, configured: false, configPath: settingsPath() };
  const settings = await readJson(settingsPath());
  const entry = (settings?.customModels || []).find((m) =>
    m.id?.startsWith("custom:9Router") || m.id?.startsWith("custom:AgentConfig") || m.displayName?.includes("AgentConfig")
  );
  return {
    installed: true,
    configured: !!entry,
    configPath: settingsPath(),
    baseUrl: entry?.baseUrl || null,
    apiKeyMasked: entry?.apiKey ? mask(entry.apiKey) : null,
    model: entry?.model || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !model) throw new Error("baseUrl and model are required");
  const url = ensureV1(baseUrl);
  let settings = (await readJson(settingsPath())) || {};
  if (!settings.customModels) settings.customModels = [];
  settings.customModels = settings.customModels.filter(
    (m) => !m.id?.startsWith("custom:9Router") && !m.id?.startsWith("custom:AgentConfig")
  );
  settings.customModels.unshift({
    model,
    id: "custom:AgentConfig-0",
    index: 0,
    baseUrl: url,
    apiKey: apiKey || "your_api_key",
    displayName: model,
    maxOutputTokens: 131072,
    noImageSupport: false,
    provider: "openai",
  });
  settings.customModels.forEach((m, i) => { m.index = i; });
  await writeJson(settingsPath(), settings);
  return { success: true, configPath: settingsPath() };
}

export async function reset() {
  const settings = await readJson(settingsPath());
  if (!settings) return { success: true };
  settings.customModels = (settings.customModels || []).filter(
    (m) => !m.id?.startsWith("custom:9Router") && !m.id?.startsWith("custom:AgentConfig")
  );
  await writeJson(settingsPath(), settings);
  return { success: true, configPath: settingsPath() };
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
