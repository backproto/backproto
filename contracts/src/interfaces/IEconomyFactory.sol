// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IEconomyFactory
/// @notice Interface for deploying complete BPE economy topologies in a single transaction.
///         Supports pre-built templates (MARKETPLACE, COOPERATIVE, PIPELINE, GUILD) and custom configs.
interface IEconomyFactory {
    // ──────────────────── Enums ────────────────────

    enum Template {
        MARKETPLACE, // Many-to-many competitive routing
        COOPERATIVE, // Peer pool with equal weighting floor
        PIPELINE, // Sequential multi-stage production
        GUILD // Skill-based specialist pools
    }

    // ──────────────────── Structs ────────────────────

    struct EconomyConfig {
        Template template;
        bytes32[] taskTypeIds; // Task types to create (1 for simple, N for pipeline/guild)
        uint256 minStake; // Minimum stake for all task types
        uint256 bufferMax; // Max buffer per task type (0 = unlimited)
        uint256 verificationBudgetBps; // Verification budget in bps (0 = no budget set)
    }

    struct EconomyDeployment {
        bytes32 economyId;
        address stakeManager;
        address capacityRegistry;
        address backpressurePool;
        address escrowBuffer;
        address pricingCurve;
        address pipeline; // Zero if not PIPELINE template
        address owner;
    }

    // ──────────────────── Events ────────────────────

    event EconomyDeployed(
        bytes32 indexed economyId,
        Template template,
        address indexed owner,
        address stakeManager,
        address capacityRegistry,
        address backpressurePool
    );

    // ──────────────────── Factory ────────────────────

    /// @notice Deploy a complete BPE economy from a template.
    /// @param config The economy configuration.
    /// @return deployment The deployed contract addresses.
    function deployEconomy(EconomyConfig calldata config) external returns (EconomyDeployment memory deployment);

    // ──────────────────── Reads ────────────────────

    /// @notice Get deployment details for an economy.
    /// @param economyId The economy identifier.
    /// @return deployment The deployed contract addresses.
    function getEconomy(bytes32 economyId) external view returns (EconomyDeployment memory deployment);

    /// @notice Get all economies deployed by an owner.
    /// @param owner The owner address.
    /// @return economyIds Array of economy identifiers.
    function getEconomiesByOwner(address owner) external view returns (bytes32[] memory economyIds);

    /// @notice Get the total number of deployed economies.
    /// @return count The number of economies.
    function economyCount() external view returns (uint256 count);
}
