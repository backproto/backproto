// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { DVMCompletionVerifier } from "../../src/adapters/DVMCompletionVerifier.sol";
import { CompletionTracker } from "../../src/CompletionTracker.sol";
import { CapacityRegistry } from "../../src/CapacityRegistry.sol";
import { StakeManager } from "../../src/StakeManager.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";

contract DVMCompletionVerifierTest is Test {
    DVMCompletionVerifier public verifier;
    CompletionTracker public tracker;
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public token;

    address owner = address(0xA);

    function setUp() public {
        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, 100e18, owner);
        registry = new CapacityRegistry(address(stakeManager));
        tracker = new CompletionTracker(address(registry), address(stakeManager));
        verifier = new DVMCompletionVerifier(address(tracker));
    }

    // ──────────────────── Kind Mapping ────────────────────

    function test_kindToTaskType() public view {
        bytes32 expected = keccak256(abi.encodePacked("DVM_KIND_", uint256(5002)));
        assertEq(verifier.kindToTaskType(5002), expected);
    }

    function test_kindToTaskType_differentKinds() public view {
        bytes32 kind5002 = verifier.kindToTaskType(5002);
        bytes32 kind5100 = verifier.kindToTaskType(5100);
        assertTrue(kind5002 != kind5100);
    }

    // ──────────────────── Job Recording ────────────────────

    function test_isJobRecorded_false() public view {
        assertFalse(verifier.isJobRecorded(keccak256("nonexistent")));
    }

    // ──────────────────── Reads ────────────────────

    function test_getCompletions_zero() public view {
        assertEq(verifier.getCompletions(5002, address(0x1)), 0);
    }

    function test_getCompletionRate_zero() public view {
        assertEq(verifier.getCompletionRate(5002, address(0x1)), 0);
    }
}
