# bit.recipes — Complete Build Specification

## What It Is

bit.recipes is the official Backproto cookbook: a visual, executable pipeline builder where each "recipe" is a declarative YAML spec that wires together providers, capacity signals, pricing curves, and streaming payments into a working pipeline. Recipes can be browsed in a gallery, forked with one click, simulated in-browser with live congestion visualization, and deployed to Base Sepolia via CLI.

It serves two audiences simultaneously: developers who want composable, copy-paste patterns to build on Backproto, and newcomers who need to *see* backpressure economics working in 15 seconds via the visual simulator.

Every reference product in the Backproto ecosystem (bitbolt.ai, spilt.dev, sponsors.fund, logd.ai, airadio.org, etc.) decomposes into its constituent recipe(s) on bit.recipes.

---

## Core Architecture: Three Layers

### Layer 1: The Recipe Spec

A YAML-based declarative format for defining Backproto pipelines. Publish a formal JSON Schema so tooling can validate specs.

Each recipe declares:

- **Metadata**: name, description, author, tags, difficulty level, domain (AI / Lightning / Nostr / DeFi / General), estimated deployment gas cost, Backproto contracts used
- **Funding**: EscrowBuffer address, Superfluid streaming config, pre-funding requirements
- **Steps**: ordered pipeline stages, each with an `id`, `kind` (e.g. `openai-compatible`, `nostr-relay`, `log-ingest`, `payment-stream`), and a list of providers
- **Providers** (per step): endpoint, CapacityRegistry attestor address, StakeManager config (address + minimum stake), PricingCurve parameters (base price, k, alpha), SLO expectations
- **Routing**: policy (`capacity_weighted`), fairness guarantee (`lyapunov_optimal`), min/max provider constraints, max share per provider
- **Settlement**: BackpressurePool address, CompletionTracker address, penalty config (SLO thresholds, misreporting multiplier)
- **Observability**: export targets (OpenTelemetry, JSON, webhook)

Reference YAML (this is the canonical example for the LLM Ensemble recipe):

```yaml
name: "LLM Ensemble (capacity-weighted)"
description: "Route completions across multiple model runners; weights follow spare capacity and price."
domain: ai
difficulty: intermediate
contracts_used:
  - CapacityRegistry
  - BackpressurePool
  - PricingCurve
  - EscrowBuffer
  - CompletionTracker
  - StakeManager

funding:
  escrowBuffer: "0x8d2f5b40315cccf9b7aa10869c035f9c7a0a3160"
  superfluid:
    enabled: true

steps:
  - id: prompt-to-tokens
    kind: openai-compatible
    providers:
      - name: vLLM-A
        endpoint: "https://provider-a/run"
        capacityAttestor: "0x6f58f28c0a270c198c65cff5c5a7ba9d86088948"
        stake:
          manager: "0xdc26b147030f635a2f8ac466d28a88b3b33ca6b3"
          min: "500 USDC"
        pricingCurve:
          base: 0.0008
          k: 0.15
          alpha: 2.0
      - name: vLLM-B
        endpoint: "https://provider-b/run"
        capacityAttestor: "0x6f58f28c0a270c198c65cff5c5a7ba9d86088948"
        stake:
          manager: "0xdc26b147030f635a2f8ac466d28a88b3b33ca6b3"
          min: "500 USDC"
        pricingCurve:
          base: 0.0007
          k: 0.20
          alpha: 1.8

routing:
  policy: capacity_weighted
  fairness: lyapunov_optimal
  minProviders: 2
  maxSharePerProvider: 0.7

settlement:
  backpressurePool: "0x8e999a246afea241cf3c1d400dd7786cf591fa88"
  completionTracker: "0xff3dab79a53ffd11bae041e094ed0b6217acfc3c"
  penalties:
    slo:
      p95_latency_ms: 1500
      timeout_ms: 8000
    misreportingMultiplier: 3.0

observability:
  export: ["opentelemetry", "json"]
```

### Layer 2: The `bake` CLI

