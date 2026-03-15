# Known Gaps, Risks, and Mitigations

## Critical (Resolved)

### G1: Data vs Value Mismatch
**Problem**: Can't "drop" money like data. **Fix**: Reroute via pool; overflow to EscrowBuffer; source pauses when buffer full.

### G2: Productive Allocation Circularity
**Problem**: Assumes verifiable output. **Fix**: Decomposed into routing efficiency (backpressure) + verification (PoCW) as separate mechanisms.

### G3: No Pricing in v0.1
**Status**: Deferred to v0.2. v0.1 = allocation mechanism only.

### G4: Task Typing
**Fix**: C(K,t,τ) with per-task-type BackpressurePools. Maps to Tassiulas multi-commodity.

## Moderate (Mitigated)

### G5: Oscillation / Thundering Herd
**Fix**: EWMA smoothing (α=0.3) + threshold-based rebalance triggers.

### G6: MEV / Front-Running
**Fix**: Commit-reveal for capacity signals. Rebalance is deterministic — no extraction.

### G7: Cold Start
**Fix**: Stake-based bootstrap. Capacity capped by stake until track record builds.

### G8: Sybil Attacks ⚠️
**Problem**: sqrt cap alone doesn't prevent Sybil (k × sqrt(S/k) > sqrt(S)).
**Fix**: Minimum per-sink stake S_min. Cost of k sinks = k × S_min overhead. Needs careful parameter tuning.

### G9: Oracle Centralization
**Status**: Acceptable for v0.1. Path: single oracle → multi-oracle → on-chain EWMA.

### G10: On-Chain Latency
**Status**: 2-second block time on Base is adequate for economic routing (agent tasks take seconds+).

### G11: Exit Mechanics
**Fix**: Streaming balance (constrained) vs claimed balance (free). Natural from Superfluid pool.claimAll().

### G12: AMM Taxonomy Gap
**Fix**: Added AMMs as sender-side capacity-aware analog in paper Section 2.5.
