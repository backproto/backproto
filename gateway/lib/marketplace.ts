/**
 * Marketplace: agent-to-agent skill exchange.
 * Uses Redis for persistence when available, falls back to in-memory for dev.
 */

import { useRedis, getRedisUrl, getRedisToken } from "./redis-config";

// ─── Types ───

export interface SkillRegistration {
  agentId: string;
  skillType: string;
  price: number; // sats per task
  capacity: number; // max concurrent tasks
  activeJobs: number;
  qualityScore: number;
  description: string;
  registeredAt: number;
}

export interface TaskPost {
  taskId: string;
  skillType: string;
  payload: string;
  maxPrice: number;
  requesterId: string;
  assignedTo: string | null;
  status: "open" | "assigned" | "completed" | "failed";
  createdAt: number;
  completedAt: number | null;
  qualityRating: number | null;
  paymentHash: string | null;
}

// ─── Redis helpers ───

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${getRedisUrl()}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${getRedisToken()}` },
  });
  const data = (await res.json()) as { result: string | null };
  return data.result;
}

async function redisSet(key: string, value: string): Promise<void> {
  await fetch(`${getRedisUrl()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRedisToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, value]),
  });
}

async function redisSMembers(key: string): Promise<string[]> {
  const res = await fetch(`${getRedisUrl()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRedisToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SMEMBERS", key]),
  });
  const data = (await res.json()) as { result: string[] };
  return data.result ?? [];
}

async function redisSAdd(key: string, member: string): Promise<void> {
  await fetch(`${getRedisUrl()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRedisToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SADD", key, member]),
  });
}

// ─── In-memory fallback (dev only) ───

const memSkills = new Map<string, SkillRegistration[]>();
const memTasks = new Map<string, TaskPost>();

// ─── Helpers ───

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Skill registration ───

export async function registerSkill(
  reg: Omit<SkillRegistration, "activeJobs" | "qualityScore" | "registeredAt">,
): Promise<SkillRegistration> {
  const full: SkillRegistration = {
    ...reg,
    activeJobs: 0,
    qualityScore: 1.0,
    registeredAt: Date.now(),
  };

  if (useRedis()) {
    // Load existing registrations for this agent
    const existing = await getAgentSkills(reg.agentId);
    const idx = existing.findIndex((s) => s.skillType === reg.skillType);
    if (idx >= 0) {
      existing[idx] = full;
    } else {
      existing.push(full);
    }
    await redisSet(`pura:mp:agent:${reg.agentId}`, JSON.stringify(existing));
    await redisSAdd("pura:mp:agents", reg.agentId);
    // Also index by skill type for fast search
    await redisSAdd(`pura:mp:skill:${reg.skillType}`, reg.agentId);
    await redisSAdd("pura:mp:skillTypes", reg.skillType);
  } else {
    const existing = memSkills.get(reg.agentId) ?? [];
    const idx = existing.findIndex((s) => s.skillType === reg.skillType);
    if (idx >= 0) {
      existing[idx] = full;
    } else {
      existing.push(full);
    }
    memSkills.set(reg.agentId, existing);
  }

  return full;
}

export async function getAgentSkills(agentId: string): Promise<SkillRegistration[]> {
  if (useRedis()) {
    const data = await redisGet(`pura:mp:agent:${agentId}`);
    if (!data) return [];
    return JSON.parse(data) as SkillRegistration[];
  }
  return memSkills.get(agentId) ?? [];
}

// ─── Search ───

export interface SearchParams {
  skillType: string;
  maxPrice?: number;
}

export async function searchSkills(params: SearchParams): Promise<SkillRegistration[]> {
  const results: SkillRegistration[] = [];

  if (useRedis()) {
    // Get all agents that registered this skill type
    const agentIds = await redisSMembers(`pura:mp:skill:${params.skillType}`);
    for (const agentId of agentIds) {
      const skills = await getAgentSkills(agentId);
      for (const reg of skills) {
        if (reg.skillType !== params.skillType) continue;
        if (params.maxPrice !== undefined && reg.price > params.maxPrice) continue;
        if (reg.activeJobs >= reg.capacity) continue;
        results.push(reg);
      }
    }
  } else {
    for (const regs of memSkills.values()) {
      for (const reg of regs) {
        if (reg.skillType !== params.skillType) continue;
        if (params.maxPrice !== undefined && reg.price > params.maxPrice) continue;
        if (reg.activeJobs >= reg.capacity) continue;
        results.push(reg);
      }
    }
  }

  // Sort by quality/price ratio (higher is better)
  results.sort((a, b) => {
    const ratioA = a.qualityScore / Math.max(a.price, 1);
    const ratioB = b.qualityScore / Math.max(b.price, 1);
    return ratioB - ratioA;
  });
  return results;
}

// ─── Task lifecycle ───

export async function createTask(
  post: Pick<TaskPost, "skillType" | "payload" | "maxPrice" | "requesterId">,
): Promise<TaskPost> {
  const task: TaskPost = {
    taskId: generateId(),
    skillType: post.skillType,
    payload: post.payload,
    maxPrice: post.maxPrice,
    requesterId: post.requesterId,
    assignedTo: null,
    status: "open",
    createdAt: Date.now(),
    completedAt: null,
    qualityRating: null,
    paymentHash: null,
  };

  if (useRedis()) {
    await redisSet(`pura:mp:task:${task.taskId}`, JSON.stringify(task));
    await redisSAdd("pura:mp:tasks", task.taskId);
  } else {
    memTasks.set(task.taskId, task);
  }

  return task;
}

