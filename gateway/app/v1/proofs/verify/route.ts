import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { authenticate } from "@/lib/auth";
import { getKeyHash } from "@/lib/keys";
import { getIssuerAdapter } from "@/lib/proofs/registry";
import { claimNullifier } from "@/lib/proofs/nullifiers";
import { currentIsoWeekEpoch, nextEpochStart } from "@/lib/proofs/types";
import { storeProof } from "@/lib/proofs/proof-store";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

interface VerifyBody {
  issuer?: string;
  proof?: unknown;
  scope?: string;
}

export async function POST(request: Request) {
  const auth = await authenticate(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: { message: auth.error } }, { status: 401, headers: CORS_HEADERS });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Missing API key" } }, { status: 401, headers: CORS_HEADERS });
  }

  let body: VerifyBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.issuer || !body.proof) {
    return NextResponse.json(
      { error: { message: "issuer and proof are required" } },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const adapter = getIssuerAdapter(body.issuer);
  if (!adapter) {
    return NextResponse.json(
      { error: { message: `Unsupported issuer: ${body.issuer}` } },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const scope = body.scope ?? process.env.PURA_PROOF_SCOPE ?? "pura-gateway";
  const epoch = currentIsoWeekEpoch();
  const nonce = randomUUID();

  try {
    const proofClass = await adapter.verify(body.proof, {
      appScope: scope,
      epoch,
      nonce,
    });

    if (proofClass.kind !== "unique_human") {
      return NextResponse.json(
        { error: { message: "Unsupported proof class from issuer" } },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const rawKey = authHeader.slice(7);
    const keyHash = getKeyHash(rawKey);

    const claimed = await claimNullifier(proofClass.nullifier, proofClass.issuer, proofClass.epoch, keyHash);
    if (!claimed) {
      return NextResponse.json(
        { error: { message: "Proof already claimed in this epoch", code: "already_claimed" } },
        { status: 409, headers: CORS_HEADERS },
      );
    }

    const expiresAt = nextEpochStart().toISOString();
    const stored = await storeProof(keyHash, proofClass, expiresAt);

    return NextResponse.json(
      {
        proof_id: stored.proofId,
        proof_class: "unique_human",
        issuer: proofClass.issuer,
        epoch: proofClass.epoch,
        expires_at: expiresAt,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      { error: { message: (error as Error).message } },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}
