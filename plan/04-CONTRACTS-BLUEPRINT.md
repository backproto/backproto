# Contracts Blueprint

## Architecture

```
┌─────────────────────┐     ┌─────────────────────────┐
│  CapacityRegistry   │◄────│  StakeManager           │
│  ─ task type reg    │     │  ─ stake/unstake/slash   │
│  ─ sink reg         │     │  ─ capacity cap compute  │
│  ─ commit-reveal    │     └─────────────────────────┘
│  ─ EWMA smoothing   │
└────────┬────────────┘
         │ reads capacity
         ▼
┌─────────────────────┐     ┌─────────────────────────┐
│  BackpressurePool   │────►│  Superfluid GDA Pool    │
│  ─ rebalance()      │     │  (underlying primitive) │
│  ─ needsRebalance() │     └─────────────────────────┘
│  ─ pool per taskType│
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  EscrowBuffer       │
│  ─ overflow hold    │
│  ─ FIFO drain       │
│  ─ B_max config     │
└─────────────────────┘

┌─────────────────────┐
│  Pipeline           │
│  ─ multi-pool chain │
│  ─ upstream prop    │
└─────────────────────┘
```

## Contract Interfaces

### ICapacitySignal.sol
```solidity
interface ICapacitySignal {
    event CapacityCommitted(bytes32 indexed taskTypeId, address indexed sink, bytes32 commitHash);
    event CapacityRevealed(bytes32 indexed taskTypeId, address indexed sink, uint256 raw, uint256 smoothed);
    
    function commitCapacity(bytes32 taskTypeId, bytes32 commitHash) external;
    function revealCapacity(bytes32 taskTypeId, uint256 capacity, bytes32 nonce) external;
    function getSmoothedCapacity(bytes32 taskTypeId, address sink) external view returns (uint256);
}
```

### IBackpressurePool.sol
```solidity
interface IBackpressurePool {
    event Rebalanced(bytes32 indexed taskTypeId, uint256 sinkCount, uint256 totalCapacity);
    
    function rebalance(bytes32 taskTypeId) external;
    function needsRebalance(bytes32 taskTypeId) external view returns (bool);
    function getPool(bytes32 taskTypeId) external view returns (address);
}
```

### IStakeManager.sol
```solidity
interface IStakeManager {
    event Staked(address indexed sink, uint256 amount, uint256 totalStake);
    event Unstaked(address indexed sink, uint256 amount);
    event Slashed(address indexed sink, uint256 amount, bytes32 reason);
    
    function stake(uint256 amount) external;
    function unstake(uint256 amount) external;
    function slash(address sink, uint256 amount, bytes32 reason) external;
    function getCapacityCap(address sink) external view returns (uint256);
    function getStake(address sink) external view returns (uint256);
}
```

### IEscrowBuffer.sol
```solidity
interface IEscrowBuffer {
    event Deposited(bytes32 indexed taskTypeId, address indexed source, uint256 amount);
    event Drained(bytes32 indexed taskTypeId, address indexed sink, uint256 amount);
    event BufferFull(bytes32 indexed taskTypeId, uint256 bufferLevel);
    
    function deposit(bytes32 taskTypeId, uint256 amount) external;
    function drain(bytes32 taskTypeId) external;
    function bufferLevel(bytes32 taskTypeId) external view returns (uint256);
    function bufferMax(bytes32 taskTypeId) external view returns (uint256);
}
```

## Key Constants (configurable via governance)

```solidity
uint256 constant EWMA_ALPHA_BPS = 3000;      // α = 0.3 in basis points
uint256 constant REBALANCE_THRESHOLD_BPS = 500; // 5% change triggers rebalance
uint256 constant MIN_SINK_STAKE = 100e18;     // 100 tokens minimum per sink
uint256 constant STAKE_UNIT = 1e18;           // sqrt(stake / STAKE_UNIT) = capacity cap
uint256 constant UNIT_SCALE = 1e18;           // pool unit scaling factor
uint256 constant COMMIT_TIMEOUT = 20;         // blocks before commit expires
```

## Deployment Order
1. StakeManager (standalone)
2. CapacityRegistry (depends on StakeManager)
3. BackpressurePool factory (depends on CapacityRegistry + Superfluid host)
4. EscrowBuffer (depends on BackpressurePool)
5. Pipeline (depends on BackpressurePool, optional)
