import { type WalletClient, type PublicClient, type Hash, type Abi } from "viem";

/**
 * Helper: writeContract with account and chain derived from walletClient.
 * Avoids viem strict typing issues when using generic Abi.
 */
export async function write(
  walletClient: WalletClient,
  params: { address: `0x${string}`; abi: Abi; functionName: string; args?: unknown[] },
): Promise<Hash> {
  return walletClient.writeContract({
    ...params,
    chain: walletClient.chain ?? null,
    account: walletClient.account!,
  } as any);
}

/**
 * Helper: readContract with type assertion.
 */
export async function read<T>(
  publicClient: PublicClient,
  params: { address: `0x${string}`; abi: Abi; functionName: string; args?: unknown[] },
): Promise<T> {
  return publicClient.readContract(params as any) as Promise<T>;
}
