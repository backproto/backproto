// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ICompletionTracker } from "./interfaces/ICompletionTracker.sol";
import { ICapacitySignal } from "./interfaces/ICapacitySignal.sol";
import { IStakeManager } from "./interfaces/IStakeManager.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title CompletionTracker
/// @notice Statistical capacity verification via dual-signed completion receipts.
///         Tracks per-sink completion rates over rolling epochs. If a sink's declared capacity
///         significantly exceeds its verified completions for N consecutive epochs, it is
///         auto-slashed via StakeManager — solving the oracle problem without external oracles.
contract CompletionTracker is ICompletionTracker, EIP712 {
    using ECDSA for bytes32;

    // ──────────────────── Constants ────────────────────

    /// @notice Epoch duration in seconds.
    uint256 public constant EPOCH_DURATION = 300; // 5 minutes

    /// @notice Slash threshold in basis points. If completionRate < this, count as under-performing.
    uint256 public constant SLASH_THRESHOLD_BPS = 5000; // 50%

    /// @notice Consecutive under-performing epochs before auto-slash triggers.
    uint256 public constant CONSECUTIVE_EPOCHS_FOR_SLASH = 3;

    /// @notice Slash amount as basis points of current stake.
    uint256 public constant SLASH_AMOUNT_BPS = 1000; // 10%

    uint256 public constant BPS = 10_000;

    /// @notice EIP-712 typehash for completion receipts.
    bytes32 public constant COMPLETION_TYPEHASH =
        keccak256("CompletionReceipt(bytes32 taskTypeId,address sink,address source,bytes32 taskId,uint256 timestamp)");

    // ──────────────────── Storage ────────────────────

    ICapacitySignal public immutable capacityRegistry;
    IStakeManager public immutable stakeManager;

    struct SinkEpochState {
        uint256 completions; // Completions in current epoch
        uint256 epochStart; // Current epoch start timestamp
        uint256 lastCompletionRate; // Last computed rate in BPS
        uint256 consecutiveBelow; // Consecutive epochs below threshold
    }

    mapping(bytes32 taskTypeId => mapping(address sink => SinkEpochState)) internal _sinkStates;
    mapping(bytes32 taskId => bool) public taskRecorded; // Replay prevention

    // ──────────────────── Errors ────────────────────

    error TaskAlreadyRecorded();
    error InvalidSinkSignature();
    error InvalidSourceSignature();
    error EpochNotElapsed();

    // ──────────────────── Constructor ────────────────────

    constructor(
        address capacityRegistry_,
        address stakeManager_
    ) EIP712("BPE-CompletionTracker", "1") {
        capacityRegistry = ICapacitySignal(capacityRegistry_);
        stakeManager = IStakeManager(stakeManager_);
    }

    // ──────────────────── Completion Recording ────────────────────

    /// @inheritdoc ICompletionTracker
    function recordCompletion(
        bytes32 taskTypeId,
        address sink,
        bytes32 taskId,
        bytes calldata sinkSig,
        bytes calldata sourceSig
    ) external {
        if (taskRecorded[taskId]) revert TaskAlreadyRecorded();

        // Build the EIP-712 struct hash
        bytes32 structHash = keccak256(
            abi.encode(COMPLETION_TYPEHASH, taskTypeId, sink, msg.sender, taskId, block.timestamp)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // Verify sink signature
        address recoveredSink = digest.recover(sinkSig);
        if (recoveredSink != sink) revert InvalidSinkSignature();

        // Verify source signature (source = msg.sender submitting the tx, but we still verify)
        address recoveredSource = digest.recover(sourceSig);
        if (recoveredSource != msg.sender) revert InvalidSourceSignature();

        // Record
        taskRecorded[taskId] = true;
        SinkEpochState storage ses = _sinkStates[taskTypeId][sink];
        _ensureEpochInitialized(ses);
        ses.completions++;

        emit CompletionRecorded(taskTypeId, sink, msg.sender, taskId);
    }

    // ──────────────────── Epoch Management ────────────────────

    /// @inheritdoc ICompletionTracker
    function advanceEpoch(bytes32 taskTypeId, address sink) external {
        SinkEpochState storage ses = _sinkStates[taskTypeId][sink];
        _ensureEpochInitialized(ses);

        if (block.timestamp < ses.epochStart + EPOCH_DURATION) revert EpochNotElapsed();

        // Compute completion rate: completions / declared_capacity (in BPS)
        uint256 declaredCapacity = capacityRegistry.getSmoothedCapacity(taskTypeId, sink);
        uint256 rate;
        if (declaredCapacity == 0) {
            rate = BPS; // No capacity declared, no obligation
        } else {
            rate = (ses.completions * BPS) / declaredCapacity;
            if (rate > BPS) rate = BPS; // Cap at 100%
        }

        ses.lastCompletionRate = rate;

        // Track consecutive under-performance
        if (rate < SLASH_THRESHOLD_BPS) {
            ses.consecutiveBelow++;
        } else {
            ses.consecutiveBelow = 0;
        }

        emit EpochAdvanced(taskTypeId, sink, block.timestamp, rate);

        // Auto-slash if threshold breached
        if (ses.consecutiveBelow >= CONSECUTIVE_EPOCHS_FOR_SLASH) {
            uint256 sinkStake = stakeManager.getStake(sink);
            uint256 slashAmount = (sinkStake * SLASH_AMOUNT_BPS) / BPS;
            if (slashAmount > 0) {
                stakeManager.slash(sink, slashAmount, keccak256("COMPLETION_UNDERPERFORMANCE"));
                emit AutoSlashed(taskTypeId, sink, slashAmount, rate);
            }
            ses.consecutiveBelow = 0; // Reset after slash
        }

        // Reset for next epoch
        ses.completions = 0;
        ses.epochStart = block.timestamp;
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc ICompletionTracker
    function getCompletions(bytes32 taskTypeId, address sink) external view returns (uint256) {
        return _sinkStates[taskTypeId][sink].completions;
    }

    /// @inheritdoc ICompletionTracker
    function getCompletionRate(bytes32 taskTypeId, address sink) external view returns (uint256) {
        return _sinkStates[taskTypeId][sink].lastCompletionRate;
    }

    /// @inheritdoc ICompletionTracker
    function getConsecutiveBelowThreshold(bytes32 taskTypeId, address sink) external view returns (uint256) {
        return _sinkStates[taskTypeId][sink].consecutiveBelow;
    }

    // ──────────────────── Internal ────────────────────

    function _ensureEpochInitialized(SinkEpochState storage ses) internal {
        if (ses.epochStart == 0) {
            ses.epochStart = block.timestamp;
        }
    }
}
