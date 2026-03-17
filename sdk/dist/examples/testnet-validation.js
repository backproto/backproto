/**
 * testnet-validation.ts - Multi-scenario BPE validation on Base Sepolia.
 *
 * Registers 3 task types, stakes + registers the deployer as sink for each,
 * then runs N cycles of: attestation → queue load → pricing epoch →
 * completion → completion epoch → rebalance, collecting metrics per cycle.
 *
 * Outputs:
 *   - testnet-results.csv  (per-cycle, per-task-type metrics)
 *   - Summary stats to stdout
 *
 * Usage:
 *   PRIVATE_KEY=0x... CYCLES=10 npx tsx sdk/src/examples/testnet-validation.ts
 */
import { createPublicClient, createWalletClient, http, parseEther, keccak256, encodePacked, formatEther, } from "viem";
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
import { writeFileSync } from "fs";
// ─── Config ───
const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
    console.error("Set PRIVATE_KEY env var");
    process.exit(1);
}
const CYCLES = Number(process.env.CYCLES ?? 10);
const CHAIN_ID = 84532;
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
// ─── Task Types ───
const TASK_TYPES = [
    { name: "text-generation", capacity: 50n, queueBase: 8n },
    { name: "image-generation", capacity: 30n, queueBase: 15n },
    { name: "embedding", capacity: 80n, queueBase: 5n },
];
const taskTypeIds = TASK_TYPES.map((t) => keccak256(encodePacked(["string"], [t.name])));
const MIN_STAKE = parseEther("100");
const rows = [];
// ─── Helpers ───
async function waitTx(hash, label) {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  [ok] ${label} - block ${receipt.blockNumber}, gas ${receipt.gasUsed}`);
    return receipt;
}
async function safeTx(fn, label) {
    try {
        const hash = await fn();
        return await waitTx(hash, label);
    }
    catch (e) {
        const msg = e.shortMessage || e.message || "";
        console.log(`  [skip] ${label}: ${msg.slice(0, 120)}`);
        return null;
    }
}
// ─── Setup Phase ───
async function setup() {
    console.log("\n═══ SETUP ═══");
    console.log(`Account : ${account.address}`);
    console.log(`Cycles  : ${CYCLES}`);
    // 1. Ensure sufficient stake
    console.log("\n- Staking -");
    const currentStake = await stake.getStake(publicClient, addrs, account.address);
    if (currentStake < MIN_STAKE) {
        const diff = MIN_STAKE - currentStake;
        await safeTx(() => stake.stake(walletClient, addrs, diff), `stake ${formatEther(diff)} BPE`);
    }
    else {
        console.log(`  Already staked ${formatEther(currentStake)} BPE`);
    }
    // 2. Register task types + pools + sinks
    for (let i = 0; i < TASK_TYPES.length; i++) {
        const t = TASK_TYPES[i];
        const id = taskTypeIds[i];
        console.log(`\n- Task type: ${t.name} -`);
        await safeTx(() => source.registerTaskType(walletClient, addrs, id, MIN_STAKE), `registerTaskType(${t.name})`);
        await safeTx(() => pool.createPool(walletClient, addrs, id), `createPool(${t.name})`);
        await safeTx(() => sink.registerSink(walletClient, addrs, id, t.capacity), `registerSink(${t.name}, cap=${t.capacity})`);
    }
}
// ─── Simulation Loop ───
async function runCycle(cycle) {
    console.log(`\n═══ CYCLE ${cycle + 1}/${CYCLES} ═══`);
    const now = BigInt(Math.floor(Date.now() / 1000));
    for (let i = 0; i < TASK_TYPES.length; i++) {
        const t = TASK_TYPES[i];
        const id = taskTypeIds[i];
        // --- Capacity attestation ---
        const noisedCapacity = t.capacity + BigInt(Math.floor(Math.random() * 11) - 5);
        const signed = await signCapacityAttestation(walletClient, CHAIN_ID, addrs.offchainAggregator, {
            taskTypeId: id,
            sink: account.address,
            capacity: noisedCapacity > 0n ? noisedCapacity : 1n,
            timestamp: now,
            nonce: BigInt(cycle * TASK_TYPES.length + i + 1),
        });
        const rAttest = await safeTx(() => aggregator.submitBatch(walletClient, addrs, [signed]), `attestation(${t.name}, cap=${noisedCapacity})`);
        // --- Queue load ---
        const queueLoad = t.queueBase + BigInt(Math.floor(Math.random() * 10));
        const rQueue = await safeTx(() => pricing.reportQueueLoad(walletClient, addrs, id, account.address, queueLoad), `queueLoad(${t.name}, load=${queueLoad})`);
        // --- Pricing epoch ---
        const rPricing = await safeTx(() => pricing.advancePricingEpoch(walletClient, addrs, id), `pricingEpoch(${t.name})`);
        // --- Completion (80% probability) ---
        let rCompletion = null;
        const doComplete = Math.random() < 0.8;
        if (doComplete) {
            const taskId = keccak256(encodePacked(["string", "uint256", "uint256"], [t.name, now, BigInt(cycle)]));
            const receipt = {
                taskTypeId: id,
                sink: account.address,
                source: account.address,
                taskId,
                timestamp: now,
            };
            const sinkSig = await signCompletionReceipt(walletClient, CHAIN_ID, addrs.completionTracker, receipt);
            rCompletion = await safeTx(() => completion.recordCompletion(walletClient, addrs, id, account.address, taskId, sinkSig), `completion(${t.name})`);
        }
        // --- Completion epoch ---
        const rCompEpoch = await safeTx(() => completion.advanceCompletionEpoch(walletClient, addrs, id, account.address), `completionEpoch(${t.name})`);
        // --- Rebalance ---
        let rRebalance = null;
        const needsReb = await pool.needsRebalance(publicClient, addrs, id);
        if (needsReb) {
            rRebalance = await safeTx(() => pool.rebalance(walletClient, addrs, id), `rebalance(${t.name})`);
        }
        // --- Collect read-only metrics ---
        const [price, baseFee, completionRate, poolUnits] = await Promise.all([
            pricing.getPrice(publicClient, addrs, id, account.address),
            pricing.getBaseFee(publicClient, addrs, id),
            completion.getCompletionRate(publicClient, addrs, id, account.address),
            pool.getMemberUnits(publicClient, addrs, id, account.address),
        ]);
        rows.push({
            cycle: cycle + 1,
            taskType: t.name,
            gasAttestation: rAttest?.gasUsed ?? 0n,
            gasQueueLoad: rQueue?.gasUsed ?? 0n,
            gasPricingEpoch: rPricing?.gasUsed ?? 0n,
            gasCompletion: rCompletion?.gasUsed ?? 0n,
            gasCompletionEpoch: rCompEpoch?.gasUsed ?? 0n,
            gasRebalance: rRebalance?.gasUsed ?? 0n,
            price,
            baseFee,
            completionRate,
            poolUnits,
        });
        console.log(`  => price=${price} baseFee=${baseFee} compRate=${completionRate} units=${poolUnits}`);
    }
}
// ─── Output ───
function writeCSV() {
    const header = "cycle,taskType,gasAttestation,gasQueueLoad,gasPricingEpoch,gasCompletion,gasCompletionEpoch,gasRebalance,price,baseFee,completionRate,poolUnits";
    const lines = rows.map((r) => `${r.cycle},${r.taskType},${r.gasAttestation},${r.gasQueueLoad},${r.gasPricingEpoch},${r.gasCompletion},${r.gasCompletionEpoch},${r.gasRebalance},${r.price},${r.baseFee},${r.completionRate},${r.poolUnits}`);
    const csv = [header, ...lines].join("\n") + "\n";
    writeFileSync("testnet-results.csv", csv);
    console.log(`\nWrote testnet-results.csv (${rows.length} rows)`);
}
function printSummary() {
    console.log("\n═══ SUMMARY ═══");
    const gasFields = [
        "gasAttestation",
        "gasQueueLoad",
        "gasPricingEpoch",
        "gasCompletion",
        "gasCompletionEpoch",
        "gasRebalance",
    ];
    for (const field of gasFields) {
        const vals = rows.map((r) => r[field]).filter((v) => v > 0n);
        if (vals.length === 0)
            continue;
        const avg = vals.reduce((a, b) => a + b, 0n) / BigInt(vals.length);
        const min = vals.reduce((a, b) => (a < b ? a : b));
        const max = vals.reduce((a, b) => (a > b ? a : b));
        console.log(`  ${field.padEnd(22)} avg=${avg}  min=${min}  max=${max}  n=${vals.length}`);
    }
    console.log("\n  Per-task-type final metrics:");
    for (let i = 0; i < TASK_TYPES.length; i++) {
        const name = TASK_TYPES[i].name;
        const taskRows = rows.filter((r) => r.taskType === name);
        const lastRow = taskRows[taskRows.length - 1];
        if (lastRow) {
            console.log(`    ${name.padEnd(20)} price=${lastRow.price}  baseFee=${lastRow.baseFee}  compRate=${lastRow.completionRate}  units=${lastRow.poolUnits}`);
        }
    }
    // Price convergence: std dev of last 3 cycles per task type
    console.log("\n  Price convergence (last 3 cycles):");
    for (let i = 0; i < TASK_TYPES.length; i++) {
        const name = TASK_TYPES[i].name;
        const taskRows = rows.filter((r) => r.taskType === name);
        const tail = taskRows.slice(-3).map((r) => Number(r.price));
        if (tail.length >= 2) {
            const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
            const variance = tail.reduce((a, b) => a + (b - mean) ** 2, 0) / tail.length;
            const stddev = Math.sqrt(variance);
            console.log(`    ${name.padEnd(20)} mean=${mean.toFixed(0)}  stddev=${stddev.toFixed(1)}`);
        }
    }
}
// ─── Main ───
async function main() {
    console.log("BPE Testnet Validation - Base Sepolia");
    await setup();
    for (let c = 0; c < CYCLES; c++) {
        await runCycle(c);
    }
    writeCSV();
    printSummary();
    console.log("\nDone.");
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
