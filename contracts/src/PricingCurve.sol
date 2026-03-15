// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ICapacitySignal } from "./interfaces/ICapacitySignal.sol";
import { IPricingCurve } from "./interfaces/IPricingCurve.sol";

/// @title PricingCurve
/// @notice Dynamic queue-length pricing for BPE task types.
///         Price per capacity unit rises with congestion, creating economic backpressure.
///         Base fee adjusts per epoch (EIP-1559 style): rises 12.5% when demand exceeds
///         capacity, falls 12.5% when below.
contract PricingCurve is IPricingCurve {
    // ──────────────────── Constants ────────────────────

    /// @notice Price sensitivity parameter (γ) in basis points. γ=10000 means price doubles at full load.
    uint256 public constant GAMMA_BPS = 10_000;
    uint256 public constant BPS = 10_000;

    /// @notice Base fee adjustment rate in basis points (1250 = 12.5%, matching EIP-1559).
    uint256 public constant ADJUSTMENT_RATE_BPS = 1250;

    /// @notice Minimum epoch duration in seconds.
    uint256 public constant EPOCH_DURATION = 60;

    /// @notice Default initial base fee (1e15 = 0.001 tokens at 18 decimals).
    uint256 public constant DEFAULT_BASE_FEE = 1e15;

    /// @notice Minimum base fee floor to prevent zero pricing.
    uint256 public constant MIN_BASE_FEE = 1e12;

    // ──────────────────── Storage ────────────────────

    ICapacitySignal public immutable capacityRegistry;

    struct PricingState {
        uint256 baseFee;
        uint256 lastEpochTimestamp;
        uint256 epochDemand; // Aggregate queue load reported this epoch
    }

    mapping(bytes32 taskTypeId => PricingState) internal _pricing;
    mapping(bytes32 taskTypeId => mapping(address sink => uint256)) internal _queueLoads;

    // ──────────────────── Errors ────────────────────

    error EpochNotElapsed();
    error ZeroCapacity();

    // ──────────────────── Constructor ────────────────────

    constructor(address capacityRegistry_) {
        capacityRegistry = ICapacitySignal(capacityRegistry_);
    }

    // ──────────────────── Queue Load Reporting ────────────────────

    /// @inheritdoc IPricingCurve
    function reportQueueLoad(bytes32 taskTypeId, uint256 queueLoad) external {
        _ensureInitialized(taskTypeId);
        uint256 oldLoad = _queueLoads[taskTypeId][msg.sender];
        _queueLoads[taskTypeId][msg.sender] = queueLoad;

        // Update epoch aggregate demand
        PricingState storage ps = _pricing[taskTypeId];
        ps.epochDemand = ps.epochDemand - oldLoad + queueLoad;

        emit QueueLoadUpdated(taskTypeId, msg.sender, queueLoad);
    }

    // ──────────────────── Epoch Advancement ────────────────────

    /// @inheritdoc IPricingCurve
    function advanceEpoch(bytes32 taskTypeId) external {
        _ensureInitialized(taskTypeId);
        PricingState storage ps = _pricing[taskTypeId];

        if (block.timestamp < ps.lastEpochTimestamp + EPOCH_DURATION) revert EpochNotElapsed();

        (,, uint256 totalCapacity) = capacityRegistry.getTaskType(taskTypeId);

        // EIP-1559 adjustment: if demand > capacity, increase baseFee; otherwise decrease
        uint256 oldBaseFee = ps.baseFee;
        if (ps.epochDemand > totalCapacity && totalCapacity > 0) {
            // Congested: increase by ADJUSTMENT_RATE_BPS
            ps.baseFee = oldBaseFee + (oldBaseFee * ADJUSTMENT_RATE_BPS) / BPS;
        } else {
            // Under-capacity: decrease by ADJUSTMENT_RATE_BPS
            uint256 decrease = (oldBaseFee * ADJUSTMENT_RATE_BPS) / BPS;
            ps.baseFee = oldBaseFee > decrease + MIN_BASE_FEE ? oldBaseFee - decrease : MIN_BASE_FEE;
        }

        // Reset epoch
        ps.epochDemand = 0;
        ps.lastEpochTimestamp = block.timestamp;

        emit BaseFeeUpdated(taskTypeId, ps.baseFee);
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc IPricingCurve
    function getPrice(bytes32 taskTypeId, address sink) external view returns (uint256 price) {
        PricingState storage ps = _pricing[taskTypeId];
        uint256 baseFee = ps.baseFee == 0 ? DEFAULT_BASE_FEE : ps.baseFee;
        uint256 load = _queueLoads[taskTypeId][sink];
        uint256 capacity = capacityRegistry.getSmoothedCapacity(taskTypeId, sink);

        if (capacity == 0) {
            // No capacity → infinite price (return max to signal unavailability)
            return type(uint256).max;
        }

        // price = baseFee × (1 + γ × queueLoad / capacity)
        // = baseFee + baseFee × γ × queueLoad / (capacity × BPS)
        price = baseFee + (baseFee * GAMMA_BPS * load) / (capacity * BPS);
    }

    /// @inheritdoc IPricingCurve
    function getBaseFee(bytes32 taskTypeId) external view returns (uint256) {
        uint256 fee = _pricing[taskTypeId].baseFee;
        return fee == 0 ? DEFAULT_BASE_FEE : fee;
    }

    /// @inheritdoc IPricingCurve
    function getQueueLoad(bytes32 taskTypeId, address sink) external view returns (uint256) {
        return _queueLoads[taskTypeId][sink];
    }

    // ──────────────────── Internal ────────────────────

    /// @dev Lazy-initialize pricing state on first interaction.
    function _ensureInitialized(bytes32 taskTypeId) internal {
        PricingState storage ps = _pricing[taskTypeId];
        if (ps.baseFee == 0) {
            ps.baseFee = DEFAULT_BASE_FEE;
            ps.lastEpochTimestamp = block.timestamp;
        }
    }
}
