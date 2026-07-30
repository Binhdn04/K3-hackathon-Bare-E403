import { pages } from "@/lib/mock-data";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({
    documentId: params.id,
    pages: pages.filter((page) => page.documentId === params.id)
  });
}
