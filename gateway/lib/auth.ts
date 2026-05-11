import { validateKey, validateKeyAsync, type ApiKeyRecord } from "./keys";
import { createHash } from "crypto";
import { getOrInitSettlement } from "./settlement";
import { reconcilePendingInvoicesForKey } from "./invoices";
import { getFreeQuotaUsage, quotaTier, type QuotaPeriod } from "./budget";

export interface AuthResult {
  valid: boolean;
  record: ApiKeyRecord | null;
  walletRequired: boolean;
  quotaLimit: number;
  quotaUsed: number;
  quotaRemaining: number;
  quotaPeriod: QuotaPeriod;
  billingTier: "free" | "paid";
  error?: string;
}

/**
 * Authenticate a request using the Authorization header.
 * Uses async Redis lookup when Upstash is configured, sync JSON fallback otherwise.
 */
export async function authenticate(authHeader: string | null): Promise<AuthResult> {
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      valid: false,
      record: null,
      walletRequired: false,
      quotaLimit: 0,
      quotaUsed: 0,
      quotaRemaining: 0,
      quotaPeriod: "lifetime",
      billingTier: "free",
      error: "Missing API key",
    };
  }

  const raw = authHeader.slice(7);
  const record = await validateKeyAsync(raw);

  if (!record) {
    return {
      valid: false,
      record: null,
      walletRequired: false,
      quotaLimit: 0,
      quotaUsed: 0,
      quotaRemaining: 0,
      quotaPeriod: "lifetime",
      billingTier: "free",
      error: "Invalid API key",
    };
  }

  const keyHash = createHash("sha256").update(raw).digest("hex");
  const policy = quotaTier(record);
  const quotaUsed = await getFreeQuotaUsage(keyHash, policy);
  const quotaRemaining = Math.max(0, policy.limit - quotaUsed);

  if (quotaRemaining <= 0) {
    const settlement = await getOrInitSettlement();

    if (!settlement) {
      return {
        valid: true,
        record,
        walletRequired: true,
        quotaLimit: policy.limit,
        quotaUsed,
        quotaRemaining,
        quotaPeriod: policy.period,
        billingTier: "paid",
        error: `Free tier exhausted (${policy.limit} ${policy.period} requests). Fund your account to continue.`,
      };
    }

    await reconcilePendingInvoicesForKey(keyHash, settlement);
    const balance = await settlement.checkBalance(keyHash);
    if (balance.balance <= 0) {
      return {
        valid: true,
        record,
        walletRequired: true,
        quotaLimit: policy.limit,
        quotaUsed,
        quotaRemaining,
        quotaPeriod: policy.period,
        billingTier: "paid",
        error: `Free tier exhausted (${policy.limit} ${policy.period} requests). Fund your account to continue.`,
      };
    }

    return {
      valid: true,
      record,
      walletRequired: false,
      quotaLimit: policy.limit,
      quotaUsed,
      quotaRemaining,
      quotaPeriod: policy.period,
      billingTier: "paid",
    };
  }

  return {
    valid: true,
    record,
    walletRequired: false,
    quotaLimit: policy.limit,
    quotaUsed,
    quotaRemaining,
    quotaPeriod: policy.period,
    billingTier: "free",
  };
}
