// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import { OffchainAggregator, CapacityRegistryLike } from "../src/OffchainAggregator.sol";
import { IOffchainAggregator } from "../src/interfaces/IOffchainAggregator.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { StakeManager } from "../src/StakeManager.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract OffchainAggregatorTest is Test {
    OffchainAggregator public aggregator;
    CapacityRegistry public registry;
    StakeManager public stakeManager;
    MockERC20 public token;

    address owner = address(0xA);
    address relayer = address(0xBB);

    // Use vm.addr(pk) so we can sign with known private keys
    uint256 constant SINK1_PK = 0x11;
    uint256 constant SINK2_PK = 0x22;
    address sink1;
    address sink2;

    bytes32 constant TASK_ID = keccak256("inference");
    uint256 constant MIN_STAKE = 100e18;
    uint256 constant STAKE_AMOUNT = 500e18;

    function setUp() public {
        sink1 = vm.addr(SINK1_PK);
        sink2 = vm.addr(SINK2_PK);

        token = new MockERC20("Stake", "STK");
        stakeManager = new StakeManager(address(token), 1e18, MIN_STAKE, owner);
        registry = new CapacityRegistry(address(stakeManager));
        aggregator = new OffchainAggregator(address(registry), owner);

        // Set aggregator as authorized in CapacityRegistry
        registry.setAggregator(address(aggregator));

        // Register task type
        registry.registerTaskType(TASK_ID, MIN_STAKE);

        // Fund, stake, and register sinks
        _fundStakeRegister(sink1, SINK1_PK, STAKE_AMOUNT, 100);
        _fundStakeRegister(sink2, SINK2_PK, STAKE_AMOUNT, 200);
    }

    function _fundStakeRegister(address sink, uint256, uint256 stakeAmt, uint256 initCap) internal {
        token.mint(sink, stakeAmt);
        vm.startPrank(sink);
        token.approve(address(stakeManager), type(uint256).max);
        stakeManager.stake(stakeAmt);
        registry.registerSink(TASK_ID, initCap);
        vm.stopPrank();
    }

    function _signAttestation(
        bytes32 taskTypeId,
        address sink,
        uint256 capacity,
        uint256 timestamp,
        uint256 nonce,
        uint256 signerPk
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(aggregator.ATTESTATION_TYPEHASH(), taskTypeId, sink, capacity, timestamp, nonce)
        );

        bytes32 domainSeparator = _getDomainSeparator(address(aggregator));
        bytes32 digest = MessageHashUtils.toTypedDataHash(domainSeparator, structHash);

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerPk, digest);
        return abi.encodePacked(r, s, v);
    }

    // ──────────────────── Single Attestation ────────────────────

    function test_submitBatch_single() public {
        uint256 capacity = 150;
        uint256 nonce = 1;

        IOffchainAggregator.SignedAttestation[] memory batch = new IOffchainAggregator.SignedAttestation[](1);
        batch[0] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink1,
            capacity: capacity,
            timestamp: block.timestamp,
            nonce: nonce,
            signature: _signAttestation(TASK_ID, sink1, capacity, block.timestamp, nonce, SINK1_PK)
        });

        vm.prank(relayer);
        aggregator.submitBatch(batch);

        // Nonce should be updated
        assertEq(aggregator.lastNonce(sink1), nonce);
        assertEq(aggregator.lastTimestamp(TASK_ID, sink1), block.timestamp);

        // Capacity in registry should be updated via EWMA
        uint256 smoothed = registry.getSmoothedCapacity(TASK_ID, sink1);
        assertGt(smoothed, 0);
    }

    // ──────────────────── Batch Attestation ────────────────────

    function test_submitBatch_multiple() public {
        IOffchainAggregator.SignedAttestation[] memory batch = new IOffchainAggregator.SignedAttestation[](2);
        batch[0] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink1,
            capacity: 150,
            timestamp: block.timestamp,
            nonce: 1,
            signature: _signAttestation(TASK_ID, sink1, 150, block.timestamp, 1, SINK1_PK)
        });
        batch[1] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink2,
            capacity: 300,
            timestamp: block.timestamp,
            nonce: 1,
            signature: _signAttestation(TASK_ID, sink2, 300, block.timestamp, 1, SINK2_PK)
        });

        vm.prank(relayer);
        aggregator.submitBatch(batch);

        assertEq(aggregator.lastNonce(sink1), 1);
        assertEq(aggregator.lastNonce(sink2), 1);
    }

    // ──────────────────── Nonce Replay Prevention ────────────────────

    function test_submitBatch_rejectsReplayedNonce() public {
        // First submission
        IOffchainAggregator.SignedAttestation[] memory batch1 = new IOffchainAggregator.SignedAttestation[](1);
        batch1[0] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink1,
            capacity: 150,
            timestamp: block.timestamp,
            nonce: 1,
            signature: _signAttestation(TASK_ID, sink1, 150, block.timestamp, 1, SINK1_PK)
        });
        vm.prank(relayer);
        aggregator.submitBatch(batch1);

        // Same nonce — should be silently rejected (emits AttestationRejected)
        uint256 smoothedBefore = registry.getSmoothedCapacity(TASK_ID, sink1);

        IOffchainAggregator.SignedAttestation[] memory batch2 = new IOffchainAggregator.SignedAttestation[](1);
        batch2[0] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink1,
            capacity: 999,
            timestamp: block.timestamp,
            nonce: 1,
            signature: _signAttestation(TASK_ID, sink1, 999, block.timestamp, 1, SINK1_PK)
        });
        vm.prank(relayer);
        aggregator.submitBatch(batch2);

        // Capacity should not have changed (nonce rejected)
        assertEq(registry.getSmoothedCapacity(TASK_ID, sink1), smoothedBefore);
    }

    // ──────────────────── Stale Attestation Rejection ────────────────────

    function test_submitBatch_rejectsStaleAttestation() public {
        // Warp to a reasonable time so subtraction doesn't underflow
        vm.warp(10_000);
        uint256 staleTimestamp = block.timestamp - aggregator.MAX_ATTESTATION_AGE() - 1;

        IOffchainAggregator.SignedAttestation[] memory batch = new IOffchainAggregator.SignedAttestation[](1);
        batch[0] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink1,
            capacity: 150,
            timestamp: staleTimestamp,
            nonce: 1,
            signature: _signAttestation(TASK_ID, sink1, 150, staleTimestamp, 1, SINK1_PK)
        });

        vm.prank(relayer);
        aggregator.submitBatch(batch);

        // Nonce should NOT be updated (attestation was stale)
        assertEq(aggregator.lastNonce(sink1), 0);
    }

    // ──────────────────── Invalid Signature Rejection ────────────────────

    function test_submitBatch_rejectsInvalidSignature() public {
        // Sign with wrong key
        IOffchainAggregator.SignedAttestation[] memory batch = new IOffchainAggregator.SignedAttestation[](1);
        batch[0] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink1,
            capacity: 150,
            timestamp: block.timestamp,
            nonce: 1,
            signature: _signAttestation(TASK_ID, sink1, 150, block.timestamp, 1, SINK2_PK) // Wrong key!
        });

        vm.prank(relayer);
        aggregator.submitBatch(batch);

        // Nonce should NOT be updated (signature invalid)
        assertEq(aggregator.lastNonce(sink1), 0);
    }

    // ──────────────────── Increasing Nonces Work ────────────────────

    function test_submitBatch_increasingNonces() public {
        for (uint256 n = 1; n <= 5; n++) {
            IOffchainAggregator.SignedAttestation[] memory batch = new IOffchainAggregator.SignedAttestation[](1);
            batch[0] = IOffchainAggregator.SignedAttestation({
                taskTypeId: TASK_ID,
                sink: sink1,
                capacity: 100 + n * 10,
                timestamp: block.timestamp,
                nonce: n,
                signature: _signAttestation(TASK_ID, sink1, 100 + n * 10, block.timestamp, n, SINK1_PK)
            });
            vm.prank(relayer);
            aggregator.submitBatch(batch);
            assertEq(aggregator.lastNonce(sink1), n);
        }
    }

    // ──────────────────── Anyone Can Relay ────────────────────

    function test_anyoneCanRelay() public {
        address randomUser = address(0xCAFE);

        IOffchainAggregator.SignedAttestation[] memory batch = new IOffchainAggregator.SignedAttestation[](1);
        batch[0] = IOffchainAggregator.SignedAttestation({
            taskTypeId: TASK_ID,
            sink: sink1,
            capacity: 150,
            timestamp: block.timestamp,
            nonce: 1,
            signature: _signAttestation(TASK_ID, sink1, 150, block.timestamp, 1, SINK1_PK)
        });

        vm.prank(randomUser);
        aggregator.submitBatch(batch);

        assertEq(aggregator.lastNonce(sink1), 1);
    }

    // ──────────────────── Helpers ────────────────────

    function _getDomainSeparator(address target) internal view returns (bytes32) {
        (, string memory name, string memory version, uint256 chainId, address verifyingContract,,) =
            OffchainAggregator(target).eip712Domain();
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract
            )
        );
    }
}
