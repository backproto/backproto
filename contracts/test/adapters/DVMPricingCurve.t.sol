// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { DVMPricingCurve } from "../../src/adapters/DVMPricingCurve.sol";
import { CapacityRegistry } from "../../src/CapacityRegistry.sol";
import { StakeManager } from "../../src/StakeManager.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

contract DVMPricingCurveTest is Test {
    DVMPricingCurve public pricing;
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public token;

    address admin = address(0xA);
    address operator1 = address(0x1);

    bytes32 constant TASK_TYPE = keccak256(abi.encodePacked("DVM_KIND_", uint256(5002)));

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, 100e18, admin);
        registry = new CapacityRegistry(address(stakeManager));
        pricing = new DVMPricingCurve(address(registry), admin);
    }

    // ──────────────────── Base Fee ────────────────────

    function test_getBaseFee_default() public view {
        uint256 fee = pricing.getBaseFee(TASK_TYPE);
        assertEq(fee, 1e15); // DEFAULT_BASE_FEE
    }

    // ──────────────────── Queue Load ────────────────────

    function test_reportQueueLoad() public {
        vm.prank(operator1);
        pricing.reportQueueLoad(TASK_TYPE, 50);
        assertEq(pricing.getQueueLoad(TASK_TYPE, operator1), 50);
    }

    function test_reportQueueLoad_updatesAggregate() public {
        vm.prank(operator1);
        pricing.reportQueueLoad(TASK_TYPE, 50);

        // Update to higher load
        vm.prank(operator1);
        pricing.reportQueueLoad(TASK_TYPE, 80);
        assertEq(pricing.getQueueLoad(TASK_TYPE, operator1), 80);
    }

    // ──────────────────── Kind Weights ────────────────────

    function test_setKindWeight() public {
        vm.prank(admin);
        pricing.setKindWeight(5002, 5000); // 0.5x for translation

        assertEq(pricing.kindWeights(5002), 5000);
    }

    function test_setKindWeight_revert_notAdmin() public {
        vm.expectRevert(DVMPricingCurve.OnlyAdmin.selector);
        vm.prank(operator1);
        pricing.setKindWeight(5002, 5000);
    }

    // ──────────────────── Epoch Advancement ────────────────────

    function test_advanceEpoch_revert_tooEarly() public {
        // Initialize by reporting a load
        vm.prank(operator1);
        pricing.reportQueueLoad(TASK_TYPE, 10);

        vm.expectRevert(DVMPricingCurve.EpochNotElapsed.selector);
        pricing.advanceEpoch(TASK_TYPE);
    }

    function test_advanceEpoch_decreasesBaseFee() public {
        // Initialize
        vm.prank(operator1);
        pricing.reportQueueLoad(TASK_TYPE, 0); // no demand

        vm.warp(block.timestamp + 61);
        pricing.advanceEpoch(TASK_TYPE);

        uint256 fee = pricing.getBaseFee(TASK_TYPE);
        // Should decrease from default (or hit floor)
        assertLe(fee, 1e15);
    }

    // ──────────────────── Admin ────────────────────

    function test_setTemperatureOracle() public {
        address oracle = address(0xBBB);
        vm.prank(admin);
        pricing.setTemperatureOracle(oracle);
        assertEq(address(pricing.temperatureOracle()), oracle);
    }

    function test_setEscrowBuffer() public {
        address buffer = address(0xCCC);
        vm.prank(admin);
        pricing.setEscrowBuffer(buffer);
        assertEq(address(pricing.escrowBuffer()), buffer);
    }

    function test_setTemperatureOracle_revert_notAdmin() public {
        vm.expectRevert(DVMPricingCurve.OnlyAdmin.selector);
        vm.prank(operator1);
        pricing.setTemperatureOracle(address(0xBBB));
    }
}
