import { apiError } from "@/lib/api";
import { getDocument } from "@/lib/services/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const document = await getDocument(params.id);
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    return NextResponse.json({ id: document.id, status: document.status });
  } catch (error) {
    return apiError(error);
  }
}
