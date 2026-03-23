// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { LightningSettlementAdapter } from "../../src/adapters/LightningSettlementAdapter.sol";
import { ISettlementAdapter } from "../../src/interfaces/ISettlementAdapter.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

contract LightningSettlementAdapterTest is Test {
    LightningSettlementAdapter public adapter;
    MockERC20 public token;

    address pipeline = address(0xAA);
    address provider1 = address(0x1);

    // Known preimage + hash pair for testing
    bytes constant PREIMAGE = hex"deadbeef";
    bytes32 PAYMENT_HASH;

    function setUp() public {
        PAYMENT_HASH = sha256(PREIMAGE);
        token = new MockERC20("Settlement", "SET");
        adapter = new LightningSettlementAdapter(address(token), pipeline);
        token.mint(address(adapter), 1_000_000e18);
        token.mint(pipeline, 1_000_000e18);
    }

    // ──────────────────── Rail ID ────────────────────

    function test_railId() public view {
        assertEq(adapter.railId(), keccak256("LIGHTNING"));
    }

    // ──────────────────── Stream Management ────────────────────

    function test_initializeStream() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);
        assertEq(adapter.getStreamFlowRate(streamId), 1e15);
    }

    function test_adjustStream() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);

        vm.prank(pipeline);
        adapter.adjustStream(streamId, 3e15);
        assertEq(adapter.getStreamFlowRate(streamId), 3e15);
    }

    // ──────────────────── Escrow + HTLC ────────────────────

    function test_escrow() public {
        bytes32 jobId = keccak256("job-1");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 100e18);
        adapter.escrow(jobId, 100e18);
        vm.stopPrank();

        assertEq(adapter.getEscrowedAmount(jobId), 100e18);
    }

    function test_settleCompletion_validPreimage() public {
        // The jobId is used as the payment hash in this adapter
        // We need to escrow first, and the jobId itself becomes the payment hash
        bytes32 jobId = PAYMENT_HASH; // Use the payment hash as the jobId

        vm.startPrank(pipeline);
        token.approve(address(adapter), 100e18);
        adapter.escrow(jobId, 100e18);
        vm.stopPrank();

        uint256 balBefore = token.balanceOf(provider1);

        vm.prank(pipeline);
        adapter.settleCompletion(jobId, provider1, 100e18, PREIMAGE);

        assertEq(token.balanceOf(provider1) - balBefore, 100e18);
        assertEq(adapter.getEscrowedAmount(jobId), 0);
    }

    function test_settleCompletion_revert_invalidPreimage() public {
        bytes32 jobId = PAYMENT_HASH;

        vm.startPrank(pipeline);
        token.approve(address(adapter), 100e18);
        adapter.escrow(jobId, 100e18);
        vm.stopPrank();

        vm.expectRevert(LightningSettlementAdapter.InvalidPreimage.selector);
        vm.prank(pipeline);
        adapter.settleCompletion(jobId, provider1, 100e18, hex"baddecaf");
    }

    function test_settleCompletion_revert_expired() public {
        bytes32 jobId = PAYMENT_HASH;

        vm.startPrank(pipeline);
        token.approve(address(adapter), 100e18);
        adapter.escrow(jobId, 100e18);
        vm.stopPrank();

        // Advance past HTLC timeout
        vm.warp(block.timestamp + 86_401);

        vm.expectRevert(LightningSettlementAdapter.HTLCExpired.selector);
        vm.prank(pipeline);
        adapter.settleCompletion(jobId, provider1, 100e18, PREIMAGE);
    }

    function test_releaseEscrow() public {
        bytes32 jobId = keccak256("job-release");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 50e18);
        adapter.escrow(jobId, 50e18);
        vm.stopPrank();

        uint256 balBefore = token.balanceOf(provider1);

        vm.prank(pipeline);
        adapter.releaseEscrow(jobId, provider1);

        assertEq(token.balanceOf(provider1) - balBefore, 50e18);
    }

    // ──────────────────── Refund ────────────────────

    function test_refundExpired() public {
        bytes32 jobId = keccak256("job-refund");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 100e18);
        adapter.escrow(jobId, 100e18);
        vm.stopPrank();

        uint256 balBefore = token.balanceOf(pipeline);

        // Advance past timeout
        vm.warp(block.timestamp + 86_401);
        adapter.refundExpired(jobId);

        assertEq(token.balanceOf(pipeline) - balBefore, 100e18);
    }

    function test_refundExpired_revert_notExpired() public {
        bytes32 jobId = keccak256("job-early");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 100e18);
        adapter.escrow(jobId, 100e18);
        vm.stopPrank();

        vm.expectRevert(LightningSettlementAdapter.HTLCNotExpired.selector);
        adapter.refundExpired(jobId);
    }

    // ──────────────────── HTLC Reads ────────────────────

    function test_getHTLC() public {
        bytes32 jobId = keccak256("job-htlc");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 100e18);
        adapter.escrow(jobId, 100e18);
        vm.stopPrank();

        (
            address depositor,
            uint256 amount,
            bytes32 paymentHash,
            uint256 deadline,
            bool claimed,
            bool refunded
        ) = adapter.getHTLC(jobId);

        assertEq(depositor, pipeline);
        assertEq(amount, 100e18);
        assertEq(paymentHash, jobId);
        assertGt(deadline, block.timestamp);
        assertFalse(claimed);
        assertFalse(refunded);
    }
}
