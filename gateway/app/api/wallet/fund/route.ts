import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { buildInvoiceLinks } from "@/lib/invoice-links";
import { getOrInitSettlement } from "@/lib/settlement";
import { storePendingInvoice } from "@/lib/invoices";
import { createHash } from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const auth = await authenticate(request.headers.get("authorization"));
  if (!auth.valid) {
    return NextResponse.json({ error: { message: auth.error } }, { status: 401 });
  }

  const settlement = await getOrInitSettlement();
  if (!settlement) {
    return NextResponse.json(
      { error: { message: "No settlement provider configured" } },
      { status: 503 },
    );
  }

  let body: { amount?: number };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const amountSats = body.amount ?? 10_000; // default 10k sats (~$4)
  if (amountSats < 100 || amountSats > 1_000_000) {
    return NextResponse.json(
      { error: { message: "Amount must be between 100 and 1,000,000 sats" } },
      { status: 400 },
    );
  }

  const keyHash = createHash("sha256")
    .update(request.headers.get("authorization")!.slice(7))
    .digest("hex");

  const invoice = await settlement.createInvoice(keyHash, amountSats);
  await storePendingInvoice({
    id: invoice.id,
    keyHash,
    amount: invoice.amount,
    rail: settlement.name,
    paymentRequest: invoice.paymentRequest,
    expiresAt: invoice.expiresAt,
  });

  const links = buildInvoiceLinks(origin, invoice.id, invoice.paymentRequest);

  return NextResponse.json({
    paymentRequest: invoice.paymentRequest,
    amount: invoice.amount,
    invoiceId: invoice.id,
    expiresAt: invoice.expiresAt,
    rail: settlement.name,
    invoiceUrl: links.invoiceUrl,
    statusUrl: links.statusUrl,
    lightningUrl: links.lightningUrl,
  });
}
