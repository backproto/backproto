// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { CompletionTracker } from "../src/CompletionTracker.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract CompletionTrackerTest is Test {
    CompletionTracker public tracker;
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public token;

    address owner = address(0xA);

    // Use vm.addr(pk) so we can sign with known private keys
    uint256 constant SINK_PK = 0x1;
    uint256 constant SOURCE_PK = 0x2;
    address sink1;
    address source1;

    bytes32 constant TASK_ID = keccak256("inference");
    uint256 constant MIN_STAKE = 100e18;
    uint256 constant STAKE_AMOUNT = 500e18;

    function setUp() public {
        sink1 = vm.addr(SINK_PK);
        source1 = vm.addr(SOURCE_PK);

        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, MIN_STAKE, owner);
        registry = new CapacityRegistry(address(stakeManager));
        tracker = new CompletionTracker(address(registry), address(stakeManager));

        // Authorize tracker as slasher
        vm.prank(owner);
        stakeManager.setSlasher(address(tracker), true);

        // Register task type
        registry.registerTaskType(TASK_ID, MIN_STAKE);

        // Fund and register sink
        token.mint(sink1, STAKE_AMOUNT);
        vm.startPrank(sink1);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(STAKE_AMOUNT);
        registry.registerSink(TASK_ID, 100);
        vm.stopPrank();
    }

    function _signCompletion(
        bytes32 taskTypeId,
        address sink,
        address source,
        bytes32 taskId,
        uint256 timestamp,
        uint256 signerPk
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(tracker.COMPLETION_TYPEHASH(), taskTypeId, sink, source, taskId, timestamp)
        );

        // Compute the EIP-712 digest using eip712Domain()
        bytes32 domainSeparator = _getDomainSeparator(address(tracker));
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    // ──────────────────── Record Completion ────────────────────

    function test_recordCompletion() public {
        bytes32 taskId = keccak256("task-1");

        bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
        bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);

        vm.prank(source1);
        tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);

        assertEq(tracker.getCompletions(TASK_ID, sink1), 1);
        assertTrue(tracker.taskRecorded(taskId));
    }

    // ──────────────────── Replay Prevention ────────────────────

    function test_recordCompletion_revert_replay() public {
        bytes32 taskId = keccak256("task-1");

        bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
        bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);

        vm.prank(source1);
        tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);

        vm.expectRevert(CompletionTracker.TaskAlreadyRecorded.selector);
        vm.prank(source1);
        tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);
    }

    // ──────────────────── Invalid Sink Signature ────────────────────

    function test_recordCompletion_revert_invalidSinkSig() public {
        bytes32 taskId = keccak256("task-2");

        // Sign with wrong key for sink
        bytes memory badSinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);
        bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);

        vm.expectRevert(CompletionTracker.InvalidSinkSignature.selector);
        vm.prank(source1);
        tracker.recordCompletion(TASK_ID, sink1, taskId, badSinkSig, sourceSig);
    }

    // ──────────────────── Invalid Source Signature ────────────────────

    function test_recordCompletion_revert_invalidSourceSig() public {
        bytes32 taskId = keccak256("task-3");

        bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
        // Sign with wrong key for source
        bytes memory badSourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);

        vm.expectRevert(CompletionTracker.InvalidSourceSignature.selector);
        vm.prank(source1);
        tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, badSourceSig);
    }

    // ──────────────────── Epoch Advancement ────────────────────

    function test_advanceEpoch() public {
        // Record some completions
        for (uint256 i; i < 60; i++) {
            bytes32 taskId = keccak256(abi.encode("task", i));
            bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
            bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);
            vm.prank(source1);
            tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);
        }

        assertEq(tracker.getCompletions(TASK_ID, sink1), 60);

        // Advance past epoch
        vm.warp(block.timestamp + tracker.EPOCH_DURATION() + 1);
        tracker.advanceEpoch(TASK_ID, sink1);

        // Completions reset
        assertEq(tracker.getCompletions(TASK_ID, sink1), 0);

        // Completion rate should be: 60 / 100 (declared capacity) = 6000 BPS
        assertEq(tracker.getCompletionRate(TASK_ID, sink1), 6000);
    }

    // ──────────────────── Epoch: Revert if Not Elapsed ────────────────────

    function test_advanceEpoch_revert_notElapsed() public {
        // Record a completion to initialize epoch
        bytes32 taskId = keccak256("task-init");
        bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
        bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);
        vm.prank(source1);
        tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);

        vm.expectRevert(CompletionTracker.EpochNotElapsed.selector);
        tracker.advanceEpoch(TASK_ID, sink1);
    }

    // ──────────────────── Auto-Slash After Consecutive Underperformance ────────────────────

    function test_autoSlash_afterConsecutiveEpochs() public {
        uint256 stakeBefore = stakeManager.getStake(sink1);

        // Run 3 epochs with zero completions (0% rate < 50% threshold)
        for (uint256 epoch; epoch < 3; epoch++) {
            // Record 1 completion to initialize epoch state, but that's still way below 100 capacity
            bytes32 taskId = keccak256(abi.encode("auto-slash-task", epoch));
            bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
            bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);
            vm.prank(source1);
            tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);

            vm.warp(block.timestamp + tracker.EPOCH_DURATION() + 1);
            tracker.advanceEpoch(TASK_ID, sink1);
        }

        uint256 stakeAfter = stakeManager.getStake(sink1);
        assertLt(stakeAfter, stakeBefore, "Stake should be slashed after consecutive underperformance");

        // Slash amount should be 10% of stake
        uint256 expectedSlash = (stakeBefore * tracker.SLASH_AMOUNT_BPS()) / tracker.BPS();
        assertEq(stakeBefore - stakeAfter, expectedSlash);
    }

    // ──────────────────── No Slash When Performing Well ────────────────────

    function test_noSlash_goodPerformance() public {
        uint256 stakeBefore = stakeManager.getStake(sink1);

        // Record 60 completions out of 100 capacity = 60% > 50% threshold
        for (uint256 i; i < 60; i++) {
            bytes32 taskId = keccak256(abi.encode("good-task", i));
            bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
            bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);
            vm.prank(source1);
            tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);
        }

        vm.warp(block.timestamp + tracker.EPOCH_DURATION() + 1);
        tracker.advanceEpoch(TASK_ID, sink1);

        assertEq(stakeManager.getStake(sink1), stakeBefore, "No slash when performing above threshold");
        assertEq(tracker.getConsecutiveBelowThreshold(TASK_ID, sink1), 0);
    }

    // ──────────────────── Consecutive Counter Resets on Good Epoch ────────────────────

    function test_consecutiveCounterResets() public {
        // 2 bad epochs (below threshold but not enough for slash)
        for (uint256 epoch; epoch < 2; epoch++) {
            bytes32 taskId = keccak256(abi.encode("bad-epoch", epoch));
            bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
            bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);
            vm.prank(source1);
            tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);

            vm.warp(block.timestamp + tracker.EPOCH_DURATION() + 1);
            tracker.advanceEpoch(TASK_ID, sink1);
        }

        assertEq(tracker.getConsecutiveBelowThreshold(TASK_ID, sink1), 2);

        // 1 good epoch — 60 completions out of 100 capacity
        for (uint256 i; i < 60; i++) {
            bytes32 taskId = keccak256(abi.encode("recovery-task", i));
            bytes memory sinkSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SINK_PK);
            bytes memory sourceSig = _signCompletion(TASK_ID, sink1, source1, taskId, block.timestamp, SOURCE_PK);
            vm.prank(source1);
            tracker.recordCompletion(TASK_ID, sink1, taskId, sinkSig, sourceSig);
        }

        vm.warp(block.timestamp + tracker.EPOCH_DURATION() + 1);
        tracker.advanceEpoch(TASK_ID, sink1);

        assertEq(tracker.getConsecutiveBelowThreshold(TASK_ID, sink1), 0, "Counter should reset on good epoch");
    }

    // ──────────────────── Helpers ────────────────────

    function _getDomainSeparator(address target) internal view returns (bytes32) {
        (, string memory name, string memory version, uint256 chainId, address verifyingContract,,) =
            CompletionTracker(target).eip712Domain();
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract
            )
        );
    }
}
