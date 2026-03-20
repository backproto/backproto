// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IEconomyFactory } from "./interfaces/IEconomyFactory.sol";
import { CapacityRegistry } from "./CapacityRegistry.sol";
import { StakeManager } from "./StakeManager.sol";
import { BackpressurePool } from "./BackpressurePool.sol";
import { EscrowBuffer } from "./EscrowBuffer.sol";
import { PricingCurve } from "./PricingCurve.sol";
import { Pipeline } from "./Pipeline.sol";

/// @title EconomyFactory
/// @notice Deploys complete BPE economy topologies in a single transaction.
///         Supports pre-built templates: MARKETPLACE, COOPERATIVE, PIPELINE, GUILD.
///         Each deployment creates an isolated economy with its own contracts.
contract EconomyFactory is IEconomyFactory, Ownable {
    // ──────────────────── Storage ────────────────────

    /// @notice The GDA contract address (Superfluid, shared across economies).
    address public immutable GDA;

    /// @notice The Super Token used for streaming payments (shared across economies).
    address public immutable SUPER_TOKEN;

    /// @notice The ERC-20 token used for staking (shared across economies).
    address public immutable STAKE_TOKEN;

    /// @notice Stake unit for capacity cap computation (shared across economies).
    uint256 public immutable STAKE_UNIT;

    /// @dev Economy ID → deployment record.
    mapping(bytes32 => EconomyDeployment) internal _economies;

    /// @dev Owner → array of economy IDs.
    mapping(address => bytes32[]) internal _ownerEconomies;

    /// @dev Total deployed count.
    uint256 internal _count;

    // ──────────────────── Errors ────────────────────

    error EconomyAlreadyExists();
    error EconomyDoesNotExist();
    error NoTaskTypes();
    error PipelineRequiresMultipleStages();

    // ──────────────────── Constructor ────────────────────

    constructor(
        address gda_,
        address superToken_,
        address stakeToken_,
        uint256 stakeUnit_,
        address owner_
    ) Ownable(owner_) {
        GDA = gda_;
        SUPER_TOKEN = superToken_;
        STAKE_TOKEN = stakeToken_;
        STAKE_UNIT = stakeUnit_;
    }

    // ──────────────────── Factory ────────────────────

    /// @inheritdoc IEconomyFactory
    function deployEconomy(EconomyConfig calldata config)
        external
        returns (EconomyDeployment memory deployment)
    {
        if (config.taskTypeIds.length == 0) revert NoTaskTypes();
        if (config.template == Template.PIPELINE && config.taskTypeIds.length < 2) {
            revert PipelineRequiresMultipleStages();
        }

        // Generate unique economy ID from sender + count
        bytes32 economyId = keccak256(abi.encode(msg.sender, _count));
        if (_economies[economyId].owner != address(0)) revert EconomyAlreadyExists();

        // Deploy core contracts — EscrowBuffer initially owned by factory for setup
        StakeManager sm = new StakeManager(STAKE_TOKEN, STAKE_UNIT, config.minStake, msg.sender);
        CapacityRegistry cr = new CapacityRegistry(address(sm));
        BackpressurePool bp = new BackpressurePool(GDA, SUPER_TOKEN, address(cr), msg.sender);
        EscrowBuffer eb = new EscrowBuffer(STAKE_TOKEN, address(cr), address(this));
        PricingCurve pc = new PricingCurve(address(cr));

        // Register task types and create pools
        for (uint256 i; i < config.taskTypeIds.length; ++i) {
            cr.registerTaskType(config.taskTypeIds[i], config.minStake);
            bp.createPool(config.taskTypeIds[i]);
            if (config.bufferMax > 0) {
                eb.setBufferMax(config.taskTypeIds[i], config.bufferMax);
            }
            if (config.verificationBudgetBps > 0) {
                bp.setVerificationBudget(config.taskTypeIds[i], config.verificationBudgetBps);
            }
        }

        // Deploy pipeline if PIPELINE template
        address pipelineAddr;
        if (config.template == Template.PIPELINE) {
            Pipeline pl = new Pipeline(address(bp), address(cr), msg.sender);
            bytes32 pipelineId = keccak256(abi.encode(economyId, "pipeline"));
            pl.createPipeline(pipelineId, config.taskTypeIds);
            pipelineAddr = address(pl);
        }

        // Transfer EscrowBuffer ownership to deployer after setup
        eb.transferOwnership(msg.sender);

        // Record deployment
        deployment = EconomyDeployment({
            economyId: economyId,
            stakeManager: address(sm),
            capacityRegistry: address(cr),
            backpressurePool: address(bp),
            escrowBuffer: address(eb),
            pricingCurve: address(pc),
            pipeline: pipelineAddr,
            owner: msg.sender
        });

        _economies[economyId] = deployment;
        _ownerEconomies[msg.sender].push(economyId);
        _count++;

        emit EconomyDeployed(
            economyId,
            config.template,
            msg.sender,
            address(sm),
            address(cr),
            address(bp)
        );
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc IEconomyFactory
    function getEconomy(bytes32 economyId) external view returns (EconomyDeployment memory) {
        EconomyDeployment storage d = _economies[economyId];
        if (d.owner == address(0)) revert EconomyDoesNotExist();
        return d;
    }

    /// @inheritdoc IEconomyFactory
    function getEconomiesByOwner(address owner_) external view returns (bytes32[] memory) {
        return _ownerEconomies[owner_];
    }

    /// @inheritdoc IEconomyFactory
    function economyCount() external view returns (uint256) {
        return _count;
    }
}
