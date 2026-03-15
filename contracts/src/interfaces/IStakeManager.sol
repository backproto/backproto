// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title IStakeManager
/// @notice Interface for staking, capacity cap computation, and slashing.
///         Sybil resistance: minimum per-sink stake + concave (sqrt) capacity cap.
interface IStakeManager {
    // ──────────────────── Events ────────────────────

    event Staked(address indexed sink, uint256 amount, uint256 totalStake);
    event Unstaked(address indexed sink, uint256 amount, uint256 totalStake);
    event Slashed(address indexed sink, uint256 amount, bytes32 indexed reason);

    // ──────────────────── Staking ────────────────────

    /// @notice Stake tokens. Increases capacity cap.
    /// @param amount Amount of stake tokens to deposit.
    function stake(uint256 amount) external;

    /// @notice Unstake tokens. Reduces capacity cap. Reverts if sink has active registrations
    ///         that would exceed the new cap.
    /// @param amount Amount of stake tokens to withdraw.
    function unstake(uint256 amount) external;

    // ──────────────────── Slashing ────────────────────

    /// @notice Slash a sink's stake. Only callable by authorized slasher (verification service).
    /// @param sink The sink to slash.
    /// @param amount Amount to slash.
    /// @param reason Identifier for the slash reason.
    function slash(address sink, uint256 amount, bytes32 reason) external;

    // ──────────────────── Reads ────────────────────

    /// @notice Get the current stake for a sink.
    /// @param sink The sink address.
    /// @return stakeAmount Current staked amount.
    function getStake(address sink) external view returns (uint256 stakeAmount);

    /// @notice Compute the maximum capacity a sink can declare given their stake.
    ///         Formula: sqrt(stake / STAKE_UNIT) (concave to resist Sybil fragmentation).
    /// @param sink The sink address.
    /// @return cap Maximum declarable capacity.
    function getCapacityCap(address sink) external view returns (uint256 cap);

    /// @notice The minimum stake required per sink registration (Sybil resistance).
    /// @return minStake The minimum per-sink stake.
    function minSinkStake() external view returns (uint256 minStake);

    /// @notice The stake token address.
    /// @return token The ERC20 token used for staking.
    function stakeToken() external view returns (address token);
}
