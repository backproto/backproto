// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { EconomyFactory } from "../src/EconomyFactory.sol";
import { IEconomyFactory } from "../src/interfaces/IEconomyFactory.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { BackpressurePool } from "../src/BackpressurePool.sol";
import { EscrowBuffer } from "../src/EscrowBuffer.sol";
import { PricingCurve } from "../src/PricingCurve.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockGDA } from "./mocks/MockGDA.sol";

contract EconomyFactoryTest is Test {
    EconomyFactory public factory;
    MockERC20 public token;
    MockGDA public gda;

    address owner = address(0xA);
    address deployer = address(0xB);

    bytes32 constant TASK_A = keccak256("research");
    bytes32 constant TASK_B = keccak256("coding");

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        gda = new MockGDA();

        factory = new EconomyFactory(
            address(gda),
            address(token), // super token (mock)
            address(token), // stake token
            1e18,           // stake unit
            owner
        );
    }

    // ──────────────────── Deploy Economy ────────────────────

    function test_deployEconomy_marketplace() public {
        bytes32[] memory tasks = new bytes32[](2);
        tasks[0] = TASK_A;
        tasks[1] = TASK_B;

        IEconomyFactory.EconomyConfig memory config = IEconomyFactory.EconomyConfig({
            template: IEconomyFactory.Template.MARKETPLACE,
            taskTypeIds: tasks,
            minStake: 100e18,
            bufferMax: 1000e18,
            verificationBudgetBps: 0
        });

        vm.prank(deployer);
        IEconomyFactory.EconomyDeployment memory d = factory.deployEconomy(config);

        // Verify deployment
        assertNe(d.stakeManager, address(0));
        assertNe(d.capacityRegistry, address(0));
        assertNe(d.backpressurePool, address(0));
        assertNe(d.escrowBuffer, address(0));
        assertNe(d.pricingCurve, address(0));
        assertEq(d.pipeline, address(0)); // No pipeline for MARKETPLACE
        assertEq(d.owner, deployer);
    }

    function test_deployEconomy_pipeline() public {
        bytes32[] memory tasks = new bytes32[](2);
        tasks[0] = TASK_A;
        tasks[1] = TASK_B;

        IEconomyFactory.EconomyConfig memory config = IEconomyFactory.EconomyConfig({
            template: IEconomyFactory.Template.PIPELINE,
            taskTypeIds: tasks,
            minStake: 100e18,
            bufferMax: 0,
            verificationBudgetBps: 0
        });

        vm.prank(deployer);
        IEconomyFactory.EconomyDeployment memory d = factory.deployEconomy(config);

        assertNe(d.pipeline, address(0)); // Pipeline deployed
    }

    function test_deployEconomy_revert_noTaskTypes() public {
        bytes32[] memory tasks = new bytes32[](0);

        IEconomyFactory.EconomyConfig memory config = IEconomyFactory.EconomyConfig({
            template: IEconomyFactory.Template.MARKETPLACE,
            taskTypeIds: tasks,
            minStake: 100e18,
            bufferMax: 0,
            verificationBudgetBps: 0
        });

        vm.prank(deployer);
        vm.expectRevert(EconomyFactory.NoTaskTypes.selector);
        factory.deployEconomy(config);
    }

    function test_deployEconomy_revert_pipelineNeedsMultipleStages() public {
        bytes32[] memory tasks = new bytes32[](1);
        tasks[0] = TASK_A;

        IEconomyFactory.EconomyConfig memory config = IEconomyFactory.EconomyConfig({
            template: IEconomyFactory.Template.PIPELINE,
            taskTypeIds: tasks,
            minStake: 100e18,
            bufferMax: 0,
            verificationBudgetBps: 0
        });

        vm.prank(deployer);
        vm.expectRevert(EconomyFactory.PipelineRequiresMultipleStages.selector);
        factory.deployEconomy(config);
    }

    // ──────────────────── Reads ────────────────────

    function test_getEconomy() public {
        bytes32[] memory tasks = new bytes32[](1);
        tasks[0] = TASK_A;

        IEconomyFactory.EconomyConfig memory config = IEconomyFactory.EconomyConfig({
            template: IEconomyFactory.Template.COOPERATIVE,
            taskTypeIds: tasks,
            minStake: 50e18,
            bufferMax: 0,
            verificationBudgetBps: 0
        });

        vm.prank(deployer);
        IEconomyFactory.EconomyDeployment memory d = factory.deployEconomy(config);

        IEconomyFactory.EconomyDeployment memory fetched = factory.getEconomy(d.economyId);
        assertEq(fetched.stakeManager, d.stakeManager);
        assertEq(fetched.owner, deployer);
    }

    function test_getEconomiesByOwner() public {
        bytes32[] memory tasks = new bytes32[](1);
        tasks[0] = TASK_A;

        IEconomyFactory.EconomyConfig memory config = IEconomyFactory.EconomyConfig({
            template: IEconomyFactory.Template.MARKETPLACE,
            taskTypeIds: tasks,
            minStake: 100e18,
            bufferMax: 0,
            verificationBudgetBps: 0
        });

        vm.prank(deployer);
        factory.deployEconomy(config);
        vm.prank(deployer);
        factory.deployEconomy(config);

        bytes32[] memory economies = factory.getEconomiesByOwner(deployer);
        assertEq(economies.length, 2);
    }

    function test_economyCount() public {
        assertEq(factory.economyCount(), 0);

        bytes32[] memory tasks = new bytes32[](1);
        tasks[0] = TASK_A;

        IEconomyFactory.EconomyConfig memory config = IEconomyFactory.EconomyConfig({
            template: IEconomyFactory.Template.GUILD,
            taskTypeIds: tasks,
            minStake: 100e18,
            bufferMax: 0,
            verificationBudgetBps: 0
        });

        vm.prank(deployer);
        factory.deployEconomy(config);
        assertEq(factory.economyCount(), 1);
    }

    // ──────────────────── Helper ────────────────────

    function assertNe(address a, address b) internal pure {
        assertTrue(a != b, "Addresses should not be equal");
    }
}
