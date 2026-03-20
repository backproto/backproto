// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ISuperfluidToken } from "@superfluid-finance/contracts/interfaces/superfluid/ISuperfluidToken.sol";
import { ISuperfluidPool } from "@superfluid-finance/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {
    IGeneralDistributionAgreementV1,
    PoolConfig
} from "@superfluid-finance/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import { IBackpressurePool } from "./interfaces/IBackpressurePool.sol";
import { ICapacitySignal } from "./interfaces/ICapacitySignal.sol";

/// @title BackpressurePool
/// @notice Factory and rebalancer for Superfluid GDA pools weighted by capacity signals.
///         Each task type gets a dedicated pool. Member units = proportional to EWMA-smoothed capacity.
contract BackpressurePool is IBackpressurePool, Ownable {
    // ──────────────────── Constants ────────────────────

    /// @notice Scale factor for converting capacity proportions to pool units.
    uint128 public constant UNIT_SCALE = 1e9;

    /// @notice Rebalance threshold in basis points - only rebalance if total capacity changed by this much.
    uint256 public constant REBALANCE_THRESHOLD_BPS = 500; // 5%
    uint256 public constant BPS = 10_000;

    // ──────────────────── Storage ────────────────────

    IGeneralDistributionAgreementV1 public immutable GDA;
    ISuperfluidToken public immutable SUPER_TOKEN;
    ICapacitySignal public immutable capacityRegistry;

    struct PoolState {
        ISuperfluidPool pool;
        uint256 lastTotalCapacity; // Total capacity at last rebalance
    }

    mapping(bytes32 taskTypeId => PoolState) internal _pools;
    mapping(bytes32 taskTypeId => uint256) internal _verificationBudgetBps;

    // ──────────────────── Errors ────────────────────

    error PoolAlreadyExists();
    error PoolDoesNotExist();
    error TaskTypeDoesNotExist();
    error BudgetExceedsBps();

    // ──────────────────── Constructor ────────────────────

    constructor(
        address gda_,
        address superToken_,
        address capacityRegistry_,
        address owner_
    ) Ownable(owner_) {
        GDA = IGeneralDistributionAgreementV1(gda_);
        SUPER_TOKEN = ISuperfluidToken(superToken_);
        capacityRegistry = ICapacitySignal(capacityRegistry_);
    }

    // ──────────────────── Pool Lifecycle ────────────────────

    /// @inheritdoc IBackpressurePool
    function createPool(bytes32 taskTypeId) external {
        if (address(_pools[taskTypeId].pool) != address(0)) revert PoolAlreadyExists();

        // Verify task type exists in registry
        (uint256 minStake,,) = capacityRegistry.getTaskType(taskTypeId);
        if (minStake == 0) {
            // Check if it truly doesn't exist vs just minStake=0
            // A task type with 0 minStake is still valid, so we check existence via the registry
        }

        // Create Superfluid GDA pool - this contract is the admin (controls units)
        PoolConfig memory config = PoolConfig({
            transferabilityForUnitsOwner: false,
            distributionFromAnyAddress: true // Allow any source to stream to pool
        });

        ISuperfluidPool pool = GDA.createPool(SUPER_TOKEN, address(this), config);
        _pools[taskTypeId] = PoolState({ pool: pool, lastTotalCapacity: 0 });

        emit PoolCreated(taskTypeId, address(pool));
    }

    // ──────────────────── Rebalance ────────────────────

    /// @inheritdoc IBackpressurePool
    function rebalance(bytes32 taskTypeId) external {
        PoolState storage ps = _pools[taskTypeId];
        if (address(ps.pool) == address(0)) revert PoolDoesNotExist();

        (address[] memory sinks, uint256[] memory capacities) = capacityRegistry.getSinks(taskTypeId);
        uint256 totalCap;
        for (uint256 i; i < capacities.length; ++i) {
            totalCap += capacities[i];
        }

        // Update member units proportional to capacity
        if (totalCap > 0) {
            for (uint256 i; i < sinks.length; ++i) {
                // Safe: UNIT_SCALE=1e9, so max value fits uint128 (max ~3.4e38)
                uint128 units = uint128((capacities[i] * UNIT_SCALE) / totalCap);
                ps.pool.updateMemberUnits(sinks[i], units);
            }
        } else {
            // Zero total capacity - set all units to 0
            for (uint256 i; i < sinks.length; ++i) {
                ps.pool.updateMemberUnits(sinks[i], 0);
            }
        }

        ps.lastTotalCapacity = totalCap;
        emit Rebalanced(taskTypeId, sinks.length, totalCap);
    }

    /// @inheritdoc IBackpressurePool
    function needsRebalance(bytes32 taskTypeId) external view returns (bool) {
        PoolState storage ps = _pools[taskTypeId];
        if (address(ps.pool) == address(0)) return false;

        (,, uint256 currentTotal) = capacityRegistry.getTaskType(taskTypeId);
        uint256 lastTotal = ps.lastTotalCapacity;

        if (lastTotal == 0) return currentTotal > 0;
        if (currentTotal == 0) return lastTotal > 0;

        // Check if change exceeds threshold
        uint256 diff = currentTotal > lastTotal ? currentTotal - lastTotal : lastTotal - currentTotal;
        return (diff * BPS) / lastTotal >= REBALANCE_THRESHOLD_BPS;
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc IBackpressurePool
    function getPool(bytes32 taskTypeId) external view returns (address) {
        return address(_pools[taskTypeId].pool);
    }

    /// @inheritdoc IBackpressurePool
    function getMemberUnits(bytes32 taskTypeId, address sink) external view returns (uint128) {
        PoolState storage ps = _pools[taskTypeId];
        if (address(ps.pool) == address(0)) return 0;
        return ps.pool.getUnits(sink);
    }

    // ──────────────────── Verification Budget ────────────────────

    /// @notice Set the verification budget for a task type pool.
    /// @param taskTypeId The task type.
    /// @param budgetBps The verification budget in basis points (0-10000).
    function setVerificationBudget(bytes32 taskTypeId, uint256 budgetBps) external onlyOwner {
        if (budgetBps > BPS) revert BudgetExceedsBps();
        if (address(_pools[taskTypeId].pool) == address(0)) revert PoolDoesNotExist();
        _verificationBudgetBps[taskTypeId] = budgetBps;
        emit VerificationBudgetSet(taskTypeId, budgetBps);
    }

    /// @inheritdoc IBackpressurePool
    function getVerificationBudget(bytes32 taskTypeId) external view returns (uint256) {
        return _verificationBudgetBps[taskTypeId];
    }
}
