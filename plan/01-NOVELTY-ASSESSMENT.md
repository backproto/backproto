# Novelty & Feasibility Assessment

---

## What's Genuinely Novel

1. **Domain Transfer: Network Backpressure → Monetary Flow Control** - Nobody has applied Tassiulas-Ephremides backpressure routing to monetary flows in token economies. Backpressure routing (1992+), congestion pricing (Kelly 1998), and streaming payments (Superfluid 2020+) exist independently. No work unifies all three.

2. **Demurrage-Backpressure Distinction** - Demurrage: stock-based, time-decay, drives uniform velocity. Backpressure: flow-based, capacity-constraint, drives allocation efficiency. Orthogonal axes, complementary mechanisms.

3. **AI Agent Pipeline with Upstream Propagation** - Multi-agent pipelines naturally exhibit backpressure dynamics (slow downstream → upstream throttles). No existing agent payment protocol addresses flow control.

4. **Timing** - Agent payment ecosystem (March 2026): Google AP2, Coinbase x402, OpenAI-Stripe ACP, Visa TAP all focus on authorization/trust. None address flow control.

## What's NOT Novel (Acknowledge)

- Backpressure routing with throughput optimality (Tassiulas 1992)
- Network congestion pricing with proportional fairness (Kelly 1998)
- Streaming payments (Superfluid, Sablier 2018+)
- Token economy modeling via dynamical systems (Zhang-Zargham 2020)

## Prior Art Map

```
Stream 1: Network Flow         Stream 2: Network Economics
  Tassiulas (1992)               Kelly (1998)
  Neely (2010)                   Srikant (2004)
         ↘                        ↙
    ┌─────────────────────────────────────┐
    │   BACKPRESSURE ECONOMICS (gap)      │
    │   Capacity-based monetary routing   │
    └─────────────────────────────────────┘
         ↗                        ↖
Stream 3: Token Engineering    Stream 4: Monetary Velocity
  Zhang-Zargham (2020)           Gesell (1916)
  Cha et al. (2025)              Fisher (1933)
                  ↘              ↙
           Stream 5: AI Agent Economies
             Google AP2, x402, Stripe ACP
```

## External Validation (March 2026)

Catalini, Gans, & Ma ("Some Simple Economics of AGI", arXiv:2602.20946v2) published a formal economic model where a measurability parameter *m* determines the automation frontier. Their framework predicts that verification cost, not production cost, drives task pricing — and that on-chain verification mechanisms with stablecoin settlement will be the infrastructure for agent economies.

Pura convergences with Catalini's model:

| Catalini concept | Pura mechanism |
|---|---|
| Measurability *m* | CompletionTracker: dual-signed receipts, per-epoch rates, auto-slash |
| Verification function V(m) | On-chain completion tracking + staked capacity declarations |
| Automation frontier (m threshold) | Task type registry: high-*m* vs low-*m* task pools |
| Stablecoin settlement | Superfluid GDA streaming on Base L2, sub-cent marginal cost |
| Verification cost as price driver | New: verificationBudgetBps per pool (v0.1 informational, v0.2 enforced) |

Dixon and Lazzarin (a16z, March 2026) independently described blockchain as "the financial API for autonomous software" — the same thesis that motivated building on Superfluid + Base rather than off-chain payment rails.

This is convergent evidence from MIT economics and a16z crypto arriving at the same architectural conclusion Pura implements.

## Feasibility

| Domain | Feasibility | Capacity Signal | Verification |
|--------|------------|----------------|-------------|
| AI Agent Pipelines | **Strong** | Queue depth, latency, throughput | Task completion proofs |
| Decentralized Compute | **Strong** | GPU util, VRAM, queue depth | TEE attestation |
| Public Goods Funding | **Partial** | Team size, PRs, deployments | Soft signals |
| Subjective Goods | **Not feasible** | No verifiable signal | N/A |
