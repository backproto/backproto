import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, base } from "viem/chains";

function getChain(): Chain {
  const id = Number(process.env.CHAIN_ID ?? 84532);
  if (id === 8453) return base;
  return baseSepolia;
}

const rpcUrl = process.env.RPC_URL ?? "https://sepolia.base.org";
const chain = getChain();

export const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

export const chainId = chain.id;

export function operatorWallet(): WalletClient {
  const pk = process.env.OPERATOR_PRIVATE_KEY;
  if (!pk) throw new Error("OPERATOR_PRIVATE_KEY not set");
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
}
