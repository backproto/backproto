# Next steps

## Where things stand

The gateway runs at api.pura.xyz with four providers (OpenAI, Anthropic, Groq, Gemini) and cascade routing for cost optimization. The site is at pura.xyz. Contracts (35, 319 tests) compile and pass. NVM base (31900-31905) and advanced systems (31910-31922) are implemented with 87 tests. Shadow sidecar, CLI bootstrap, MCP server, and operator playbook are all in the repo.

### What shipped in this cycle

- Cascade routing engine (opt-in, staged escalation: groq → gemini → openai → anthropic, confidence heuristic with 4 signals)
- Homepage rewrite (15 sections down to 5: hero, proof/income, how-it-works, comparison, go-deeper)
- Nav cleanup (7 links to 4, subnav removed)
- Shadow mode landing page at `/shadow`
- 17 blog posts with consecutive dates (Mar 12-28), 7 rewritten
- `create-pura-agent` CLI bootstrap tool
- `@puraxyz/mcp-server` with 3 tools (route_request, check_balance, get_report)
- `OPERATOR-PLAYBOOK.md` (Pura-1 directive)
- 4 new NVM spec documents (kinds 31930-31935): artifact royalty graphs, specification bonds, dead letter vaults, blend gradient scoring
- Protocol design constraints document (Lightning liquidity, blend-diversity tension, correlation verification, hitchhiker bids)
- Cascade stats endpoint (`/api/cascade-stats`), savings endpoint (`/api/savings`)
- Monitor pages tagged with launch banners

### What's left

Ordered by priority. Operational steps that need manual intervention are marked.

---

## 1. Verify builds

Run `tsc --noEmit` and `next build` for gateway and pura. Run `vitest` for nvm. All must pass before committing.

```bash
cd gateway && npx tsc --noEmit && npx next build
cd ../pura && npx tsc --noEmit && npx next build
cd ../nvm && npx vitest run
```

## 2. Commit and tag

Push all unstaged changes. Tag `v0.2.0-cascade`.

## 3. Deploy gateway update

Gateway is already live at api.pura.xyz on Vercel. Push to main triggers auto-deploy. After deploy:

- Verify `curl https://api.pura.xyz/api/health`
- Verify `curl https://api.pura.xyz/api/cascade-stats` returns valid JSON
- Send a cascade request: `routing.cascade: true` in the request body
- Check response headers for `X-Pura-Cascade-Depth`, `X-Pura-Cascade-Savings`, `X-Pura-Confidence`

## 4. Deploy site update

Site is at pura.xyz on Vercel. Auto-deploys on push. After deploy:

- Verify homepage loads with 5-section layout
- Verify `/shadow` page renders
- Verify blog post dates are consecutive (Mar 12-28)
- Verify nav has 4 links (home, gateway, docs, blog)

## 5. End-to-end cascade proof

This is the "cascade saves money" moment.

```bash
# Generate key
curl -X POST https://api.pura.xyz/api/keys \
  -H "Content-Type: application/json" \
  -d '{"label":"cascade-test"}'

# Send cascade request
curl https://api.pura.xyz/v1/chat/completions \
  -H "Authorization: Bearer pura_..." \
  -H "Content-Type: application/json" \
  -d '{
    "messages":[{"role":"user","content":"What is 2+2?"}],
    "routing":{"cascade":true}
  }'
```

Simple questions should resolve at depth 1 (Groq). Hard questions should escalate. Check `X-Pura-Cascade-Savings` header for cost delta.

Run 10+ requests with varying complexity. Verify `/api/cascade-stats` aggregates correctly.

## 6. Publish CLI and MCP server

```bash
cd create-pura-agent && npm publish --access public
cd ../mcp-server && npm publish --access public
```

Test the CLI: `npx create-pura-agent` should walk through key setup and send a cascade test request.

## 7. Publish SDK

```bash
cd sdk && npm version patch && npm run build && npm publish --access public
```

## 8. Deploy contracts to Base mainnet (manual)

Fund deployer wallet with ~0.05 ETH on Base.

```bash
cd contracts
forge script script/DeployMainnet.s.sol \
  --rpc-url base_mainnet \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast --verify \
  --etherscan-api-key $BASESCAN_API_KEY
```

Copy addresses to `contracts/deployments/base-mainnet.json` and `sdk/src/addresses.ts`.

## 9. GTM execution — OpenClaw-first

All materials in `gtm/`. Strategy: penetrate the OpenClaw ecosystem (250K stars, 1.5M agents, 129 startups) as the default cost-optimization layer. 60-day plan.

