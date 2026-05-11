import { createHash } from "crypto";
import type { IssuerAdapter, ProofClass, VerificationContext } from "./types";

interface WorldIdPayload {
  proof?: string;
  merkle_root?: string;
  nullifier_hash?: string;
  signal?: string;
  mock_valid?: boolean;
}

interface WorldVerifyResponse {
  success?: boolean;
  nullifier_hash?: string;
  code?: string;
  detail?: string;
}

function deriveExternalNullifier(scope: string, epoch: string): string {
  return createHash("sha256").update(`${scope}:${epoch}`).digest("hex");
}

export const worldIdAdapter: IssuerAdapter = {
  issuerId: "world_id",

  async verify(payload: unknown, context: VerificationContext): Promise<ProofClass> {
    const parsed = (payload ?? {}) as WorldIdPayload;

    // Local dev and test mode support.
    if (parsed.mock_valid === true && parsed.nullifier_hash) {
      return {
        kind: "unique_human",
        issuer: "world_id",
        nullifier: parsed.nullifier_hash,
        scope: context.appScope,
        epoch: context.epoch,
      };
    }

    if (!parsed.proof || !parsed.merkle_root || !parsed.nullifier_hash) {
      throw new Error("world_id proof, merkle_root, and nullifier_hash are required");
    }

    const verifyUrl = process.env.WORLD_ID_VERIFY_URL ?? "https://developer.worldcoin.org/api/v2/verify";
    const externalNullifier = deriveExternalNullifier(context.appScope, context.epoch);
    const appId = process.env.WORLD_ID_APP_ID ?? context.appScope;

    const body = {
      app_id: appId,
      action: externalNullifier,
      signal: parsed.signal ?? context.nonce,
      proof: parsed.proof,
      merkle_root: parsed.merkle_root,
      nullifier_hash: parsed.nullifier_hash,
    };

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.WORLD_ID_APP_KEY) {
      headers.Authorization = `Bearer ${process.env.WORLD_ID_APP_KEY}`;
    }

    const response = await fetch(verifyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`world_id verification failed with status ${response.status}`);
    }

    const data = (await response.json()) as WorldVerifyResponse;
    if (!data.success) {
      throw new Error(`world_id verification rejected: ${data.code ?? data.detail ?? "invalid_proof"}`);
    }

    const nullifier = data.nullifier_hash ?? parsed.nullifier_hash;
    if (!nullifier) {
      throw new Error("world_id verification did not return a nullifier_hash");
    }

    return {
      kind: "unique_human",
      issuer: "world_id",
      nullifier,
      scope: context.appScope,
      epoch: context.epoch,
    };
  },
};
