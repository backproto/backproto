// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { SuperfluidSettlementAdapter } from "../../src/adapters/SuperfluidSettlementAdapter.sol";
import { ISettlementAdapter } from "../../src/interfaces/ISettlementAdapter.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

contract SuperfluidSettlementAdapterTest is Test {
    SuperfluidSettlementAdapter public adapter;
    MockERC20 public token;

    address pipeline = address(0xAA);
    address provider1 = address(0x1);
    address provider2 = address(0x2);

    function setUp() public {
        token = new MockERC20("Settlement", "SET");
        adapter = new SuperfluidSettlementAdapter(address(token), pipeline);
        token.mint(address(adapter), 1_000_000e18);
        token.mint(pipeline, 1_000_000e18);
    }

    // ──────────────────── Rail ID ────────────────────

    function test_railId() public view {
        assertEq(adapter.railId(), keccak256("SUPERFLUID"));
    }

    // ──────────────────── Stream Management ────────────────────

    function test_initializeStream() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);
        assertGt(uint256(streamId), 0);
        assertEq(adapter.getStreamFlowRate(streamId), 1e15);
    }

    function test_initializeStream_revert_notPipeline() public {
        vm.expectRevert(SuperfluidSettlementAdapter.OnlyPipeline.selector);
        adapter.initializeStream(provider1, 1e15);
    }

    function test_initializeStream_revert_zeroFlowRate() public {
        vm.expectRevert(SuperfluidSettlementAdapter.ZeroFlowRate.selector);
        vm.prank(pipeline);
        adapter.initializeStream(provider1, 0);
    }

    function test_adjustStream() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);

        vm.prank(pipeline);
        adapter.adjustStream(streamId, 2e15);

        assertEq(adapter.getStreamFlowRate(streamId), 2e15);
    }

    function test_adjustStream_closeStream() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);

        vm.prank(pipeline);
        adapter.adjustStream(streamId, 0);

        assertEq(adapter.getStreamFlowRate(streamId), 0);
    }

    function test_adjustStream_revert_notActive() public {
        vm.prank(pipeline);
        bytes32 streamId = adapter.initializeStream(provider1, 1e15);

        // Close stream
        vm.prank(pipeline);
        adapter.adjustStream(streamId, 0);

        // Try to adjust closed stream
        vm.expectRevert(SuperfluidSettlementAdapter.StreamNotActive.selector);
        vm.prank(pipeline);
        adapter.adjustStream(streamId, 1e15);
    }

    // ──────────────────── Completion Settlement ────────────────────

    function test_settleCompletion() public {
        bytes32 jobId = keccak256("job-1");
        uint256 balBefore = token.balanceOf(provider1);

        vm.prank(pipeline);
        adapter.settleCompletion(jobId, provider1, 100e18, "");

        assertEq(token.balanceOf(provider1) - balBefore, 100e18);
    }

    function test_settleCompletion_revert_zeroAmount() public {
        vm.expectRevert(SuperfluidSettlementAdapter.ZeroAmount.selector);
        vm.prank(pipeline);
        adapter.settleCompletion(keccak256("job-1"), provider1, 0, "");
    }

    // ──────────────────── Escrow ────────────────────

    function test_escrow_and_release() public {
        bytes32 jobId = keccak256("job-2");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 50e18);
        adapter.escrow(jobId, 50e18);
        vm.stopPrank();

        assertEq(adapter.getEscrowedAmount(jobId), 50e18);

        uint256 balBefore = token.balanceOf(provider1);
        vm.prank(pipeline);
        adapter.releaseEscrow(jobId, provider1);

        assertEq(token.balanceOf(provider1) - balBefore, 50e18);
        assertEq(adapter.getEscrowedAmount(jobId), 0);
    }

    function test_releaseEscrow_revert_alreadyReleased() public {
        bytes32 jobId = keccak256("job-3");

        vm.startPrank(pipeline);
        token.approve(address(adapter), 50e18);
        adapter.escrow(jobId, 50e18);
        adapter.releaseEscrow(jobId, provider1);
        vm.stopPrank();

        vm.expectRevert(SuperfluidSettlementAdapter.EscrowAlreadyReleased.selector);
        vm.prank(pipeline);
        adapter.releaseEscrow(jobId, provider1);
    }

    function test_releaseEscrow_revert_notFound() public {
        vm.expectRevert(SuperfluidSettlementAdapter.EscrowNotFound.selector);
        vm.prank(pipeline);
        adapter.releaseEscrow(keccak256("nonexistent"), provider1);
    }
}
