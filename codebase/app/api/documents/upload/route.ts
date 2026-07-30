import { apiError } from "@/lib/api";
import { processUpload } from "@/lib/services/documents";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "file is required" }, { status: 400 });
    const courseId = String(formData.get("courseId") ?? "course-ai-product-k3");
    const document = await processUpload(file, courseId);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
