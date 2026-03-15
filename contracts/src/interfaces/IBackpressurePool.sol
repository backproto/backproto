// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IBackpressurePool
/// @notice Interface for backpressure-weighted Superfluid Distribution Pools.
///         Each task type has an associated pool; member units are dynamically adjusted
///         based on EWMA-smoothed capacity signals from the CapacityRegistry.
interface IBackpressurePool {
    // ──────────────────── Events ────────────────────

    event PoolCreated(bytes32 indexed taskTypeId, address indexed pool);
    event Rebalanced(bytes32 indexed taskTypeId, uint256 sinkCount, uint256 totalCapacity);

    // ──────────────────── Pool Lifecycle ────────────────────

    /// @notice Create a Superfluid GDA pool for a registered task type.
    ///         Called once per task type, typically by the task type creator.
    /// @param taskTypeId The task type to create a pool for.
    function createPool(bytes32 taskTypeId) external;

    // ──────────────────── Rebalance ────────────────────

    /// @notice Rebalance pool member units based on current capacity signals.
    ///         Permissionless — anyone can call. Reads from CapacityRegistry.
    /// @param taskTypeId The task type pool to rebalance.
    function rebalance(bytes32 taskTypeId) external;

    /// @notice Check whether a rebalance is needed (capacity changed beyond threshold).
    /// @param taskTypeId The task type pool to check.
    /// @return needed True if capacity signals have changed enough to warrant rebalance.
    function needsRebalance(bytes32 taskTypeId) external view returns (bool needed);

    // ──────────────────── Reads ────────────────────

    /// @notice Get the Superfluid pool address for a task type.
    /// @param taskTypeId The task type.
    /// @return pool The Superfluid pool address (zero if not created).
    function getPool(bytes32 taskTypeId) external view returns (address pool);

    /// @notice Get the current unit weight for a sink in a task type pool.
    /// @param taskTypeId The task type.
    /// @param sink The sink address.
    /// @return units The member's current pool units.
    function getMemberUnits(bytes32 taskTypeId, address sink) external view returns (uint128 units);
}
