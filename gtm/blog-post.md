# Decentralized networks have a plumbing problem

AI agents are learning to pay each other. Streaming payment protocols let agents send cryptocurrency in real time, a running meter for work done by other agents. Translation agents pay LLM agents. Search agents pay embedding agents. The money flows continuously.

Nobody built the pipes.

## What happens when an agent gets overloaded?

Right now, nothing good. The money keeps flowing in whether the work gets done or not.

Three agents all stream payments to the same LLM service. That service can handle so many requests per second. There is no reroute. No throttle. No overflow buffer. Payments pile up. Work does not get done. Nobody tells the senders to try somewhere else.

In data networks, this was solved decades ago. Routers drop packets. TCP throttles the sender. Backpressure signals propagate upstream. The internet works because congestion is a first-class concept in the protocol stack.

Payment networks for AI agents have no equivalent.

## Backpressure routing, but for money

Backproto adapts a well-studied algorithm from network theory (Tassiulas-Ephremides backpressure routing, 1992) to monetary flows.

Send more money to the agents who have the most spare capacity.

When Agent A has room, it gets a bigger share of the payment stream. When Agent B is nearly full, it gets less. The system reroutes money toward whoever can actually do the work. No human intervention. No central coordinator.

Five operations make it work:

1. Agents announce how much work they can handle, backed by a staked deposit
2. The protocol tracks actual completions against claims and slashes liars automatically
3. Busy agents become more expensive (EIP-1559-style pricing), pushing demand to available capacity
4. A smart contract pool distributes incoming payment streams proportional to verified capacity
5. Overflow payments sit in escrow until capacity frees up, rather than get lost

## What is different about this?

This is a payment routing protocol with built-in flow control. The money and the work signals are unified in one mechanism. When you want to use an agent, you route payment to it. The act of paying is the act of signaling demand, and the protocol makes sure that demand gets served by an agent that actually has capacity.

Simulations over 1,000-step horizons show 95.7% allocation efficiency (vs 93.5% for round-robin), recovery from sudden agent failures within 50 steps, and buffer stall rates under 9%.

## Part of a stack

Backproto does not operate alone. It is the routing layer in a three-project stack:

- Buildlog (buildlog.ai) captures what agents do — workflow recording, MCP integration, execution trails
- VR (vr.dev) verifies that outcomes actually changed system state
- Backproto routes payments based on verified spare capacity

Deploy all three. Agents that do the work get paid. Agents that fake it get slashed. Overloaded agents get rerouted around.

## Live on testnet

Backproto is deployed and verified on Base Sepolia. Twenty-two contracts, 213 passing tests, a TypeScript SDK with 18 action modules, and a research paper with formal proofs. MIT licensed.

Research modules extend the core mechanism to Lightning channel routing, Nostr relay economics, and demurrage tokens.

- Docs: backproto.io
- GitHub: github.com/backproto/backproto
- Paper: backproto.io/paper

If you are building multi-agent systems and your agents pay each other, try the testnet. Read the paper. Tell me what breaks.

---

Backproto is MIT-licensed open source. [GitHub](https://github.com/backproto/backproto) | [Docs](https://backproto.io) | [Paper](https://backproto.io/paper)
