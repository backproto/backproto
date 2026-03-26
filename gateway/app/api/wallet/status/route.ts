import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import { buildInvoiceLinks } from "@/lib/invoice-links";
import { getOrInitSettlement } from "@/lib/settlement";
import { getInvoice, reconcileInvoice } from "@/lib/invoices";
import { createHash } from "crypto";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const invoiceId = url.searchParams.get("invoiceId");
  if (!invoiceId) {
    return NextResponse.json(
      { error: { message: "invoiceId is required" } },
      { status: 400 },
    );
  }

  const keyHash = createHash("sha256")
    .update(request.headers.get("authorization")!.slice(7))
    .digest("hex");

  const existing = await getInvoice(invoiceId);
  if (!existing || existing.keyHash !== keyHash) {
    return NextResponse.json(
      { error: { message: "Invoice not found" } },
      { status: 404 },
    );
  }

  const invoice = await reconcileInvoice(invoiceId, settlement);
  if (!invoice || invoice.keyHash !== keyHash) {
    return NextResponse.json(
      { error: { message: "Invoice not found" } },
      { status: 404 },
    );
  }

  const balance = await settlement.checkBalance(keyHash);
  const links = invoice.paymentRequest
    ? buildInvoiceLinks(origin, invoice.id, invoice.paymentRequest)
    : null;

  return NextResponse.json({
    invoiceId: invoice.id,
    status: invoice.status,
    amount: invoice.amount,
    rail: invoice.rail,
    paymentRequest: invoice.paymentRequest ?? null,
    expiresAt: invoice.expiresAt,
    paidAt: invoice.paidAt ?? null,
    creditedAt: invoice.creditedAt ?? null,
    balance: balance.balance,
    estimatedRequests: balance.estimatedRequests,
    unit: "sats",
    invoiceUrl: links?.invoiceUrl ?? null,
    statusUrl: links?.statusUrl ?? null,
    lightningUrl: links?.lightningUrl ?? null,
  });
}