import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { getRedisToken, getRedisUrl, useRedis } from "@/lib/redis-config";
import type { ProofClass } from "./types";

const DATA_DIR = join(process.cwd(), "data");
const PROOFS_FILE = join(DATA_DIR, "proofs.json");
const WEEK_SECONDS = 7 * 24 * 60 * 60;

export interface StoredProof {
  proofId: string;
  keyHash: string;
  proofClass: ProofClass;
  createdAt: string;
  expiresAt: string;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadProofs(): StoredProof[] {
  ensureDataDir();
  if (!existsSync(PROOFS_FILE)) return [];
  return JSON.parse(readFileSync(PROOFS_FILE, "utf-8")) as StoredProof[];
}

function saveProofs(records: StoredProof[]) {
  ensureDataDir();
  writeFileSync(PROOFS_FILE, JSON.stringify(records, null, 2));
}

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${getRedisUrl()}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${getRedisToken()}` },
  });
  const data = (await res.json()) as { result: string | null };
  return data.result;
}

async function redisSet(key: string, value: string, exSeconds: number): Promise<void> {
  await fetch(`${getRedisUrl()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRedisToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, value, "EX", String(exSeconds)]),
  });
}

export async function storeProof(keyHash: string, proofClass: ProofClass, expiresAt: string): Promise<StoredProof> {
  const proof: StoredProof = {
    proofId: `proof_${randomUUID()}`,
    keyHash,
    proofClass,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  if (useRedis()) {
    await redisSet(`pura:proof:${proof.proofId}`, JSON.stringify(proof), WEEK_SECONDS);
    return proof;
  }

  const records = loadProofs();
  records.push(proof);
  saveProofs(records);
  return proof;
}

export async function getProofById(proofId: string): Promise<StoredProof | null> {
  if (useRedis()) {
    const raw = await redisGet(`pura:proof:${proofId}`);
    if (!raw) return null;
    return JSON.parse(raw) as StoredProof;
  }

  const records = loadProofs();
  return records.find((r) => r.proofId === proofId) ?? null;
}
