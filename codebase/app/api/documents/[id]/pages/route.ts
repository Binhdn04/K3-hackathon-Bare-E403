import { apiError } from "@/lib/api";
import { getDocument, getDocumentPages } from "@/lib/services/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const document = await getDocument(params.id);
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    return NextResponse.json({ documentId: params.id, pages: await getDocumentPages(params.id) });
  } catch (error) {
    return apiError(error);
  }
}
