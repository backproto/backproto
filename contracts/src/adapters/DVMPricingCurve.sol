// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ICapacitySignal } from "../interfaces/ICapacitySignal.sol";
import { IPricingCurve } from "../interfaces/IPricingCurve.sol";
import { ITemperatureOracle } from "../interfaces/ITemperatureOracle.sol";
import { IEscrowBuffer } from "../interfaces/IEscrowBuffer.sol";

/// @title DVMPricingCurve
/// @notice Extends the base PricingCurve with DVM-specific parameters.
///         Each NIP-90 kind has a complexity weight (kindWeight) that scales the base
///         price. Translation jobs (kind 5002) cost less than image generation (kind 5100).
///         Formula: price = baseFee × kindWeight × (1 + γ × queueLoad / capacity) × escrowMultiplier
contract DVMPricingCurve is IPricingCurve {
    // ──────────────────── Constants ────────────────────

    uint256 public constant GAMMA_BPS = 10_000;
    uint256 public constant BPS = 10_000;
    uint256 public constant ADJUSTMENT_RATE_BPS = 1250;
    uint256 public constant EPOCH_DURATION = 60;
    uint256 public constant DEFAULT_BASE_FEE = 1e15;
    uint256 public constant MIN_BASE_FEE = 1e12;
    uint256 public constant ESCROW_SENSITIVITY = 8e17;
    uint256 public constant MAX_UTILIZATION = 99e16;

    /// @notice Default kind weight (1.0x in BPS).
    uint256 public constant DEFAULT_KIND_WEIGHT = 10_000;

    // ──────────────────── Storage ────────────────────

    ICapacitySignal public immutable capacityRegistry;
    ITemperatureOracle public temperatureOracle;
    IEscrowBuffer public escrowBuffer;
    address public admin;

    struct PricingState {
        uint256 baseFee;
        uint256 lastEpochTimestamp;
        uint256 epochDemand;
    }

    mapping(bytes32 taskTypeId => PricingState) internal _pricing;
    mapping(bytes32 taskTypeId => mapping(address sink => uint256)) internal _queueLoads;

    /// @notice Kind weight in BPS. 10000 = 1.0x.
    mapping(uint256 kind => uint256) public kindWeights;

    // ──────────────────── Events ────────────────────

    event KindWeightSet(uint256 indexed kind, uint256 weight);

    // ──────────────────── Errors ────────────────────

    error EpochNotElapsed();
    error ZeroCapacity();
    error OnlyAdmin();

    // ──────────────────── Constructor ────────────────────

    constructor(address capacityRegistry_, address admin_) {
        capacityRegistry = ICapacitySignal(capacityRegistry_);
        admin = admin_;
    }

    // ──────────────────── Admin ────────────────────

    function setTemperatureOracle(address oracle_) external {
        if (msg.sender != admin) revert OnlyAdmin();
        temperatureOracle = ITemperatureOracle(oracle_);
    }

    function setEscrowBuffer(address buffer_) external {
        if (msg.sender != admin) revert OnlyAdmin();
        escrowBuffer = IEscrowBuffer(buffer_);
    }

    /// @notice Set the complexity weight for a NIP-90 kind.
    /// @param kind NIP-90 kind number.
    /// @param weight Weight in BPS (10000 = 1.0x, 5000 = 0.5x, 20000 = 2.0x).
    function setKindWeight(uint256 kind, uint256 weight) external {
        if (msg.sender != admin) revert OnlyAdmin();
        kindWeights[kind] = weight;
        emit KindWeightSet(kind, weight);
    }

    // ──────────────────── IPricingCurve ────────────────────

    /// @inheritdoc IPricingCurve
    function reportQueueLoad(bytes32 taskTypeId, uint256 queueLoad) external {
        _ensureInitialized(taskTypeId);
        uint256 oldLoad = _queueLoads[taskTypeId][msg.sender];
        _queueLoads[taskTypeId][msg.sender] = queueLoad;

        PricingState storage ps = _pricing[taskTypeId];
        ps.epochDemand = ps.epochDemand - oldLoad + queueLoad;

        emit QueueLoadUpdated(taskTypeId, msg.sender, queueLoad);
    }

    /// @inheritdoc IPricingCurve
    function advanceEpoch(bytes32 taskTypeId) external {
        _ensureInitialized(taskTypeId);
        PricingState storage ps = _pricing[taskTypeId];

        if (block.timestamp < ps.lastEpochTimestamp + EPOCH_DURATION) revert EpochNotElapsed();

        (,, uint256 totalCapacity) = capacityRegistry.getTaskType(taskTypeId);

        uint256 oldBaseFee = ps.baseFee;
        if (ps.epochDemand > totalCapacity && totalCapacity > 0) {
            ps.baseFee = oldBaseFee + (oldBaseFee * ADJUSTMENT_RATE_BPS) / BPS;
        } else {
            uint256 decrease = (oldBaseFee * ADJUSTMENT_RATE_BPS) / BPS;
            ps.baseFee = oldBaseFee > decrease + MIN_BASE_FEE ? oldBaseFee - decrease : MIN_BASE_FEE;
        }

        ps.epochDemand = 0;
        ps.lastEpochTimestamp = block.timestamp;

        emit BaseFeeUpdated(taskTypeId, ps.baseFee);
    }

    /// @inheritdoc IPricingCurve
    function getPrice(bytes32 taskTypeId, address sink) external view returns (uint256 price) {
        PricingState storage ps = _pricing[taskTypeId];
        uint256 baseFee = ps.baseFee == 0 ? DEFAULT_BASE_FEE : ps.baseFee;
        uint256 load = _queueLoads[taskTypeId][sink];
        uint256 capacity = capacityRegistry.getSmoothedCapacity(taskTypeId, sink);

        if (capacity == 0) {
            return type(uint256).max;
        }

        uint256 utilization = (load * 1e18) / capacity;
        if (utilization > MAX_UTILIZATION) utilization = MAX_UTILIZATION;

        uint256 congestion = 1e18 + (GAMMA_BPS * utilization) / (1e18 - utilization) * 1e18 / BPS;

        uint256 escrowMultiplier = 1e18;
        if (address(escrowBuffer) != address(0)) {
            uint256 pressure = escrowBuffer.getEscrowPressure(taskTypeId);
            escrowMultiplier = 1e18 + (ESCROW_SENSITIVITY * pressure) / 1e18;
        }

        // Extract kind from taskTypeId and apply kind weight
        // Since we can't reverse keccak256, callers use getDVMPrice(kind, sink) for kind-weighted pricing
        price = (baseFee * escrowMultiplier / 1e18) * congestion / 1e18;
    }

    /// @notice Get the DVM-specific price including kind weight.
    /// @param kind NIP-90 kind number.
    /// @param sink The sink address.
    /// @return price The kind-weighted price.
    function getDVMPrice(uint256 kind, address sink) external view returns (uint256 price) {
        bytes32 taskTypeId = keccak256(abi.encodePacked("DVM_KIND_", kind));
        PricingState storage ps = _pricing[taskTypeId];
        uint256 baseFee = ps.baseFee == 0 ? DEFAULT_BASE_FEE : ps.baseFee;
        uint256 load = _queueLoads[taskTypeId][sink];
        uint256 capacity = capacityRegistry.getSmoothedCapacity(taskTypeId, sink);

        if (capacity == 0) {
            return type(uint256).max;
        }

        uint256 utilization = (load * 1e18) / capacity;
        if (utilization > MAX_UTILIZATION) utilization = MAX_UTILIZATION;

        uint256 congestion = 1e18 + (GAMMA_BPS * utilization) / (1e18 - utilization) * 1e18 / BPS;

        uint256 escrowMultiplier = 1e18;
        if (address(escrowBuffer) != address(0)) {
            uint256 pressure = escrowBuffer.getEscrowPressure(taskTypeId);
            escrowMultiplier = 1e18 + (ESCROW_SENSITIVITY * pressure) / 1e18;
        }

        uint256 kw = kindWeights[kind];
        if (kw == 0) kw = DEFAULT_KIND_WEIGHT;

        price = (baseFee * escrowMultiplier / 1e18) * congestion / 1e18;
        price = (price * kw) / BPS;
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

    function _ensureInitialized(bytes32 taskTypeId) internal {
        PricingState storage ps = _pricing[taskTypeId];
        if (ps.baseFee == 0) {
            ps.baseFee = DEFAULT_BASE_FEE;
            ps.lastEpochTimestamp = block.timestamp;
        }
    }
}
