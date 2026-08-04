import path from "path";
import {
  home, pathExists, readText, writeText, commandExists, ensureV1,
} from "../fsutil.js";

const configPath = () => path.join(home(), ".deepseek", "config.toml");

export async function getStatus() {
  const installed = (await commandExists("deepseek")) || (await pathExists(configPath()));
  if (!installed) return { installed: false, configured: false, configPath: configPath() };
  const toml = (await readText(configPath())) || "";
  const baseMatch = toml.match(/base_url\s*=\s*"([^"]+)"/);
  const modelMatch = toml.match(/model\s*=\s*"([^"]+)"/);
  const configured = /provider\s*=\s*"openai"/.test(toml) && !!baseMatch;
  return {
    installed: true,
    configured,
    configPath: configPath(),
    baseUrl: baseMatch?.[1] || null,
    model: modelMatch?.[1] || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !model) throw new Error("baseUrl and model are required");
  const url = ensureV1(baseUrl);
  const key = apiKey || "sk-agentconfig";
  const toml = `provider = "openai"\n\n[providers.openai]\nbase_url = "${url}"\napi_key = "${key}"\nmodel = "${model}"\n`;
  await writeText(configPath(), toml);
  return { success: true, configPath: configPath() };
}

export async function reset() {
  await writeText(configPath(), 'provider = "deepseek"\n');
  return { success: true, configPath: configPath() };
}
