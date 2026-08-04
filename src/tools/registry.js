/**
 * CLI tool registry — mirrors 9router CLI_TOOLS (+ MITM tools as guide/info).
 * configType:
 *   - writable: can apply/reset endpoint + apiKey via adapter
 *   - guide: show copy-paste / manual steps only
 */

export const CLI_TOOLS = {
  claude: {
    id: "claude",
    name: "Claude Code",
    image: "/providers/claude.png",
    color: "#D97757",
    description: "Anthropic Claude Code CLI",
    configType: "writable",
    defaultModel: "cc/claude-sonnet-5",
    settingsHint: "~/.claude/settings.json",
  },
  openclaw: {
    id: "openclaw",
    name: "Open Claw",
    image: "/providers/openclaw.png",
    color: "#FF6B35",
    description: "Open Claw AI Assistant",
    configType: "writable",
    defaultModel: "claude-sonnet-4-6",
    settingsHint: "~/.openclaw/openclaw.json",
  },
  codex: {
    id: "codex",
    name: "OpenAI Codex CLI / App",
    image: "/providers/codex.png",
    color: "#10A37F",
    description: "OpenAI Codex CLI",
    configType: "writable",
    defaultModel: "gpt-5",
    settingsHint: "~/.codex/config.toml + auth.json",
  },
  opencode: {
    id: "opencode",
    name: "OpenCode",
    image: "/providers/opencode.png",
    color: "#E87040",
    description: "OpenCode AI Terminal Assistant",
    configType: "writable",
    defaultModel: "claude-sonnet-4-6",
    settingsHint: "~/.config/opencode/opencode.json",
  },
  hermes: {
    id: "hermes",
    name: "Hermes Agent",
    image: "/providers/hermes.png",
    color: "#8B5CF6",
    description: "Nous Research self-improving AI agent",
    configType: "writable",
    defaultModel: "claude-sonnet-4-6",
    settingsHint: "~/.hermes/config.yaml + .env",
  },
  droid: {
    id: "droid",
    name: "Factory Droid",
    image: "/providers/droid.png",
    color: "#00D4FF",
    description: "Factory Droid AI Assistant",
    configType: "writable",
    defaultModel: "claude-sonnet-4-6",
    settingsHint: "~/.factory/settings.json",
  },
  cline: {
    id: "cline",
    name: "Cline",
    image: "/providers/cline.png",
    color: "#00D1B2",
    description: "Cline AI Coding Assistant",
    configType: "writable",
    defaultModel: "claude-sonnet-4-6",
    settingsHint: "~/.cline/data/globalState.json + secrets.json",
  },
  kilo: {
    id: "kilo",
    name: "Kilo Code",
    image: "/providers/kilocode.png",
    color: "#FF6B6B",
    description: "Kilo Code AI Assistant",
    configType: "writable",
    defaultModel: "claude-sonnet-4-6",
    settingsHint: "~/.local/share/kilo/auth.json",
  },
  copilot: {
    id: "copilot",
    name: "GitHub Copilot (VS Code models)",
    image: "/providers/copilot.png",
    color: "#1F6FEB",
    description: "VS Code chatLanguageModels.json provider",
    configType: "writable",
    defaultModel: "gpt-4o",
    settingsHint: "VS Code chatLanguageModels.json",
  },
  "deepseek-tui": {
    id: "deepseek-tui",
    name: "DeepSeek TUI",
    image: "/providers/deepseek-tui.png",
    color: "#4D6BFE",
    description: "DeepSeek Terminal Coding Agent (Rust TUI)",
    configType: "writable",
    defaultModel: "deepseek-chat",
    settingsHint: "~/.deepseek/config.toml",
  },
  jcode: {
    id: "jcode",
    name: "jcode",
    image: "/providers/jcode.png",
    color: "#FF6B35",
    description: "High-performance Rust-based coding agent harness",
    configType: "writable",
    defaultModel: "claude-sonnet-4-6",
    settingsHint: "~/.jcode/config.toml",
  },
  "grok-build": {
    id: "grok-build",
    name: "Grok Build",
    image: "/providers/grok-cli.png",
    color: "#1DA1F2",
    description: "xAI Grok Build TUI coding agent",
    configType: "writable",
    defaultModel: "grok-4",
    settingsHint: "~/.grok/config.toml",
  },
  cursor: {
    id: "cursor",
    name: "Cursor",
    image: "/providers/cursor.png",
    color: "#000000",
    description: "Cursor AI Code Editor",
    configType: "guide",
    notes: [
      "Requires Cursor Pro for custom OpenAI endpoint.",
      "Settings → Models → Enable OpenAI API key.",
      "Paste Base URL + API Key, then Add Custom Model.",
    ],
  },
  roo: {
    id: "roo",
    name: "Roo",
    image: "/providers/roo.png",
    color: "#FF6B6B",
    description: "Roo AI Assistant",
    configType: "guide",
    notes: [
      "Open Roo Settings → API Provider → OpenAI Compatible (or Ollama-style).",
      "Set Base URL + API Key + Model.",
    ],
  },
  continue: {
    id: "continue",
    name: "Continue",
    image: "/providers/continue.png",
    color: "#7C3AED",
    description: "Continue AI Assistant",
    configType: "guide",
    codeTemplate: `{
  "apiBase": "{{baseUrl}}",
  "title": "{{model}}",
  "model": "{{model}}",
  "provider": "openai",
  "apiKey": "{{apiKey}}"
}`,
  },
  amp: {
    id: "amp",
    name: "Amp CLI",
    image: "/providers/amp.png",
    color: "#F97316",
    description: "Sourcegraph Amp coding assistant CLI",
    configType: "guide",
    codeTemplate: `export OPENAI_API_KEY="{{apiKey}}"
export OPENAI_BASE_URL="{{baseUrl}}"
amp --model "{{model}}"`,
  },
  qwen: {
    id: "qwen",
    name: "Qwen Code",
    image: "/providers/qwen.png",
    color: "#10B981",
    description: "Alibaba Qwen Code CLI (OpenAI-compatible via gateway)",
    configType: "guide",
    settingsHint: "~/.qwen/settings.json",
    codeTemplate: `{
  "security": {
    "auth": {
      "selectedType": "openai",
      "apiKey": "{{apiKey}}",
      "baseUrl": "{{baseUrl}}"
    }
  },
  "model": {
    "name": "{{model}}"
  }
}`,
  },
  cowork: {
    id: "cowork",
    name: "Claude Cowork",
    image: "/providers/claude.png",
    color: "#D97757",
    description: "Claude Desktop Cowork (third-party inference)",
    configType: "guide",
    notes: [
      "Claude Desktop third-party inference config — platform-specific paths.",
      "Prefer configuring via Claude Desktop UI or 9router full stack for Cowork.",
    ],
  },
};

export const MITM_TOOLS = {
  antigravity: {
    id: "antigravity",
    name: "Antigravity",
    image: "/providers/antigravity.png",
    color: "#4285F4",
    description: "Google Antigravity IDE with MITM (use 9router MITM stack)",
  },
  copilot_mitm: {
    id: "copilot_mitm",
    name: "GitHub Copilot MITM",
    image: "/providers/copilot.png",
    color: "#1F6FEB",
    description: "GitHub Copilot IDE MITM (use 9router MITM stack)",
  },
  kiro: {
    id: "kiro",
    name: "Kiro",
    image: "/providers/kiro.png",
    color: "#FF6B00",
    description: "Kiro IDE with MITM (use 9router MITM stack)",
  },
};

export function listTools() {
  return Object.values(CLI_TOOLS);
}

export function getTool(id) {
  return CLI_TOOLS[id] || null;
}
