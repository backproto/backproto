import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { useRedis, getRedisUrl, getRedisToken } from "./redis-config";
import { log } from "./log";
import type { SettlementProvider } from "./settlement";

const DATA_DIR = join(process.cwd(), "data");
const INVOICES_FILE = join(DATA_DIR, "invoices.json");

export type InvoiceStatus = "pending" | "paid" | "expired";

export interface StoredInvoice {
  id: string;
  keyHash: string;
  amount: number;
  rail: string;
  paymentRequest?: string;
  status: InvoiceStatus;
  createdAt: number;
  expiresAt: number;
  paidAt?: number;
  creditedAt?: number;
  updatedAt?: number;
}

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
  const data = (await res.json()) as { result: string[] | null };
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

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadInvoicesFile(): StoredInvoice[] {
  ensureDataDir();
  if (!existsSync(INVOICES_FILE)) return [];
  return JSON.parse(readFileSync(INVOICES_FILE, "utf-8")) as StoredInvoice[];
}

function saveInvoicesFile(invoices: StoredInvoice[]) {
  ensureDataDir();
  writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));
}

async function saveInvoice(invoice: StoredInvoice): Promise<void> {
  if (useRedis()) {
    await redisSet(`pura:invoice:${invoice.id}`, JSON.stringify(invoice));
    await redisSAdd(`pura:invoices:key:${invoice.keyHash}`, invoice.id);
    return;
  }

  const invoices = loadInvoicesFile();
  const existingIndex = invoices.findIndex((entry) => entry.id === invoice.id);
  if (existingIndex >= 0) {
    invoices[existingIndex] = invoice;
  } else {
    invoices.push(invoice);
  }
  saveInvoicesFile(invoices);
}

export async function getInvoice(id: string): Promise<StoredInvoice | null> {
  if (useRedis()) {
    const raw = await redisGet(`pura:invoice:${id}`);
    return raw ? (JSON.parse(raw) as StoredInvoice) : null;
  }

  return loadInvoicesFile().find((invoice) => invoice.id === id) ?? null;
}

export async function storePendingInvoice(
  invoice: Omit<StoredInvoice, "status" | "createdAt"> & { createdAt?: number },
): Promise<StoredInvoice> {
  const stored: StoredInvoice = {
    ...invoice,
    status: "pending",
    createdAt: invoice.createdAt ?? Date.now(),
  };

  await saveInvoice(stored);
  return stored;
}

export async function updateInvoice(
  id: string,
  patch: Partial<StoredInvoice>,
): Promise<StoredInvoice | null> {
  const current = await getInvoice(id);
  if (!current) return null;

  const updated: StoredInvoice = {
    ...current,
    ...patch,
    id: current.id,
    updatedAt: patch.updatedAt ?? Date.now(),
  };

  await saveInvoice(updated);
  return updated;
}

export async function listInvoicesForKey(keyHash: string): Promise<StoredInvoice[]> {
  if (useRedis()) {
    const ids = await redisSMembers(`pura:invoices:key:${keyHash}`);
    const invoices = await Promise.all(ids.map((id) => getInvoice(id)));
    return invoices.filter((invoice): invoice is StoredInvoice => invoice !== null);
  }

  return loadInvoicesFile().filter((invoice) => invoice.keyHash === keyHash);
}

export async function listUnsettledInvoicesForKey(keyHash: string): Promise<StoredInvoice[]> {
  const invoices = await listInvoicesForKey(keyHash);
  return invoices.filter(
    (invoice) => invoice.status === "pending" || (invoice.status === "paid" && !invoice.creditedAt),
  );
}

export async function reconcileInvoice(
  invoiceId: string,
  settlement: SettlementProvider,
): Promise<StoredInvoice | null> {
  let invoice = await getInvoice(invoiceId);
  if (!invoice) return null;

  if (invoice.status === "expired") return invoice;

  if (invoice.status === "pending" && invoice.expiresAt <= Date.now()) {
    invoice = await updateInvoice(invoice.id, { status: "expired" });
    return invoice;
  }

  if (invoice.status === "pending") {
    const paid = await settlement.isInvoicePaid(invoice.id);
    if (!paid) return invoice;
    invoice = await updateInvoice(invoice.id, {
      status: "paid",
      paidAt: Date.now(),
    });
    if (!invoice) return null;
    log.info("wallet.invoice_paid", {
      invoiceId: invoice.id,
      keyHash: invoice.keyHash.slice(0, 8),
      amount: invoice.amount,
      rail: invoice.rail,
    });
  }

  if (invoice.status === "paid" && !invoice.creditedAt) {
    await settlement.creditBalance(invoice.keyHash, invoice.amount);
    invoice = await updateInvoice(invoice.id, { creditedAt: Date.now() });
    if (!invoice) return null;
    log.info("wallet.invoice_credited", {
      invoiceId: invoice.id,
      keyHash: invoice.keyHash.slice(0, 8),
      amount: invoice.amount,
      rail: invoice.rail,
    });
  }

  return invoice;
}

export async function reconcilePendingInvoicesForKey(
  keyHash: string,
  settlement: SettlementProvider,
): Promise<StoredInvoice[]> {
  const invoices = await listUnsettledInvoicesForKey(keyHash);
  const reconciled = await Promise.all(
    invoices.map((invoice) => reconcileInvoice(invoice.id, settlement)),
  );
  return reconciled.filter((invoice): invoice is StoredInvoice => invoice !== null);
}