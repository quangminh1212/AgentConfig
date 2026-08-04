import path from "path";
import { fileURLToPath } from "url";
import { readJson, writeJson } from "./tools/fsutil.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SETTINGS_PATH = path.join(ROOT, "data", "settings.json");

const DEFAULTS = {
  defaultBaseUrl: "http://127.0.0.1:20128/v1",
  defaultApiKey: "",
  defaultModel: "claude-sonnet-4-6",
  presets: [
    { name: "9router local", baseUrl: "http://127.0.0.1:20128/v1" },
    { name: "9router LAN", baseUrl: "http://192.168.1.2:20128/v1" },
  ],
  savedKeys: [],
};

export async function loadSettings() {
  const data = await readJson(SETTINGS_PATH);
  return { ...DEFAULTS, ...(data || {}) };
}

export async function saveSettings(partial) {
  const current = await loadSettings();
  const next = { ...current, ...partial };
  // never wipe arrays if undefined
  if (partial.presets === undefined) next.presets = current.presets;
  if (partial.savedKeys === undefined) next.savedKeys = current.savedKeys;
  await writeJson(SETTINGS_PATH, next);
  return next;
}
