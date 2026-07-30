import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const name = file instanceof File ? file.name : "uploaded-material";

  return NextResponse.json({
    id: `upload-${Date.now()}`,
    title: name,
    status: "processing",
    message: "File accepted. Mock processor queued document parsing and chunk embedding."
  });
}
