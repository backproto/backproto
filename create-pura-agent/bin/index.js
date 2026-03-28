#!/usr/bin/env node

import { createInterface } from "node:readline";
import { writeFileSync, existsSync } from "node:fs";

const API = "https://api.pura.xyz";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

async function main() {
  log("");
  log("create-pura-agent");
  log("==================");
  log("This will set up a .env file with your Pura API key");
  log("and run a test request through cascade routing.");
  log("");

  // Step 1: collect provider keys (optional)
  const openaiKey = await ask("OpenAI API key (optional, press enter to skip): ");
  const anthropicKey = await ask("Anthropic API key (optional, press enter to skip): ");

  // Step 2: get a Pura key
  log("");
  log("Requesting a Pura API key...");

  let puraKey;
  try {
    const res = await fetch(`${API}/api/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "create-pura-agent bootstrap" }),
    });
    if (!res.ok) {
      const text = await res.text();
      log(`Failed to get API key: ${res.status} ${text}`);
      log("You can create one manually at https://api.pura.xyz/gateway");
      puraKey = await ask("Paste your Pura API key: ");
    } else {
      const data = await res.json();
      puraKey = data.key;
      log(`Got key: ${puraKey.slice(0, 8)}...`);
    }
  } catch (err) {
    log(`Could not reach ${API}: ${err.message}`);
    puraKey = await ask("Paste your Pura API key: ");
  }

  if (!puraKey || puraKey.trim() === "") {
    log("No API key provided. Exiting.");
    rl.close();
    process.exit(1);
  }

  // Step 3: write .env
  const envLines = [`PURA_API_KEY=${puraKey.trim()}`];
  if (openaiKey.trim()) envLines.push(`OPENAI_API_KEY=${openaiKey.trim()}`);
  if (anthropicKey.trim()) envLines.push(`ANTHROPIC_API_KEY=${anthropicKey.trim()}`);

  const envPath = ".env";
  if (existsSync(envPath)) {
    log(".env already exists — appending Pura key");
    writeFileSync(envPath, "\n" + envLines.join("\n") + "\n", { flag: "a" });
  } else {
    writeFileSync(envPath, envLines.join("\n") + "\n");
  }
  log(`Wrote ${envPath}`);

  // Step 4: test cascade request
  log("");
  log("Running a test cascade request...");

  try {
    const res = await fetch(`${API}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${puraKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is backpressure in distributed systems? Answer in two sentences." }],
        routing: { cascade: true },
      }),
    });

    if (!res.ok) {
      log(`Request failed: ${res.status} ${await res.text()}`);
    } else {
      const data = await res.json();
      const depth = res.headers.get("x-pura-cascade-depth") || data.cascade?.depth || "?";
      const savings = res.headers.get("x-pura-cascade-savings") || data.cascade?.savings_pct || "?";
      const confidence = res.headers.get("x-pura-confidence") || data.cascade?.confidence_scores?.[0] || "?";

      log("");
      log("Cascade result:");
      log(`  Depth:      ${depth}`);
      log(`  Savings:    ${savings}%`);
      log(`  Confidence: ${confidence}`);
      if (data.choices?.[0]?.message?.content) {
        log(`  Response:   ${data.choices[0].message.content.slice(0, 120)}...`);
      }
    }
  } catch (err) {
    log(`Test request failed: ${err.message}`);
  }

  // Step 5: next steps
  log("");
  log("Next steps:");
  log("  1. Use Pura as a drop-in OpenAI replacement:");
  log('     const openai = new OpenAI({ baseURL: "https://api.pura.xyz/v1" })');
  log("  2. Enable cascade routing: { routing: { cascade: true } }");
  log("  3. Check costs: GET https://api.pura.xyz/api/income");
  log("  4. Docs: https://pura.xyz/docs/getting-started-gateway");
  log("");

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
