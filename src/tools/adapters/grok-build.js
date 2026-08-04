import path from "path";
import {
  home, pathExists, readText, writeText, commandExists, ensureV1,
} from "../fsutil.js";

const configPath = () => path.join(home(), ".grok", "config.toml");
const SLOT = "agentconfig";

export async function getStatus() {
  const installed =
    (await commandExists("grok")) ||
    (await pathExists(configPath())) ||
    (await pathExists(path.join(home(), ".grok", "bin", "grok")));
  if (!installed) return { installed: false, configured: false, configPath: configPath() };
  const toml = (await readText(configPath())) || "";
  const hasSlot = /\[model\.agentconfig\]/.test(toml) || /\[model\.9router\]/.test(toml);
  const section = toml.match(/\[model\.(?:agentconfig|9router)\][^\[]*/);
  const baseUrl = section?.[0]?.match(/base_url\s*=\s*"([^"]+)"/)?.[1] || null;
  const model = section?.[0]?.match(/model\s*=\s*"([^"]+)"/)?.[1] || null;
  return {
    installed: true,
    configured: hasSlot && !!baseUrl,
    configPath: configPath(),
    baseUrl,
    model,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !model) throw new Error("baseUrl and model are required");
  const url = ensureV1(baseUrl);
  const key = apiKey || "sk-agentconfig";
  let toml = (await readText(configPath())) || "";

  // Remove previous slots
  toml = toml.replace(/\n?\[model\.(agentconfig|9router)\][^\[]*/g, "\n");

  const section = `
[model.${SLOT}]
model = ${JSON.stringify(model)}
base_url = ${JSON.stringify(url)}
name = "AgentConfig"
description = "Routed via AgentConfig"
api_backend = "chat_completions"
api_key = ${JSON.stringify(key)}
context_window = 200000
`;
  toml = toml.trimEnd() + "\n" + section;

  // Set default models.default
  if (/^\[models\]/m.test(toml)) {
    if (/^default\s*=/m.test(toml)) {
      toml = toml.replace(/^default\s*=\s*".*"/m, `default = "${SLOT}"`);
    } else {
      toml = toml.replace(/^\[models\]/m, `[models]\ndefault = "${SLOT}"`);
    }
  } else {
    toml = `[models]\ndefault = "${SLOT}"\n\n` + toml;
  }

  await writeText(configPath(), toml.endsWith("\n") ? toml : toml + "\n");
  return { success: true, configPath: configPath() };
}

export async function reset() {
  let toml = await readText(configPath());
  if (!toml) return { success: true };
  toml = toml.replace(/\n?\[model\.(agentconfig|9router)\][^\[]*/g, "\n");
  if (/^default\s*=\s*"(agentconfig|9router)"/m.test(toml)) {
    toml = toml.replace(/^default\s*=\s*"(agentconfig|9router)"/m, 'default = "grok-build"');
  }
  await writeText(configPath(), toml.replace(/\n{3,}/g, "\n\n"));
  return { success: true, configPath: configPath() };
}
