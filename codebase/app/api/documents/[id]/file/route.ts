import { apiError } from "@/lib/api";
import { getDocument, getUploadedFile } from "@/lib/services/store";
import { promises as fs } from "fs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const contentTypes: Record<string, string> = {
  pdf: "application/pdf",
  markdown: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8"
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const document = await getDocument(params.id);
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const uploaded = await getUploadedFile(document.id);
    if (!uploaded) return NextResponse.json({ error: "Uploaded file not found" }, { status: 404 });

    const file = await fs.readFile(uploaded.path);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[document.kind] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(uploaded.fileName)}"`,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
