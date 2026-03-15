// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ICompletionTracker
/// @notice Interface for statistical capacity verification via dual-signed completion receipts.
///         Sources and sinks co-sign task completions. Rolling completion rate is tracked per
///         sink per epoch. If completion rate drops below threshold for N consecutive epochs,
///         the sink is auto-slashed via StakeManager.
interface ICompletionTracker {
    // ──────────────────── Events ────────────────────

    event CompletionRecorded(
        bytes32 indexed taskTypeId, address indexed sink, address indexed source, bytes32 taskId
    );
    event EpochAdvanced(bytes32 indexed taskTypeId, address indexed sink, uint256 epoch, uint256 completionRate);
    event AutoSlashed(bytes32 indexed taskTypeId, address indexed sink, uint256 slashAmount, uint256 completionRate);

    // ──────────────────── Completion Recording ────────────────────

    /// @notice Record a task completion with dual signatures (source + sink).
    /// @param taskTypeId The task type.
    /// @param sink The sink that completed the task.
    /// @param taskId Unique task identifier.
    /// @param sinkSig Sink's EIP-712 signature over the completion receipt.
    /// @param sourceSig Source's EIP-712 signature over the completion receipt.
    function recordCompletion(
        bytes32 taskTypeId,
        address sink,
        bytes32 taskId,
        bytes calldata sinkSig,
        bytes calldata sourceSig
    ) external;

    // ──────────────────── Epoch Management ────────────────────

    /// @notice Advance the epoch for a sink, computing completion rate and triggering
    ///         auto-slash if below threshold for consecutive epochs.
    /// @param taskTypeId The task type.
    /// @param sink The sink to evaluate.
    function advanceEpoch(bytes32 taskTypeId, address sink) external;

    // ──────────────────── Reads ────────────────────

    /// @notice Get the completion count for a sink in the current epoch.
    /// @param taskTypeId The task type.
    /// @param sink The sink.
    /// @return completions Number of verified completions this epoch.
    function getCompletions(bytes32 taskTypeId, address sink) external view returns (uint256 completions);

    /// @notice Get the rolling completion rate for a sink (completions / declared capacity).
    /// @param taskTypeId The task type.
    /// @param sink The sink.
    /// @return rate Completion rate in basis points (10000 = 100%).
    function getCompletionRate(bytes32 taskTypeId, address sink) external view returns (uint256 rate);

    /// @notice Get the number of consecutive epochs a sink has been below the slash threshold.
    /// @param taskTypeId The task type.
    /// @param sink The sink.
    /// @return count Consecutive below-threshold epochs.
    function getConsecutiveBelowThreshold(bytes32 taskTypeId, address sink) external view returns (uint256 count);
}