A Node.js/TypeScript CLI tool published to npm as `@backproto/bake`.

Commands:

- **`bake init <template>`** — Scaffold a new recipe from a named template or blank. Generates the YAML file, a README, and a basic test harness.
- **`bake validate`** — Validate a recipe YAML against the JSON Schema. Report errors with line numbers and suggestions.
- **`bake test`** — Run the recipe against a local simulator with synthetic load. Spin up mock providers, generate requests, and output metrics (allocation efficiency, latency distribution, provider earnings).
- **`bake sim --chaos`** — Same as test but with fault injection: randomly kill providers, spike load on specific nodes, degrade capacity. Output shows how routing adapts in real-time. Print a summary comparing "with Backproto" vs "naive round-robin" allocation.
- **`bake deploy`** — Deploy the recipe to Base Sepolia using the contract addresses in the YAML. Verify contracts on-chain, register providers in CapacityRegistry, configure PricingCurve parameters, fund the EscrowBuffer. Output transaction hashes for each step.
- **`bake fork <recipe-name>`** — Clone an existing recipe from the bit.recipes registry into local directory. Prompt user to customize provider endpoints and pricing parameters.
- **`bake serve`** — Run a deployed recipe as a live service. Start an HTTP gateway that accepts requests, routes them via the configured Backproto pipeline, and streams payments.
- **`bake publish`** — Publish a recipe to the bit.recipes public registry (requires GitHub auth).

The CLI should output clean, colorized terminal output with progress indicators. Every command should have a `--json` flag for programmatic use.

### Layer 3: The Visual Playground (Web UI)

The hero feature of bit.recipes. Built with React + React Flow (or xyflow) for the node-based pipeline visualization + Tailwind for styling.

**Gallery Page (Landing Page)**:
- Grid of recipe cards, each showing: name, domain tag (AI/Lightning/Nostr/DeFi), difficulty badge, one-line description, contracts used (as small icons/pills), and a miniature pipeline diagram preview
- Filter by domain, difficulty, contract used, granularity (full pipeline vs atomic pattern)
- Search
- "Fork this recipe" button on every card → copies YAML to clipboard or opens in editor
- Hero section at top with animated pipeline visualization showing backpressure in action (auto-playing the simulation from the flagship LLM Ensemble recipe)

**Recipe Detail Page**:
Each recipe gets its own page with these sections:

1. **Header**: Name, description, domain, difficulty, author, link to related reference product (e.g. "This recipe powers bitbolt.ai"), contracts used as linked pills (link to Basescan)
2. **Visual Pipeline View**: Full React Flow canvas showing the recipe as a node graph
   - Each step is a node; each provider within a step is a sub-node
   - Edges show data flow (solid lines) and payment streams (dashed lines, thickness proportional to flow)
   - Provider nodes display real-time utilization (0–100%), pricing curve position, and capacity status
   - Color coding: green (spare capacity) → yellow (moderate load) → red (at capacity)
3. **Simulation Panel**: A control panel (sidebar or bottom drawer) with:
   - "Run Simulation" button — starts synthetic traffic flowing through the pipeline
   - Load slider — adjust request volume from low to extreme
   - "Kill Provider" buttons — click any provider node to take it offline
   - "Spike Load" button — inject a sudden burst of traffic
   - "Degrade Capacity" — gradually reduce a provider's declared capacity
   - Real-time metrics dashboard showing: allocation efficiency %, gas costs, per-provider earnings, SLO compliance, active reroutes count
   - A/B comparison toggle: show naive round-robin vs Backproto routing side-by-side
4. **YAML Spec**: Full YAML with syntax highlighting, copy button, and inline annotations explaining each section
5. **"How to Deploy" Guide**: Step-by-step instructions for deploying this recipe via the `bake` CLI
6. **"How to Turn This Into a Business" Guide**: For each recipe, a short (3–5 paragraph) guide explaining what business this recipe enables, who the customers are, how to monetize, and what to customize. This is the "forkable business" narrative.
7. **"How to Customize" Section**: Common variations and tweaks (e.g. "To add a third provider, add another entry under providers and increase minProviders")
8. **Related Recipes**: Links to atomic patterns this recipe uses, and to other full recipes in the same domain

