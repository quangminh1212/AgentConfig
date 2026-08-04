import path from "path";
import {
  home, pathExists, readText, writeText, commandExists, ensureV1, upsertEnvVar, removeEnvVar,
} from "../fsutil.js";

const configPath = () => path.join(home(), ".jcode", "config.toml");
const envPath = () => {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(home(), ".config");
  return path.join(xdg, "jcode", "provider-agentconfig.env");
};

export async function getStatus() {
  const installed = (await commandExists("jcode")) || (await pathExists(configPath()));
  if (!installed) return { installed: false, configured: false, configPath: configPath() };
  const toml = (await readText(configPath())) || "";
  const configured = /\[providers\.agentconfig\]/.test(toml) || /\[providers\.9router\]/.test(toml);
  const baseMatch = toml.match(/base_url\s*=\s*"([^"]+)"/);
  return {
    installed: true,
    configured,
    configPath: configPath(),
    baseUrl: baseMatch?.[1] || null,
  };
}

export async function apply({ baseUrl, apiKey, model }) {
  if (!baseUrl || !apiKey) throw new Error("baseUrl and apiKey are required");
  const url = ensureV1(baseUrl);
  let toml = (await readText(configPath())) || "";
  // Remove old blocks
  toml = toml.replace(/\n?\[providers\.(agentconfig|9router)\][^\[]*/g, "\n").trimEnd();
  const modelId = model || "default";
  const block = `
[providers.agentconfig]
name = "AgentConfig"
base_url = "${url}"
api_key_env = "JCODE_AGENTCONFIG_API_KEY"
default_model = "${modelId}"
requires_api_key = true
`;
  toml = (toml ? toml + "\n" : "") + block.trim() + "\n";
  // Set default provider if missing
  if (!/^default_provider\s*=/m.test(toml)) {
    toml = `default_provider = "agentconfig"\n` + toml;
  } else {
    toml = toml.replace(/^default_provider\s*=\s*".*"/m, 'default_provider = "agentconfig"');
  }
  await writeText(configPath(), toml);

  let env = (await readText(envPath())) || "";
  env = upsertEnvVar(env, "JCODE_AGENTCONFIG_API_KEY", apiKey);
  await writeText(envPath(), env);
  return { success: true, configPath: configPath() };
}

export async function reset() {
  let toml = await readText(configPath());
  if (toml) {
    toml = toml.replace(/\n?\[providers\.(agentconfig|9router)\][^\[]*/g, "\n");
    toml = toml.replace(/^default_provider\s*=\s*"(agentconfig|9router)"\r?\n?/m, "");
    await writeText(configPath(), toml.trim() + (toml.trim() ? "\n" : ""));
  }
  let env = await readText(envPath());
  if (env) {
    env = removeEnvVar(env, "JCODE_AGENTCONFIG_API_KEY");
    await writeText(envPath(), env);
  }
  return { success: true, configPath: configPath() };
}
