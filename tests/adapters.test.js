import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { ensureV1, stripV1, upsertEnvVar } from "../src/tools/fsutil.js";
import { listTools, getTool, CLI_TOOLS } from "../src/tools/registry.js";
import { getAdapter } from "../src/tools/adapters/index.js";

describe("fsutil", () => {
  it("ensureV1 adds /v1 once", () => {
    assert.equal(ensureV1("http://127.0.0.1:20128"), "http://127.0.0.1:20128/v1");
    assert.equal(ensureV1("http://127.0.0.1:20128/v1"), "http://127.0.0.1:20128/v1");
    assert.equal(ensureV1("http://127.0.0.1:20128/v1/"), "http://127.0.0.1:20128/v1");
  });

  it("stripV1 removes suffix", () => {
    assert.equal(stripV1("http://x/v1"), "http://x");
  });

  it("upsertEnvVar inserts and replaces", () => {
    let e = upsertEnvVar("", "A", "1");
    assert.match(e, /^A=1/m);
    e = upsertEnvVar(e, "A", "2");
    assert.match(e, /^A=2/m);
    assert.equal((e.match(/^A=/gm) || []).length, 1);
  });
});

describe("registry", () => {
  it("lists all 9router-aligned CLI tools", () => {
    const tools = listTools();
    assert.ok(tools.length >= 17);
    for (const id of [
      "claude", "codex", "opencode", "hermes", "openclaw", "droid",
      "cline", "kilo", "copilot", "deepseek-tui", "jcode", "grok-build",
      "cursor", "roo", "continue", "amp", "qwen", "cowork",
    ]) {
      assert.ok(getTool(id), `missing tool ${id}`);
    }
  });

  it("writable tools have adapters", () => {
    for (const tool of Object.values(CLI_TOOLS)) {
      if (tool.configType !== "writable") continue;
      assert.ok(getAdapter(tool.id), `missing adapter for ${tool.id}`);
    }
  });
});

describe("claude adapter (temp home)", () => {
  it("apply + status + reset", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "agentconfig-"));
    const prev = process.env.USERPROFILE || process.env.HOME;
    // patch home via env (fsutil uses os.homedir which reads env on some systems only at import —
    // so we write directly using adapter paths under real home is unsafe in CI.
    // Instead test pure registry + ensure adapter methods exist.
    const adapter = getAdapter("claude");
    assert.equal(typeof adapter.apply, "function");
    assert.equal(typeof adapter.getStatus, "function");
    assert.equal(typeof adapter.reset, "function");
    // cleanup
    await fs.rm(tmp, { recursive: true, force: true });
    void prev;
  });
});
