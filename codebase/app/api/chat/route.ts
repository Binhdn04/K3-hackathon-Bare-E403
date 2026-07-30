import { answerQuestion } from "@/lib/services/ai";
import type { ChatContext } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { question?: string; context?: ChatContext };
  if (!body.question || !body.context?.courseId) {
    return NextResponse.json({ error: "question and context.courseId are required" }, { status: 400 });
  }

  const message = await answerQuestion(body.question, body.context);
  return NextResponse.json(message);
}
