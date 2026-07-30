import { apiError } from "@/lib/api";
import { deleteUploadedDocument } from "@/lib/services/store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const document = await deleteUploadedDocument(params.id);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, documentId: document.id });
  } catch (error) {
    return apiError(error);
  }
}
