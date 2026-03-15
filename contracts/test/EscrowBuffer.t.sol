// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { EscrowBuffer } from "../src/EscrowBuffer.sol";
import { IEscrowBuffer } from "../src/interfaces/IEscrowBuffer.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract EscrowBufferTest is Test {
    EscrowBuffer public buffer;
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public stakeToken;
    MockERC20 public paymentToken;

    address owner = address(0xA);
    address source = address(0xF);
    address sink1 = address(0x1);
    address sink2 = address(0x2);

    bytes32 constant TASK_ID = keccak256("research");
    uint256 constant MIN_STAKE = 100e18;

    function setUp() public {
        stakeToken = new MockERC20("Stake", "STK");
        paymentToken = new MockERC20("Payment", "PAY");
        stakeManager = new StakeManager(address(stakeToken), 1e18, MIN_STAKE, owner);
        registry = new CapacityRegistry(address(stakeManager));
        buffer = new EscrowBuffer(address(paymentToken), address(registry), owner);

        // Register task type
        registry.registerTaskType(TASK_ID, MIN_STAKE);

        // Fund and register sinks
        _fundStakeAndRegister(sink1, 500e18, 100);
        _fundStakeAndRegister(sink2, 500e18, 200);

        // Fund source with payment tokens
        paymentToken.mint(source, 10_000e18);
        vm.prank(source);
        paymentToken.approve(address(buffer), type(uint256).max);
    }

    function _fundStakeAndRegister(address sink, uint256 stakeAmount, uint256 capacity) internal {
        stakeToken.mint(sink, stakeAmount);
        vm.startPrank(sink);
        stakeToken.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(stakeAmount);
        vm.stopPrank();

        vm.prank(sink);
        registry.registerSink(TASK_ID, capacity);
    }

    // ──────────────────── Deposit ────────────────────

    function test_deposit() public {
        vm.prank(source);
        buffer.deposit(TASK_ID, 1000e18);
        assertEq(buffer.bufferLevel(TASK_ID), 1000e18);
        assertEq(paymentToken.balanceOf(address(buffer)), 1000e18);
    }

    function test_deposit_revert_zero() public {
        vm.expectRevert(EscrowBuffer.ZeroAmount.selector);
        vm.prank(source);
        buffer.deposit(TASK_ID, 0);
    }

    function test_deposit_revert_exceedsMax() public {
        vm.prank(owner);
        buffer.setBufferMax(TASK_ID, 500e18);

        vm.expectRevert(abi.encodeWithSelector(EscrowBuffer.BufferExceedsMax.selector, 600e18, 500e18));
        vm.prank(source);
        buffer.deposit(TASK_ID, 600e18);
    }

    function test_deposit_emitsBufferFull() public {
        vm.prank(owner);
        buffer.setBufferMax(TASK_ID, 1000e18);

        vm.expectEmit(true, false, false, true);
        emit IEscrowBuffer.BufferFull(TASK_ID, 1000e18);
        vm.prank(source);
        buffer.deposit(TASK_ID, 1000e18);
    }

    // ──────────────────── Drain ────────────────────

    function test_drain() public {
        vm.prank(source);
        buffer.deposit(TASK_ID, 300e18);

        buffer.drain(TASK_ID);

        // Should have distributed proportionally: sink1=100, sink2=200, total=300
        // sink1 gets 300 * 100/300 = 100
        // sink2 gets 300 * 200/300 = 200
        assertEq(paymentToken.balanceOf(sink1), 100e18);
        assertEq(paymentToken.balanceOf(sink2), 200e18);
        assertEq(buffer.bufferLevel(TASK_ID), 0);
    }

    function test_drain_revert_empty() public {
        vm.expectRevert(EscrowBuffer.NothingToDrain.selector);
        buffer.drain(TASK_ID);
    }

    // ──────────────────── Configuration ────────────────────

    function test_setBufferMax() public {
        vm.prank(owner);
        buffer.setBufferMax(TASK_ID, 5000e18);
        assertEq(buffer.bufferMax(TASK_ID), 5000e18);
    }

    function test_setBufferMax_onlyOwner() public {
        vm.expectRevert();
        vm.prank(source);
        buffer.setBufferMax(TASK_ID, 5000e18);
    }
}
