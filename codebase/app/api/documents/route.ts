import { apiError } from "@/lib/api";
import { listDocuments } from "@/lib/services/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const courseId = new URL(request.url).searchParams.get("courseId") ?? undefined;
    return NextResponse.json({ documents: await listDocuments(courseId) });
  } catch (error) {
    return apiError(error);
  }
}
