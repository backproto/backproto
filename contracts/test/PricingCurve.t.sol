// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { PricingCurve } from "../src/PricingCurve.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract PricingCurveTest is Test {
    PricingCurve public pricing;
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public token;

    address owner = address(0xA);
    address sink1 = address(0x1);
    address sink2 = address(0x2);

    bytes32 constant TASK_ID = keccak256("inference");
    uint256 constant MIN_STAKE = 100e18;
    uint256 constant STAKE_AMOUNT = 500e18;

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, MIN_STAKE, owner);
        registry = new CapacityRegistry(address(stakeManager));
        pricing = new PricingCurve(address(registry));

        // Register task type
        registry.registerTaskType(TASK_ID, MIN_STAKE);

        // Fund, stake, and register sinks
        _fundStakeRegister(sink1, STAKE_AMOUNT, 100);
        _fundStakeRegister(sink2, STAKE_AMOUNT, 200);
    }

    function _fundStakeRegister(address sink, uint256 stakeAmt, uint256 initCap) internal {
        token.mint(sink, stakeAmt);
        vm.startPrank(sink);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(stakeAmt);
        registry.registerSink(TASK_ID, initCap);
        vm.stopPrank();
    }

    // ──────────────────── Base Fee ────────────────────

    function test_defaultBaseFee() public view {
        assertEq(pricing.getBaseFee(TASK_ID), pricing.DEFAULT_BASE_FEE());
    }

    // ──────────────────── Price at Zero Load ────────────────────

    function test_priceAtZeroLoad() public view {
        // With zero queue load, price = baseFee
        uint256 price = pricing.getPrice(TASK_ID, sink1);
        assertEq(price, pricing.DEFAULT_BASE_FEE());
    }

    // ──────────────────── Price Increases with Load ────────────────────

    function test_priceIncreasesWithLoad() public {
        uint256 priceZero = pricing.getPrice(TASK_ID, sink1);

        // Report queue load
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 50);

        uint256 priceLoaded = pricing.getPrice(TASK_ID, sink1);
        assertGt(priceLoaded, priceZero, "Price should increase with load");
    }

    // ──────────────────── Price Proportional to Load ────────────────────

    function test_priceProportionalToLoad() public {
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 50);
        uint256 price50 = pricing.getPrice(TASK_ID, sink1);

        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 100);
        uint256 price100 = pricing.getPrice(TASK_ID, sink1);

        // price100 should be roughly double the congestion premium of price50
        // price = baseFee + baseFee * γ * load / (cap * BPS)
        assertGt(price100, price50, "Higher load = higher price");
    }

    // ──────────────────── Zero Capacity Returns Max Price ────────────────────

    function test_zeroCapacityReturnsMaxPrice() public {
        // Create a new task type with no sinks
        bytes32 emptyTask = keccak256("empty");
        registry.registerTaskType(emptyTask, MIN_STAKE);

        uint256 price = pricing.getPrice(emptyTask, address(0xDEAD));
        assertEq(price, type(uint256).max);
    }

    // ──────────────────── Queue Load Tracking ────────────────────

    function test_queueLoadTracking() public {
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 42);
        assertEq(pricing.getQueueLoad(TASK_ID, sink1), 42);

        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 100);
        assertEq(pricing.getQueueLoad(TASK_ID, sink1), 100);
    }

    // ──────────────────── Epoch Advancement: Fee Increase ────────────────────

    function test_advanceEpoch_feeIncrease() public {
        // Report queue load > total capacity to trigger congestion
        (,, uint256 totalCap) = registry.getTaskType(TASK_ID);
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, totalCap + 1);

        uint256 baseBefore = pricing.getBaseFee(TASK_ID);

        // Advance time past epoch
        vm.warp(block.timestamp + pricing.EPOCH_DURATION() + 1);
        pricing.advanceEpoch(TASK_ID);

        uint256 baseAfter = pricing.getBaseFee(TASK_ID);
        assertGt(baseAfter, baseBefore, "Base fee should increase under congestion");

        // Verify 12.5% increase
        uint256 expected = baseBefore + (baseBefore * pricing.ADJUSTMENT_RATE_BPS()) / pricing.BPS();
        assertEq(baseAfter, expected);
    }

    // ──────────────────── Epoch Advancement: Fee Decrease ────────────────────

    function test_advanceEpoch_feeDecrease() public {
        // First increase the fee
        (,, uint256 totalCap) = registry.getTaskType(TASK_ID);
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, totalCap + 1);
        vm.warp(block.timestamp + pricing.EPOCH_DURATION() + 1);
        pricing.advanceEpoch(TASK_ID);

        uint256 baseBefore = pricing.getBaseFee(TASK_ID);

        // Now advance with zero demand — fee should decrease
        vm.warp(block.timestamp + pricing.EPOCH_DURATION() + 1);
        pricing.advanceEpoch(TASK_ID);

        uint256 baseAfter = pricing.getBaseFee(TASK_ID);
        assertLt(baseAfter, baseBefore, "Base fee should decrease under low demand");
    }

    // ──────────────────── Epoch: Revert if Not Elapsed ────────────────────

    function test_advanceEpoch_revert_notElapsed() public {
        // Initialize pricing state
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 1);

        vm.expectRevert(PricingCurve.EpochNotElapsed.selector);
        pricing.advanceEpoch(TASK_ID);
    }

    // ──────────────────── Base Fee Floor ────────────────────

    function test_baseFeeFloor() public {
        // Initialize pricing state
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 0);

        // Decrease fee many times — should not go below MIN_BASE_FEE
        for (uint256 i; i < 50; i++) {
            vm.warp(block.timestamp + pricing.EPOCH_DURATION() + 1);
            pricing.advanceEpoch(TASK_ID);
        }

        uint256 fee = pricing.getBaseFee(TASK_ID);
        assertGe(fee, pricing.MIN_BASE_FEE(), "Fee should not drop below minimum");
    }

    // ──────────────────── Different Sinks Different Prices ────────────────────

    function test_differentSinksDifferentPrices() public {
        // sink1 reports high load, sink2 reports zero
        vm.prank(sink1);
        pricing.reportQueueLoad(TASK_ID, 100);

        uint256 price1 = pricing.getPrice(TASK_ID, sink1);
        uint256 price2 = pricing.getPrice(TASK_ID, sink2);

        assertGt(price1, price2, "Congested sink should have higher price");
    }
}
