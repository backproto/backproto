import { NextResponse } from "next/server";
import { generateKey } from "@/lib/keys";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
