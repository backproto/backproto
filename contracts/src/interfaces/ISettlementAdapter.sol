// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ISettlementAdapter
/// @notice Abstract adapter for settling payments between sources and sinks.
///         Three implementations cover different settlement rails: Superfluid (streaming),
///         Lightning (HTLC), and Direct (simple ERC-20 transfer). The BPE Pipeline
///         calls these adapters to initiate, adjust, and finalize payments without
///         knowing the underlying settlement mechanism.
interface ISettlementAdapter {
    // ──────────────────── Events ────────────────────

    event StreamInitialized(bytes32 indexed streamId, address indexed provider, uint256 flowRate);
    event StreamAdjusted(bytes32 indexed streamId, uint256 newFlowRate);
    event CompletionSettled(bytes32 indexed jobId, address indexed provider, uint256 amount);
    event Escrowed(bytes32 indexed jobId, uint256 amount);
    event EscrowReleased(bytes32 indexed jobId, address indexed recipient, uint256 amount);

    // ──────────────────── Stream Management ────────────────────

    /// @notice Initialize a payment stream to a provider.
    /// @param provider The provider (sink) address receiving the stream.
    /// @param flowRate The initial flow rate in token base units per second.
    /// @return streamId A unique identifier for the stream.
    function initializeStream(address provider, uint256 flowRate) external returns (bytes32 streamId);

    /// @notice Adjust the flow rate of an existing stream.
    /// @param streamId The stream to adjust.
    /// @param newFlowRate The new flow rate in token base units per second.
    function adjustStream(bytes32 streamId, uint256 newFlowRate) external;

    // ──────────────────── Completion Settlement ────────────────────

    /// @notice Settle payment for a verified completion.
    /// @param jobId Unique job identifier (from CompletionTracker).
    /// @param provider The provider who completed the job.
    /// @param amount Payment amount in token base units.
    /// @param proof Settlement-rail-specific proof (e.g., preimage for Lightning).
    function settleCompletion(bytes32 jobId, address provider, uint256 amount, bytes calldata proof) external;

    // ──────────────────── Escrow ────────────────────

    /// @notice Lock funds in escrow for a pending job.
    /// @param jobId Unique job identifier.
    /// @param amount Amount to escrow.
    function escrow(bytes32 jobId, uint256 amount) external;

    /// @notice Release escrowed funds to the recipient after job completion.
    /// @param jobId The job whose escrow to release.
    /// @param recipient The address to receive the funds.
    function releaseEscrow(bytes32 jobId, address recipient) external;

    // ──────────────────── Reads ────────────────────

    /// @notice Get the settlement rail identifier.
    /// @return rail A bytes32 identifying the settlement rail (e.g., keccak256("SUPERFLUID")).
    function railId() external pure returns (bytes32 rail);

    /// @notice Get the current flow rate for a stream.
    /// @param streamId The stream identifier.
    /// @return flowRate Current flow rate in token base units per second.
    function getStreamFlowRate(bytes32 streamId) external view returns (uint256 flowRate);

    /// @notice Get the escrowed amount for a job.
    /// @param jobId The job identifier.
    /// @return amount Currently escrowed amount.
    function getEscrowedAmount(bytes32 jobId) external view returns (uint256 amount);
}
