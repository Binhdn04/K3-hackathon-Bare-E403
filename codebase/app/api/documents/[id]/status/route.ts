import { documents } from "@/lib/mock-data";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const document = documents.find((item) => item.id === params.id);
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  return NextResponse.json({ id: document.id, status: document.status });
}
