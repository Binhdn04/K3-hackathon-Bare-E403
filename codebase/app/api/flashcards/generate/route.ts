import { generateFlashcards } from "@/lib/services/ai";
import type { ChatContext } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { context?: ChatContext };
  if (!body.context?.courseId) {
    return NextResponse.json({ error: "context.courseId is required" }, { status: 400 });
  }

  return NextResponse.json({ flashcards: await generateFlashcards(body.context) });
}
