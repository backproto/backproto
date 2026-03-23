// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { ISettlementAdapter } from "../../src/interfaces/ISettlementAdapter.sol";
import { SuperfluidSettlementAdapter } from "../../src/adapters/SuperfluidSettlementAdapter.sol";
import { LightningSettlementAdapter } from "../../src/adapters/LightningSettlementAdapter.sol";
import { DirectSettlementAdapter } from "../../src/adapters/DirectSettlementAdapter.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

/// @notice Interface compliance tests — verifies all three settlement adapters
///         implement ISettlementAdapter correctly and consistently.
contract ISettlementAdapterTest is Test {
    SuperfluidSettlementAdapter public sfAdapter;
    LightningSettlementAdapter public lnAdapter;
    DirectSettlementAdapter public directAdapter;
    MockERC20 public token;

    address pipeline = address(0xAA);
    address provider = address(0x1);

    function setUp() public {
        token = new MockERC20("Settlement", "SET");
        sfAdapter = new SuperfluidSettlementAdapter(address(token), pipeline);
        lnAdapter = new LightningSettlementAdapter(address(token), pipeline);
        directAdapter = new DirectSettlementAdapter(address(token), pipeline);

        // Fund adapters
        token.mint(address(sfAdapter), 1_000_000e18);
        token.mint(address(lnAdapter), 1_000_000e18);
        token.mint(address(directAdapter), 1_000_000e18);
        token.mint(pipeline, 1_000_000e18);
    }

    // ──────────────────── Rail IDs are unique ────────────────────

    function test_railIds_unique() public view {
        bytes32 sfRail = sfAdapter.railId();
        bytes32 lnRail = lnAdapter.railId();
        bytes32 directRail = directAdapter.railId();

        assertTrue(sfRail != lnRail);
        assertTrue(sfRail != directRail);
        assertTrue(lnRail != directRail);
    }

    // ──────────────────── All adapters support stream init ────────────────────

    function test_allAdapters_initializeStream() public {
        vm.startPrank(pipeline);

        bytes32 s1 = sfAdapter.initializeStream(provider, 1e15);
        bytes32 s2 = lnAdapter.initializeStream(provider, 1e15);
        bytes32 s3 = directAdapter.initializeStream(provider, 1e15);

        assertGt(uint256(s1), 0);
        assertGt(uint256(s2), 0);
        assertGt(uint256(s3), 0);

        assertEq(sfAdapter.getStreamFlowRate(s1), 1e15);
        assertEq(lnAdapter.getStreamFlowRate(s2), 1e15);
        assertEq(directAdapter.getStreamFlowRate(s3), 1e15);

        vm.stopPrank();
    }

    // ──────────────────── All adapters support escrow ────────────────────

    function test_allAdapters_escrow() public {
        bytes32 job1 = keccak256("sf-job");
        bytes32 job2 = keccak256("ln-job");
        bytes32 job3 = keccak256("direct-job");

        vm.startPrank(pipeline);
        token.approve(address(sfAdapter), 100e18);
        token.approve(address(lnAdapter), 100e18);
        token.approve(address(directAdapter), 100e18);

        sfAdapter.escrow(job1, 100e18);
        lnAdapter.escrow(job2, 100e18);
        directAdapter.escrow(job3, 100e18);
        vm.stopPrank();

        assertEq(sfAdapter.getEscrowedAmount(job1), 100e18);
        assertEq(lnAdapter.getEscrowedAmount(job2), 100e18);
        assertEq(directAdapter.getEscrowedAmount(job3), 100e18);
    }

    // ──────────────────── All adapters support release ────────────────────

    function test_allAdapters_releaseEscrow() public {
        bytes32 job1 = keccak256("sf-release");
        bytes32 job2 = keccak256("ln-release");
        bytes32 job3 = keccak256("direct-release");

        vm.startPrank(pipeline);
        token.approve(address(sfAdapter), 300e18);
        token.approve(address(lnAdapter), 300e18);
        token.approve(address(directAdapter), 300e18);

        sfAdapter.escrow(job1, 100e18);
        lnAdapter.escrow(job2, 100e18);
        directAdapter.escrow(job3, 100e18);

        sfAdapter.releaseEscrow(job1, provider);
        lnAdapter.releaseEscrow(job2, provider);
        directAdapter.releaseEscrow(job3, provider);
        vm.stopPrank();

        assertEq(sfAdapter.getEscrowedAmount(job1), 0);
        assertEq(lnAdapter.getEscrowedAmount(job2), 0);
        assertEq(directAdapter.getEscrowedAmount(job3), 0);
    }

    // ──────────────────── All adapters reject non-pipeline callers ────────────────────

    function test_allAdapters_revert_notPipeline() public {
        vm.expectRevert(SuperfluidSettlementAdapter.OnlyPipeline.selector);
        sfAdapter.initializeStream(provider, 1e15);

        vm.expectRevert(LightningSettlementAdapter.OnlyPipeline.selector);
        lnAdapter.initializeStream(provider, 1e15);

        vm.expectRevert(DirectSettlementAdapter.OnlyPipeline.selector);
        directAdapter.initializeStream(provider, 1e15);
    }
}
