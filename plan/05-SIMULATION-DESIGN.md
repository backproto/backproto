# Simulation Design

## Purpose
Generate data for paper Sections 7.1–7.4 (convergence, shock, Sybil, EWMA sweep).

## Agent-Based Model (Python)

### Environment
- 50 sinks, 10 sources, 3 task types
- Discrete time steps (1 step = 1 block ≈ 2 seconds on Base)
- Each sink has internal capacity drawn from distribution (heterogeneous)

### Agent Behaviors
- **Source**: emits payment at constant or bursty rate
- **Sink**: signals capacity with noise (honest ± ε), processes work, earns payment
- **Malicious**: over-reports capacity, under-delivers (for Sybil/slashing experiments)

### Metrics
1. **Allocation efficiency**: Σ min(payment_received, actual_capacity) / total_payment — measures how much payment goes to productive use
2. **Convergence time**: steps until allocation is within 5% of optimal
3. **Sybil profit**: gain from splitting vs honest single-sink
4. **Queue stability**: max virtual queue backlog over time

### Experiments

| # | Name | Variables | Expected Result |
|---|------|-----------|----------------|
| E1 | Convergence | BPE vs round-robin vs random | BPE converges to capacity-proportional |
| E2 | Shock | Kill 20% sinks at t=500 | BPE rebalances in O(1/α) steps |
| E3 | Sybil | k = {1,2,5,10,20} fragments | Net profit decreasing in k |
| E4 | EWMA | α = {0.1, 0.2, 0.3, 0.5, 0.8} | 0.2-0.3 optimal stability/responsiveness |
| E5 | Buffer | B_max = {0, 0.1, 0.5, 1.0} × flow_rate | Buffer prevents source stalling |

### Implementation
```python
# Core simulation loop (pseudocode)
for t in range(T):
    for source in sources:
        source.emit_payment(t)
    for sink in sinks:
        sink.signal_capacity(t)  # + EWMA
    backpressure_allocate(sinks, sources)  # max-weight
    for sink in sinks:
        sink.process_and_earn(t)
    collect_metrics(t)
```

### Tech
- Python 3.11+, NumPy, Matplotlib/Seaborn
- Results: CSV + plots (PDF for paper)
