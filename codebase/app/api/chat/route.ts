import { answerQuestion } from "@/lib/services/ai";
import { apiError } from "@/lib/api";
import type { ChatContext } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { question?: string; context?: ChatContext };
  if (!body.question || !body.context?.courseId) {
    return NextResponse.json({ error: "question and context.courseId are required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await answerQuestion(body.question, body.context));
  } catch (error) {
    return apiError(error);
  }
}