export async function assignTask(taskId: string, agentId: string): Promise<TaskPost | null> {
  const task = await getTask(taskId);
  if (!task || task.status !== "open") return null;

  const regs = await getAgentSkills(agentId);
  const reg = regs.find((r) => r.skillType === task.skillType);
  if (!reg || reg.activeJobs >= reg.capacity) return null;
  if (reg.price > task.maxPrice) return null;

  task.assignedTo = agentId;
  task.status = "assigned";
  reg.activeJobs++;

  if (useRedis()) {
    await redisSet(`pura:mp:task:${taskId}`, JSON.stringify(task));
    // Update agent skills with incremented activeJobs
    await redisSet(`pura:mp:agent:${agentId}`, JSON.stringify(regs));
  }

  return task;
}

export async function completeTask(
  taskId: string,
  agentId: string,
  qualityRating: number,
): Promise<TaskPost | null> {
  const task = await getTask(taskId);
  if (!task || task.status !== "assigned" || task.assignedTo !== agentId) return null;

  task.status = "completed";
  task.completedAt = Date.now();
  task.qualityRating = Math.max(0, Math.min(1, qualityRating));

  // Update agent quality score (exponential moving average)
  const regs = await getAgentSkills(agentId);
  const reg = regs.find((r) => r.skillType === task.skillType);
  if (reg) {
    reg.activeJobs = Math.max(0, reg.activeJobs - 1);
    reg.qualityScore = 0.8 * reg.qualityScore + 0.2 * task.qualityRating;
  }

  if (useRedis()) {
    await redisSet(`pura:mp:task:${taskId}`, JSON.stringify(task));
    await redisSet(`pura:mp:agent:${agentId}`, JSON.stringify(regs));
  }

  return task;
}

export async function getTask(taskId: string): Promise<TaskPost | null> {
  if (useRedis()) {
    const data = await redisGet(`pura:mp:task:${taskId}`);
    if (!data) return null;
    return JSON.parse(data) as TaskPost;
  }
  return memTasks.get(taskId) ?? null;
}

// ─── Aggregate stats ───

export interface MarketplaceStats {
  totalAgents: number;
  totalSkills: number;
  totalTasks: number;
  completedTasks: number;
  totalSatsTransacted: number;
  skillPrices: Record<string, { avgPrice: number; count: number }>;
  recentTasks: TaskPost[];
  leaderboard: { agentId: string; earnings: number; quality: number }[];
}

export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  let totalSkills = 0;
  const skillPriceMap = new Map<string, { sum: number; count: number }>();
  const agentEarnings = new Map<string, { earnings: number; quality: number }>();

  // Load all agents
  let allAgentIds: string[];
  if (useRedis()) {
    allAgentIds = await redisSMembers("pura:mp:agents");
  } else {
    allAgentIds = Array.from(memSkills.keys());
  }

  for (const agentId of allAgentIds) {
    const regs = await getAgentSkills(agentId);
    totalSkills += regs.length;
    for (const reg of regs) {
      const sp = skillPriceMap.get(reg.skillType) ?? { sum: 0, count: 0 };
      sp.sum += reg.price;
      sp.count++;
      skillPriceMap.set(reg.skillType, sp);
    }
    if (!agentEarnings.has(agentId)) {
      agentEarnings.set(agentId, { earnings: 0, quality: 1 });
    }
  }

  // Load all tasks
  let allTasks: TaskPost[];
  if (useRedis()) {
    const taskIds = await redisSMembers("pura:mp:tasks");
    allTasks = [];
    for (const taskId of taskIds) {
      const task = await getTask(taskId);
      if (task) allTasks.push(task);
    }
  } else {
    allTasks = Array.from(memTasks.values());
  }

  let completedTasks = 0;
  let totalSats = 0;

  for (const task of allTasks) {
    if (task.status === "completed" && task.assignedTo) {
      completedTasks++;
      const regs = await getAgentSkills(task.assignedTo);
      const reg = regs.find((r) => r.skillType === task.skillType);
      const price = reg?.price ?? 0;
      totalSats += price;

      const ae = agentEarnings.get(task.assignedTo) ?? { earnings: 0, quality: 1 };
      ae.earnings += price;
      if (reg) ae.quality = reg.qualityScore;
      agentEarnings.set(task.assignedTo, ae);
    }
  }

  // Sort recent by creation time, take last 20
  allTasks.sort((a, b) => b.createdAt - a.createdAt);

  const skillPrices: Record<string, { avgPrice: number; count: number }> = {};
  for (const [type, data] of skillPriceMap.entries()) {
    skillPrices[type] = { avgPrice: Math.round(data.sum / data.count), count: data.count };
  }

  const leaderboard = Array.from(agentEarnings.entries())
    .map(([agentId, data]) => ({ agentId, ...data }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10);

  return {
    totalAgents: allAgentIds.length,
    totalSkills,
    totalTasks: allTasks.length,
    completedTasks,
    totalSatsTransacted: totalSats,
    skillPrices,
    recentTasks: allTasks.slice(0, 20),
    leaderboard,
  };
}
