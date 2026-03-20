/**
 * Deterministic seed data for the Mandalay gateway dashboard.
 * Wall-clock-derived values — same numbers for every visitor at a given moment.
 */

interface SinkState {
  name: string;
  configured: boolean;
  address?: string;
  units?: string;
  completionRate?: string;
  completions?: string;
  price?: string;
}

interface GatewayState {
  providers: string[];
  sinks: SinkState[];
  pool: string | null;
  baseFee: string;
  chainId: number;
  keys: { total: number; totalRequests: number; withWallet: number };
  seed: boolean;
}

const EPOCH = 1_710_000_000_000;

function wave(t: number, period: number, lo: number, hi: number): number {
  const mid = (lo + hi) / 2;
  const amp = (hi - lo) / 2;
  return Math.round(mid + amp * Math.sin((2 * Math.PI * t) / period));
}

export function generateSeedState(): GatewayState {
  const t = Date.now() - EPOCH;
  const hoursSinceEpoch = t / 3_600_000;

  return {
    providers: ["openai", "anthropic"],
    sinks: [
      {
        name: "openai",
        configured: true,
        address: "0x4936822CB9F8b4d42E35B3502798E366725F054e",
        units: wave(t, 300_000, 45, 75).toString(),
        completionRate: wave(t, 420_000, 92, 99).toString(),
        completions: Math.floor(320 + hoursSinceEpoch * 2.1).toString(),
        price: wave(t, 600_000, 1200, 2800).toString(),
      },
      {
        name: "anthropic",
        configured: true,
        address: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69",
        units: wave(t, 360_000, 30, 55).toString(),
        completionRate: wave(t, 480_000, 94, 99).toString(),
        completions: Math.floor(185 + hoursSinceEpoch * 1.4).toString(),
        price: wave(t, 540_000, 1500, 3200).toString(),
      },
    ],
    pool: "0x8a1F99e32d51C0A826eBD5C1Ff367e8e5CFC1994",
    baseFee: wave(t, 720_000, 800, 1600).toString(),
    chainId: 84532,
    keys: {
      total: Math.floor(12 + hoursSinceEpoch * 0.3),
      totalRequests: Math.floor(505 + hoursSinceEpoch * 3.5),
      withWallet: Math.floor(4 + hoursSinceEpoch * 0.1),
    },
    seed: true,
  };
}
