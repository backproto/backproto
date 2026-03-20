/**
 * Deterministic seed data for the agent explorer.
 * All values derived from Date.now() — consistent across visitors.
 */

interface AgentInfo {
  id: string;
  operator: string;
  skillTypeId: string;
  capacity: string;
  active: boolean;
  reputation: {
    score: string;
    completions: string;
    slashCount: string;
  } | null;
  measurabilityGap: string;
}

interface ExplorerState {
  agents: AgentInfo[];
  totalAgents: number;
  protocolAvailable: boolean;
  chainId: number;
  seed: boolean;
}

const EPOCH = 1_710_000_000_000;

function wave(t: number, period: number, lo: number, hi: number): number {
  const mid = (lo + hi) / 2;
  const amp = (hi - lo) / 2;
  return Math.round(mid + amp * Math.sin((2 * Math.PI * t) / period));
}

export function generateSeedState(): ExplorerState {
  const t = Date.now() - EPOCH;
  const hoursSinceEpoch = t / 3_600_000;

  const agents: AgentInfo[] = [
    {
      id: "0x0000000000000000000000000000000000000000000000000000000000000001",
      operator: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
      skillTypeId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      capacity: wave(t, 300_000, 80, 120).toString(),
      active: true,
      reputation: {
        score: wave(t, 600_000, 82, 94).toString(),
        completions: Math.floor(140 + hoursSinceEpoch * 1.2).toString(),
        slashCount: "0",
      },
      measurabilityGap: wave(t, 500_000, 5, 18).toString(),
    },
    {
      id: "0x0000000000000000000000000000000000000000000000000000000000000002",
      operator: "0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
      skillTypeId: "0x0000000000000000000000000000000000000000000000000000000000000001",
      capacity: wave(t, 420_000, 60, 95).toString(),
      active: true,
      reputation: {
        score: wave(t, 480_000, 74, 88).toString(),
        completions: Math.floor(85 + hoursSinceEpoch * 0.8).toString(),
        slashCount: "1",
      },
      measurabilityGap: wave(t, 400_000, 22, 48).toString(),
    },
    {
      id: "0x0000000000000000000000000000000000000000000000000000000000000003",
      operator: "0x6813Eb9362372EEF6200f3b1dbC3f819671cBA69",
      skillTypeId: "0x0000000000000000000000000000000000000000000000000000000000000002",
      capacity: wave(t, 360_000, 150, 220).toString(),
      active: true,
      reputation: {
        score: wave(t, 540_000, 88, 96).toString(),
        completions: Math.floor(210 + hoursSinceEpoch * 1.5).toString(),
        slashCount: "0",
      },
      measurabilityGap: wave(t, 450_000, 3, 12).toString(),
    },
  ];

  return {
    agents,
    totalAgents: 3,
    protocolAvailable: true,
    chainId: 84532,
    seed: true,
  };
}
