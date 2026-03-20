/**
 * Deterministic seed data for the Lightning dashboard.
 * Wall-clock-derived values — same numbers for every visitor at a given moment.
 */

interface NodeInfo {
  pubkey: string;
  capacity: string;
  fee: string;
  active: boolean;
}

interface LightningState {
  nodes: NodeInfo[];
  totalNodes: number;
  chainId: number;
  seed: boolean;
}

const EPOCH = 1_710_000_000_000;

function wave(t: number, period: number, lo: number, hi: number): number {
  const mid = (lo + hi) / 2;
  const amp = (hi - lo) / 2;
  return Math.round(mid + amp * Math.sin((2 * Math.PI * t) / period));
}

export function generateSeedState(): LightningState {
  const t = Date.now() - EPOCH;

  const nodes: NodeInfo[] = [
    {
      pubkey: "0xaa11bb22cc33dd44ee55ff6677889900aa11bb22cc33dd44ee55ff6677889900",
      capacity: wave(t, 360_000, 3_200_000, 5_800_000).toString(),
      fee: wave(t, 480_000, 12, 28).toString(),
      active: true,
    },
    {
      pubkey: "0xbb22cc33dd44ee55ff6677889900aa11bb22cc33dd44ee55ff6677889900aa11",
      capacity: wave(t, 450_000, 1_800_000, 3_400_000).toString(),
      fee: wave(t, 600_000, 18, 42).toString(),
      active: true,
    },
    {
      pubkey: "0xcc33dd44ee55ff6677889900aa11bb22cc33dd44ee55ff6677889900aa11bb22",
      capacity: wave(t, 540_000, 5_500_000, 8_200_000).toString(),
      fee: wave(t, 720_000, 10, 22).toString(),
      active: true,
    },
  ];

  return {
    nodes,
    totalNodes: 3,
    chainId: 84532,
    seed: true,
  };
}
