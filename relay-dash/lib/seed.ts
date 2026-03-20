/**
 * Deterministic seed data for the relay dashboard.
 * Generates smoothly changing values from wall-clock time so every visitor
 * sees the same numbers at the same moment.  No randomness, no network.
 */

interface RelayInfo {
  pubkey: string;
  operator: string;
  capacity: string;
  registered: boolean;
}

interface RelayState {
  relays: RelayInfo[];
  antiSpamMinimums: { write: string; read: string; store: string };
  totalRelays: number;
  chainId: number;
  seed: boolean;
}

const EPOCH = 1_710_000_000_000; // ~2024-03-09, arbitrary fixed anchor

function wave(t: number, period: number, lo: number, hi: number): number {
  const mid = (lo + hi) / 2;
  const amp = (hi - lo) / 2;
  return Math.round(mid + amp * Math.sin((2 * Math.PI * t) / period));
}

export function generateSeedState(): RelayState {
  const t = Date.now() - EPOCH;
  const hoursSinceEpoch = t / 3_600_000;

  const relays: RelayInfo[] = [
    {
      pubkey: "0xa1c3e5f708192b3d4e6a8c0f2b4d6e8a1c3e5f708192b3d4e6a8c0f2b4d6e8a",
      operator: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
      capacity: wave(t, 300_000, 420, 580).toString(),
      registered: true,
    },
    {
      pubkey: "0xb2d4f6a809213c4e5f7b9d1a3c5e7f09213c4e5f7b9d1a3c5e7f09213c4e5f7b",
      operator: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
      capacity: wave(t, 420_000, 260, 340).toString(),
      registered: true,
    },
    {
      pubkey: "0xc3e5f7b90a324d5e6f8a0c2d4e6f8a0b2d4f6a8c0e2a4c6e8f0a2c4e6a8c0e2",
      operator: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69",
      capacity: wave(t, 540_000, 700, 860).toString(),
      registered: true,
    },
  ];

  const totalRelays = 3 + Math.floor(hoursSinceEpoch / 48);

  return {
    relays,
    antiSpamMinimums: {
      write: wave(t, 600_000, 8, 14).toString(),
      read: wave(t, 750_000, 3, 7).toString(),
      store: wave(t, 900_000, 15, 25).toString(),
    },
    totalRelays,
    chainId: 84532,
    seed: true,
  };
}
