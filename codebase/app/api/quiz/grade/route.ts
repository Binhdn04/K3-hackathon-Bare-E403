import { gradeQuiz } from "@/lib/services/ai";
import { apiError } from "@/lib/api";
import type { QuizQuestion } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as { answer?: string; question?: QuizQuestion };
  if (!body.answer || !body.question) {
    return NextResponse.json({ error: "answer and question are required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await gradeQuiz(body.answer, body.question));
  } catch (error) {
    return apiError(error);
  }
}
