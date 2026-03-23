# Outreach DM templates

All DMs first person singular. Short. Specific. No pitch deck language.

---

## AI agent builders (primary target)

Subject: capacity routing for agent payments

Hey — I saw your work on [specific project/post]. I have been working on a problem that probably shows up once you have multiple agents paying each other: what happens when the provider hits capacity?

I built a protocol called Pura that does backpressure routing for streaming payments. Agents declare capacity, the protocol verifies completions, and payments automatically reroute when someone is overloaded. Live on Base Sepolia with 25 contracts and a TS SDK.

It is part of a stack I am building: Buildlog (buildlog.ai) captures agent workflows, VR (vr.dev) verifies outcomes, and Pura routes payments to verified capacity.

Would 15 minutes on a call be useful? Happy to walk through the testnet. No pitch — just want to know if the model makes sense for your use case.

pura.xyz

---

## AI framework developers (LangChain, CrewAI, AutoGen contributors)

Subject: payment flow control for multi-agent frameworks

Hey, I have been following your contributions to [framework]. I built something that might complement what you are doing on the payment/resource layer.

Pura is a protocol for routing payments between agents based on verified spare capacity. Concretely: agents stake tokens, report completions, and payments stream proportional to who has room for more work. Overloaded agents get rerouted around.

The math is from network theory (Tassiulas-Ephremides, 1992). The implementation is 25 contracts on Base plus a TypeScript SDK.

Is resource allocation / payment routing something your framework handles today, or do you leave that to app developers?

pura.xyz/explainer

---

## Base / onchain AI builders

Subject: shipped capacity routing on Base Sepolia

Hey, I shipped 25 contracts on Base Sepolia that do capacity-weighted payment routing for AI agents. Uses Superfluid GDA for streaming, EIP-712 attestations for capacity verification, off-chain aggregation for gas efficiency.

Part of a stack: Buildlog (agent workflow capture, buildlog.ai) + VR (outcome verification, vr.dev) + Pura (payment routing, pura.xyz).

249 tests, TypeScript SDK with 18 modules. Looking for builders to try it on testnet and tell me what breaks.

Would you be up for 15 minutes? I can walk through deploy → register → stream in the SDK.

---

## Superfluid ecosystem builders

Subject: using GDA for dynamic capacity rebalancing

Hey, I built a protocol that uses Superfluid GDA in a way you might find interesting. Pura dynamically adjusts GDA member units based on verified agent capacity, turning pools into real-time allocation engines.

The primary use case is AI agent payment routing: agents declare capacity, complete task receipts update their share, and the GDA pool rebalances accordingly. Overflow goes to an escrow buffer.

25 contracts, 249 tests, Base Sepolia. Off-chain attestation batching gets 83.5% gas reduction.

What patterns have you seen work well for rapid GDA unit updates? I have some questions about multi-pool architectures sharing a Super Token.

pura.xyz

---

## Warm follow-up (after initial contact, no response after 5+ days)

Subject: Re: [original subject]

Hey, just circling back. No pressure at all. If the timing is off, I will leave it.

If it helps, here is the 2-minute version of what Pura does:

Agents register capacity → get verified via completion receipts → payments stream proportional to spare capacity → overloaded agents get rerouted → overflow sits in escrow.

15-minute walkthrough on testnet is open if you are curious.

pura.xyz

---

## Pinata / OpenClaw agent platform (local Omaha connection)

Subject: Pura + OpenClaw agents on Pinata

Hey, I am an engineer in Omaha working on agent infrastructure on Base. I noticed Pinata is running hosted OpenClaw instances for its agent platform and I built a protocol that plugs into that.

Pura does capacity-aware payment routing for agent economies. I already have three OpenClaw-specific contracts deployed on Base Sepolia: an adapter that maps agent capacity into the routing layer, a completion verifier for dual-signed work receipts, and a reputation bridge that makes track records portable across domains.

The short version: when Pinata-hosted agents start doing multi-step work that involves paying external services (other agents, compute, storage), Pura provides the payment routing. It uses Superfluid streaming on Base, same chain as your x402 monetization layer.

Not asking Pinata to change any infrastructure. This sits alongside what you already have. Your agent users opt in when they need payment flow control.

25 contracts live on Base Sepolia. 249 tests. TypeScript SDK.

Would a 15-minute walkthrough be useful? Happy to do it in person given we are both in Omaha.

pura.xyz
github.com/pura-xyz/pura

---

## Nostr relay operators

Subject: earn proportional to your relay's spare capacity

Hey, I saw your relay [specific relay name/pubkey]. I built a protocol that turns relay capacity into a revenue stream based on actual performance.

You register events/sec, storage, and bandwidth on-chain. An exponential moving average smooths the data. A Superfluid payment pool distributes revenue proportional to your verified capacity score. Three pool types: write, read, and store.

There is a live dashboard at relay.gold showing registered relays and anti-spam minimums. TypeScript SDK handles registration.

Would 15 minutes work to walk through it? I can run the setup script on testnet while we talk.

relay.gold

---

## Lightning node operators

Subject: on-chain capacity signals for your node

Hey, I noticed your node [specific node pubkey/alias]. I built a system where Lightning node operators publish their channel capacity on-chain, backed by stake. Routers use these signals instead of gossip to compute capacity-weighted routes.

The tradeoff vs gossip: you commit capital, but you get consistent routing fee income instead of random HTLC lottery tickets.

Live dashboard with a route explorer at lightning.gold.

Would you try it on testnet? Takes about 5 minutes to register a node.

lightning.gold

---

## AI agent framework developers (OpenClaw / agent reputation)

Subject: on-chain reputation for your agents

Hey, I have been following [specific framework/project]. I built a reputation system where the score comes from verified work rather than ratings.

Both the agent operator and requester sign each execution receipt on-chain. The protocol tracks completions, failures, and computes a composite reputation score. High reputation reduces stake requirements across the whole network.

Explorer at darksource.ai. SDK integration is about 10 lines of TypeScript.

Would a quick walkthrough be useful?

darksource.ai
