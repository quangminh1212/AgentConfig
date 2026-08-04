import path from "path";
import {
  home, pathExists, readJson, writeJson, commandExists, stripV1, ensureV1,
} from "../fsutil.js";

const dataDir = () => path.join(home(), ".cline", "data");
const globalStatePath = () => path.join(dataDir(), "globalState.json");
const secretsPath = () => path.join(dataDir(), "secrets.json");

export async function getStatus() {
  const installed =
    (await commandExists("cline")) ||
    (await pathExists(globalStatePath())) ||
    (await pathExists(path.join(home(), ".cline")));
  if (!installed) return { installed: false, configured: false, configPath: globalStatePath() };
  const globalState = await readJson(globalStatePath());
  const secrets = await readJson(secretsPath());
  const baseUrl = globalState?.openAiBaseUrl || null;
  const configured = globalState?.apiProvider === "openai" && !!baseUrl;
  return {
    installed: true,
    configured,
    configPath: globalStatePath(),
    baseUrl,
    apiKeyMasked: secrets?.openAiApiKey ? mask(secrets.openAiApiKey) : null,
    model: globalState?.openAiModelId || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !apiKey || !model) throw new Error("baseUrl, apiKey and model are required");
  // Cline often wants host without /v1 for some builds; store root form
  const normalized = stripV1(baseUrl) || ensureV1(baseUrl);
  let globalState = (await readJson(globalStatePath())) || {};
  globalState.apiProvider = "openai";
  globalState.openAiBaseUrl = normalized;
  globalState.openAiModelId = model;
  await writeJson(globalStatePath(), globalState);

  let secrets = (await readJson(secretsPath())) || {};
  secrets.openAiApiKey = apiKey;
  await writeJson(secretsPath(), secrets);
  return { success: true, configPath: globalStatePath() };
}

export async function reset() {
  const globalState = await readJson(globalStatePath());
  if (globalState) {
    delete globalState.openAiBaseUrl;
    delete globalState.openAiModelId;
    if (globalState.apiProvider === "openai") delete globalState.apiProvider;
    await writeJson(globalStatePath(), globalState);
  }
  const secrets = await readJson(secretsPath());
  if (secrets?.openAiApiKey) {
    delete secrets.openAiApiKey;
    await writeJson(secretsPath(), secrets);
  }
  return { success: true, configPath: globalStatePath() };
}

function mask(k) {
  if (!k || k.length < 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
