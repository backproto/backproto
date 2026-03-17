/**
 * full-flow.ts - End-to-end BPE example on Base Sepolia.
 *
 * Demonstrates the complete lifecycle:
 *   1. Register a task type and GDA pool
 *   2. Stake tokens and register as a sink
 *   3. Report capacity via off-chain attestation
 *   4. Start a payment stream (source → pool)
 *   5. Report queue load and read dynamic price
 *   6. Record a completion with dual EIP-712 signatures
 *   7. Rebalance pool weights
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx sdk/src/examples/full-flow.ts
 */
import { createPublicClient, createWalletClient, http, parseEther, keccak256, encodePacked, } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { getAddresses } from "../addresses.js";
import * as stake from "../actions/stake.js";
import * as sink from "../actions/sink.js";
import * as pool from "../actions/pool.js";
import * as source from "../actions/source.js";
import * as pricing from "../actions/pricing.js";
import * as completion from "../actions/completion.js";
import * as aggregator from "../actions/aggregator.js";
import { signCapacityAttestation, signCompletionReceipt } from "../signing.js";
// ─── Config ───
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.error("Set PRIVATE_KEY env var");
    process.exit(1);
}
const CHAIN_ID = 84532; // Base Sepolia
const addrs = getAddresses(CHAIN_ID);
const account = privateKeyToAccount(PRIVATE_KEY);
const transport = http();
const publicClient = createPublicClient({
    chain: baseSepolia,
    transport,
});
const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport,
});
// Task type: a deterministic ID for "text-generation"
const TASK_TYPE_ID = keccak256(encodePacked(["string"], ["text-generation"]));
const MIN_STAKE = parseEther("100"); // 100 BPE tokens
const INITIAL_CAPACITY = 50n;
const FLOW_RATE = 1000n; // tokens/sec in SuperToken units
async function waitForTx(hash, label) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✓ ${label} (block ${receipt.blockNumber})`);
    return receipt;
}
// ─── Main Flow ───
async function main() {
    console.log(`\nBPE Full Flow - Base Sepolia`);
    console.log(`Account: ${account.address}\n`);
    // ── Step 1: Register task type + create pool ──
    console.log("Step 1: Register task type & create pool");
    try {
        const tx1 = await source.registerTaskType(walletClient, addrs, TASK_TYPE_ID, MIN_STAKE);
        await waitForTx(tx1, "registerTaskType");
    }
    catch (e) {
        if (e.message?.includes("already registered")) {
            console.log("  (task type already registered, skipping)");
        }
        else
            throw e;
    }
    try {
        const tx2 = await pool.createPool(walletClient, addrs, TASK_TYPE_ID);
        await waitForTx(tx2, "createPool");
    }
    catch (e) {
        if (e.message?.includes("already exists")) {
            console.log("  (pool already exists, skipping)");
        }
        else
            throw e;
    }
    // ── Step 2: Stake tokens + register as sink ──
    console.log("\nStep 2: Stake & register as sink");
    const currentStake = await stake.getStake(publicClient, addrs, account.address);
    if (currentStake < MIN_STAKE) {
        // Note: caller must have approved StakeManager to spend stakeToken first
        const txStake = await stake.stake(walletClient, addrs, MIN_STAKE - currentStake);
        await waitForTx(txStake, `stake ${MIN_STAKE - currentStake} tokens`);
    }
    else {
        console.log(`  (already staked ${currentStake} tokens)`);
    }
    try {
        const txSink = await sink.registerSink(walletClient, addrs, TASK_TYPE_ID, INITIAL_CAPACITY);
        await waitForTx(txSink, "registerSink");
    }
    catch (e) {
        if (e.message?.includes("already registered")) {
            console.log("  (sink already registered, skipping)");
        }
        else
            throw e;
    }
    // ── Step 3: Off-chain capacity attestation ──
    console.log("\nStep 3: Sign & submit capacity attestation");
    const now = BigInt(Math.floor(Date.now() / 1000));
    const signed = await signCapacityAttestation(walletClient, CHAIN_ID, addrs.offchainAggregator, {
        taskTypeId: TASK_TYPE_ID,
        sink: account.address,
        capacity: 75n, // updated capacity
        timestamp: now,
        nonce: 1n,
    });
    console.log(`  Signed attestation (capacity=75, nonce=1)`);
    const txBatch = await aggregator.submitBatch(walletClient, addrs, [signed]);
    await waitForTx(txBatch, "submitBatch (1 attestation)");
    // ── Step 4: Start payment stream ──
    console.log("\nStep 4: Start payment stream");
    const poolAddr = await pool.getPoolAddress(publicClient, addrs, TASK_TYPE_ID);
    console.log(`  Pool address: ${poolAddr}`);
    // Note: caller must have tUSDCx (wrapped SuperToken) balance
    try {
        const txStream = await source.startStream(walletClient, addrs, poolAddr, FLOW_RATE);
        await waitForTx(txStream, `startStream (rate=${FLOW_RATE})`);
    }
    catch (e) {
        console.log(`  Stream setup: ${e.shortMessage || e.message}`);
    }
    // ── Step 5: Report queue load + read price ──
    console.log("\nStep 5: Report queue load & read price");
    const txQueue = await pricing.reportQueueLoad(walletClient, addrs, TASK_TYPE_ID, account.address, 10n);
    await waitForTx(txQueue, "reportQueueLoad (load=10)");
    const price = await pricing.getPrice(publicClient, addrs, TASK_TYPE_ID, account.address);
    const baseFee = await pricing.getBaseFee(publicClient, addrs, TASK_TYPE_ID);
    console.log(`  Current price: ${price} (base fee: ${baseFee})`);
    // ── Step 6: Record completion (dual-signed) ──
    console.log("\nStep 6: Record completion");
    const taskId = keccak256(encodePacked(["string", "uint256"], ["task-001", now]));
    const receipt = {
        taskTypeId: TASK_TYPE_ID,
        sink: account.address,
        source: account.address, // self-sourced for demo
        taskId,
        timestamp: now,
    };
    // In production, sink and source are different accounts.
    // Here we demo with the same account signing both roles.
    const sinkSig = await signCompletionReceipt(walletClient, CHAIN_ID, addrs.completionTracker, receipt);
    console.log(`  Sink signed completion receipt`);
    // Source calls recordCompletion (msg.sender = source)
    try {
        const txComplete = await completion.recordCompletion(walletClient, addrs, TASK_TYPE_ID, account.address, taskId, sinkSig);
        await waitForTx(txComplete, "recordCompletion");
    }
    catch (e) {
        console.log(`  Completion: ${e.shortMessage || e.message}`);
    }
    // ── Step 7: Rebalance ──
    console.log("\nStep 7: Rebalance pool");
    const needsReb = await pool.needsRebalance(publicClient, addrs, TASK_TYPE_ID);
    if (needsReb) {
        const txReb = await pool.rebalance(walletClient, addrs, TASK_TYPE_ID);
        await waitForTx(txReb, "rebalance");
    }
    else {
        console.log("  (no rebalance needed)");
    }
    // ── Summary ──
    console.log("\n── Summary ──");
    const finalStake = await stake.getStake(publicClient, addrs, account.address);
    const cap = await stake.getCapacityCap(publicClient, addrs, account.address);
    const completions = await completion.getCompletions(publicClient, addrs, TASK_TYPE_ID, account.address);
    const flowRate = await source.getFlowRate(publicClient, addrs, account.address, poolAddr);
    console.log(`  Stake:       ${finalStake}`);
    console.log(`  Capacity cap: ${cap}`);
    console.log(`  Completions:  ${completions}`);
    console.log(`  Flow rate:    ${flowRate}`);
    console.log(`  Price:        ${price}`);
    console.log(`\nDone.`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