**Atomic Pattern Pages**:
Smaller, single-concept recipes that show one Backproto primitive in isolation:
- "CapacityRegistry Attestation Pattern" — just the attestation signing and registration flow
- "PricingCurve Configuration for Bursty Workloads" — just the curve parameters and their effects, with an interactive slider showing price vs utilization
- "EIP-712 Capacity Attestation Signing" — just the off-chain signing pattern
- "Superfluid GDA Streaming Setup" — just the payment stream initialization
- "StakeManager Bonding and Slashing" — just the stake lifecycle
- "CompletionTracker SLO Verification" — just the completion tracking and penalty logic

These atomic patterns are referenced by the full recipes ("This recipe uses the CapacityRegistry Attestation Pattern → [link]") and are browsable in their own section of the gallery.

---

## Seed Recipes (Full Pipelines)

### Recipe 1: LLM Ensemble Router
**Domain**: AI | **Difficulty**: Intermediate | **Related Product**: bitbolt.ai

Multi-model AI inference routing. Requests flow to model runners with spare capacity; overloaded runners automatically receive fewer requests and less payment. Demonstrates the core Backproto value proposition in the most broadly applicable domain.

**Steps**: Single step with 3+ LLM providers (simulating vLLM, Ollama, and a cloud API). Routing is capacity-weighted with Lyapunov-optimal fairness.

**Contracts used**: CapacityRegistry, BackpressurePool, PricingCurve, EscrowBuffer, CompletionTracker, StakeManager

### Recipe 2: Nostr Relay Fanout with Congestion Pricing
**Domain**: Nostr | **Difficulty**: Intermediate | **Related Product**: airadio.org

Publish/subscribe event distribution across multiple Nostr relays. When a relay hits bandwidth capacity, new subscriptions and their associated payment streams reroute to relays with spare capacity. Relay operators earn proportionally to the capacity they serve.

**Steps**: (1) Event ingestion (2) Relay fanout with capacity-weighted distribution (3) Subscriber delivery confirmation

**Contracts used**: CapacityRegistry, BackpressurePool, PricingCurve, CompletionTracker

### Recipe 3: Open Source Revenue Splitter
**Domain**: General | **Difficulty**: Beginner | **Related Product**: spilt.dev

Incoming payments (grants, sponsorships, bounties) stream through a BackpressurePool and distribute to contributors based on their declared availability/capacity. When a maintainer is at capacity (on vacation, maxed on PRs), their share automatically reroutes to active contributors.

**Steps**: (1) Payment ingestion (2) Contributor capacity verification (3) Streaming distribution

**Contracts used**: CapacityRegistry, BackpressurePool, EscrowBuffer

### Recipe 4: Sport Sponsorship Streamer
**Domain**: General | **Difficulty**: Beginner | **Related Product**: sponsors.fund, *.fund domains

Fan and brand micropayments stream to athletes/teams. When one recipient is overfunded relative to their engagement capacity (events, content, community interaction), new sponsorship flows reroute to underfunded participants with spare capacity.

**Steps**: (1) Sponsorship payment ingestion (2) Engagement capacity attestation (3) Capacity-weighted distribution

**Contracts used**: CapacityRegistry, BackpressurePool, PricingCurve, EscrowBuffer

### Recipe 5: Decentralized Log Router
**Domain**: Infrastructure | **Difficulty**: Advanced | **Related Product**: logd.ai

Log ingestion and routing where collector nodes declare capacity. When a node is overwhelmed, log streams reroute to nodes with spare capacity. Streaming payments compensate node operators proportionally.

**Steps**: (1) Log stream ingestion (2) Node capacity verification (3) Capacity-weighted routing (4) Delivery confirmation and settlement

**Contracts used**: CapacityRegistry, BackpressurePool, PricingCurve, EscrowBuffer, CompletionTracker, StakeManager, Pipeline

---

