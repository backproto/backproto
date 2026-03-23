import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { Shadow } from "./shadow.js";

export interface ServerConfig {
  port?: number;
  host?: string;
}

/**
 * Starts a lightweight HTTP server exposing shadow metrics.
 *
 * GET /metrics → ShadowMetrics JSON
 * GET /simulate → SimulationResult JSON
 * GET /health → { status: "ok" }
 */
export function startServer(shadow: Shadow, config?: ServerConfig) {
  const port = config?.port ?? 3099;
  const host = config?.host ?? "127.0.0.1";

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/metrics" && req.method === "GET") {
      const metrics = shadow.getMetrics();
      res.writeHead(200);
      res.end(JSON.stringify(metrics));
    } else if (req.url === "/simulate" && req.method === "GET") {
      const result = shadow.simulate();
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } else if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "not found" }));
    }
  });

  server.listen(port, host);
  return server;
}
