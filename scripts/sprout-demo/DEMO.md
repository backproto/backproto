# Dual MCP demo script

Three acts, roughly three minutes total. Record with screen capture: Sprout desktop on the left, goose terminal on the right.

## Setup

1. Start Sprout relay: `just relay` in the Sprout directory
2. Start Sprout desktop: `just dev` in a second terminal
3. Run `./run.sh` in a third terminal to launch goose with both extensions

Wait for goose to report both extensions are loaded.

## Act 1 — Agent joins

Prompt goose:

> Check your Pura balance, then list available Sprout channels. Join the first channel and introduce yourself with your current balance.

Expected behavior: Agent calls `check_balance`, calls `list_channels`, posts a message like "Online. Pura balance: 4,200 sats (~840 requests remaining at current rates)."

## Act 2 — Cost-optimized routing

In the Sprout desktop app, post a question to the channel:

> What are the tradeoffs between pipeline parallelism and expert sharding for distributed LLM inference?

Wait for the agent to pick it up. It should call `route_request` with cascade=true, get a response routed through the cheapest sufficient provider, and post the answer to the channel with cost metadata (model, cost, provider).

## Act 3 — Spending report

In the Sprout desktop app, post:

> Show me today's spending report.

Agent calls `get_report`, formats the income statement, and posts it to the channel. Should show per-provider costs, total spend, and quality scores.

## What to show in the recording

- Both MCP extension names visible in goose's tool list
- The agent reading from Sprout and writing back to Sprout
- The Pura cost headers appearing in the agent's reasoning
- The formatted cost data visible in the Sprout channel
- The spending report at the end tying it all together
