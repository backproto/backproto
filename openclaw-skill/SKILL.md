---
name: pura
description: Route LLM calls through the Pura gateway — automatic model selection, cost tracking, quality-weighted routing, Lightning settlement
emoji: ⚡
homepage: https://pura.xyz
metadata:
  requires:
    env:
      - PURA_API_KEY
  optional_env:
    - PURA_GATEWAY_URL
  tags:
    - llm
    - routing
    - lightning
    - ai-agent
---

# Pura — intelligent inference gateway

Route LLM requests across OpenAI, Anthropic, Groq, and Gemini. Pura picks the best model for each task, tracks per-key spend, and settles on Lightning. Drop-in OpenAI-compatible.

## Setup

Get an API key:

```bash
curl -s -X POST https://api.pura.xyz/api/keys \
  -H "Content-Type: application/json" \
  -d '{"label":"my-agent"}' | python3 -m json.tool
```

Save the returned key (starts with `pura_`):

```bash
export PURA_API_KEY="pura_your_key_here"
```

## Sending requests

Pura is OpenAI SDK-compatible. Swap your base URL:

```python
from openai import OpenAI
import os

client = OpenAI(
    base_url="https://api.pura.xyz/v1",
    api_key=os.environ["PURA_API_KEY"]
)

response = client.chat.completions.create(
    model="auto",  # let Pura pick the best model
    messages=[{"role": "user", "content": "Hello"}]
)
```

Or with curl (OpenAI-compatible path):

```bash
curl -s -X POST https://api.pura.xyz/v1/chat/completions \
  -H "Authorization: Bearer $PURA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}], "stream": false}'
```

Direct gateway path also works:

```bash
curl -s -X POST https://api.pura.xyz/api/chat \
  -H "Authorization: Bearer $PURA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

## Response headers

Every response includes routing metadata:

| Header | Value |
|--------|-------|
| `X-Pura-Provider` | Which provider handled it (openai, anthropic, groq, gemini) |
| `X-Pura-Model` | Specific model used |
| `X-Pura-Cost` | Estimated cost in USD |
| `X-Pura-Budget-Remaining` | Remaining daily budget in USD |
| `X-Pura-Tier` | Complexity tier (cheap, mid, premium) |
| `X-Pura-Quality` | Provider quality score (0-1) |

## Cost reports

```bash
# 24h spend breakdown
curl -s https://api.pura.xyz/api/report \
  -H "Authorization: Bearer $PURA_API_KEY" | python3 -m json.tool

# Formatted income statement
curl -s https://api.pura.xyz/api/income \
  -H "Authorization: Bearer $PURA_API_KEY" | python3 -m json.tool
```

## Lightning wallet

5,000 free requests included. After that, fund a Lightning wallet:

```bash
# Get a funding invoice
curl -s -X POST https://api.pura.xyz/api/wallet/fund \
  -H "Authorization: Bearer $PURA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}' | python3 -m json.tool

# Check balance
curl -s https://api.pura.xyz/api/wallet/balance \
  -H "Authorization: Bearer $PURA_API_KEY" | python3 -m json.tool
```

## Explicit model routing

Override auto-routing by specifying a model:

```bash
# Force GPT-4o
curl -s -X POST https://api.pura.xyz/v1/chat/completions \
  -H "Authorization: Bearer $PURA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role":"user","content":"Hello"}], "stream": false}'
```

Supported models: `gpt-4o`, `claude-sonnet-4-20250514`, `llama-3.3-70b-versatile`, `gemini-2.0-flash`.

## Routing hints

Influence provider selection without forcing a specific model:

```json
{
  "messages": [{"role": "user", "content": "..."}],
  "routing": {
    "quality": "high",
    "prefer": "anthropic",
    "maxCost": 0.01,
    "maxLatency": 5000
  }
}
```

## Marketplace

Register skills to earn sats from other agents:

```bash
# Register a skill
curl -s -X POST https://api.pura.xyz/api/marketplace/register \
  -H "Authorization: Bearer $PURA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"skillType": "code-review", "price": 1500, "capacity": 10, "description": "Review PRs for bugs and style"}'

# Search for available agents
curl -s "https://api.pura.xyz/api/marketplace/search?skill=code-review&maxPrice=2000" \
  -H "Authorization: Bearer $PURA_API_KEY"
```

## How routing works

Pura scores each request's complexity based on message length, code blocks, reasoning triggers, and conversation depth. Simple tasks go to Groq or Gemini. Complex reasoning goes to Anthropic or OpenAI. Quality scores (derived from recent success rate and latency) weight the selection so underperforming providers get fewer requests until they recover.

## Links

- Gateway: <https://api.pura.xyz>
- Website: <https://pura.xyz>
- Docs: <https://pura.xyz/docs>
- GitHub: <https://github.com/puraxyz/puraxyz>
