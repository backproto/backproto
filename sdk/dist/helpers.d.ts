import { type WalletClient, type PublicClient, type Hash, type Abi } from "viem";
/**
 * Helper: writeContract with account and chain derived from walletClient.
 * Avoids viem strict typing issues when using generic Abi.
 */
export declare function write(walletClient: WalletClient, params: {
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args?: unknown[];
}): Promise<Hash>;
/**
 * Helper: readContract with type assertion.
 */
export declare function read<T>(publicClient: PublicClient, params: {
    address: `0x${string}`;
    abi: Abi;
    functionName: string;
    args?: unknown[];
}): Promise<T>;
