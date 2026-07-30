import { generateSummary } from "@/lib/services/ai";
import { apiError } from "@/lib/api";
import type { ChatContext } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { kind?: string; context?: ChatContext };
  if (!body.kind || !body.context?.courseId) {
    return NextResponse.json({ error: "kind and context are required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await generateSummary(body.kind, body.context));
  } catch (error) {
    return apiError(error);
  }
}
