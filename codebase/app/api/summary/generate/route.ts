import { generateSummary } from "@/lib/services/ai";
import type { ChatContext } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { kind?: string; context?: ChatContext };
  if (!body.kind || !body.context?.courseId) {
    return NextResponse.json({ error: "kind and context are required" }, { status: 400 });
  }

  return NextResponse.json(await generateSummary(body.kind, body.context));
}
