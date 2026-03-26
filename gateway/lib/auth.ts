import { validateKey, validateKeyAsync, type ApiKeyRecord } from "./keys";
import { createHash } from "crypto";
import { getOrInitSettlement } from "./settlement";
import { reconcilePendingInvoicesForKey } from "./invoices";

const FREE_TIER_LIMIT = 5000;

export interface AuthResult {
  valid: boolean;
  record: ApiKeyRecord | null;
  walletRequired: boolean;
  error?: string;
}

/**
 * Authenticate a request using the Authorization header.
 * Uses async Redis lookup when Upstash is configured, sync JSON fallback otherwise.
 */
export async function authenticate(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, record: null, walletRequired: false, error: "Missing API key" };
  }

  const raw = authHeader.slice(7);
  const record = await validateKeyAsync(raw);

  if (!record) {
    return { valid: false, record: null, walletRequired: false, error: "Invalid API key" };
  }

  if (record.requests >= FREE_TIER_LIMIT) {
    const keyHash = createHash("sha256").update(raw).digest("hex");
    const settlement = await getOrInitSettlement();

    if (!settlement) {
      return {
        valid: true,
        record,
        walletRequired: true,
        error: `Free tier exhausted (${FREE_TIER_LIMIT} requests). Fund your account to continue.`,
      };
    }

    await reconcilePendingInvoicesForKey(keyHash, settlement);
    const balance = await settlement.checkBalance(keyHash);
    if (balance.balance <= 0) {
      return {
        valid: true,
        record,
        walletRequired: true,
        error: `Free tier exhausted (${FREE_TIER_LIMIT} requests). Fund your account to continue.`,
      };
    }
  }

  return { valid: true, record, walletRequired: false };
}
