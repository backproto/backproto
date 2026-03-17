/**
 * Helper: writeContract with account and chain derived from walletClient.
 * Avoids viem strict typing issues when using generic Abi.
 */
export async function write(walletClient, params) {
    return walletClient.writeContract({
        ...params,
        chain: walletClient.chain ?? null,
        account: walletClient.account,
    });
}
/**
 * Helper: readContract with type assertion.
 */
export async function read(publicClient, params) {
    return publicClient.readContract(params);
}
