// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IPricingCurve
/// @notice Interface for dynamic queue-length pricing.
///         Price increases with congestion (queue load / capacity ratio), creating economic
///         backpressure that throttles sources before the escrow buffer is needed.
///         Follows EIP-1559 base-fee adjustment: baseFee rises when demand exceeds capacity.
interface IPricingCurve {
    // ──────────────────── Events ────────────────────

    event BaseFeeUpdated(bytes32 indexed taskTypeId, uint256 newBaseFee);
    event QueueLoadUpdated(bytes32 indexed taskTypeId, address indexed sink, uint256 queueLoad);

    // ──────────────────── Queue Load Reporting ────────────────────

    /// @notice Report current queue load for a sink. Called by sinks or aggregator.
    /// @param taskTypeId The task type.
    /// @param queueLoad Current number of pending tasks / utilization metric.
    function reportQueueLoad(bytes32 taskTypeId, uint256 queueLoad) external;

    // ──────────────────── Epoch Advancement ────────────────────

    /// @notice Advance the pricing epoch for a task type. Adjusts baseFee based on
    ///         aggregate demand vs aggregate capacity in the previous epoch.
    ///         Permissionless — anyone can call once the epoch has elapsed.
    /// @param taskTypeId The task type.
    function advanceEpoch(bytes32 taskTypeId) external;

    // ──────────────────── Reads ────────────────────

    /// @notice Get the current price per unit of capacity for a specific sink.
    ///         price = baseFee × (1 + γ × queueLoad / capacity)
    /// @param taskTypeId The task type.
    /// @param sink The sink address.
    /// @return price The current price per capacity unit (in token base units).
    function getPrice(bytes32 taskTypeId, address sink) external view returns (uint256 price);

    /// @notice Get the current base fee for a task type.
    /// @param taskTypeId The task type.
    /// @return baseFee The current base fee (adjusted per epoch).
    function getBaseFee(bytes32 taskTypeId) external view returns (uint256 baseFee);

    /// @notice Get the current queue load for a sink.
    /// @param taskTypeId The task type.
    /// @param sink The sink address.
    /// @return queueLoad The last reported queue load.
    function getQueueLoad(bytes32 taskTypeId, address sink) external view returns (uint256 queueLoad);
}
