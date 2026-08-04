import path from "path";
import {
  home, pathExists, readText, writeText, commandExists, ensureV1, upsertEnvVar,
} from "../fsutil.js";

const dir = () => path.join(home(), ".hermes");
const configPath = () => path.join(dir(), "config.yaml");
const envPath = () => path.join(dir(), ".env");
const MODEL_BLOCK_RE = /^model:[ \t]*\r?\n((?:[ \t]+.*\r?\n?|[ \t]*\r?\n)*)/m;

export async function getStatus() {
  const installed = (await commandExists("hermes")) || (await pathExists(configPath()));
  if (!installed) return { installed: false, configured: false, configPath: configPath() };
  const yaml = (await readText(configPath())) || "";
  const model = parseModelBlock(yaml);
  return {
    installed: true,
    configured: !!model?.base_url,
    configPath: configPath(),
    baseUrl: model?.base_url || null,
    model: model?.default || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !model) throw new Error("baseUrl and model are required");
  const url = ensureV1(baseUrl);
  const existing = (await readText(configPath())) || "";
  const block = `model:\n  default: "${model}"\n  provider: "custom"\n  base_url: "${url}"\n`;
  const next = MODEL_BLOCK_RE.test(existing)
    ? existing.replace(MODEL_BLOCK_RE, block)
    : (existing.length ? `${block}\n${existing}` : block);
  await writeText(configPath(), next);
  if (apiKey) {
    const env = (await readText(envPath())) || "";
    await writeText(envPath(), upsertEnvVar(env, "OPENAI_API_KEY", apiKey));
  }
  return { success: true, configPath: configPath() };
}

export async function reset() {
  const yaml = await readText(configPath());
  if (!yaml) return { success: true };
  const next = yaml.replace(MODEL_BLOCK_RE, "").replace(/^\n+/, "");
  await writeText(configPath(), next);
  return { success: true, configPath: configPath() };
}

function parseModelBlock(yaml) {
  const match = yaml.match(MODEL_BLOCK_RE);
  if (!match) return null;
  const body = match[1] || "";
  const get = (key) => {
    const m = body.match(new RegExp(`^[ \\t]+${key}:[ \\t]*["']?([^"'\\r\\n]+)["']?`, "m"));
    return m ? m[1].trim() : null;
  };
  return { default: get("default"), provider: get("provider"), base_url: get("base_url") };
}
