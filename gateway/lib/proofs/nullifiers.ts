import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getRedisToken, getRedisUrl, useRedis } from "@/lib/redis-config";

const DATA_DIR = join(process.cwd(), "data");
const NULLIFIERS_FILE = join(DATA_DIR, "nullifiers.json");
const WEEK_SECONDS = 7 * 24 * 60 * 60;

export interface NullifierRecord {
  nullifier: string;
  issuer: string;
  epoch: string;
  claimedAt: string;
  keyHash: string | null;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadNullifiers(): NullifierRecord[] {
  ensureDataDir();
  if (!existsSync(NULLIFIERS_FILE)) return [];
  return JSON.parse(readFileSync(NULLIFIERS_FILE, "utf-8")) as NullifierRecord[];
}

function saveNullifiers(records: NullifierRecord[]) {
  ensureDataDir();
  writeFileSync(NULLIFIERS_FILE, JSON.stringify(records, null, 2));
}

async function redisGet(key: string): Promise<string | null> {
  const res = await fetch(`${getRedisUrl()}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${getRedisToken()}` },
  });
  const data = (await res.json()) as { result: string | null };
  return data.result;
}

async function redisSetNx(key: string, value: string, exSeconds: number): Promise<boolean> {
  const res = await fetch(`${getRedisUrl()}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getRedisToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, value, "NX", "EX", String(exSeconds)]),
  });
  const data = (await res.json()) as { result: string | null };
  return data.result === "OK";
}

export async function claimNullifier(
  nullifier: string,
  issuer: string,
  epoch: string,
  keyHash: string | null,
): Promise<boolean> {
  const record: NullifierRecord = {
    nullifier,
    issuer,
    epoch,
    claimedAt: new Date().toISOString(),
    keyHash,
  };

  if (useRedis()) {
    const key = `pura:nullifier:${issuer}:${epoch}:${nullifier}`;
    return redisSetNx(key, JSON.stringify(record), WEEK_SECONDS);
  }

  const records = loadNullifiers();
  const exists = records.some((r) => r.issuer === issuer && r.epoch === epoch && r.nullifier === nullifier);
  if (exists) return false;
  records.push(record);
  saveNullifiers(records);
  return true;
}

export async function getActiveNullifier(keyHash: string, epoch: string): Promise<NullifierRecord | null> {
  if (useRedis()) {
    const res = await fetch(`${getRedisUrl()}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getRedisToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["KEYS", `pura:nullifier:*:${epoch}:*`]),
    });
    const data = (await res.json()) as { result: string[] };
    const keys = data.result ?? [];

    for (const key of keys) {
      const raw = await redisGet(key);
      if (!raw) continue;
      const record = JSON.parse(raw) as NullifierRecord;
      if (record.keyHash === keyHash) return record;
    }
    return null;
  }

  const records = loadNullifiers();
  return records.find((r) => r.keyHash === keyHash && r.epoch === epoch) ?? null;
}
