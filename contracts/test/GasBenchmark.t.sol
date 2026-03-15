// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { BackpressurePool } from "../src/BackpressurePool.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

/// @title GasBenchmark
/// @notice Measures gas costs for core BPE operations at varying sink counts.
///         Run with `forge test --match-contract GasBenchmark -vv` to see gas reports.
contract GasBenchmarkTest is Test {
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public token;

    address owner = address(0xA);
    bytes32 constant TASK_ID = keccak256("benchmark");
    uint256 constant MIN_STAKE = 100e18;
    uint256 constant STAKE_AMOUNT = 1000e18;

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, MIN_STAKE, owner);
        registry = new CapacityRegistry(address(stakeManager));
        registry.registerTaskType(TASK_ID, MIN_STAKE);
    }

    function _createAndRegisterSinks(uint256 count) internal returns (address[] memory sinks) {
        sinks = new address[](count);
        for (uint256 i; i < count; i++) {
            address sink = address(uint160(0x1000 + i));
            sinks[i] = sink;
            token.mint(sink, STAKE_AMOUNT);
            vm.startPrank(sink);
            token.approve(address(stakeManager), type(uint256).max);
            stakeManager.stake(STAKE_AMOUNT);
            registry.registerSink(TASK_ID, 100);
            vm.stopPrank();
        }
    }

    // ──────────────────── Gas: registerTaskType ────────────────────

    function test_gas_registerTaskType() public {
        bytes32 newId = keccak256("gas-test-tasktype");
        uint256 gasBefore = gasleft();
        registry.registerTaskType(newId, MIN_STAKE);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("registerTaskType gas", gasUsed);
    }

    // ──────────────────── Gas: registerSink ────────────────────

    function test_gas_registerSink() public {
        address sink = address(0x9999);
        token.mint(sink, STAKE_AMOUNT);
        vm.startPrank(sink);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(STAKE_AMOUNT);
        uint256 gasBefore = gasleft();
        registry.registerSink(TASK_ID, 100);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();
        emit log_named_uint("registerSink gas", gasUsed);
    }

    // ──────────────────── Gas: commitCapacity + revealCapacity ────────────────────

    function test_gas_commitReveal() public {
        address sink = address(0x9999);
        token.mint(sink, STAKE_AMOUNT);
        vm.startPrank(sink);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(STAKE_AMOUNT);
        registry.registerSink(TASK_ID, 100);

        uint256 capacity = 200;
        bytes32 nonce = keccak256("nonce");
        bytes32 commitHash = keccak256(abi.encode(capacity, nonce));

        uint256 gasBefore = gasleft();
        registry.commitCapacity(TASK_ID, commitHash);
        uint256 commitGas = gasBefore - gasleft();

        vm.roll(block.number + 1);

        gasBefore = gasleft();
        registry.revealCapacity(TASK_ID, capacity, nonce);
        uint256 revealGas = gasBefore - gasleft();
        vm.stopPrank();

        emit log_named_uint("commitCapacity gas", commitGas);
        emit log_named_uint("revealCapacity gas", revealGas);
        emit log_named_uint("commit+reveal total gas", commitGas + revealGas);
    }

    // ──────────────────── Gas: getSinks at various sizes ────────────────────

    function test_gas_getSinks_5() public {
        _createAndRegisterSinks(5);
        uint256 gasBefore = gasleft();
        registry.getSinks(TASK_ID);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("getSinks(5) gas", gasUsed);
    }

    function test_gas_getSinks_10() public {
        _createAndRegisterSinks(10);
        uint256 gasBefore = gasleft();
        registry.getSinks(TASK_ID);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("getSinks(10) gas", gasUsed);
    }

    function test_gas_getSinks_25() public {
        _createAndRegisterSinks(25);
        uint256 gasBefore = gasleft();
        registry.getSinks(TASK_ID);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("getSinks(25) gas", gasUsed);
    }

    function test_gas_getSinks_50() public {
        _createAndRegisterSinks(50);
        uint256 gasBefore = gasleft();
        registry.getSinks(TASK_ID);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("getSinks(50) gas", gasUsed);
    }

    function test_gas_getSinks_100() public {
        _createAndRegisterSinks(100);
        uint256 gasBefore = gasleft();
        registry.getSinks(TASK_ID);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("getSinks(100) gas", gasUsed);
    }

    // ──────────────────── Gas: updateCapacityFromAggregator ────────────────────

    function test_gas_updateCapacityFromAggregator() public {
        address sink = address(0x9999);
        token.mint(sink, STAKE_AMOUNT);
        vm.startPrank(sink);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(STAKE_AMOUNT);
        registry.registerSink(TASK_ID, 100);
        vm.stopPrank();

        // Set up aggregator
        address aggregator = address(0xA66);
        registry.setAggregator(aggregator);

        vm.prank(aggregator);
        uint256 gasBefore = gasleft();
        registry.updateCapacityFromAggregator(TASK_ID, sink, 200);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("updateCapacityFromAggregator gas", gasUsed);
    }
}
