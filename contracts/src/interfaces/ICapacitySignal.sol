// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ICapacitySignal
/// @notice Interface for capacity signal registration, commit-reveal updates, and EWMA-smoothed reads.
interface ICapacitySignal {
    // ──────────────────── Events ────────────────────

    event TaskTypeRegistered(bytes32 indexed taskTypeId, address indexed creator, uint256 minStake);
    event SinkRegistered(bytes32 indexed taskTypeId, address indexed sink, uint256 initialCapacity);
    event SinkDeregistered(bytes32 indexed taskTypeId, address indexed sink);
    event CapacityCommitted(bytes32 indexed taskTypeId, address indexed sink, bytes32 commitHash);
    event CapacityRevealed(bytes32 indexed taskTypeId, address indexed sink, uint256 rawCapacity, uint256 smoothedCapacity);

    // ──────────────────── Task Type Management ────────────────────

    /// @notice Register a new task type (permissionless with stake).
    /// @param taskTypeId Unique identifier for the task type.
    /// @param minStake Minimum stake required for sinks to join this task type.
    function registerTaskType(bytes32 taskTypeId, uint256 minStake) external;

    /// @notice Get metadata for a registered task type.
    /// @param taskTypeId The task type to query.
    /// @return minStake The minimum stake required.
    /// @return sinkCount The number of registered sinks.
    /// @return totalCapacity The aggregate smoothed capacity.
    function getTaskType(bytes32 taskTypeId) external view returns (uint256 minStake, uint256 sinkCount, uint256 totalCapacity);

    // ──────────────────── Sink Management ────────────────────

    /// @notice Register as a sink for a task type. Caller must have staked via StakeManager.
    /// @param taskTypeId The task type to register for.
    /// @param initialCapacity Initial capacity declaration (subject to stake cap).
    function registerSink(bytes32 taskTypeId, uint256 initialCapacity) external;

    /// @notice Deregister from a task type.
    /// @param taskTypeId The task type to deregister from.
    function deregisterSink(bytes32 taskTypeId) external;

    // ──────────────────── Commit-Reveal Capacity Updates ────────────────────

    /// @notice Commit a capacity update (MEV-resistant). Hash = keccak256(abi.encode(capacity, nonce)).
    /// @param taskTypeId The task type.
    /// @param commitHash The hash of (capacity, nonce).
    function commitCapacity(bytes32 taskTypeId, bytes32 commitHash) external;

    /// @notice Reveal a previously committed capacity value. Applies EWMA smoothing.
    /// @param taskTypeId The task type.
    /// @param capacity The raw capacity value.
    /// @param nonce The nonce used in the commit.
    function revealCapacity(bytes32 taskTypeId, uint256 capacity, bytes32 nonce) external;

    // ──────────────────── Reads ────────────────────

    /// @notice Get the EWMA-smoothed capacity for a sink.
    /// @param taskTypeId The task type.
    /// @param sink The sink address.
    /// @return smoothed The smoothed capacity value.
    function getSmoothedCapacity(bytes32 taskTypeId, address sink) external view returns (uint256 smoothed);

    /// @notice Get all sinks for a task type with their smoothed capacities.
    /// @param taskTypeId The task type.
    /// @return sinks Array of sink addresses.
    /// @return capacities Array of corresponding smoothed capacities.
    function getSinks(bytes32 taskTypeId) external view returns (address[] memory sinks, uint256[] memory capacities);
}
