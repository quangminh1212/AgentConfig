import fs from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export const home = () => os.homedir();
export const isWin = () => os.platform() === "win32";

export function expandHome(p) {
  if (!p) return p;
  if (p.startsWith("~/") || p === "~") return path.join(home(), p.slice(2));
  return p;
}

export async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function readText(p) {
  try {
    return await fs.readFile(p, "utf-8");
  } catch (e) {
    if (e.code === "ENOENT") return null;
    throw e;
  }
}

export async function readJson(p) {
  const text = await readText(p);
  if (text == null) return null;
  try {
    const stripped = text.replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

export async function writeJson(p, data) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(data, null, 2) + "\n");
}

export async function writeText(p, text) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, text);
}

export async function commandExists(cmd) {
  try {
    const command = isWin() ? `where ${cmd}` : `which ${cmd}`;
    const env = isWin()
      ? { ...process.env, PATH: `${process.env.APPDATA}\\pnpm;${process.env.PATH}` }
      : process.env;
    await execAsync(command, { windowsHide: true, env });
    return true;
  } catch {
    return false;
  }
}

/** Ensure URL ends with /v1 (OpenAI-compatible base). */
export function ensureV1(url) {
  const trimmed = String(url || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /\/v1$/i.test(trimmed) ? trimmed : `${trimmed}/v1`;
}

/** Strip trailing /v1 for tools that want host root. */
export function stripV1(url) {
  return String(url || "").trim().replace(/\/+$/, "").replace(/\/v1$/i, "");
}

export function isLocalOrKnown(url) {
  if (!url) return false;
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|9router|agentconfig/i.test(url);
}

export function upsertEnvVar(envText, key, value) {
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (re.test(envText || "")) return (envText || "").replace(re, line);
  const base = envText || "";
  return base.length > 0 && !base.endsWith("\n") ? `${base}\n${line}\n` : `${base}${line}\n`;
}

export function removeEnvVar(envText, key) {
  return (envText || "").replace(new RegExp(`^${key}=.*\\r?\\n?`, "m"), "");
}
