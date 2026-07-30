import { generateQuiz } from "@/lib/services/ai";
import { apiError } from "@/lib/api";
import type { ChatContext, QuizOptions } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { options?: QuizOptions; context?: ChatContext };
  if (!body.options || !body.context?.courseId) {
    return NextResponse.json({ error: "options and context are required" }, { status: 400 });
  }

  try {
    return NextResponse.json({ questions: await generateQuiz(body.options, body.context) });
  } catch (error) {
    return apiError(error);
  }
}
