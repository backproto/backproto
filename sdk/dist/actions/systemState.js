import { abis } from "../abis/index.js";
import { write } from "../helpers.js";
/**
 * Emit an aggregated system state snapshot for a given scope.
 */
export async function emitState(walletClient, addrs, scope) {
    return write(walletClient, {
        address: addrs.systemStateEmitter, abi: abis.SystemStateEmitter,
        functionName: "emitSystemState", args: [scope],
    });
}
