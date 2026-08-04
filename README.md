# AgentConfig

Standalone dashboard to configure **endpoint (Base URL)** and **API key** for AI CLIs — tool list aligned with [9router](https://github.com/) `CLI_TOOLS`.

UI layout matches 9router’s **Dashboard → CLI Tools** (card grid + detail Apply/Reset).

## Features

- Global default **Base URL / API Key / Model**
- Per-CLI **Apply** / **Reset** for writable tools
- **Apply all** writable CLIs in one click
- Guide cards (Cursor, Roo, Continue, Amp, Qwen, Cowork) with copy helpers
- MITM tools listed as info (configure via full 9router MITM stack)

### Writable adapters

| CLI | Config path |
|-----|-------------|
| Claude Code | `~/.claude/settings.json` |
| Codex | `~/.codex/config.toml` + `auth.json` |
| OpenCode | `~/.config/opencode/opencode.json` |
| Hermes | `~/.hermes/config.yaml` + `.env` |
| OpenClaw | `~/.openclaw/openclaw.json` |
| Factory Droid | `~/.factory/settings.json` |
| Cline | `~/.cline/data/*` |
| Kilo Code | `~/.local/share/kilo/auth.json` |
| Copilot (VS Code models) | `chatLanguageModels.json` |
| DeepSeek TUI | `~/.deepseek/config.toml` |
| jcode | `~/.jcode/config.toml` |
| Grok Build | `~/.grok/config.toml` |

## Run

```bat
cd C:\Dev\AgentConfig
run.bat
```

Or:

```bash
npm install
npm start
```

Open: **http://127.0.0.1:20130**

Port: `AGENTCONFIG_PORT` or `PORT` (default `20130`).

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health |
| GET | `/api/tools` | Tool registry |
| GET | `/api/tools/statuses` | Install/config status batch |
| POST | `/api/tools/:id/apply` | `{ baseUrl, apiKey, model }` |
| DELETE | `/api/tools/:id/reset` | Remove AgentConfig/9router slots |
| POST | `/api/tools/apply-all` | Apply to all writable CLIs |
| GET/PUT | `/api/settings` | Defaults + presets |

## Notes

- Defaults target a local gateway (e.g. 9router `http://127.0.0.1:20128/v1`).
- Provider slots are written as `agentconfig` (also detects legacy `9router` as configured).
- MITM (Antigravity / Copilot / Kiro) is **not** started here — use 9router.
