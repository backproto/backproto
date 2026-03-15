// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { IStakeManager } from "../src/interfaces/IStakeManager.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract StakeManagerTest is Test {
    StakeManager public stakeManager;
    MockERC20 public token;

    address owner = address(0xA);
    address sink1 = address(0x1);
    address sink2 = address(0x2);
    address slasher = address(0x55);

    uint256 constant STAKE_UNIT = 1e18;
    uint256 constant MIN_SINK_STAKE = 100e18;

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), STAKE_UNIT, MIN_SINK_STAKE, owner);

        // Fund sinks
        token.mint(sink1, 10_000e18);
        token.mint(sink2, 10_000e18);

        // Approve
        vm.prank(sink1);
        token.approve(address(stakeManager), type(uint256).max);
        vm.prank(sink2);
        token.approve(address(stakeManager), type(uint256).max);

        // Authorize slasher
        vm.prank(owner);
        stakeManager.setSlasher(slasher, true);
    }

    // ──────────────────── Staking ────────────────────

    function test_stake() public {
        vm.prank(sink1);
        stakeManager.stake(500e18);
        assertEq(stakeManager.getStake(sink1), 500e18);
        assertEq(token.balanceOf(address(stakeManager)), 500e18);
    }

    function test_stake_multiple() public {
        vm.prank(sink1);
        stakeManager.stake(200e18);
        vm.prank(sink1);
        stakeManager.stake(300e18);
        assertEq(stakeManager.getStake(sink1), 500e18);
    }

    function test_stake_revert_zero() public {
        vm.expectRevert(StakeManager.ZeroAmount.selector);
        vm.prank(sink1);
        stakeManager.stake(0);
    }

    function test_stake_emits() public {
        vm.expectEmit(true, false, false, true);
        emit IStakeManager.Staked(sink1, 500e18, 500e18);
        vm.prank(sink1);
        stakeManager.stake(500e18);
    }

    // ──────────────────── Unstaking ────────────────────

    function test_unstake() public {
        vm.prank(sink1);
        stakeManager.stake(500e18);

        vm.prank(sink1);
        stakeManager.unstake(200e18);
        assertEq(stakeManager.getStake(sink1), 300e18);
        assertEq(token.balanceOf(sink1), 9_700e18);
    }

    function test_unstake_revert_insufficient() public {
        vm.prank(sink1);
        stakeManager.stake(100e18);

        vm.expectRevert(abi.encodeWithSelector(StakeManager.InsufficientStake.selector, 200e18, 100e18));
        vm.prank(sink1);
        stakeManager.unstake(200e18);
    }

    // ──────────────────── Capacity Cap ────────────────────

    function test_capacityCap_zero_below_min() public {
        // Below minimum stake → cap is 0
        vm.prank(sink1);
        stakeManager.stake(50e18);
        assertEq(stakeManager.getCapacityCap(sink1), 0);
    }

    function test_capacityCap_at_min() public {
        vm.prank(sink1);
        stakeManager.stake(MIN_SINK_STAKE);
        uint256 cap = stakeManager.getCapacityCap(sink1);
        // sqrt(100e18 * 1e18 / 1e18) = sqrt(100e18) = 10e9
        assertEq(cap, 10e9);
    }

    function test_capacityCap_concave() public {
        // Verify concavity: cap(4x) <= 2 * cap(x) (sqrt is concave: equality at exact multiples)
        vm.prank(sink1);
        stakeManager.stake(400e18);
        uint256 cap400 = stakeManager.getCapacityCap(sink1);

        vm.prank(sink2);
        stakeManager.stake(1600e18);
        uint256 cap1600 = stakeManager.getCapacityCap(sink2);

        // sqrt grows slower than linear: cap(4x) = 2*cap(x) exactly, cap(5x) < sqrt(5)*cap(x) < 3*cap(x)
        assertLe(cap1600, 2 * cap400);

        // Also verify non-perfect-square ratio: cap(3x) < sqrt(3)*cap(x) < 2*cap(x)
        // Stake sink1 up to 1200 total
        vm.prank(sink1);
        stakeManager.unstake(400e18); // Reset
        token.mint(sink1, 1200e18);
        vm.prank(sink1);
        token.approve(address(stakeManager), type(uint256).max);
        vm.prank(sink1);
        stakeManager.stake(1200e18);
        uint256 cap1200 = stakeManager.getCapacityCap(sink1);

        // 3x stake should give < 2x cap
        assertLt(cap1200, 2 * cap400);
    }

    // ──────────────────── Slashing ────────────────────

    function test_slash() public {
        vm.prank(sink1);
        stakeManager.stake(500e18);

        vm.prank(slasher);
        stakeManager.slash(sink1, 100e18, keccak256("overreport"));
        assertEq(stakeManager.getStake(sink1), 400e18);
        // Slashed funds go to owner
        assertEq(token.balanceOf(owner), 100e18);
    }

    function test_slash_caps_at_balance() public {
        vm.prank(sink1);
        stakeManager.stake(50e18);

        vm.prank(slasher);
        stakeManager.slash(sink1, 100e18, keccak256("overreport"));
        assertEq(stakeManager.getStake(sink1), 0);
        assertEq(token.balanceOf(owner), 50e18);
    }

    function test_slash_revert_unauthorized() public {
        vm.expectRevert(StakeManager.NotAuthorizedSlasher.selector);
        vm.prank(sink2); // Not authorized
        stakeManager.slash(sink1, 100e18, keccak256("overreport"));
    }

    function test_slash_emits() public {
        vm.prank(sink1);
        stakeManager.stake(500e18);

        vm.expectEmit(true, false, false, true);
        emit IStakeManager.Slashed(sink1, 100e18, keccak256("overreport"));
        vm.prank(slasher);
        stakeManager.slash(sink1, 100e18, keccak256("overreport"));
    }

    // ──────────────────── Admin ────────────────────

    function test_setSlasher_onlyOwner() public {
        vm.expectRevert();
        vm.prank(sink1);
        stakeManager.setSlasher(sink1, true);
    }

    // ──────────────────── View Functions ────────────────────

    function test_stakeToken() public view {
        assertEq(stakeManager.stakeToken(), address(token));
    }

    function test_minSinkStake() public view {
        assertEq(stakeManager.minSinkStake(), MIN_SINK_STAKE);
    }
}
