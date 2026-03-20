# Academic Paper Outline

**Title**: Backpressure Economics: Capacity-Constrained Monetary Flow Control for Agent Economies

**Target**: ACM CCS / IEEE S&P / FC (Financial Cryptography) - theoretical contribution + systems paper

---

## Section 1: Introduction (2 pages)
- Motivating example: three-stage AI agent pipeline - transcription → summarization → report generation - where the summarizer hits GPU limits and payment continues flowing into a bottleneck
- Problem statement: streaming payment protocols lack flow control; money cannot be "dropped" like data packets - requires new routing primitives
- Contribution summary: (1) formal model, (2) throughput optimality proof, (3) protocol design, (4) simulation

## Section 2: Background & Related Work (3 pages)
### 2.1 Backpressure Routing
- Tassiulas-Ephremides (1992): max-weight scheduling, throughput optimality, Lyapunov drift
- Neely (2010): utility-optimal extensions, V-parameter tradeoff
- Multi-commodity flow formulations

### 2.2 Network Pricing
- Kelly proportional fairness (1998): shadow prices, dual decomposition
- Srikant (2004): congestion control as optimization
- Bridge: Kelly's "price" = Lagrange multiplier on capacity constraints = our capacity signal

### 2.3 Token Engineering
- Zhang-Zargham (2020): dynamical systems for token economies
- Superfluid Protocol: CFA/GDA streaming primitives
- Position: BPE adds flow-control layer above streaming primitives

### 2.4 Demurrage Economics
- Gesell (1916), Fisher (1933): stock-based velocity mechanisms
- Position: BPE is flow-based *allocation* - orthogonal to demurrage's velocity

### 2.5 Sender-Side Capacity Awareness
- AMMs as sender-side routing (Uniswap, Curve)
- BPE as receiver-side routing: distinct contribution

### 2.6 AI Agent Payment Protocols
- Google AP2, Coinbase x402, OpenAI-Stripe ACP, Visa TAP (2024-2026)
- Gap: all handle authorization/trust, none handle flow control

### 2.7 Verification Economics
- Catalini, Gans, & Ma (2026): measurability parameter *m* determines automation frontier
- Key result: verification cost, not production cost, is the binding constraint on task pricing
- V(m) = verification function; BPE's CompletionTracker is a concrete V(m) for high-*m* tasks
- Low-*m* tasks require verification budget allocation (motivates `verificationBudgetBps`)
- Stablecoin settlement thesis (Catalini) + "financial API for agents" (a16z) = architectural confirmation
- Position: BPE implements the measurability-aware routing that Catalini's model predicts will emerge

## Section 3: Model (4 pages)
### 3.1 Network Graph
```
G = (V, E) where V = Sources ∪ Sinks, E = payment flow edges
C(K, t, τ): capacity of sink K at time t for task type τ
Q(K, t, τ): virtual queue backlog of unprocessed payment at sink K
F(e, t): payment flow rate on edge e at time t
```

### 3.2 Backpressure Payment Routing
- Differential backlog: `W(K, t) = Q(source, t) - Q(K, t)` (simplified single-hop)
- Max-weight scheduling: allocate to sink K* = argmax_K W(K, t) · C(K, t)
- Money-specific constraint: no packet drops → overflow buffer B(t)

### 3.3 Multi-Commodity Extension
- Task types as commodities: τ ∈ T
- Separate virtual queues per (sink, task type)
- Capacity allocation across task types at each sink

### 3.4 EWMA Smoothing
- `C_smooth(K, t) = α·C_raw(K, t) + (1-α)·C_smooth(K, t-1)`
- Stability analysis: α tradeoff between responsiveness and oscillation

## Section 4: Throughput Optimality (3 pages)
### 4.1 Lyapunov Function
- L(t) = Σ_K Q(K,t)² - sum of squared virtual queue backlogs
- Drift: Δ(t) = E[L(t+1) - L(t) | Q(t)]

### 4.2 Main Theorem
- Show backpressure payment routing achieves throughput optimality for payment flows within the capacity region
- Proof sketch via Lyapunov drift minimization
- Key modification from Tassiulas: overflow buffer B(t) absorbs drops; show B(t) is bounded under sufficient capacity

### 4.3 Stability Conditions
- Sufficient capacity condition (total sink capacity > total source flow rate)
- Buffer bound theorem

## Section 5: Protocol Design (3 pages)
- Map model to Superfluid GDA implementation
- CapacityRegistry, BackpressurePool, StakeManager, EscrowBuffer
- Pipeline composition for multi-stage

## Section 6: Security Analysis (2 pages)
- Sybil resistance (min stake + concave cap)
- Capacity truthfulness (incentive-compatible under slashing)
- MEV resistance (commit-reveal)

## Section 7: Simulation & Evaluation (3 pages)
### 7.1 Setup
- Python agent-based model, 50 sinks, 10 sources, 3 task types
### 7.2 Experiments
1. Convergence: time to steady-state allocation vs round-robin
2. Shock response: sink failure → rebalance speed
3. Sybil resistance: attack cost vs gain under min-stake
4. EWMA α sweep: stability vs responsiveness

## Section 8: Discussion & Future Work (1.5 pages)
- Pricing (v0.2), multi-hop routing, cross-chain, TEE verification
- Limitations: oracle trust, on-chain latency, task type coverage

## Section 9: Conclusion (0.5 pages)
