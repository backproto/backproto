// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IStakeManager } from "./interfaces/IStakeManager.sol";

/// @title StakeManager
/// @notice Manages staking, capacity cap computation (sqrt), and slashing for BPE sinks.
///         Sybil resistance: minimum per-sink stake + concave capacity cap.
contract StakeManager is IStakeManager, Ownable {
    using SafeERC20 for IERC20;

    // ──────────────────── Storage ────────────────────

    IERC20 public immutable STAKE_TOKEN;
    uint256 public immutable STAKE_UNIT; // Denominator for sqrt cap: cap = sqrt(stake / STAKE_UNIT)
    uint256 public immutable MIN_SINK_STAKE; // Minimum stake per sink (Sybil resistance)

    mapping(address sink => uint256 amount) private _stakes;
    mapping(address slasher => bool authorized) public authorizedSlashers;

    // ──────────────────── Errors ────────────────────

    error InsufficientStake(uint256 required, uint256 available);
    error NotAuthorizedSlasher();
    error ZeroAmount();

    // ──────────────────── Constructor ────────────────────

    constructor(address stakeToken_, uint256 stakeUnit_, uint256 minSinkStake_, address owner_) Ownable(owner_) {
        STAKE_TOKEN = IERC20(stakeToken_);
        STAKE_UNIT = stakeUnit_;
        MIN_SINK_STAKE = minSinkStake_;
    }

    // ──────────────────── Admin ────────────────────

    /// @notice Authorize or deauthorize a slasher address.
    function setSlasher(address slasher, bool authorized) external onlyOwner {
        authorizedSlashers[slasher] = authorized;
    }

    // ──────────────────── Staking ────────────────────

    /// @inheritdoc IStakeManager
    function stake(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        _stakes[msg.sender] += amount;
        STAKE_TOKEN.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, _stakes[msg.sender]);
    }

    /// @inheritdoc IStakeManager
    function unstake(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        uint256 current = _stakes[msg.sender];
        if (amount > current) revert InsufficientStake(amount, current);
        unchecked {
            _stakes[msg.sender] = current - amount;
        }
        STAKE_TOKEN.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, _stakes[msg.sender]);
    }

    // ──────────────────── Slashing ────────────────────

    /// @inheritdoc IStakeManager
    function slash(address sink, uint256 amount, bytes32 reason) external {
        if (!authorizedSlashers[msg.sender]) revert NotAuthorizedSlasher();
        uint256 current = _stakes[sink];
        uint256 slashAmount = amount > current ? current : amount;
        unchecked {
            _stakes[sink] = current - slashAmount;
        }
        // Slashed funds go to protocol treasury (owner)
        STAKE_TOKEN.safeTransfer(owner(), slashAmount);
        emit Slashed(sink, slashAmount, reason);
    }

    // ──────────────────── Reads ────────────────────

    /// @inheritdoc IStakeManager
    function getStake(address sink) external view returns (uint256) {
        return _stakes[sink];
    }

    /// @inheritdoc IStakeManager
    function getCapacityCap(address sink) external view returns (uint256) {
        return _computeCap(_stakes[sink]);
    }

    /// @inheritdoc IStakeManager
    function minSinkStake() external view returns (uint256) {
        return MIN_SINK_STAKE;
    }

    /// @inheritdoc IStakeManager
    function stakeToken() external view returns (address) {
        return address(STAKE_TOKEN);
    }

    // ──────────────────── Internal ────────────────────

    /// @dev Compute capacity cap: sqrt(stake / STAKE_UNIT).
    ///      Returns 0 if stake < MIN_SINK_STAKE.
    function _computeCap(uint256 stakeAmount) internal view returns (uint256) {
        if (stakeAmount < MIN_SINK_STAKE) return 0;
        return Math.sqrt((stakeAmount * 1e18) / STAKE_UNIT);
    }
}
