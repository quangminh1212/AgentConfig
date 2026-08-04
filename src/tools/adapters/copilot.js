import path from "path";
import os from "os";
import {
  home, pathExists, readJson, writeJson, ensureV1,
} from "../fsutil.js";

function modelsPath() {
  const h = home();
  if (os.platform() === "win32") {
    return path.join(process.env.APPDATA || path.join(h, "AppData", "Roaming"), "Code", "User", "chatLanguageModels.json");
  }
  if (os.platform() === "darwin") {
    return path.join(h, "Library", "Application Support", "Code", "User", "chatLanguageModels.json");
  }
  return path.join(h, ".config", "Code", "User", "chatLanguageModels.json");
}

export async function getStatus() {
  const p = modelsPath();
  const installed = await pathExists(p);
  if (!installed) return { installed: false, configured: false, configPath: p };
  const config = await readJson(p);
  const entry = findEntry(config);
  return {
    installed: true,
    configured: !!entry,
    configPath: p,
    baseUrl: entry?.url?.replace(/\/chat\/completions.*$/, "") || null,
    apiKeyMasked: entry?.apiKey ? mask(entry.apiKey) : null,
    model: entry?.id || entry?.name || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !model) throw new Error("baseUrl and model are required");
  const url = ensureV1(baseUrl);
  const p = modelsPath();
  let config = (await readJson(p)) || [];
  if (!Array.isArray(config)) config = [];
  config = config.filter((e) => e?.vendor !== "agentconfig" && e?.vendor !== "9router");
  config.push({
    vendor: "agentconfig",
    name: model,
    id: model,
    family: "gpt-4o",
    version: "1",
    maxInputTokens: 128000,
    maxOutputTokens: 16384,
    url: `${url}/chat/completions#models.ai.azure.com`,
    apiKey: apiKey || "sk-agentconfig",
  });
  await writeJson(p, config);
  return { success: true, configPath: p };
}

export async function reset() {
  const p = modelsPath();
  const config = await readJson(p);
  if (!Array.isArray(config)) return { success: true };
  await writeJson(p, config.filter((e) => e?.vendor !== "agentconfig" && e?.vendor !== "9router"));
  return { success: true, configPath: p };
}

function findEntry(config) {
  if (!Array.isArray(config)) return null;
  return config.find((e) => e?.vendor === "agentconfig" || e?.vendor === "9router") || null;
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
