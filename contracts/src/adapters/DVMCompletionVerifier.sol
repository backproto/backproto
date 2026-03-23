// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ICompletionTracker } from "../interfaces/ICompletionTracker.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title DVMCompletionVerifier
/// @notice Bridges NIP-90 DVM job results to the core CompletionTracker.
///         DVM operators (sinks) and job requesters (sources) co-sign a DVMJobResult
///         struct. This contract verifies both EIP-712 signatures and forwards the
///         completion to CompletionTracker.recordCompletion().
///
///         Each NIP-90 kind maps to a BPE taskTypeId via keccak256(abi.encodePacked("DVM_KIND_", kind)).
contract DVMCompletionVerifier is EIP712 {
    using ECDSA for bytes32;

    // ──────────────────── Constants ────────────────────

    bytes32 public constant JOB_RESULT_TYPEHASH = keccak256(
        "DVMJobResult(bytes32 dvmId,uint256 kind,bytes32 jobId,address requester,uint256 timestamp)"
    );

    // ──────────────────── Storage ────────────────────

    ICompletionTracker public immutable completionTracker;

    mapping(bytes32 jobId => bool) public jobRecorded;

    // ──────────────────── Events ────────────────────

    event DVMJobVerified(
        bytes32 indexed dvmId,
        uint256 indexed kind,
        bytes32 indexed jobId,
        address requester
    );

    // ──────────────────── Errors ────────────────────

    error JobAlreadyRecorded();
    error InvalidDVMSignature();
    error InvalidRequesterSignature();

    // ──────────────────── Constructor ────────────────────

    constructor(address completionTracker_) EIP712("Pura-DVMCompletionVerifier", "1") {
        completionTracker = ICompletionTracker(completionTracker_);
    }

    // ──────────────────── Verification ────────────────────

    /// @notice Verify and record a NIP-90 DVM job result with dual signatures.
    /// @param dvmId The DVM that completed the job.
    /// @param kind NIP-90 kind number.
    /// @param jobId Unique job identifier (from NIP-90 event id).
    /// @param dvmOperator The DVM operator's Ethereum address (sink).
    /// @param dvmSig DVM operator's EIP-712 signature over the DVMJobResult.
    /// @param requesterSig Requester's EIP-712 signature over the DVMJobResult.
    function verifyJobResult(
        bytes32 dvmId,
        uint256 kind,
        bytes32 jobId,
        address dvmOperator,
        bytes calldata dvmSig,
        bytes calldata requesterSig
    ) external {
        if (jobRecorded[jobId]) revert JobAlreadyRecorded();

        bytes32 structHash = keccak256(
            abi.encode(
                JOB_RESULT_TYPEHASH,
                dvmId,
                kind,
                jobId,
                msg.sender,
                block.timestamp
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // Verify DVM operator (sink) signature
        address recoveredDVM = digest.recover(dvmSig);
        if (recoveredDVM != dvmOperator) revert InvalidDVMSignature();

        // Verify requester (source) signature
        address recoveredRequester = digest.recover(requesterSig);
        if (recoveredRequester != msg.sender) revert InvalidRequesterSignature();

        jobRecorded[jobId] = true;

        // Map kind to BPE taskTypeId
        bytes32 taskTypeId = kindToTaskType(kind);

        completionTracker.recordCompletion(
            taskTypeId,
            dvmOperator,
            jobId,
            dvmSig,
            requesterSig
        );

        emit DVMJobVerified(dvmId, kind, jobId, msg.sender);
    }

    // ──────────────────── Reads ────────────────────

    /// @notice Convert a NIP-90 kind to BPE taskTypeId.
    function kindToTaskType(uint256 kind) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("DVM_KIND_", kind));
    }

    function isJobRecorded(bytes32 jobId) external view returns (bool) {
        return jobRecorded[jobId];
    }

    function getCompletionRate(uint256 kind, address dvmOperator) external view returns (uint256) {
        return completionTracker.getCompletionRate(kindToTaskType(kind), dvmOperator);
    }

    function getCompletions(uint256 kind, address dvmOperator) external view returns (uint256) {
        return completionTracker.getCompletions(kindToTaskType(kind), dvmOperator);
    }
}
