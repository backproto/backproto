import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { attachProofToKey, getKeyHash } from "@/lib/keys";
import { getProofById } from "@/lib/proofs/proof-store";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
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

  let body: { proof_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.proof_id) {
    return NextResponse.json(
      { error: { message: "proof_id is required" } },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const proof = await getProofById(body.proof_id);
  if (!proof) {
    return NextResponse.json(
      { error: { message: "Proof not found or expired" } },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  const raw = authHeader.slice(7);
  const keyHash = getKeyHash(raw);
  if (proof.keyHash !== keyHash) {
    return NextResponse.json(
      { error: { message: "Proof can only be attached to the key that verified it" } },
      { status: 403, headers: CORS_HEADERS },
    );
  }

  const attached = await attachProofToKey(raw, proof.proofId, proof.proofClass);
  if (!attached) {
    return NextResponse.json(
      { error: { message: "API key not found" } },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      proof_id: proof.proofId,
      proof_class: proof.proofClass.kind,
      expires_at: proof.expiresAt,
    },
    { headers: CORS_HEADERS },
  );
}
