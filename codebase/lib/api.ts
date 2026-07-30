import { NextResponse } from "next/server";

export function apiError(error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
  return NextResponse.json({ error: message }, { status });
}
