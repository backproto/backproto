# Base Ecosystem Fund — Grant Application

## Project name

Backproto

## One-liner

Capacity-weighted payment routing for AI agent economies, deployed on Base.

## What does it do?

Backproto applies backpressure routing from network theory to payment flows between AI agents. Agents declare capacity, complete tasks, and receive streaming payments proportional to verified spare capacity. Overloaded agents are rerouted around. Overflow goes to escrow.

The problem: streaming payment protocols have no congestion control. When a downstream agent hits capacity, payments keep arriving. There is no reroute, no throttle, no feedback signal. TCP solved this for data packets in 1986. Backproto solves it for money.

## Why Base?

First, L2 cost structure. Backproto uses off-chain attestation aggregation with on-chain verification. Gas costs must be low enough that rebalancing a payment pool on every capacity update is economically rational. Base makes this viable.

Second, Superfluid GDA is deployed on Base. Backproto uses General Distribution Agreement pools as the streaming primitive. BackpressurePool wraps GDA and rebalances member units dynamically.

Third, the AI agent ecosystem on Base is growing. Backproto provides infrastructure that agents need once they start paying each other at scale.

## What is deployed?

22 Solidity contracts on Base Sepolia:

- Core (8 contracts): CapacityRegistry, BackpressurePool, CompletionTracker, StakeManager, PricingCurve, EscrowBuffer, OffchainAggregator, Pipeline
- Research modules (14 contracts): demurrage tokens, Nostr relay economics, Lightning routing incentives, cross-domain composition

All contracts verified on Basescan. 213 passing tests. TypeScript SDK with 18 action modules.

Router contract: 0x8e999a246afea241cf3c1d400dd7786cf591fa88

## Simulation results

- 95.7% allocation efficiency (vs 93.5% round-robin baseline)
- 83.5% gas reduction via off-chain attestation batching
- Throughput-optimal under any stabilizable demand vector (formal proof via Lyapunov drift analysis)

## Part of a stack

Backproto is one layer in a three-project stack for AI agent infrastructure:

- Buildlog (buildlog.ai): Captures agent workflows and execution trails
- VR (vr.dev): Verifies that agent outcomes actually changed system state
- Backproto (backproto.io): Routes payments to agents with verified spare capacity

Each project works independently. Together they close the loop: capture what agents do, verify they did it, pay them proportionally.

## Team

Solo builder. Background in software engineering and protocol research. Building all three projects.

- GitHub: github.com/backproto/backproto
- VR: github.com/espetey/vrdev
- Buildlog: github.com/buildlogai/web

## What the grant would fund

1. Mainnet deployment (contracts, monitoring, initial pool seeding)
2. SDK developer experience (interactive playground, template integrations for LangChain/CrewAI/AutoGen)
3. External audit of core contracts
4. Documentation and onboarding for first pilot integrations

## Timeline

- Month 1: Mainnet deploy, playground launch, first external integration attempt
- Month 2: SDK v2 with framework adapters, audit engagement
- Month 3: Two pilot integrations running, public benchmark results

## Links

- Website: https://backproto.io
- GitHub: https://github.com/backproto/backproto
- Paper: https://backproto.io/paper
- Explainer: https://backproto.io/explainer
- Basescan: https://sepolia.basescan.org/address/0x8e999a246afea241cf3c1d400dd7786cf591fa88
