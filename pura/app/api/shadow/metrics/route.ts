import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Proxy to shadow sidecar /metrics endpoint.
 * Falls back to 502 when the sidecar is unreachable — the UI handles seed fallback.
 */
export async function GET() {
  const url = process.env.SHADOW_URL ?? "http://127.0.0.1:3099";
  try {
    const res = await fetch(`${url}/metrics`, { next: { revalidate: 0 } });
    if (!res.ok) return NextResponse.json(null, { status: 502 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
