import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { CLI_TOOLS, MITM_TOOLS, listTools, getTool } from "./tools/registry.js";
import { getAllStatuses, applyTool, resetTool, applyAll, getAdapter } from "./tools/adapters/index.js";
import { loadSettings, saveSettings } from "./settings.js";
import { ensureV1 } from "./tools/fsutil.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.AGENTCONFIG_PORT || process.env.PORT || 20130);

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));

// —— API ——

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "agentconfig", port: PORT });
});

app.get("/api/tools", (_req, res) => {
  res.json({
    tools: listTools(),
    mitmTools: Object.values(MITM_TOOLS),
  });
});

app.get("/api/tools/statuses", async (_req, res) => {
  try {
    res.json(await getAllStatuses());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/tools/:id/status", async (req, res) => {
  try {
    const tool = getTool(req.params.id);
    if (!tool) return res.status(404).json({ error: "Unknown tool" });
    const adapter = getAdapter(req.params.id);
    if (!adapter) {
      return res.json({ installed: null, configured: false, configType: "guide", guide: true });
    }
    res.json({ ...(await adapter.getStatus()), configType: tool.configType });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/tools/:id/apply", async (req, res) => {
  try {
    const { baseUrl, apiKey, model } = req.body || {};
    if (!baseUrl) return res.status(400).json({ error: "baseUrl is required" });
    const settings = await loadSettings();
    const result = await applyTool(req.params.id, {
      baseUrl: ensureV1(baseUrl),
      apiKey: apiKey || settings.defaultApiKey || "sk-agentconfig",
      model: model || settings.defaultModel || getTool(req.params.id)?.defaultModel || "default",
    });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/tools/:id/reset", async (req, res) => {
  try {
    res.json(await resetTool(req.params.id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/tools/apply-all", async (req, res) => {
  try {
    const settings = await loadSettings();
    const baseUrl = ensureV1(req.body?.baseUrl || settings.defaultBaseUrl);
    const apiKey = req.body?.apiKey || settings.defaultApiKey || "sk-agentconfig";
    const model = req.body?.model || settings.defaultModel || "claude-sonnet-4-6";
    const toolIds = Array.isArray(req.body?.toolIds) ? req.body.toolIds : null;
    if (!baseUrl) return res.status(400).json({ error: "baseUrl is required" });
    const results = await applyAll({ baseUrl, apiKey, model }, toolIds);
    res.json({ success: true, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/settings", async (_req, res) => {
  try {
    const s = await loadSettings();
    // mask default key in response list only partially
    res.json(s);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const allowed = ["defaultBaseUrl", "defaultApiKey", "defaultModel", "presets", "savedKeys"];
    const partial = {};
    for (const k of allowed) {
      if (req.body?.[k] !== undefined) partial[k] = req.body[k];
    }
    if (partial.defaultBaseUrl) partial.defaultBaseUrl = ensureV1(partial.defaultBaseUrl);
    res.json(await saveSettings(partial));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SPA fallback for tool detail deep links
app.get(["/", "/tools", "/tools/:id"], (_req, res) => {
  res.sendFile(path.join(ROOT, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AgentConfig running at http://127.0.0.1:${PORT}`);
  console.log(`CLI tools: ${Object.keys(CLI_TOOLS).length} · MITM info: ${Object.keys(MITM_TOOLS).length}`);
});
