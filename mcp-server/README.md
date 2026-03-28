# @puraxyz/mcp-server

MCP server that connects AI agents to the Pura gateway.

## Tools

| Tool | What it does |
|------|-------------|
| `route_request` | Send a chat completion through the gateway. Supports cascade routing. Returns response + provider/cost metadata. |
| `check_balance` | Get current wallet balance and usage stats for this API key. |
| `get_report` | Get the daily income statement: costs, earnings, quality, cascade stats. |

## Setup

```bash
npm install @puraxyz/mcp-server
```

Set the environment variable:

```bash
export PURA_API_KEY=pura_abc123...
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pura": {
      "command": "npx",
      "args": ["@puraxyz/mcp-server"],
      "env": {
        "PURA_API_KEY": "pura_abc123..."
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "pura": {
      "command": "npx",
      "args": ["@puraxyz/mcp-server"],
      "env": {
        "PURA_API_KEY": "pura_abc123..."
      }
    }
  }
}
```

### OpenClaw

The MCP server works as an OpenClaw skill. Point your agent's MCP config at `@puraxyz/mcp-server` and it gains access to the gateway, balance checking, and income reporting.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PURA_API_KEY` | (required) | Your Pura gateway API key |
| `PURA_API_URL` | `https://api.pura.xyz` | Gateway base URL |
