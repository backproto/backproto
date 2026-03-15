# Gas Benchmarks — Backpressure Economics Protocol

Measured on Foundry (Solidity 0.8.26, Cancun EVM) using `forge test --match-contract GasBenchmark -vv`.

## Core Operations

| Operation | Gas | Notes |
|-----------|----:|-------|
| `registerTaskType` | 52,520 | One-time per task type |
| `registerSink` | 174,386 | Includes stake verification |
| `commitCapacity` | 47,987 | Commit phase (hash-based) |
| `revealCapacity` | 10,300 | Reveal phase (EWMA update) |
| **commit + reveal total** | **58,287** | Full on-chain capacity update |
| `updateCapacityFromAggregator` | 9,595 | Off-chain path (no commit phase) |

## Capacity Update: On-chain vs Off-chain

| Path | Gas | Latency |
|------|----:|---------|
| Commit-reveal (on-chain) | 58,287 | ~40s (commit timeout) |
| Aggregated (off-chain signed) | 9,595 | <5s (gossip + batch submit) |
| **Savings** | **83.5%** | **~87.5%** |

## `getSinks` Scaling (Read Cost)

| Sinks (n) | Gas | Gas/Sink |
|----------:|-----:|---------:|
| 5 | 14,709 | 2,942 |
| 10 | 25,747 | 2,575 |
| 25 | 58,892 | 2,356 |
| 50 | 114,227 | 2,285 |
| 100 | 225,248 | 2,252 |

Linear scaling — O(n) with ~2,250-2,950 gas per sink. No algorithmic bottleneck for practical pool sizes.

## Deployment Costs

| Contract | Deploy Gas | Size (bytes) |
|----------|----------:|-------------:|
| CapacityRegistry | 1,901,708 | 8,909 |
| StakeManager | 1,161,363 | 5,934 |

---

*Generated from `contracts/test/GasBenchmark.t.sol`. Re-run with `forge test --match-contract GasBenchmark -vv` to update.*
