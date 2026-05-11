export type ProofClass =
  | { kind: "unknown" }
  | {
    kind: "unique_human";
    issuer: string;
    nullifier: string;
    scope: string;
    epoch: string;
  };

export interface VerificationContext {
  appScope: string;
  epoch: string;
  nonce: string;
  agentPubkey?: string;
}

export interface IssuerAdapter {
  issuerId: string;
  verify(payload: unknown, context: VerificationContext): Promise<ProofClass>;
}

export const UNKNOWN_PROOF_CLASS: ProofClass = { kind: "unknown" };

export function currentIsoWeekEpoch(now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function nextEpochStart(now = new Date()): Date {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay() || 7;
  const daysUntilMonday = 8 - day;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
