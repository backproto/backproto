import { NextResponse } from "next/server";
import { linkWallet, validateKey } from "@/lib/keys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const raw = authHeader.slice(7);
  const record = validateKey(raw);
  if (!record) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  let body: { wallet?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const wallet = body.wallet;
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  linkWallet(raw, wallet);

  return NextResponse.json({
    message: "Wallet linked",
    wallet,
    prefix: record.prefix,
  });
}