## Atomic Patterns (Small Recipes)

Build these six atomic patterns, each as a standalone page with a focused code snippet, brief explanation, and interactive element where applicable:

1. **CapacityRegistry Attestation** — EIP-712 signing flow for declaring spare capacity. Show the typed data structure, signing code, and on-chain registration call.
2. **PricingCurve Tuning** — Interactive visualization: sliders for base price, k, and alpha. Chart shows resulting price curve as utilization goes 0→100%. Presets for "bursty workloads," "steady state," and "premium tier."
3. **Superfluid GDA Streaming** — Initialize a streaming payment via Superfluid's General Distribution Agreement. Show the setup, the flow rate calculation, and the pool connection.
4. **StakeManager Bond/Slash Lifecycle** — The full lifecycle: bonding tokens, operating, getting slashed (3× penalty), and withdrawing. Show contract calls and state transitions.
5. **CompletionTracker SLO Verification** — Define SLOs (latency, completion rate), track completions, and trigger penalties on violation. Show the verification flow.
6. **OffchainAggregator Telemetry Loop** — Collect runtime metrics off-chain, aggregate them, and push updated capacity attestations on-chain. Show the aggregation logic and the attestation refresh cycle.

---

## Site Structure and Navigation

```
bit.recipes/
├── / (landing page — hero simulation + recipe gallery grid)
├── /recipes (full gallery with filters)
│   ├── /recipes/llm-ensemble-router
│   ├── /recipes/nostr-relay-fanout
│   ├── /recipes/open-source-revenue-splitter
│   ├── /recipes/sport-sponsorship-streamer
│   └── /recipes/decentralized-log-router
├── /patterns (atomic pattern gallery)
│   ├── /patterns/capacity-registry-attestation
│   ├── /patterns/pricing-curve-tuning
│   ├── /patterns/superfluid-gda-streaming
│   ├── /patterns/stakemanager-bond-slash
│   ├── /patterns/completion-tracker-slo
│   └── /patterns/offchain-aggregator-telemetry
├── /spec (the recipe YAML format documentation + JSON Schema)
├── /cli (bake CLI documentation, installation, command reference)
├── /about (what bit.recipes is, how it relates to backproto.io)
└── /submit (how to contribute a recipe — links to GitHub PR workflow)
```

**Global Navigation**: Logo (bit.recipes) | Recipes | Patterns | Spec | CLI | About | GitHub link | backproto.io link

**Footer**: MIT License · Backproto Contributors 2026 | Links to backproto.io, GitHub, Basescan

---

## Design Direction

- Dark theme to match backproto.io's aesthetic (protocol-native, developer-focused)
- Monospace type for YAML/code, clean sans-serif for prose
- The pipeline visualizations should feel alive — subtle animations on edges showing data flow, smooth color transitions on nodes as utilization changes
- The simulation should feel like a control room: meters, gauges, real-time numbers ticking
- Recipe cards in the gallery should show a miniature static version of the pipeline diagram as a visual thumbnail
- Responsive: the gallery and documentation pages must work on mobile; the visual playground can show a "best experienced on desktop" notice on small screens but should still render a simplified view
- Branding: "bit.recipes" wordmark, tagline: "Composable pipelines for backpressure economics"

---

## Tech Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Pipeline Visualization**: React Flow (@xyflow/react)
- **YAML Rendering**: react-syntax-highlighter or shiki
- **Charts/Metrics**: Lightweight — recharts or a custom canvas-based gauge component
- **CLI**: Node.js/TypeScript, published as `@backproto/bake` on npm, using commander.js for argument parsing
- **Recipe Registry**: Static for v1 — recipes stored as YAML files in the repo, built into the site at build time. The gallery reads from a `/recipes` directory.
- **Simulation Engine**: Client-side TypeScript. Each recipe's simulation is a state machine that models providers, capacity, load, and routing decisions. No backend required for simulation. The engine reads the recipe YAML and generates synthetic traffic patterns.
- **Deployment**: Vercel or similar static hosting for the site. CLI published to npm.

---

