import { NextResponse } from "next/server";
import { generateKey } from "@/lib/keys";

export const runtime = "nodejs";

// Simple in-memory rate limit for key generation: 5 keys per IP per hour
const KEY_GEN_WINDOW_MS = 60 * 60 * 1000;
const KEY_GEN_MAX = 5;
const keyGenLog = new Map<string, number[]>();

function checkKeyGenRate(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - KEY_GEN_WINDOW_MS;
  let timestamps = keyGenLog.get(ip) ?? [];
  timestamps = timestamps.filter((t) => t > cutoff);
  if (timestamps.length >= KEY_GEN_MAX) return false;
  timestamps.push(now);
  keyGenLog.set(ip, timestamps);
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkKeyGenRate(ip)) {
    return NextResponse.json(
      { error: { message: "Too many key generation requests. Try again later." } },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const body = await request.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.slice(0, 64) : "";

  const { raw, record } = generateKey(label);

  return NextResponse.json({
    key: raw,
    prefix: record.prefix,
    label: record.label,
    message: "Save this key — it will not be shown again.",
  });
}
