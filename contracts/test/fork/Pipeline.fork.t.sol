// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";

import { Pipeline } from "../../src/Pipeline.sol";
import { BackpressurePool } from "../../src/BackpressurePool.sol";
import { CapacityRegistry } from "../../src/CapacityRegistry.sol";
import { StakeManager } from "../../src/StakeManager.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

import { ISuperfluidToken } from "@superfluid-finance/contracts/interfaces/superfluid/ISuperfluidToken.sol";
import { ISuperToken } from "@superfluid-finance/contracts/interfaces/superfluid/ISuperToken.sol";
import { ISuperfluidPool } from "@superfluid-finance/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";
import {
    IGeneralDistributionAgreementV1
} from "@superfluid-finance/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import { ISuperTokenFactory } from "@superfluid-finance/contracts/interfaces/superfluid/ISuperTokenFactory.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @title Pipeline Fork Test
/// @notice Tests multi-stage pipeline against real Superfluid GDA on Base Sepolia.
///         Run: forge test --match-path test/fork/Pipeline.fork.t.sol --fork-url $BASE_SEPOLIA_RPC_URL -vvv
contract PipelineForkTest is Test {
    // ──────────────────── Base Sepolia Superfluid Addresses ────────────────────
    address constant GDA_V1 = 0x53F4f44C813Dc380182d0b2b67fe5832A12B97f8;
    address constant SUPER_TOKEN_FACTORY = 0x7447E94Dfe3d804a9f46Bf12838d467c912C8F6C;

    // ──────────────────── Contracts ────────────────────
    Pipeline public pipeline;
    BackpressurePool public bpPool;
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public underlying;
    ISuperToken public superToken;

    // ──────────────────── Actors ────────────────────
    address owner = address(0xA);
    // Stage 0 sinks (research)
    address sink0a = address(0x1001);
    address sink0b = address(0x1002);
    // Stage 1 sinks (synthesis)
    address sink1a = address(0x2001);
    address sink1b = address(0x2002);
    // Stage 2 sinks (writing)
    address sink2a = address(0x3001);
    address sink2b = address(0x3002);

    bytes32 constant STAGE_0 = keccak256("research");
    bytes32 constant STAGE_1 = keccak256("synthesis");
    bytes32 constant STAGE_2 = keccak256("writing");
    bytes32 constant PIPELINE_ID = keccak256("research-pipeline");

    uint256 constant MIN_STAKE = 100e18;
    uint256 constant STAKE_AMOUNT = 500e18;

    function setUp() public {
        // Fork must be active
        try vm.activeFork() returns (uint256) {} catch {
            vm.skip(true);
            return;
        }

        // 1. Deploy underlying ERC20
        underlying = new MockERC20("Test Token", "TEST");

        // 2. Create Super Token
        ISuperTokenFactory factory = ISuperTokenFactory(SUPER_TOKEN_FACTORY);
        superToken = factory.createERC20Wrapper(
            IERC20Metadata(address(underlying)),
            ISuperTokenFactory.Upgradability.SEMI_UPGRADABLE,
            "Super Test Token",
            "TESTx"
        );

        // 3. Deploy BPE stack
        stakeManager = new StakeManager(address(underlying), 1e18, MIN_STAKE, owner);
        registry = new CapacityRegistry(address(stakeManager));
        bpPool = new BackpressurePool(GDA_V1, address(superToken), address(registry), owner);
        pipeline = new Pipeline(address(bpPool), address(registry), owner);

        // 4. Register 3 stages
        registry.registerTaskType(STAGE_0, MIN_STAKE);
        registry.registerTaskType(STAGE_1, MIN_STAKE);
        registry.registerTaskType(STAGE_2, MIN_STAKE);

        // 5. Register sinks for each stage with different capacities
        _fundStakeAndRegister(sink0a, STAKE_AMOUNT, 500, STAGE_0);
        _fundStakeAndRegister(sink0b, STAKE_AMOUNT, 500, STAGE_0);

        _fundStakeAndRegister(sink1a, STAKE_AMOUNT, 300, STAGE_1);
        _fundStakeAndRegister(sink1b, STAKE_AMOUNT, 300, STAGE_1);

        _fundStakeAndRegister(sink2a, STAKE_AMOUNT, 100, STAGE_2); // Bottleneck stage
        _fundStakeAndRegister(sink2b, STAKE_AMOUNT, 100, STAGE_2);

        // 6. Create pools for each stage
        bpPool.createPool(STAGE_0);
        bpPool.createPool(STAGE_1);
        bpPool.createPool(STAGE_2);
    }

    function _fundStakeAndRegister(address sink, uint256 stakeAmt, uint256 cap, bytes32 taskType) internal {
        underlying.mint(sink, stakeAmt);
        vm.startPrank(sink);
        underlying.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(stakeAmt);
        registry.registerSink(taskType, cap);
        vm.stopPrank();
    }

    // ──────────────────── Tests ────────────────────

    function test_createPipeline_threeStages() public {
        bytes32[] memory stages = new bytes32[](3);
        stages[0] = STAGE_0;
        stages[1] = STAGE_1;
        stages[2] = STAGE_2;

        pipeline.createPipeline(PIPELINE_ID, stages);

        (bytes32[] memory readStages, bool active) = pipeline.getPipeline(PIPELINE_ID);
        assertEq(readStages.length, 3);
        assertTrue(active);
        assertEq(readStages[0], STAGE_0);
        assertEq(readStages[1], STAGE_1);
        assertEq(readStages[2], STAGE_2);
    }

    function test_effectiveCapacities_downstreamBottleneck() public {
        bytes32[] memory stages = new bytes32[](3);
        stages[0] = STAGE_0;
        stages[1] = STAGE_1;
        stages[2] = STAGE_2;
        pipeline.createPipeline(PIPELINE_ID, stages);

        // Stage capacities (capped by sqrt(stake)):
        // cap = sqrt(500e18) ≈ 22.36e9
        // So all declared capacities (100-500) are within cap
        uint256[] memory effCaps = pipeline.getEffectiveCapacities(PIPELINE_ID);

        assertEq(effCaps.length, 3);

        // Stage 2 (writing) is the bottleneck with lowest total capacity
        // Upstream stages should be constrained to stage 2's capacity
        // effCap[0] = min(stage0_cap, effCap[1])
        // effCap[1] = min(stage1_cap, effCap[2])
        // effCap[2] = stage2_cap
        assertEq(effCaps[2], effCaps[1], "Stage 1 should be constrained by Stage 2");
        assertEq(effCaps[1], effCaps[0], "Stage 0 should be constrained by Stage 1");
    }

    function test_rebalancePipeline_allStagesRebalanced() public {
        bytes32[] memory stages = new bytes32[](3);
        stages[0] = STAGE_0;
        stages[1] = STAGE_1;
        stages[2] = STAGE_2;
        pipeline.createPipeline(PIPELINE_ID, stages);

        // Rebalance pipeline — should trigger rebalance on all 3 pools
        pipeline.rebalancePipeline(PIPELINE_ID);

        // Verify each stage's pool has units set
        ISuperfluidPool pool0 = ISuperfluidPool(bpPool.getPool(STAGE_0));
        ISuperfluidPool pool1 = ISuperfluidPool(bpPool.getPool(STAGE_1));
        ISuperfluidPool pool2 = ISuperfluidPool(bpPool.getPool(STAGE_2));

        assertGt(pool0.getTotalUnits(), 0, "Stage 0 pool should have units");
        assertGt(pool1.getTotalUnits(), 0, "Stage 1 pool should have units");
        assertGt(pool2.getTotalUnits(), 0, "Stage 2 pool should have units");
    }

    function test_rebalancePipeline_afterBottleneckCapacityDrop() public {
        bytes32[] memory stages = new bytes32[](3);
        stages[0] = STAGE_0;
        stages[1] = STAGE_1;
        stages[2] = STAGE_2;
        pipeline.createPipeline(PIPELINE_ID, stages);

        pipeline.rebalancePipeline(PIPELINE_ID);

        // Get effective capacities before
        uint256[] memory capsBefore = pipeline.getEffectiveCapacities(PIPELINE_ID);

        // Deregister one sink from stage 2 (the bottleneck)
        vm.prank(sink2a);
        registry.deregisterSink(STAGE_2);

        // Rebalance again
        pipeline.rebalancePipeline(PIPELINE_ID);

        uint256[] memory capsAfter = pipeline.getEffectiveCapacities(PIPELINE_ID);

        // Stage 2 capacity should drop (lost one sink)
        assertLt(capsAfter[2], capsBefore[2], "Stage 2 capacity should decrease");

        // Upstream stages should also be constrained
        assertLe(capsAfter[0], capsBefore[0], "Stage 0 effective cap should not increase");
        assertLe(capsAfter[1], capsBefore[1], "Stage 1 effective cap should not increase");
    }
}
