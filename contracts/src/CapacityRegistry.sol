// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ICapacitySignal } from "./interfaces/ICapacitySignal.sol";
import { IStakeManager } from "./interfaces/IStakeManager.sol";

/// @title CapacityRegistry
/// @notice On-chain registry for task types, sink registrations, and EWMA-smoothed capacity signals.
///         Uses commit-reveal for MEV-resistant capacity updates.
contract CapacityRegistry is ICapacitySignal {
    // ──────────────────── Constants ────────────────────

    /// @notice EWMA smoothing factor in basis points (3000 = 0.3).
    uint256 public constant EWMA_ALPHA_BPS = 3000;
    uint256 public constant BPS = 10_000;

    /// @notice Commit expires after this many blocks.
    uint256 public constant COMMIT_TIMEOUT = 20;

    // ──────────────────── Storage ────────────────────

    IStakeManager public immutable stakeManager;
    address public authorizedAggregator;

    struct TaskType {
        uint256 minStake;
        uint256 totalCapacity; // Aggregate smoothed capacity
        address[] sinks;
        mapping(address => uint256) sinkIndex; // 1-indexed (0 = not present)
    }

    struct SinkState {
        uint256 smoothedCapacity;
        uint256 rawCapacity;
        bytes32 pendingCommit;
        uint256 commitBlock;
        bool registered;
    }

    mapping(bytes32 => TaskType) internal _taskTypes;
    mapping(bytes32 => bool) public taskTypeExists;
    mapping(bytes32 taskTypeId => mapping(address sink => SinkState)) internal _sinkStates;

    // ──────────────────── Errors ────────────────────

    error TaskTypeAlreadyExists();
    error TaskTypeDoesNotExist();
    error SinkAlreadyRegistered();
    error SinkNotRegistered();
    error InsufficientStake(uint256 required, uint256 available);
    error CapacityExceedsCap(uint256 declared, uint256 cap);
    error NoCommitPending();
    error CommitExpired();
    error CommitHashMismatch();
    error CommitNotExpired();
    error NotAuthorizedAggregator();

    // ──────────────────── Constructor ────────────────────

    constructor(address stakeManager_) {
        stakeManager = IStakeManager(stakeManager_);
    }

    // ──────────────────── Aggregator Management ────────────────────

    /// @notice Set the authorized off-chain aggregator address. Only callable by deployer (initially).
    ///         In production, this should be governed or immutable.
    function setAggregator(address aggregator) external {
        // Simple access: only callable if no aggregator set, or by current aggregator
        // For v0.1, deployer calls this once after deploying OffchainAggregator
        require(authorizedAggregator == address(0) || msg.sender == authorizedAggregator, "unauthorized");
        authorizedAggregator = aggregator;
    }

    // ──────────────────── Aggregated Capacity Updates ────────────────────

    /// @notice Update capacity from an authorized off-chain aggregator.
    ///         Applies the same EWMA smoothing as commit-reveal but skips the commit phase.
    /// @param taskTypeId The task type.
    /// @param sink The sink whose capacity is being updated.
    /// @param capacity The raw capacity value from the aggregated attestation.
    function updateCapacityFromAggregator(bytes32 taskTypeId, address sink, uint256 capacity) external {
        if (msg.sender != authorizedAggregator) revert NotAuthorizedAggregator();

        SinkState storage ss = _sinkStates[taskTypeId][sink];
        if (!ss.registered) revert SinkNotRegistered();

        // Cap by stake
        uint256 cap = stakeManager.getCapacityCap(sink);
        uint256 capped = capacity > cap ? cap : capacity;

        // EWMA smoothing (same formula as revealCapacity)
        uint256 oldSmoothed = ss.smoothedCapacity;
        uint256 newSmoothed = (EWMA_ALPHA_BPS * capped + (BPS - EWMA_ALPHA_BPS) * oldSmoothed) / BPS;

        // Update state
        ss.rawCapacity = capped;
        ss.smoothedCapacity = newSmoothed;

        // Update aggregate
        TaskType storage tt = _taskTypes[taskTypeId];
        tt.totalCapacity = tt.totalCapacity - oldSmoothed + newSmoothed;

        emit CapacityRevealed(taskTypeId, sink, capped, newSmoothed);
    }

    // ──────────────────── Task Type Management ────────────────────

    /// @inheritdoc ICapacitySignal
    function registerTaskType(bytes32 taskTypeId, uint256 minStake) external {
        if (taskTypeExists[taskTypeId]) revert TaskTypeAlreadyExists();
        taskTypeExists[taskTypeId] = true;
        _taskTypes[taskTypeId].minStake = minStake;
        emit TaskTypeRegistered(taskTypeId, msg.sender, minStake);
    }

    /// @inheritdoc ICapacitySignal
    function getTaskType(bytes32 taskTypeId)
        external
        view
        returns (uint256 minStake, uint256 sinkCount, uint256 totalCapacity)
    {
        TaskType storage tt = _taskTypes[taskTypeId];
        return (tt.minStake, tt.sinks.length, tt.totalCapacity);
    }

    // ──────────────────── Sink Management ────────────────────

    /// @inheritdoc ICapacitySignal
    function registerSink(bytes32 taskTypeId, uint256 initialCapacity) external {
        if (!taskTypeExists[taskTypeId]) revert TaskTypeDoesNotExist();
        TaskType storage tt = _taskTypes[taskTypeId];
        SinkState storage ss = _sinkStates[taskTypeId][msg.sender];
        if (ss.registered) revert SinkAlreadyRegistered();

        // Check stake requirements
        uint256 sinkStake = stakeManager.getStake(msg.sender);
        uint256 reqStake = tt.minStake > stakeManager.minSinkStake() ? tt.minStake : stakeManager.minSinkStake();
        if (sinkStake < reqStake) revert InsufficientStake(reqStake, sinkStake);

        // Cap capacity by stake
        uint256 cap = stakeManager.getCapacityCap(msg.sender);
        uint256 capped = initialCapacity > cap ? cap : initialCapacity;

        // Register
        ss.registered = true;
        ss.smoothedCapacity = capped;
        ss.rawCapacity = capped;
        tt.sinks.push(msg.sender);
        tt.sinkIndex[msg.sender] = tt.sinks.length; // 1-indexed
        tt.totalCapacity += capped;

        emit SinkRegistered(taskTypeId, msg.sender, capped);
    }

    /// @inheritdoc ICapacitySignal
    function deregisterSink(bytes32 taskTypeId) external {
        if (!taskTypeExists[taskTypeId]) revert TaskTypeDoesNotExist();
        TaskType storage tt = _taskTypes[taskTypeId];
        SinkState storage ss = _sinkStates[taskTypeId][msg.sender];
        if (!ss.registered) revert SinkNotRegistered();

        // Remove from totalCapacity
        tt.totalCapacity -= ss.smoothedCapacity;

        // Swap-and-pop from sinks array
        uint256 idx = tt.sinkIndex[msg.sender] - 1; // 0-indexed
        uint256 lastIdx = tt.sinks.length - 1;
        if (idx != lastIdx) {
            address lastSink = tt.sinks[lastIdx];
            tt.sinks[idx] = lastSink;
            tt.sinkIndex[lastSink] = idx + 1; // 1-indexed
        }
        tt.sinks.pop();
        delete tt.sinkIndex[msg.sender];

        // Clear state
        delete _sinkStates[taskTypeId][msg.sender];

        emit SinkDeregistered(taskTypeId, msg.sender);
    }

    // ──────────────────── Commit-Reveal ────────────────────

    /// @inheritdoc ICapacitySignal
    function commitCapacity(bytes32 taskTypeId, bytes32 commitHash) external {
        SinkState storage ss = _sinkStates[taskTypeId][msg.sender];
        if (!ss.registered) revert SinkNotRegistered();

        ss.pendingCommit = commitHash;
        ss.commitBlock = block.number;

        emit CapacityCommitted(taskTypeId, msg.sender, commitHash);
    }

    /// @inheritdoc ICapacitySignal
    function revealCapacity(bytes32 taskTypeId, uint256 capacity, bytes32 nonce) external {
        SinkState storage ss = _sinkStates[taskTypeId][msg.sender];
        if (!ss.registered) revert SinkNotRegistered();
        if (ss.pendingCommit == bytes32(0)) revert NoCommitPending();
        if (block.number > ss.commitBlock + COMMIT_TIMEOUT) revert CommitExpired();

        // Verify commit
        bytes32 expected = keccak256(abi.encode(capacity, nonce));
        if (expected != ss.pendingCommit) revert CommitHashMismatch();

        // Cap by stake
        uint256 cap = stakeManager.getCapacityCap(msg.sender);
        uint256 capped = capacity > cap ? cap : capacity;

        // EWMA smoothing: C_smooth = α * C_raw + (1−α) * C_smooth_prev
        uint256 oldSmoothed = ss.smoothedCapacity;
        uint256 newSmoothed = (EWMA_ALPHA_BPS * capped + (BPS - EWMA_ALPHA_BPS) * oldSmoothed) / BPS;

        // Update state
        ss.rawCapacity = capped;
        ss.smoothedCapacity = newSmoothed;
        ss.pendingCommit = bytes32(0);

        // Update aggregate
        TaskType storage tt = _taskTypes[taskTypeId];
        tt.totalCapacity = tt.totalCapacity - oldSmoothed + newSmoothed;

        emit CapacityRevealed(taskTypeId, msg.sender, capped, newSmoothed);
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc ICapacitySignal
    function getSmoothedCapacity(bytes32 taskTypeId, address sink) external view returns (uint256) {
        return _sinkStates[taskTypeId][sink].smoothedCapacity;
    }

    /// @inheritdoc ICapacitySignal
    function getSinks(bytes32 taskTypeId) external view returns (address[] memory sinks, uint256[] memory capacities) {
        TaskType storage tt = _taskTypes[taskTypeId];
        uint256 len = tt.sinks.length;
        sinks = new address[](len);
        capacities = new uint256[](len);
        for (uint256 i; i < len; ++i) {
            sinks[i] = tt.sinks[i];
            capacities[i] = _sinkStates[taskTypeId][tt.sinks[i]].smoothedCapacity;
        }
    }

    /// @notice Get the raw (pre-EWMA) capacity for a sink.
    function getRawCapacity(bytes32 taskTypeId, address sink) external view returns (uint256) {
        return _sinkStates[taskTypeId][sink].rawCapacity;
    }

    /// @notice Check if a sink has a pending commit.
    function hasPendingCommit(bytes32 taskTypeId, address sink) external view returns (bool) {
        return _sinkStates[taskTypeId][sink].pendingCommit != bytes32(0);
    }
}
