# BPE Protocol Specification v0.1

## 1. Overview

The BPE Protocol implements capacity-based monetary flow control for continuous payment streams. It enables autonomous agents to signal productive capacity, and routes payment streams toward available capacity using backpressure principles derived from Tassiulas-Ephremides network optimization.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Agent SDK Layer                                             │
│  ├─ CapacityComputer: runtime metric → capacity signal       │
│  ├─ TaskQueueManager: local queue with overflow handling     │
│  └─ StreamLifecycle: subscribe/unsubscribe/claim/withdraw    │
├─────────────────────────────────────────────────────────────┤
│  Backpressure Logic Layer (Off-chain + On-chain oracle)      │
│  ├─ CapacityOracle: aggregates signals, applies EWMA         │
│  ├─ RebalanceEngine: computes unit weights from capacity     │
│  └─ VerificationService: PoCW checks, slash triggers         │
├─────────────────────────────────────────────────────────────┤
│  Settlement Layer (On-chain / Base L2)                       │
│  ├─ BackpressurePool.sol: extends Superfluid GDA Pool        │
│  ├─ CapacityRegistry.sol: on-chain capacity signal state     │
│  ├─ StakeManager.sol: staking, capacity caps, slashing       │
│  └─ EscrowBuffer.sol: overflow buffer when all sinks full    │
├─────────────────────────────────────────────────────────────┤
│  Streaming Primitive Layer                                   │
│  └─ Superfluid Protocol (CFA + GDA on Base)                 │
└─────────────────────────────────────────────────────────────┘
```

## 2. Core Protocol

### 2.1 Task Type Registry
- `registerTaskType(bytes32 taskTypeId, string metadata, uint256 minStake)` — permissionless with stake
- Creates a BackpressurePool for this task type

### 2.2 Sink Registration
- `registerSink(bytes32 taskTypeId, uint256 initialCapacity)` — must stake ≥ minStake
- Capacity capped at `sqrt(stake / STAKE_UNIT)` (+ minimum per-sink stake for Sybil resistance)
- Becomes member of task type's BackpressurePool

### 2.3 Capacity Signal Update
- Commit-reveal: `commitCapacity(hash)` then `revealCapacity(value, nonce)` (MEV protection)
- EWMA smoothing: `C_smooth(t) = α·C_raw(t) + (1−α)·C_smooth(t-1)`, default α=0.3
- Triggers rebalance if change exceeds threshold δ

### 2.4 Rebalance
- `rebalance(taskTypeId)` — permissionless, reads CapacityRegistry, updates pool member units
- Units proportional to smoothed capacity: `units(K) = C_smooth(K) × SCALE / totalCapacity`

### 2.5 Source Streaming
- `createStream(taskTypeId, flowRate)` — Superfluid CFA to BackpressurePool
- Payment distributed to sinks proportional to current unit weights

### 2.6 Verification & Slashing
- Off-chain verification: compare declared capacity vs actual throughput
- Slash on over-report: reduces stake → reduces capacity cap → rebalance

### 2.7 EscrowBuffer (Overflow)
- Receives excess when all sinks at capacity
- B_max configurable; sources signaled to reduce when buffer full
- Drains FIFO as capacity frees

## 3. Pipeline Composition

Multi-stage pipelines chain BackpressurePools:
```
Source → [Pool Stage 1] → Agent A → [Pool Stage 2] → Agent B → [Pool Stage 3] → Agent C → Output
```

Upstream propagation: `C_effective(K, N, t) = min(C_local(K, t), downstream_rate(N+1, t))`

## 4. Token Economics
- Payment: any Superfluid-compatible Super Token (recommended USDCx)
- Stake: same or separate token; minimum per-sink + sqrt cap
- Protocol fee: optional (0.1%), configurable to 0

## 5. Security
- Sybil: min per-sink stake + concave cap
- MEV: commit-reveal for capacity signals
- Oracle: semi-trusted v0.1, decentralization path via multi-oracle or on-chain EWMA
