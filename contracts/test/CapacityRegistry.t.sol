// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract CapacityRegistryTest is Test {
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public token;

    address owner = address(0xA);
    address sink1 = address(0x1);
    address sink2 = address(0x2);
    address sink3 = address(0x3);

    bytes32 constant TASK_ID = keccak256("research");
    uint256 constant MIN_STAKE = 100e18;

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, MIN_STAKE, owner);
        registry = new CapacityRegistry(address(stakeManager));

        // Fund and stake sinks
        _fundAndStake(sink1, 500e18);
        _fundAndStake(sink2, 500e18);
        _fundAndStake(sink3, 500e18);

        // Register a task type
        registry.registerTaskType(TASK_ID, MIN_STAKE);
    }

    function _fundAndStake(address sink, uint256 amount) internal {
        token.mint(sink, amount);
        vm.startPrank(sink);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(amount);
        vm.stopPrank();
    }

    // ──────────────────── Task Type Registration ────────────────────

    function test_registerTaskType() public {
        bytes32 newId = keccak256("coding");
        registry.registerTaskType(newId, 200e18);
        (uint256 minStake, uint256 sinkCount, uint256 totalCap) = registry.getTaskType(newId);
        assertEq(minStake, 200e18);
        assertEq(sinkCount, 0);
        assertEq(totalCap, 0);
    }

    function test_registerTaskType_revert_duplicate() public {
        vm.expectRevert(CapacityRegistry.TaskTypeAlreadyExists.selector);
        registry.registerTaskType(TASK_ID, MIN_STAKE);
    }

    // ──────────────────── Sink Registration ────────────────────

    function test_registerSink() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        (uint256 minStake, uint256 sinkCount, uint256 totalCap) = registry.getTaskType(TASK_ID);
        assertEq(sinkCount, 1);
        assertGt(totalCap, 0);
        assertEq(registry.getSmoothedCapacity(TASK_ID, sink1), 100);
    }

    function test_registerSink_caps_by_stake() public {
        // Capacity cap for 500e18 stake = sqrt(500e18 * 1e18 / 1e18) ≈ 22.36e9
        uint256 cap = stakeManager.getCapacityCap(sink1);

        vm.prank(sink1);
        registry.registerSink(TASK_ID, type(uint256).max); // Try max capacity

        // Should be capped
        assertEq(registry.getSmoothedCapacity(TASK_ID, sink1), cap);
    }

    function test_registerSink_revert_notExists() public {
        vm.expectRevert(CapacityRegistry.TaskTypeDoesNotExist.selector);
        vm.prank(sink1);
        registry.registerSink(keccak256("nonexistent"), 100);
    }

    function test_registerSink_revert_alreadyRegistered() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        vm.expectRevert(CapacityRegistry.SinkAlreadyRegistered.selector);
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);
    }

    function test_registerSink_revert_insufficientStake() public {
        address poorSink = address(0xBEEF);
        token.mint(poorSink, 10e18); // Below min
        vm.startPrank(poorSink);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(10e18);
        vm.stopPrank();

        vm.expectRevert(abi.encodeWithSelector(CapacityRegistry.InsufficientStake.selector, MIN_STAKE, 10e18));
        vm.prank(poorSink);
        registry.registerSink(TASK_ID, 100);
    }

    // ──────────────────── Deregistration ────────────────────

    function test_deregisterSink() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        vm.prank(sink1);
        registry.deregisterSink(TASK_ID);

        (,uint256 sinkCount, uint256 totalCap) = registry.getTaskType(TASK_ID);
        assertEq(sinkCount, 0);
        assertEq(totalCap, 0);
    }

    function test_deregisterSink_swapAndPop() public {
        // Register 3 sinks
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);
        vm.prank(sink2);
        registry.registerSink(TASK_ID, 200);
        vm.prank(sink3);
        registry.registerSink(TASK_ID, 300);

        // Deregister middle (sink1) — should swap with last (sink3)
        vm.prank(sink1);
        registry.deregisterSink(TASK_ID);

        (address[] memory sinks,) = registry.getSinks(TASK_ID);
        assertEq(sinks.length, 2);
        // sink3 should have taken sink1's position
        assertEq(sinks[0], sink3);
        assertEq(sinks[1], sink2);
    }

    // ──────────────────── Commit-Reveal ────────────────────

    function test_commitReveal() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        uint256 newCap = 200;
        bytes32 nonce = keccak256("secret");
        bytes32 commitHash = keccak256(abi.encode(newCap, nonce));

        // Commit
        vm.prank(sink1);
        registry.commitCapacity(TASK_ID, commitHash);
        assertTrue(registry.hasPendingCommit(TASK_ID, sink1));

        // Advance 1 block
        vm.roll(block.number + 1);

        // Reveal
        vm.prank(sink1);
        registry.revealCapacity(TASK_ID, newCap, nonce);
        assertFalse(registry.hasPendingCommit(TASK_ID, sink1));

        // EWMA: 0.3 * 200 + 0.7 * 100 = 60 + 70 = 130
        assertEq(registry.getSmoothedCapacity(TASK_ID, sink1), 130);
    }

    function test_commitReveal_revert_wrongHash() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        vm.prank(sink1);
        registry.commitCapacity(TASK_ID, keccak256(abi.encode(uint256(200), bytes32("secret"))));

        vm.roll(block.number + 1);

        vm.expectRevert(CapacityRegistry.CommitHashMismatch.selector);
        vm.prank(sink1);
        registry.revealCapacity(TASK_ID, 300, bytes32("secret")); // Wrong capacity
    }

    function test_commitReveal_revert_expired() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        vm.prank(sink1);
        registry.commitCapacity(TASK_ID, keccak256(abi.encode(uint256(200), bytes32("secret"))));

        // Advance beyond timeout
        vm.roll(block.number + 21);

        vm.expectRevert(CapacityRegistry.CommitExpired.selector);
        vm.prank(sink1);
        registry.revealCapacity(TASK_ID, 200, bytes32("secret"));
    }

    function test_commitReveal_revert_noCommit() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        vm.expectRevert(CapacityRegistry.NoCommitPending.selector);
        vm.prank(sink1);
        registry.revealCapacity(TASK_ID, 200, bytes32("secret"));
    }

    // ──────────────────── EWMA Smoothing ────────────────────

    function test_ewma_convergence() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);

        // Repeatedly signal capacity = 1000 (capped to stake cap)
        uint256 cap = stakeManager.getCapacityCap(sink1);
        uint256 target = cap; // Use cap as target so capping doesn't interfere

        for (uint256 i; i < 10; ++i) {
            bytes32 nonce = bytes32(i);
            bytes32 commitHash = keccak256(abi.encode(target, nonce));
            vm.prank(sink1);
            registry.commitCapacity(TASK_ID, commitHash);
            vm.roll(block.number + 1);
            vm.prank(sink1);
            registry.revealCapacity(TASK_ID, target, nonce);
        }

        // After 10 rounds of EWMA with α=0.3, should converge toward target
        uint256 smoothed = registry.getSmoothedCapacity(TASK_ID, sink1);
        // Within 5% of target
        assertApproxEqRel(smoothed, target, 0.05e18);
    }

    // ──────────────────── Aggregate Capacity ────────────────────

    function test_totalCapacity_tracks() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);
        vm.prank(sink2);
        registry.registerSink(TASK_ID, 200);

        (,, uint256 total) = registry.getTaskType(TASK_ID);
        assertEq(total, 300);

        vm.prank(sink1);
        registry.deregisterSink(TASK_ID);

        (,, total) = registry.getTaskType(TASK_ID);
        assertEq(total, 200);
    }

    // ──────────────────── getSinks ────────────────────

    function test_getSinks() public {
        vm.prank(sink1);
        registry.registerSink(TASK_ID, 100);
        vm.prank(sink2);
        registry.registerSink(TASK_ID, 200);

        (address[] memory sinks, uint256[] memory caps) = registry.getSinks(TASK_ID);
        assertEq(sinks.length, 2);
        assertEq(sinks[0], sink1);
        assertEq(sinks[1], sink2);
        assertEq(caps[0], 100);
        assertEq(caps[1], 200);
    }
}
