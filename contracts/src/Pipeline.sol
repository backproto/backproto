// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IBackpressurePool } from "./interfaces/IBackpressurePool.sol";
import { ICapacitySignal } from "./interfaces/ICapacitySignal.sol";

/// @title Pipeline
/// @notice Multi-stage pipeline composition: chains BackpressurePools so that downstream
///         congestion propagates upstream. Each stage's effective capacity is constrained
///         by the minimum of its local capacity and the downstream stage's throughput.
///
///         Pipeline: Source → [Stage 0] → [Stage 1] → ... → [Stage N] → Output
///
///         Upstream propagation: C_effective(stage_i) = min(C_local(stage_i), throughput(stage_{i+1}))
contract Pipeline is Ownable {
    // ──────────────────── Storage ────────────────────

    IBackpressurePool public immutable backpressurePool;
    ICapacitySignal public immutable capacityRegistry;

    struct PipelineConfig {
        bytes32[] stages; // Ordered task type IDs for each stage
        bool active;
    }

    mapping(bytes32 pipelineId => PipelineConfig) internal _pipelines;

    // ──────────────────── Events ────────────────────

    event PipelineCreated(bytes32 indexed pipelineId, bytes32[] stages);
    event PipelineRebalanced(bytes32 indexed pipelineId, uint256[] effectiveCapacities);

    // ──────────────────── Errors ────────────────────

    error PipelineAlreadyExists();
    error PipelineDoesNotExist();
    error InsufficientStages();

    // ──────────────────── Constructor ────────────────────

    constructor(address backpressurePool_, address capacityRegistry_, address owner_) Ownable(owner_) {
        backpressurePool = IBackpressurePool(backpressurePool_);
        capacityRegistry = ICapacitySignal(capacityRegistry_);
    }

    // ──────────────────── Pipeline Management ────────────────────

    /// @notice Create a pipeline with ordered stages.
    /// @param pipelineId Unique identifier for this pipeline.
    /// @param stages Ordered array of task type IDs (stage 0 = first, stage N = last).
    function createPipeline(bytes32 pipelineId, bytes32[] calldata stages) external {
        if (_pipelines[pipelineId].active) revert PipelineAlreadyExists();
        if (stages.length < 2) revert InsufficientStages();

        _pipelines[pipelineId] = PipelineConfig({ stages: stages, active: true });
        emit PipelineCreated(pipelineId, stages);
    }

    /// @notice Rebalance all stages in a pipeline, propagating downstream constraints upstream.
    ///         This reads current capacity from the registry and triggers rebalance on each pool.
    ///         Stages are rebalanced back-to-front so downstream capacity informs upstream.
    /// @param pipelineId The pipeline to rebalance.
    function rebalancePipeline(bytes32 pipelineId) external {
        PipelineConfig storage pipeline = _pipelines[pipelineId];
        if (!pipeline.active) revert PipelineDoesNotExist();

        uint256 stageCount = pipeline.stages.length;
        uint256[] memory effectiveCaps = new uint256[](stageCount);

        // Pass 1: Compute effective capacities back-to-front (upstream propagation)
        for (uint256 i = stageCount; i > 0;) {
            unchecked { --i; }
            bytes32 taskTypeId = pipeline.stages[i];
            (,, uint256 localCapacity) = capacityRegistry.getTaskType(taskTypeId);

            if (i == stageCount - 1) {
                // Last stage: effective = local
                effectiveCaps[i] = localCapacity;
            } else {
                // Constrained by downstream
                effectiveCaps[i] = localCapacity < effectiveCaps[i + 1] ? localCapacity : effectiveCaps[i + 1];
            }
        }

        // Pass 2: Trigger rebalance on each stage's pool
        for (uint256 i; i < stageCount; ++i) {
            backpressurePool.rebalance(pipeline.stages[i]);
        }

        emit PipelineRebalanced(pipelineId, effectiveCaps);
    }

    // ──────────────────── Reads ────────────────────

    /// @notice Get pipeline stage configuration.
    /// @param pipelineId The pipeline.
    /// @return stages The ordered task type IDs.
    /// @return active Whether the pipeline is active.
    function getPipeline(bytes32 pipelineId) external view returns (bytes32[] memory stages, bool active) {
        PipelineConfig storage p = _pipelines[pipelineId];
        return (p.stages, p.active);
    }

    /// @notice Compute effective capacities for all stages (read-only, no state change).
    /// @param pipelineId The pipeline.
    /// @return effectiveCaps Effective capacity per stage after upstream propagation.
    function getEffectiveCapacities(bytes32 pipelineId) external view returns (uint256[] memory effectiveCaps) {
        PipelineConfig storage pipeline = _pipelines[pipelineId];
        uint256 stageCount = pipeline.stages.length;
        effectiveCaps = new uint256[](stageCount);

        for (uint256 i = stageCount; i > 0;) {
            unchecked { --i; }
            (,, uint256 localCapacity) = capacityRegistry.getTaskType(pipeline.stages[i]);
            if (i == stageCount - 1) {
                effectiveCaps[i] = localCapacity;
            } else {
                effectiveCaps[i] = localCapacity < effectiveCaps[i + 1] ? localCapacity : effectiveCaps[i + 1];
            }
        }
    }
}