Phase 1 (days 1-7): Run personal agents through gateway, collect real cost data, verify /compare page and install flow.
Phase 2 (days 1-14): OpenClaw community immersion — GitHub issues, Discord, identify target builders. No self-promotion yet.
Phase 3 (days 7-21): LinkedIn content push — 5 posts, cost savings angle, real experiment data.
Phase 4 (days 7-28): Direct outreach — DMs to OpenClaw builders, startup founders, top contributors.
Phase 5 (days 14-28): Reddit + HN — product-first posts on r/LocalLLaMA, r/OpenClaw, Show HN.
Phase 6 (days 28-60): Expand if beachhead is working — grants, secondary communities, SDK publish.

Full plan: `gtm/ROADMAP.md`

## 10. NVM relay deployment

Deploy strfry relay + NVM relay to a VPS. Connect gateway with `NVM_ENABLED=true`. Full infra guide in OWNERS-MANUAL.md section 18.

## 11. Shadow mode beta

Run shadow sidecar alongside gateway. Collect comparison data for the cascade-routing-savings blog post. Update the placeholder at `pura/content/blog/cascade-routing-savings.mdx` with real numbers.

---

## Critical path

```
verify builds → commit → deploy gateway + site → cascade proof
                                                → publish CLI + MCP + SDK
                                                → deploy contracts (manual)
                                                → GTM (start after proof)
                                                → NVM relay (parallel)
                                                → shadow beta (parallel)
```

## Scope boundaries

Included: cascade routing, UI cleanup, shadow mode, blog, CLI/MCP, operator playbook, NVM specs, documentation updates, build verification.

Excluded: thermodynamic layer (v0.2), V2 composition contracts, mainnet contract deployment (manual step after audit).

Advanced NVM systems (31910-31922): implemented and tested locally. New specs (31930-31935): designed, not implemented. Deployment deferred to relay integration phase.


**Stubs (interfaces + ingestion, no execution):**
- Capacity futures — orderbook, buy/sell matching, price oracle
- Cross-NVM bridging — registry, sanitizer, attestation store
- Emergent protocol negotiation — proposal tracking, endorsement counting, activation

**Wired into relay:** Credit and reputation are integrated into the AgentRelay. The routing service checks credit availability before dispatching jobs. Reputation profiles are published periodically alongside quality scores.

**Visualization:** Evolution dashboard at `/evolution` renders agent phylogeny as a force-directed Canvas graph.

**Next:** Wire futures into the relay subscription loop. Build a real bridge agent that connects two relay instances. Convert protocol stubs into active governance. All of these require multi-relay test infrastructure that doesn't exist yet.

---

## 10. Pura-1 agent setup (human-only)

Everything below requires credentials, accounts, or manual interaction.

### OpenClaw install

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

During onboard, choose Anthropic claude-opus-4-6 as primary model.

### Telegram bot

Create a bot via @BotFather. Save the token. Add it to OpenClaw config:

```bash
# In ~/.openclaw/openclaw.json, set:
# channels.telegram.botToken = "<your-bot-token>"
```

### Agent workspace

```bash
# Point OpenClaw at the Pura monorepo
# In ~/.openclaw/openclaw.json, set:
# agents.defaults.workspace = "/path/to/synthesi"

# Copy the prepared directive and skill
cp openclaw-skill/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp -r openclaw-skill/ ~/.openclaw/workspace/skills/pura/

# Set up Git identity for the agent
cd ~/.openclaw/workspace
git config user.name "pura-1-agent"
git config user.email "pura-1@pura.xyz"
```

### Generate API key

```bash
# Generate a Pura gateway key for the agent
curl -s -X POST https://api.pura.xyz/api/keys \
  -H "Content-Type: application/json" \
  -d '{"label":"pura-1"}'

# Set the returned key in OpenClaw env
# PURA_API_KEY=pura_...
```

### Lightning wallet

Option A — LNbits:
```bash
# Create wallet at your LNbits instance
# Set in gateway env:
# LNBITS_URL=https://your-lnbits.com
# LNBITS_ADMIN_KEY=<admin-key>
```

Option B — LND:
```bash
# Set in gateway env:
# LND_REST_HOST=https://your-lnd:8080
# LND_MACAROON_HEX=<hex-encoded-admin-macaroon>
```

Fund the wallet with ~50,000 sats via `POST /api/wallet/fund`.

### ClawHub publishing

```bash
cd openclaw-skill
openclaw skills publish pura
# Or via clawhub CLI:
npm install -g clawhub
clawhub sync
```

Verify the skill appears on clawhub.com and is installable via `openclaw skills install pura`.

### OpenClaw cron

Configure periodic tasks in OpenClaw:

| Schedule | Task |
|----------|------|
| Every 15 min | Health check (test request through gateway) |
| Daily 7am | Send income statement to Telegram |
| Nightly | QA pass (review routing decisions, spot patterns) |
| Weekly Sunday evening | Write WEEKLY-REVIEW.md |

### Verify

```bash
# Telegram bot should respond
# Health check should pass
openclaw status
# Should show pura-1 agent running with skill registered
```

