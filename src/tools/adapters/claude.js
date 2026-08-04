import path from "path";
import {
  home, pathExists, readJson, writeJson, commandExists, ensureV1,
} from "../fsutil.js";

const settingsPath = () => path.join(home(), ".claude", "settings.json");

export async function getStatus() {
  const installed = (await commandExists("claude")) || (await pathExists(settingsPath()));
  if (!installed) return { installed: false, configured: false, settings: null, configPath: settingsPath() };
  const settings = await readJson(settingsPath());
  const baseUrl = settings?.env?.ANTHROPIC_BASE_URL || null;
  const apiKey = settings?.env?.ANTHROPIC_AUTH_TOKEN || null;
  return {
    installed: true,
    configured: !!baseUrl,
    configPath: settingsPath(),
    baseUrl,
    apiKeyMasked: apiKey ? mask(apiKey) : null,
    model: settings?.env?.ANTHROPIC_DEFAULT_SONNET_MODEL || settings?.env?.ANTHROPIC_MODEL || null,
    settings,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  const p = settingsPath();
  let settings = (await readJson(p)) || {};
  if (!settings.env) settings.env = {};
  const url = ensureV1(baseUrl);
  settings.env.ANTHROPIC_BASE_URL = url;
  if (apiKey) settings.env.ANTHROPIC_AUTH_TOKEN = apiKey;
  if (model) {
    settings.env.ANTHROPIC_MODEL = model;
    settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL = model;
  }
  settings.hasCompletedOnboarding = true;
  await writeJson(p, settings);
  return { success: true, configPath: p };
}

export async function reset() {
  const p = settingsPath();
  const settings = await readJson(p);
  if (!settings) return { success: true, message: "No config" };
  if (settings.env) {
    for (const k of [
      "ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_MODEL",
      "ANTHROPIC_DEFAULT_OPUS_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL", "ANTHROPIC_DEFAULT_FABLE_MODEL",
    ]) delete settings.env[k];
    if (Object.keys(settings.env).length === 0) delete settings.env;
  }
  await writeJson(p, settings);
  return { success: true, configPath: p };
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
