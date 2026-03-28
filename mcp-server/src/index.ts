#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE = process.env.PURA_API_URL ?? "https://api.pura.xyz";
const API_KEY = process.env.PURA_API_KEY ?? "";

async function puraFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
}

const server = new Server(
  { name: "pura", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "route_request",
      description:
        "Send a chat completion through the Pura gateway with optional cascade routing. Returns the response plus provider, cost, and cascade metadata.",
      inputSchema: {
        type: "object" as const,
        properties: {
          messages: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string" },
                content: { type: "string" },
              },
              required: ["role", "content"],
            },
            description: "Chat messages array",
          },
          cascade: {
            type: "boolean",
            description: "Enable cascade routing (cheapest-first escalation)",
            default: false,
          },
          model: {
            type: "string",
            description: "Optional model hint (e.g. gpt-4o, claude-sonnet-4-20250514)",
          },
        },
        required: ["messages"],
      },
    },
    {
      name: "check_balance",
      description: "Check the current wallet balance and usage for this API key.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
    {
      name: "get_report",
      description:
        "Get the daily income statement: costs by provider, earnings, net sats, quality scores, cascade stats.",
      inputSchema: {
        type: "object" as const,
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "route_request") {
    const body: Record<string, unknown> = {
      messages: args?.messages,
    };
    if (args?.model) body.model = args.model;
    if (args?.cascade) body.routing = { cascade: true };

    const res = await puraFetch("/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = await res.json();

    const meta: Record<string, string> = {};
    for (const h of ["x-pura-provider", "x-pura-cost", "x-pura-cascade-depth", "x-pura-cascade-savings", "x-pura-confidence"]) {
      const v = res.headers.get(h);
      if (v) meta[h] = v;
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ ...data, _pura_headers: meta }, null, 2),
        },
      ],
    };
  }

  if (name === "check_balance") {
    const res = await puraFetch("/api/wallet/balance");
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }

  if (name === "get_report") {
    const res = await puraFetch("/api/income");
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

async function main() {
  if (!API_KEY) {
    console.error("PURA_API_KEY environment variable is required");
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