## Build Sequence (Logical Steps)

1. **Initialize the repo and Next.js project.** Set up the project structure matching the site structure above. Configure Tailwind, TypeScript, and the basic layout (nav, footer, dark theme). Deploy a skeleton to bit.recipes.

2. **Define the Recipe spec.** Write the JSON Schema for the recipe YAML format. Create the five seed recipe YAML files and six atomic pattern YAML files. Store them in `/content/recipes/` and `/content/patterns/` in the repo. Write the spec documentation page (`/spec`).

3. **Build the recipe gallery and detail page templates.** Create the gallery grid component with filtering (by domain, difficulty, contract, granularity). Create the recipe detail page layout with all sections (header, YAML view, deploy guide, business guide, customization guide, related recipes). Wire up static generation from the YAML files. Do the same for atomic patterns.

4. **Build the simulation engine.** Write the client-side TypeScript simulation engine that takes a parsed recipe YAML and models: provider capacity states, incoming request load, routing decisions (capacity-weighted with Lyapunov-optimal fairness), payment stream distribution, SLO tracking, and fault injection (provider death, load spikes, capacity degradation). The engine should emit a stream of state snapshots that the UI can subscribe to.

5. **Build the visual pipeline renderer.** Using React Flow, create the node-based pipeline visualization. Map recipe steps to nodes, providers to sub-nodes, and data/payment flows to edges. Connect the renderer to the simulation engine so nodes update color, edges update thickness, and metrics update in real-time as the simulation runs.

6. **Build the simulation control panel.** Create the sidebar/drawer with: Run/Pause/Reset buttons, load slider, per-provider "Kill" and "Degrade" buttons, "Spike Load" button, real-time metrics display (allocation efficiency, gas costs, provider earnings, reroute count), and the A/B comparison toggle (Backproto vs naive round-robin).

7. **Build the landing page hero.** The landing page hero section auto-plays the LLM Ensemble Router simulation on load (no user interaction required to see it working). Below the hero, show the recipe gallery grid. This is the first thing anyone sees when they visit bit.recipes.

8. **Build the atomic pattern pages.** Each pattern gets a focused page with: explanation, code snippet, and where applicable an interactive element (e.g., the PricingCurve tuning page gets the interactive slider + chart). Patterns are cross-linked from full recipes that use them.

9. **Build the `bake` CLI.** Implement all commands: `init`, `validate`, `test`, `sim --chaos`, `deploy`, `fork`, `serve`, `publish`. The `test` and `sim` commands use the same simulation engine as the web UI (shared TypeScript library). The `deploy` command interacts with the Base Sepolia contracts using ethers.js or viem. Publish to npm as `@backproto/bake`.

10. **Write the business guides.** For each of the five seed recipes, write the "How to Turn This Into a Business" guide: what business this enables, who the customers are, how to set pricing, what to customize, and which domain in the Backproto portfolio it maps to (bitbolt.ai, spilt.dev, sponsors.fund, logd.ai, airadio.org).

11. **Write the CLI documentation page** (`/cli`). Installation instructions, command reference with examples, and a quickstart walkthrough that goes from `npm install -g @backproto/bake` to `bake fork llm-ensemble-router && bake sim --chaos && bake deploy`.

12. **Write the About and Submit pages.** `/about` explains what bit.recipes is, how it relates to backproto.io, and the philosophy (composable, forkable, executable). `/submit` explains how to contribute a recipe via GitHub PR, including the spec requirements and quality bar.

13. **Cross-link everything.** Ensure every seed recipe links to its related reference product domain. Ensure every atomic pattern is linked from the full recipes that use it. Ensure the backproto.io site links to bit.recipes as the "start building" destination. Add bit.recipes to the backproto.io footer and navigation.

14. **Final polish.** Verify all simulations run smoothly across the five seed recipes. Verify the gallery filters work correctly. Verify responsive behavior. Verify all contract addresses in recipe YAMLs match the live Base Sepolia deployments. Verify the hero auto-play simulation is performant and visually compelling on first load. Ship it.