## 11. Run the 48-hour experiment

Follow `gtm/experiment-runbook.md`. Requires 5 funded API keys and the economy dashboard live at pura.xyz/economy.

After the experiment:
- Fill in placeholder data in `pura/content/blog/first-agent-economy.mdx`
- Post X thread narrating results
- DM steipete with the income statement screenshot
- Submit Show HN with live dashboard link

---

## 12. NVM (Nostr Virtual Machine) — future work

The `nvm/` package implements BPE routing over Nostr events with Lightning settlement. Below are items explicitly deferred from the initial implementation. Each one has a stub, a TODO comment, or an interface ready for it.

### Real Lightning wallet backends

`nvm/src/payments/lightning.ts` has a mock wallet. Real backends need implementing:

- **Alby**: OAuth token → NWC (Nostr Wallet Connect) flow. Most agents will use this.
- **LND**: gRPC/REST macaroon auth, invoice creation, payment monitoring.
- **CLN**: `lightning-cli` or commando plugin interface.
- **Cashu**: ecash mints for instant micro-settlements. Good for sub-100-sat jobs.

The `LightningWallet` interface is defined. Each backend is a factory function in `createWallet()`.

### Formal NIP proposal

The six NVM event kinds (31900-31905) work today as application-specific events. For broader adoption, write a NIP (Nostr Implementation Proposal) specifying:

- Tag schemas for each kind
- Dual-signature verification protocol (kind-31901)
- Expected relay behavior for parameterized replaceable events
- Interaction with NIP-90 (DVM) and NIP-57 (zaps)

Draft in `docs/nips/nip-nvm.md`. Submit to `nostr-protocol/nips` repo.

### Thermodynamic adoption layer

`plan/13-THERMODYNAMIC-ADOPTION.md` describes agent temperature, Gibbs free energy for task-agent matching, and entropy-driven exploration. The NVM's `adaptiveExplorationRate()` in `nvm/src/routing/scoring.ts` is the first step — it adjusts exploration based on quality score volatility. The full thermodynamic model would replace the flat exploration rate with temperature-aware Boltzmann selection across the entire routing decision.

### Dynamic DAGs (runtime pipeline modification)

Current pipelines (kind-31904) are static: you define the DAG, it runs. Dynamic DAGs would allow:

- Conditional branches (if node A score > threshold, skip node B)
- Loop nodes (retry with exponentially increasing budget)
- Runtime node insertion (agent discovers it needs a sub-task)

The `PipelineExecutor` in `nvm/src/orchestrator/executor.ts` would need a `modifyDAG()` hook and support for kind-31904 updates mid-execution.

### Agent guilds and specialization markets

Groups of agents that coordinate internally before competing externally. A guild has a shared reputation, shared capacity pool, and internal job routing. The relay sees the guild as a single agent; internally the guild has its own BPE instance.

Would need: kind-31906 (guild attestation), guild-level EWMA aggregation in `CapacityIndex`, and a guild membership protocol.

### Physical IoT integration

The research-6 proposal describes capacity attestations from physical devices (compute nodes, storage, bandwidth). The kind-31900 schema already supports this — `skillType` can be `compute-gpu-a100` or `storage-s3-compatible`. What's missing:

- Hardware attestation (proving you actually have the GPU, not just claiming it)
- Bandwidth measurement protocol
- Physical-world latency measurement vs. Nostr message propagation delay

### Gateway NVM consumer refactor

The HTTP gateway at `gateway/` currently routes via its own provider scoring. It could consume NVM events instead:

- Subscribe to kind-31900 attestations from LLM providers running as NVM agents
- Use the BPE router (`nvm/src/routing/router.ts`) for provider selection
- Publish kind-31901 receipts after each completion
- Settle via NIP-57 zaps instead of tracking USD spend

This makes the gateway a thin NVM client rather than a standalone routing engine. Both modes should coexist during transition.

### SDK Nostr transport

The SDK (`sdk/`) currently talks to Base contracts via ethers.js. Add a Nostr transport layer:

- `sdk/src/transports/nostr.ts` wrapping `NostrClient`
- Same action module interface, different backend
- Agent chooses transport at init: `createAgent({ transport: 'nostr' })` or `createAgent({ transport: 'base' })`

### Relay federation

Multiple Agent Relays sharing capacity indices. When relay A has no agents for a skill, it forwards to relay B. Needs:

- Relay discovery (kind-31907 relay attestation?)
- Inter-relay capacity gossip protocol
- Split routing fees between forwarding and executing relays

### Agent reputation portability

An agent's quality score (kind-31902) is currently relay-local. For scores to be portable across relays:

- Standardize the composite score formula across implementations
- Cryptographic proof of completion count (aggregate Schnorr sigs?)
- Sybil resistance for score bootstrapping (new agents with no history)
