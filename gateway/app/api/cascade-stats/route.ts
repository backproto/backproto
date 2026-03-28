import { NextResponse } from "next/server";
import { getCascadeStats } from "@/lib/cascade-metrics";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/cascade-stats — public aggregate cascade routing metrics.
 */
export async function GET() {
  const stats = getCascadeStats();
  return NextResponse.json(stats, { headers: CORS_HEADERS });
}
