import { NextResponse } from "next/server";
import { getAddresses, openclaw, platform } from "@backproto/sdk";
import { publicClient, chainId } from "@/lib/chain";

export const runtime = "nodejs";

const DEMO_SKILL: `0x${string}` =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

export async function GET() {
  const addrs = getAddresses(chainId);

  const agentIds = await openclaw
    .getAgentsForSkill(publicClient, addrs, DEMO_SKILL)
    .catch(() => [] as `0x${string}`[]);

  const agents = await Promise.all(
    agentIds.slice(0, 20).map(async (id) => {
      const [agent, reputation] = await Promise.all([
        openclaw.getAgent(publicClient, addrs, id).catch(() => null),
        openclaw
          .getOpenClawReputation(
            publicClient,
            addrs,
            "0x0000000000000000000000000000000000000000",
          )
          .catch(() => null),
      ]);
      if (!agent) return null;

      let operatorRep = reputation;
      if (agent.operator !== "0x0000000000000000000000000000000000000000") {
        operatorRep = await openclaw
          .getOpenClawReputation(publicClient, addrs, agent.operator)
          .catch(() => reputation);
      }

      return {
        id,
        operator: agent.operator,
        skillTypeId: agent.skillTypeId,
        capacity: agent.smoothedCapacity.toString(),
        active: agent.active,
        reputation: operatorRep
          ? {
              score: operatorRep.score.toString(),
              completions: operatorRep.completions.toString(),
              slashCount: operatorRep.slashCount.toString(),
            }
          : null,
      };
    }),
  );

  const protocolAvailable = await platform
    .isProtocolAvailable(publicClient, addrs, 2)
    .catch(() => false);

  return NextResponse.json({
    agents: agents.filter(Boolean),
    totalAgents: agentIds.length,
    protocolAvailable,
    chainId,
  });
}
