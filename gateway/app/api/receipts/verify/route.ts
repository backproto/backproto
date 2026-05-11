import { NextResponse } from "next/server";
import { getReceiptPublicKeyPem, verifyReceiptToken } from "@/lib/receipts";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("receipt");

  if (!token) {
    return NextResponse.json(
      { error: { message: "receipt query parameter is required" } },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const result = verifyReceiptToken(token);
  if (!result.valid) {
    return NextResponse.json(
      { valid: false, error: result.error, public_key: getReceiptPublicKeyPem() },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      valid: true,
      payload: result.payload,
      public_key: getReceiptPublicKeyPem(),
    },
    { headers: CORS_HEADERS },
  );
}
