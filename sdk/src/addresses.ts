export type ChainAddresses = {
  stakeToken: `0x${string}`;
  stakeManager: `0x${string}`;
  capacityRegistry: `0x${string}`;
  bpeSuperToken: `0x${string}`;
  paymentToken: `0x${string}`;
  paymentSuperToken: `0x${string}`;
  backpressurePool: `0x${string}`;
  escrowBuffer: `0x${string}`;
  pipeline: `0x${string}`;
  pricingCurve: `0x${string}`;
  completionTracker: `0x${string}`;
  offchainAggregator: `0x${string}`;
  gdaV1: `0x${string}`;
  gdaV1Forwarder: `0x${string}`;
  superTokenFactory: `0x${string}`;
};

/** Well-known Superfluid addresses on Base Sepolia */
const SUPERFLUID_BASE_SEPOLIA = {
  gdaV1: "0x53F4f44C813Dc380182d0b2b67fe5832A12B97f8" as `0x${string}`,
  gdaV1Forwarder: "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08" as `0x${string}`,
  superTokenFactory: "0x7447E94Dfe3d804a9f46Bf12838d467c912C8F6C" as `0x${string}`,
};

/**
 * Deployed contract addresses per chain.
 * Populated after running Deploy.s.sol and recording output.
 */
export const addresses: Record<number, ChainAddresses> = {
  // Base Sepolia (chain ID 84532) — deployed 2026-03-14
  84532: {
    stakeToken: "0xf5cf3cd405ac3b48dde534d9793ce9118d4ca4a5",
    stakeManager: "0xdc26b147030f635a2f8ac466d28a88b3b33ca6b3",
    capacityRegistry: "0x6f58f28c0a270c198c65cff5c5a7ba9d86088948",
    bpeSuperToken: "0x7faf85cc70540ef4e9bf8880150ff4fd7a4d2fa4",
    paymentToken: "0xb1152e5426e4cebd7a3f034fff7fae2711e8ff15",
    paymentSuperToken: "0x04bf42ae7d7b55c2000653067ccd37400a4f5a74",
    backpressurePool: "0x8e999a246afea241cf3c1d400dd7786cf591fa88",
    escrowBuffer: "0x8d2f5b40315cccf9b7aa10869c035f9c7a0a3160",
    pipeline: "0xbc2c20d75ab5a03f592bcfdb7d8c40fdd3f7afa7",
    pricingCurve: "0x11522daf010c08d5d26a2b1369567279a27338e3",
    completionTracker: "0xff3dab79a53ffd11bae041e094ed0b6217acfc3c",
    offchainAggregator: "0xa70993d6d4cb5e4cf5ee8ddcbfde875e55a937fa",
    ...SUPERFLUID_BASE_SEPOLIA,
  },
};

export function getAddresses(chainId: number): ChainAddresses {
  const addrs = addresses[chainId];
  if (!addrs) {
    throw new Error(`No addresses configured for chain ${chainId}`);
  }
  return addrs;
}
