import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { getSavingsBreakdown } from "@/lib/cascade-metrics";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/savings — per-request cost comparison for the last 24h.
 * Authenticated endpoint.
 */
export async function GET(request: Request) {
  const auth = await authenticate(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json(
      { error: { message: auth.error } },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const breakdown = getSavingsBreakdown();
  return NextResponse.json(breakdown, { headers: CORS_HEADERS });
}
