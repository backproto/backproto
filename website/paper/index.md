# Paper: Backpressure Economics

**Capacity-Constrained Monetary Flow Control for Agent Economies**

---

This paper presents the formal theory, protocol design, and evaluation of Backpressure Economics (BPE). It adapts the Tassiulas–Ephremides backpressure routing algorithm to monetary flows in multi-agent economies.

!!! info "Citation"
    If you use this work, please cite:
    *Backpressure Economics: Capacity-Constrained Monetary Flow Control for Agent Economies*, 2026.

## Sections

| # | Section | Description |
|---|---------|-------------|
| 0 | [Abstract](abstract.md) | 250-word summary of contributions and results |
| 1 | [Introduction](introduction.md) | Motivation, problem statement, and contributions |
| 2 | [Background](background.md) | Related work in backpressure routing, pricing, demurrage |
| 3 | [Formal Model](model.md) | Network model definition and Lyapunov analysis setup |
| 4 | [Throughput Optimality](throughput.md) | Proof of throughput-optimal allocation |
| 5 | [Protocol Design](protocol.md) | Implementation on Superfluid GDA |
| 6 | [Security Analysis](security.md) | Sybil resistance, MEV protection, slashing |
| 7 | [Evaluation](evaluation.md) | Simulation results and benchmarks |
| 8 | [Discussion](discussion.md) | Implications, limitations, future work |
| 9 | [Conclusion](conclusion.md) | Summary and outlook |

## Figures

The paper includes simulation results visualized as:

- **Convergence** — Allocation efficiency over time
- **Shock response** — Recovery from node-kill events
- **EWMA sweep** — Sensitivity analysis of smoothing parameter $\alpha$
- **Buffer utilization** — Overflow escrow dynamics
- **Sybil cost** — Stake fragmentation analysis

!!! note "LaTeX Source"
    The full LaTeX source is available in `docs/paper/` for compilation with `pdflatex` + `bibtex`.
