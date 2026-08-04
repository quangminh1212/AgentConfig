import path from "path";
import os from "os";
import {
  home, pathExists, readJson, writeJson, commandExists, ensureV1,
} from "../fsutil.js";

const dataDir = () => path.join(home(), ".local", "share", "kilo");
const authPath = () => path.join(dataDir(), "auth.json");
const vscodeSettingsPath = () => {
  if (os.platform() === "win32") {
    return path.join(process.env.APPDATA || path.join(home(), "AppData", "Roaming"), "Code", "User", "settings.json");
  }
  if (os.platform() === "darwin") {
    return path.join(home(), "Library", "Application Support", "Code", "User", "settings.json");
  }
  return path.join(home(), ".config", "Code", "User", "settings.json");
};

export async function getStatus() {
  const installed = (await commandExists("kilo")) || (await pathExists(authPath()));
  if (!installed) return { installed: false, configured: false, configPath: authPath() };
  const auth = await readJson(authPath());
  const entry = findEntry(auth);
  return {
    installed: true,
    configured: !!entry,
    configPath: authPath(),
    baseUrl: entry?.baseUrl || entry?.baseURL || null,
    apiKeyMasked: entry?.apiKey ? mask(entry.apiKey) : null,
    model: entry?.model || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !apiKey || !model) throw new Error("baseUrl, apiKey and model are required");
  const url = ensureV1(baseUrl);
  let auth = (await readJson(authPath())) || {};
  // Support array or object map formats
  if (Array.isArray(auth)) {
    auth = auth.filter((e) => !isOurs(e));
    auth.push({ name: "AgentConfig", provider: "openai", apiKey, baseUrl: url, model });
  } else if (auth && typeof auth === "object") {
    auth.agentconfig = { name: "AgentConfig", provider: "openai", apiKey, baseUrl: url, model };
    delete auth["9router"];
  } else {
    auth = { agentconfig: { name: "AgentConfig", provider: "openai", apiKey, baseUrl: url, model } };
  }
  await writeJson(authPath(), auth);

  // Optional VS Code kilocode setting
  try {
    let vscode = (await readJson(vscodeSettingsPath())) || {};
    vscode["kilocode.customProvider"] = { name: "AgentConfig", baseURL: url, apiKey };
    await writeJson(vscodeSettingsPath(), vscode);
  } catch { /* optional */ }

  return { success: true, configPath: authPath() };
}

export async function reset() {
  const auth = await readJson(authPath());
  if (auth) {
    if (Array.isArray(auth)) {
      await writeJson(authPath(), auth.filter((e) => !isOurs(e)));
    } else {
      delete auth.agentconfig;
      delete auth["9router"];
      await writeJson(authPath(), auth);
    }
  }
  return { success: true, configPath: authPath() };
}

function findEntry(auth) {
  if (!auth) return null;
  if (Array.isArray(auth)) return auth.find(isOurs) || null;
  return auth.agentconfig || auth["9router"] || null;
}

function isOurs(e) {
  if (!e) return false;
  const base = e.baseUrl || e.baseURL || "";
  return e.name === "AgentConfig" || e.name === "9Router" || /localhost|127\.0\.0\.1|9router|agentconfig/i.test(base);
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
