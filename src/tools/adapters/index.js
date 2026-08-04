import * as claude from "./claude.js";
import * as codex from "./codex.js";
import * as opencode from "./opencode.js";
import * as hermes from "./hermes.js";
import * as openclaw from "./openclaw.js";
import * as droid from "./droid.js";
import * as cline from "./cline.js";
import * as kilo from "./kilo.js";
import * as copilot from "./copilot.js";
import * as deepseekTui from "./deepseek-tui.js";
import * as jcode from "./jcode.js";
import * as grokBuild from "./grok-build.js";
import { getTool, listTools } from "../registry.js";

const ADAPTERS = {
  claude,
  codex,
  opencode,
  hermes,
  openclaw,
  droid,
  cline,
  kilo,
  copilot,
  "deepseek-tui": deepseekTui,
  jcode,
  "grok-build": grokBuild,
};

export function getAdapter(toolId) {
  return ADAPTERS[toolId] || null;
}

export async function getAllStatuses() {
  const result = {};
  await Promise.all(
    listTools().map(async (tool) => {
      const adapter = ADAPTERS[tool.id];
      if (!adapter) {
        result[tool.id] = {
          installed: null,
          configured: false,
          configType: tool.configType,
          guide: true,
        };
        return;
      }
      try {
        result[tool.id] = { ...(await adapter.getStatus()), configType: tool.configType };
      } catch (e) {
        result[tool.id] = { installed: false, configured: false, error: e.message, configType: tool.configType };
      }
    })
  );
  return result;
}

export async function applyTool(toolId, payload) {
  const tool = getTool(toolId);
  if (!tool) throw new Error(`Unknown tool: ${toolId}`);
  if (tool.configType !== "writable") throw new Error(`Tool ${toolId} is guide-only`);
  const adapter = ADAPTERS[toolId];
  if (!adapter) throw new Error(`No adapter for ${toolId}`);
  return adapter.apply(payload);
}

export async function resetTool(toolId) {
  const adapter = ADAPTERS[toolId];
  if (!adapter) throw new Error(`No adapter for ${toolId}`);
  return adapter.reset();
}

export async function applyAll(payload, toolIds = null) {
  const ids = toolIds || Object.keys(ADAPTERS);
  const results = {};
  for (const id of ids) {
    if (!ADAPTERS[id]) continue;
    try {
      const tool = getTool(id);
      const model = payload.model || tool?.defaultModel || "default";
      results[id] = await ADAPTERS[id].apply({ ...payload, model });
    } catch (e) {
      results[id] = { success: false, error: e.message };
    }
  }
  return results;
}
