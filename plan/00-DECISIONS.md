# Resolved Design Decisions

All architectural and strategic decisions for the BPE project, with rationale.

---

## D1: Theoretical Foundation

**Decision**: Ground the formal model in **Tassiulas-Ephremides backpressure routing** (1992) and **Kelly proportional fairness pricing** (1998). Demote the Reactive Streams Specification to an *implementation analogy*, not the theoretical foundation.

**Rationale**: Tassiulas-Ephremides provides decades of proven mathematical machinery — Lyapunov drift analysis, throughput optimality proofs, stability guarantees, and multi-commodity flow formulations. The Reactive Streams spec is a software engineering pattern for the same concept, but has no formal proofs. Kelly's shadow prices are *already economic objects*, providing the bridge between network flow control and monetary mechanism design.

---

## D2: Implementation Substrate

**Decision**: Build on **Superfluid Distribution Pools (GDA)** on Base L2. No new token standard required.

**Rationale**: A `BackpressurePool` is functionally a Superfluid Distribution Pool where member units are dynamically adjusted by a capacity oracle. Superfluid already handles per-second streaming payments (CFA), proportional distribution via pool units, gas-efficient one-to-many streaming, and dynamic unit adjustment by pool admin. The only new component is the capacity oracle that maps verified capacity signals to pool unit weights.

---

## D3: Target Chain

**Decision**: **Base** (Coinbase L2).

**Rationale**: (1) Superfluid is deployed on Base, (2) Coinbase's x402 agent payment standard creates ecosystem adjacency, (3) Base has strong agent economy developer community, (4) low gas costs suitable for frequent capacity signal updates.

---

## D4: Router Architecture

**Decision**: **Decentralized max-weight protocol**, not a centralized Router entity.

**Rationale**: The original proposal had a centralized "Router" directing payment flows — a centralization risk. Tassiulas's backpressure algorithm is *inherently decentralized*: each node only needs local queue information and neighbor queue backlogs. In practice for v0.1: the BackpressurePool contract + capacity oracle performs this routing within a single pool. Multi-hop routing (between pools) is deferred to v0.2.

---

## D5: Productive Allocation Property

**Decision**: Rename to **"Productive Allocation Property"** and honestly decompose into two separate mechanisms with separate guarantees:
1. **Routing efficiency** (from backpressure) — money routes around bottlenecks to nodes with available capacity
2. **Verification** (from Proof of Continuous Work / PoCW) — output is actually productive

**Rationale**: The original formulation was circular. Backpressure ensures efficient allocation given capacity signals; a separate verification layer ensures those signals are truthful. Both needed, but distinct mechanisms.

---

## D6: Demurrage Positioning

**Decision**: Position backpressure as **complementary** to demurrage, not competing.

**Rationale**: Demurrage operates on the *stock* of money (time-based decay, drives velocity). Backpressure operates on the *flow* of money (capacity-based constraint, drives allocation efficiency). Real systems may layer both.

---

## D7: Sybil Resistance

**Decision**: **Minimum per-sink registration stake + concave capacity cap**.

**Rationale**: Pure sqrt cap doesn't prevent Sybil attacks (k × sqrt(S/k) > sqrt(S)). Fix: require minimum stake S_min per sink regardless of capacity claim. Fragmenting into k sinks costs k × S_min overhead. Combined with sqrt cap: total capacity = k × sqrt((S - k·S_min)/k) which decreases in k for large k.

---

## D8: Oscillation Dampening

**Decision**: **EWMA smoothing** on capacity signals (default α = 0.3).

**Rationale**: Prevents thundering herd when all sinks signal simultaneously. Analogous to TCP AIMD (Jacobson 1988).

---

## D9: Pricing Mechanism

**Decision**: **Deferred to v0.2**. v0.1 is purely allocation (capacity-proportional routing).

---

## D10: Task Type Governance

**Decision**: **Permissionless registration with stake** for v0.1.

---

## D11: Publication Strategy

**Decision**: **Two documents** — academic paper + protocol whitepaper/specification.

---

## D12: Primary Application Domain

**Decision**: **AI agent pipeline economics** as primary. Decentralized compute secondary. Public goods funding tertiary/speculative.
