import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PDFJS_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export async function GET(request: Request) {
  try {
    const requestedVersion = new URL(request.url).searchParams.get("version");
    if (!requestedVersion || !PDFJS_VERSION_PATTERN.test(requestedVersion)) {
      return NextResponse.json({ error: "A valid PDF.js version is required" }, { status: 400 });
    }

    const workerPath = await findWorker(requestedVersion);
    if (!workerPath) {
      return NextResponse.json({ error: `PDF worker ${requestedVersion} not found` }, { status: 404 });
    }

    const worker = await fs.readFile(workerPath, "utf8");
    return new NextResponse(worker, {
      headers: {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "PDF worker not found" }, { status: 404 });
  }
}

async function findWorker(requestedVersion: string) {
  const packageRoots = [
    path.join(process.cwd(), "node_modules", "react-pdf", "node_modules", "pdfjs-dist"),
    path.join(process.cwd(), "node_modules", "pdfjs-dist")
  ];

  for (const packageRoot of packageRoots) {
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(packageRoot, "package.json"), "utf8")) as {
        version?: string;
      };
      if (packageJson.version === requestedVersion) {
        return path.join(packageRoot, "build", "pdf.worker.min.mjs");
      }
    } catch {
      // The dependency may be hoisted instead of nested; try the next location.
    }
  }

  return undefined;
}
