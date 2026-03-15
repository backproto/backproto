// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IOffchainAggregator
/// @notice Interface for batch-verified off-chain capacity attestations.
///         Agents sign EIP-712 capacity attestations off-chain. Anyone can submit a batch
///         of attestations to the aggregator, which verifies ECDSA signatures and feeds
///         aggregated capacity values into the CapacityRegistry. Replaces commit-reveal
///         as the fast path for capacity updates (commit-reveal remains as fallback).
interface IOffchainAggregator {
    // ──────────────────── Structs ────────────────────

    struct SignedAttestation {
        bytes32 taskTypeId;
        address sink;
        uint256 capacity;
        uint256 timestamp;
        uint256 nonce;
        bytes signature; // EIP-712 ECDSA signature by sink
    }

    // ──────────────────── Events ────────────────────

    event BatchSubmitted(uint256 attestationCount, address indexed relayer);
    event AttestationApplied(bytes32 indexed taskTypeId, address indexed sink, uint256 capacity, uint256 timestamp);
    event AttestationRejected(bytes32 indexed taskTypeId, address indexed sink, string reason);

    // ──────────────────── Batch Submission ────────────────────

    /// @notice Submit a batch of signed capacity attestations for verification and aggregation.
    ///         Anyone can submit (permissionless relaying).
    /// @param attestations Array of signed attestations to verify and apply.
    function submitBatch(SignedAttestation[] calldata attestations) external;

    // ──────────────────── Reads ────────────────────

    /// @notice Get the last applied nonce for a sink (replay prevention).
    /// @param sink The sink address.
    /// @return nonce The last processed nonce.
    function lastNonce(address sink) external view returns (uint256 nonce);

    /// @notice Get the last applied timestamp for a sink attestation.
    /// @param taskTypeId The task type.
    /// @param sink The sink address.
    /// @return timestamp The timestamp of the last applied attestation.
    function lastTimestamp(bytes32 taskTypeId, address sink) external view returns (uint256 timestamp);
}
