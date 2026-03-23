# Annotated Bibliography

## Foundational

### Tassiulas & Ephremides (1992)
"Stability properties of constrained queueing systems and scheduling policies for maximum throughput in multihop radio networks"
- **Role**: Primary theoretical foundation. Backpressure routing algorithm, max-weight scheduling, throughput optimality.
- **BPE usage**: Core algorithm adapted from data packet routing to monetary flow routing.

### Kelly (1998)
"Rate control for communication networks: shadow prices, proportional fairness and stability"
- **Role**: Bridge between network flow control and economic pricing. Shadow prices as Lagrange multipliers on capacity constraints.
- **BPE usage**: Theoretical anchor for future pricing mechanism (v0.2). Justifies treating capacity constraints as economic objects.

### Neely (2010)
"Stochastic Network Optimization with Application to Communication and Queueing Systems"
- **Role**: Modern treatment of Lyapunov optimization for networks. V-parameter utility tradeoff.
- **BPE usage**: Proof technique for throughput optimality. Utility extension framework.

## Network Economics

### Srikant (2004)
"The Mathematics of Internet Congestion Control"
- **Role**: TCP congestion control as distributed optimization. AIMD analysis.
- **BPE usage**: Justifies EWMA smoothing as analogous to AIMD. Stability analysis framework.

### Jacobson (1988)
"Congestion Avoidance and Control"
- **Role**: Practical congestion control (TCP). EWMA for RTT estimation.
- **BPE usage**: Precedent for EWMA in flow control systems.

## Token Engineering

### Zhang & Zargham (2020)
"Token Engineering: A Survey of Token Economy Design Patterns"
- **Role**: Dynamical systems approach to token economies. cadCAD framework.
- **BPE usage**: Positions BPE within token engineering literature. Simulation methodology.

### Superfluid Protocol Documentation
- **Role**: Implementation substrate. CFA (Constant Flow Agreement), GDA (General Distribution Agreement).
- **BPE usage**: BackpressurePool wraps Superfluid GDA pool. Streaming payment primitive.

## Monetary Theory

### Gesell (1916)
"The Natural Economic Order" - demurrage / stamp-scrip concept
- **Role**: Stock-based velocity mechanism (holding tax).
- **BPE usage**: Contrast: demurrage = stock-based velocity, BPE = flow-based allocation. Orthogonal.

### Fisher (1933)
"Stamp Scrip" - formalization of Gesellian demurrage
- **Role**: Economic formalization of timed currency decay.
- **BPE usage**: Historical context. MV=PQ decomposition.

## Verification Economics

### Catalini, Gans, & Ma (2026)
"Some Simple Economics of AGI" (arXiv:2602.20946v2)
- **Role**: Formal economic model of AI verification costs. Introduces measurability parameter *m* that determines automation frontier, wage effects, and value capture. Argues verification cost, not production cost, drives task pricing.
- **BPE usage**: External validation of Pura's mechanism design. CompletionTracker = concrete V(m) for high-*m* tasks. Motivates `verificationBudgetBps` parameter for low-*m* tasks. Informs §2.7 (Verification Economics) and pricing mechanism (v0.2).

### Dixon & Lazzarin (2026)
a16z crypto podcast: "AI just gave you superpowers — now what?"
- **Role**: Blockchain as "the financial API for autonomous software." Stablecoins reduce agent-to-agent transaction costs by ~10x. Programmable money enables payment-routing unification.
- **BPE usage**: Confirms architectural choice (Superfluid + Base L2). Supports the argument that routing signal and payment must be one mechanism.

## AI Agent Payments (2024-2026)

### Google Agent-to-Agent Payment Protocol (AP2)
- Authorization/identity between agents. No flow control.

### Coinbase x402 (2025)
- HTTP 402 Payment Required for agent tasks. Single-shot auth. No streaming/flow control.

### OpenAI-Stripe Agent Commerce Platform (ACP)
- Billing/invoicing for agent services. Batch settlements. No real-time flow control.

### Visa Transaction Authorization Protocol (TAP, 2025)
- Card-network auth for agent spending. No capacity-awareness.

### Cha et al. (2025)
"STP: Self-play LLM Token Pricing" - LLM compute pricing via self-play
- **BPE usage**: Complementary. Could inform future pricing layer (v0.2).
