// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { DVMCapacityAdapter } from "../../src/adapters/DVMCapacityAdapter.sol";
import { StakeManager } from "../../src/StakeManager.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

contract DVMCapacityAdapterTest is Test {
    DVMCapacityAdapter public adapter;
    StakeManager public stakeManager;
    MockERC20 public token;

    address operator1 = address(0x1);
    address operator2 = address(0x2);

    bytes32 constant DVM_1 = keccak256("dvm-translation");
    bytes32 constant DVM_2 = keccak256("dvm-image-gen");
    uint256 constant MIN_STAKE = 100e18;

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, MIN_STAKE, address(this));
        adapter = new DVMCapacityAdapter(address(stakeManager));

        _fundAndStake(operator1, 500e18);
        _fundAndStake(operator2, 500e18);
    }

    function _fundAndStake(address op, uint256 amount) internal {
        token.mint(op, amount);
        vm.startPrank(op);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(amount);
        vm.stopPrank();
    }

    // ──────────────────── ICapacityAdapter ────────────────────

    function test_domainId() public view {
        assertEq(adapter.domainId(), keccak256("NOSTR_DVM"));
    }

    function test_domainDescription() public view {
        string memory desc = adapter.domainDescription();
        assertTrue(bytes(desc).length > 0);
    }

    function test_normalizeCapacity() public view {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity({
            throughput: 100,
            latencyMs: 2000,
            errorRateBps: 200
        });
        uint256 normalized = adapter.normalizeCapacity(abi.encode(cap));
        assertGt(normalized, 0);
    }

    // ──────────────────── DVM Registration ────────────────────

    function test_registerDVM() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);

        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap); // kind 5002 = translation

        DVMCapacityAdapter.DVMInfo memory info = adapter.getDVM(DVM_1);
        assertEq(info.operator, operator1);
        assertEq(info.kind, 5002);
        assertTrue(info.active);
        assertGt(info.smoothedCapacity, 0);
    }

    function test_registerDVM_revert_invalidKind() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);

        vm.expectRevert(DVMCapacityAdapter.InvalidKind.selector);
        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 4999, cap);

        vm.expectRevert(DVMCapacityAdapter.InvalidKind.selector);
        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 6000, cap);
    }

    function test_registerDVM_revert_duplicate() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);

        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap);

        vm.expectRevert(DVMCapacityAdapter.DVMAlreadyRegistered.selector);
        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap);
    }

    function test_registerDVM_revert_insufficientStake() public {
        address poorOp = address(0xBEEF);
        token.mint(poorOp, 10e18);
        vm.startPrank(poorOp);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(10e18);
        vm.stopPrank();

        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);

        vm.expectRevert(DVMCapacityAdapter.InsufficientStake.selector);
        vm.prank(poorOp);
        adapter.registerDVM(keccak256("poor-dvm"), 5002, cap);
    }

    // ──────────────────── DVM Deregistration ────────────────────

    function test_deregisterDVM() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);
        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap);

        vm.prank(operator1);
        adapter.deregisterDVM(DVM_1);

        DVMCapacityAdapter.DVMInfo memory info = adapter.getDVM(DVM_1);
        assertFalse(info.active);

        bytes32[] memory dvms = adapter.getDVMsForKind(5002);
        assertEq(dvms.length, 0);
    }

    function test_deregisterDVM_swapAndPop() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);

        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap);
        vm.prank(operator2);
        adapter.registerDVM(DVM_2, 5002, cap);

        vm.prank(operator1);
        adapter.deregisterDVM(DVM_1);

        bytes32[] memory dvms = adapter.getDVMsForKind(5002);
        assertEq(dvms.length, 1);
        assertEq(dvms[0], DVM_2);
    }

    function test_deregisterDVM_revert_notOperator() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);
        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap);

        vm.expectRevert(DVMCapacityAdapter.NotDVMOperator.selector);
        vm.prank(operator2);
        adapter.deregisterDVM(DVM_1);
    }

    // ──────────────────── Capacity Update ────────────────────

    function test_updateCapacity_ewma() public {
        DVMCapacityAdapter.DVMCapacity memory initial = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);
        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, initial);

        uint256 firstCap = adapter.getSmoothedCapacity(DVM_1);

        DVMCapacityAdapter.DVMCapacity memory higher = DVMCapacityAdapter.DVMCapacity(200, 1000, 50);
        vm.prank(operator1);
        adapter.updateCapacity(DVM_1, higher);

        uint256 smoothed = adapter.getSmoothedCapacity(DVM_1);
        assertGt(smoothed, firstCap);
    }

    function test_updateCapacity_revert_notOperator() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);
        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap);

        vm.expectRevert(DVMCapacityAdapter.NotDVMOperator.selector);
        vm.prank(operator2);
        adapter.updateCapacity(DVM_1, cap);
    }

    // ──────────────────── Normalization ────────────────────

    function test_normalize_zeroThroughput() public view {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(0, 3000, 100);
        uint256 normalized = adapter.normalizeCapacity(abi.encode(cap));
        assertEq(normalized, 0);
    }

    function test_normalize_maxLatency() public view {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(100, 60_000, 0);
        uint256 normalized = adapter.normalizeCapacity(abi.encode(cap));
        // Latency component = 0, error component still contributes
        assertGt(normalized, 0);
    }

    function test_normalize_perfectDVM() public view {
        DVMCapacityAdapter.DVMCapacity memory perfect = DVMCapacityAdapter.DVMCapacity(100, 0, 0);
        uint256 perfectNorm = adapter.normalizeCapacity(abi.encode(perfect));

        DVMCapacityAdapter.DVMCapacity memory avg = DVMCapacityAdapter.DVMCapacity(100, 10_000, 500);
        uint256 avgNorm = adapter.normalizeCapacity(abi.encode(avg));

        assertGt(perfectNorm, avgNorm);
    }

    // ──────────────────── Reads ────────────────────

    function test_getDVMsForKind() public {
        DVMCapacityAdapter.DVMCapacity memory cap = DVMCapacityAdapter.DVMCapacity(50, 3000, 100);

        vm.prank(operator1);
        adapter.registerDVM(DVM_1, 5002, cap);
        vm.prank(operator2);
        adapter.registerDVM(DVM_2, 5002, cap);

        bytes32[] memory dvms = adapter.getDVMsForKind(5002);
        assertEq(dvms.length, 2);
    }
}
