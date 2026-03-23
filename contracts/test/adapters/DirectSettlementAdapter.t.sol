// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { DirectSettlementAdapter } from "../../src/adapters/DirectSettlementAdapter.sol";
import { ISettlementAdapter } from "../../src/interfaces/ISettlementAdapter.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

contract DirectSettlementAdapterTest is Test {
    DirectSettlementAdapter public adapter;
    MockERC20 public token;

    address pipeline = address(0xAA);
    address provider1 = address(0x1);

    function setUp() public {
        token = new MockERC20("Settlement", "SET");
        adapter = new DirectSettlementAdapter(address(token), pipeline);
        token.mint(address(adapter), 1_000_000e18);
        token.mint(pipeline, 1_000_000e18);
    }

    // ──────────────────── Rail ID ────────────────────

    function test_railId() public view {
        assertEq(adapter.railId(), keccak256("DIRECT"));
    }

    // ──────────────────── Stream Management ────────────────────

    function test_initializeStream() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);
        assertEq(adapter.getStreamFlowRate(streamId), 1e15);
    }

    function test_adjustStream_settlsAccrued() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);

        // Advance 100 seconds
        vm.warp(block.timestamp + 100);
        uint256 balBefore = token.balanceOf(provider1);

        vm.prank(pipeline);
        adapter.adjustStream(streamId, 2e15);

        uint256 accrued = token.balanceOf(provider1) - balBefore;
        assertEq(accrued, 1e15 * 100); // flowRate * elapsed
    }

    function test_adjustStream_closeStream() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);

        vm.prank(pipeline);
        adapter.adjustStream(streamId, 0);

        assertEq(adapter.getStreamFlowRate(streamId), 0);
    }

    // ──────────────────── Completion Settlement ────────────────────

    function test_settleCompletion() public {
        bytes32 jobId = keccak256("job-1");
        uint256 balBefore = token.balanceOf(provider1);

        vm.prank(pipeline);
        adapter.settleCompletion(jobId, provider1, 200e18, "");

        assertEq(token.balanceOf(provider1) - balBefore, 200e18);
    }

    function test_settleCompletion_revert_zeroAmount() public {
        vm.expectRevert(DirectSettlementAdapter.ZeroAmount.selector);
        vm.prank(pipeline);
        adapter.settleCompletion(keccak256("job"), provider1, 0, "");
    }

    // ──────────────────── Escrow ────────────────────

    function test_escrow_and_release() public {
        bytes32 jobId = keccak256("job-2");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 75e18);
        adapter.escrow(jobId, 75e18);
        vm.stopPrank();

        assertEq(adapter.getEscrowedAmount(jobId), 75e18);

        uint256 balBefore = token.balanceOf(provider1);
        vm.prank(pipeline);
        adapter.releaseEscrow(jobId, provider1);

        assertEq(token.balanceOf(provider1) - balBefore, 75e18);
        assertEq(adapter.getEscrowedAmount(jobId), 0);
    }

    function test_escrow_revert_zeroAmount() public {
        vm.expectRevert(DirectSettlementAdapter.ZeroAmount.selector);
        vm.prank(pipeline);
        adapter.escrow(keccak256("job"), 0);
    }

    function test_releaseEscrow_revert_notFound() public {
        vm.expectRevert(DirectSettlementAdapter.EscrowNotFound.selector);
        vm.prank(pipeline);
        adapter.releaseEscrow(keccak256("nope"), provider1);
    }

    function test_releaseEscrow_revert_alreadyReleased() public {
        bytes32 jobId = keccak256("job-double");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 50e18);
        adapter.escrow(jobId, 50e18);
        adapter.releaseEscrow(jobId, provider1);
        vm.stopPrank();

        vm.expectRevert(DirectSettlementAdapter.EscrowAlreadyReleased.selector);
        vm.prank(pipeline);
        adapter.releaseEscrow(jobId, provider1);
    }

    // ──────────────────── Pipeline Guard ────────────────────

    function test_revert_notPipeline() public {
        vm.expectRevert(DirectSettlementAdapter.OnlyPipeline.selector);
        adapter.initializeStream(provider1, 1e15);

        vm.expectRevert(DirectSettlementAdapter.OnlyPipeline.selector);
        adapter.settleCompletion(keccak256("x"), provider1, 1e18, "");

        vm.expectRevert(DirectSettlementAdapter.OnlyPipeline.selector);
        adapter.escrow(keccak256("x"), 1e18);
    }
}
