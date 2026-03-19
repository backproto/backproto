import { randomBytes, createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const KEYS_FILE = join(DATA_DIR, "keys.json");

export interface ApiKeyRecord {
  /** The hashed key (sha256 hex) — stored, never the raw key */
  hash: string;
  /** Key prefix for display (first 8 chars) */
  prefix: string;
  /** Optional label */
  label: string;
  /** Linked wallet address (set later) */
  wallet: string | null;
  /** Total requests made */
  requests: number;
  /** Created timestamp */
  createdAt: string;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadKeys(): ApiKeyRecord[] {
  ensureDataDir();
  if (!existsSync(KEYS_FILE)) return [];
  return JSON.parse(readFileSync(KEYS_FILE, "utf-8"));
}

function saveKeys(keys: ApiKeyRecord[]) {
  ensureDataDir();
  writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Generate a new API key. Returns the raw key (shown once) and the record.
 */
export function generateKey(label = ""): { raw: string; record: ApiKeyRecord } {
  const raw = `bp_${randomBytes(24).toString("hex")}`;
  const record: ApiKeyRecord = {
    hash: hashKey(raw),
    prefix: raw.slice(0, 11),
    label,
    wallet: null,
    requests: 0,
    createdAt: new Date().toISOString(),
  };

  const keys = loadKeys();
  keys.push(record);
  saveKeys(keys);

  return { raw, record };
}

/**
 * Validate an API key and return its record, or null if invalid.
 */
export function validateKey(raw: string): ApiKeyRecord | null {
  const hash = hashKey(raw);
  const keys = loadKeys();
  return keys.find((k) => k.hash === hash) ?? null;
}

/**
 * Increment request count for an API key.
 */
export function incrementRequests(raw: string): void {
  const hash = hashKey(raw);
  const keys = loadKeys();
  const key = keys.find((k) => k.hash === hash);
  if (key) {
    key.requests++;
    saveKeys(keys);
  }
}

/**
 * Link a wallet address to an API key.
 */
export function linkWallet(raw: string, wallet: string): boolean {
  const hash = hashKey(raw);
  const keys = loadKeys();
  const key = keys.find((k) => k.hash === hash);
  if (!key) return false;
  key.wallet = wallet;
  saveKeys(keys);
  return true;
}

/**
 * Get all API key records (for admin/dashboard).
 */
export function listKeys(): ApiKeyRecord[] {
  return loadKeys();
}
