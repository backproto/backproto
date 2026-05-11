import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { authenticate } from "@/lib/auth";
import { submitReview } from "@/lib/marketplace";

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

  if (auth.record?.proofClass?.kind !== "unique_human") {
    return NextResponse.json(
      { error: { message: "Only unique_human keys can submit review tasks" } },
      { status: 403, headers: CORS_HEADERS },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Missing API key" } }, { status: 401, headers: CORS_HEADERS });
  }

  const raw = authHeader.slice(7);
  const reviewerId = createHash("sha256").update(raw).digest("hex").slice(0, 16);

  let body: {
    taskId?: string;
    decision?: "approve" | "reject" | "edit";
    editedResponse?: string;
    notes?: string;
    qualityRating?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400, headers: CORS_HEADERS });
  }

  if (!body.taskId || !body.decision) {
    return NextResponse.json(
      { error: { message: "taskId and decision are required" } },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const completed = await submitReview(body.taskId, reviewerId, {
    decision: body.decision,
    editedResponse: body.editedResponse,
    notes: body.notes,
    qualityRating: body.qualityRating,
  });

  if (!completed) {
    return NextResponse.json(
      { error: { message: "Task cannot be submitted (assignment/status mismatch)" } },
      { status: 409, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(
    {
      taskId: completed.taskId,
      status: completed.status,
      reviewed: true,
    },
    { headers: CORS_HEADERS },
  );
}
