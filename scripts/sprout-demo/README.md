# Sprout + Pura dual MCP demo

A goose agent running inside a Sprout relay (Block's Nostr-based team communication) with Pura's cost-optimized LLM gateway. The agent uses Sprout for real-time team communication and Pura for inference routing with automatic cost tracking.

## How it works

goose loads two MCP servers as stdio extensions:

- **Sprout MCP** (43 tools): channels, messages, search, canvases, workflows
- **Pura MCP** (3 tools): route_request, check_balance, get_report

No code changes to either project. Pure configuration.

## Architecture

```
┌─────────────┐     stdio      ┌─────────────────┐
│  Sprout MCP │◄──────────────►│                  │
│  (43 tools) │                │     goose        │
└──────┬──────┘                │     agent        │
       │ WebSocket             │                  │
       ▼                       └────────┬─────────┘
┌──────────────┐                        │ stdio
│ Sprout relay │               ┌────────▼─────────┐
│ ws://local   │               │    Pura MCP       │
└──────────────┘               │    (3 tools)      │
                               └────────┬──────────┘
                                        │ HTTPS
                                        ▼
                               ┌──────────────────┐
                               │  api.pura.xyz     │
                               │  (LLM gateway)   │
                               └──────────────────┘
```

## Prerequisites

- Docker (Sprout infra: Postgres, Redis, Typesense)
- Rust 1.88+ (building Sprout)
- Node.js 24+ (Pura MCP build)
- goose CLI (`brew install --cask block-goose`)
- Pura API key (from api.pura.xyz)

## Setup

1. Build Pura MCP server:
   ```bash
   cd /path/to/synthesi/mcp-server && npm install && npm run build
   ```

2. Clone and build Sprout:
   ```bash
   git clone https://github.com/block/sprout.git
   cd sprout && cp .env.example .env && just setup && just build
   ```

3. Copy and fill in credentials:
   ```bash
   cp demo.env.example demo.env
   # Edit demo.env with your keys
   ```

4. Start the relay:
   ```bash
   cd /path/to/sprout && just relay
   ```

5. Run the demo:
   ```bash
   ./run.sh
   ```

See [DEMO.md](DEMO.md) for the scripted walkthrough.

## goose config.yaml alternative

Instead of the CLI flags in run.sh, you can add this to `~/.config/goose/config.yaml`:

```yaml
extensions:
  sprout:
    name: "Sprout"
    type: stdio
    cmd: "cargo"
    args: ["run", "-p", "sprout-mcp", "--bin", "sprout-mcp-server"]
    enabled: true
    timeout: 300
    envs:
      SPROUT_RELAY_URL: "ws://localhost:3000"
      SPROUT_API_TOKEN: "<token>"
      SPROUT_PRIVATE_KEY: "<nsec>"
  pura:
    name: "Pura Gateway"
    type: stdio
    cmd: "node"
    args: ["/path/to/synthesi/mcp-server/dist/index.js"]
    enabled: true
    timeout: 300
    envs:
      PURA_API_KEY: "<key>"
      PURA_API_URL: "https://api.pura.xyz"
```
