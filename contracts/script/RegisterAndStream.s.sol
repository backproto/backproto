// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ISuperToken } from "@superfluid-finance/contracts/interfaces/superfluid/ISuperToken.sol";
import { ISuperfluidPool } from "@superfluid-finance/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";

import { StakeManager } from "../src/StakeManager.sol";
import { CapacityRegistry } from "../src/CapacityRegistry.sol";
import { BackpressurePool } from "../src/BackpressurePool.sol";

/// @notice Minimal interface for GDAv1Forwarder (avoids deep dependency chain).
interface IGDAv1Forwarder {
    function connectPool(ISuperfluidPool pool, bytes calldata userData) external returns (bool);
    function distributeFlow(
        ISuperToken token,
        address from,
        ISuperfluidPool pool,
        int96 requestedFlowRate,
        bytes calldata userData
    ) external returns (bool);
}

/// @title RegisterAndStream
/// @notice Demo script: register a task type, stake, commit/reveal capacity,
///         rebalance, wrap payment tokens, connect to pool, and start a GDA distribution flow.
///         Usage: forge script script/RegisterAndStream.s.sol --rpc-url base_sepolia --broadcast
///
///         Requires prior deployment — set these env vars:
///           DEPLOYER_PRIVATE_KEY, STAKE_TOKEN, STAKE_MANAGER,
///           CAPACITY_REGISTRY, BACKPRESSURE_POOL, PAYMENT_TOKEN, PAYMENT_SUPER_TOKEN
contract RegisterAndStream is Script {
    address constant GDA_V1_FORWARDER = 0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08;

    struct Addrs {
        IERC20 stakeToken;
        StakeManager stakeManager;
        CapacityRegistry registry;
        BackpressurePool bpPool;
        IERC20 paymentToken;
        ISuperToken paymentSuperToken;
    }

    function _loadAddrs() internal view returns (Addrs memory a) {
        a.stakeToken = IERC20(vm.envAddress("STAKE_TOKEN"));
        a.stakeManager = StakeManager(vm.envAddress("STAKE_MANAGER"));
        a.registry = CapacityRegistry(vm.envAddress("CAPACITY_REGISTRY"));
        a.bpPool = BackpressurePool(vm.envAddress("BACKPRESSURE_POOL"));
        a.paymentToken = IERC20(vm.envAddress("PAYMENT_TOKEN"));
        a.paymentSuperToken = ISuperToken(vm.envAddress("PAYMENT_SUPER_TOKEN"));
    }

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        Addrs memory a = _loadAddrs();
        bytes32 taskTypeId = keccak256("demo/text-summarization");
        IGDAv1Forwarder forwarder = IGDAv1Forwarder(GDA_V1_FORWARDER);

        vm.startBroadcast(deployerKey);

        // ── 1. Register task type ──
        a.registry.registerTaskType(taskTypeId, 100e18);
        console.log("Task type registered");

        // ── 2. Stake and register sink ──
        a.stakeToken.approve(address(a.stakeManager), 200e18);
        a.stakeManager.stake(200e18);
        a.registry.registerSink(taskTypeId, 500);
        console.log("Sink registered (deployer) with capacity 500");

        // ── 3. Create the GDA pool ──
        a.bpPool.createPool(taskTypeId);
        console.log("GDA pool created");

        // ── 4. Commit-reveal capacity update ──
        {
            bytes32 nonce = keccak256("demo-nonce-1");
            bytes32 commitHash = keccak256(abi.encode(uint256(800), nonce));
            a.registry.commitCapacity(taskTypeId, commitHash);
            a.registry.revealCapacity(taskTypeId, 800, nonce);
            console.log("Capacity committed and revealed (800)");
        }

        // ── 5. Rebalance ──
        a.bpPool.rebalance(taskTypeId);
        console.log("Pool rebalanced");

        // ── 6. Connect deployer to GDA pool (required to receive distributions) ──
        {
            address poolAddr = a.bpPool.getPool(taskTypeId);
            forwarder.connectPool(ISuperfluidPool(poolAddr), new bytes(0));
            console.log("Connected to GDA pool");
        }

        // ── 7. Wrap payment tokens into SuperToken ──
        {
            uint256 wrapAmount = 100_000e6; // 100k tUSDC
            a.paymentToken.approve(address(a.paymentSuperToken), wrapAmount);
            a.paymentSuperToken.upgrade(wrapAmount);
            console.log("Wrapped 100000 tUSDC into tUSDCx");
        }

        // ── 8. Start GDA distribution flow via forwarder ──
        {
            address poolAddr = a.bpPool.getPool(taskTypeId);
            int96 flowRate = 1e9; // ~0.001 tUSDC/sec (6 decimals → 1e9 = 1000 tokens/sec is too high, use 1e3)
            flowRate = 1e3; // 0.001 tUSDC/sec
            forwarder.distributeFlow(
                a.paymentSuperToken,
                deployer,
                ISuperfluidPool(poolAddr),
                flowRate,
                new bytes(0)
            );
            console.log("Distribution flow started at rate:", uint256(uint96(flowRate)));
        }

        vm.stopBroadcast();
        console.log("--- Demo Complete ---");
    }
}
