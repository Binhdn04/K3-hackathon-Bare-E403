import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { DocumentChunk, DocumentPage, LearningDocument } from "../types";
import { openAI } from "./openai";
import { saveProcessedDocument, uploadDir } from "./store";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function cleanText(text: string) {
  return text.replace(/\0/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function chunksOf(text: string, size = 900, overlap = 120) {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + size);
    if (end < text.length) {
      const boundary = Math.max(text.lastIndexOf("\n", end), text.lastIndexOf(". ", end));
      if (boundary > start + size / 2) end = boundary + 1;
    }
    const value = text.slice(start, end).trim();
    if (value) chunks.push(value);
    if (end >= text.length) break;
    start = Math.max(start + 1, end - overlap);
  }
  return chunks;
}

async function parsePdf(buffer: Buffer, documentId: string) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: DocumentPage[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const pdfPage = await pdf.getPage(pageNumber);
    const content = await pdfPage.getTextContent();
    const text = cleanText(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
    const firstLine = text.split(/[.!?\n]/)[0]?.slice(0, 90);
    pages.push({
      id: crypto.randomUUID(),
      documentId,
      pageNumber,
      slideNumber: pageNumber,
      title: firstLine || `Page ${pageNumber}`,
      content: text || "This page does not contain extractable text."
    });
  }
  return { pages, transcriptText: "" };
}

function parseMarkdown(text: string, documentId: string) {
  const cleaned = cleanText(text);
  const sections = cleaned.split(/(?=^#{1,3}\s+)/m).filter(Boolean);
  const pageTexts = sections.length > 1 ? sections : chunksOf(cleaned, 1800, 0);
  const pages = pageTexts.map((content, index): DocumentPage => {
    const heading = content.match(/^#{1,3}\s+(.+)$/m)?.[1];
    return {
      id: crypto.randomUUID(),
      documentId,
      pageNumber: index + 1,
      slideNumber: index + 1,
      title: heading?.trim() || `Section ${index + 1}`,
      content: content.replace(/^#{1,3}\s+/gm, "").trim()
    };
  });
  return { pages, transcriptText: cleaned };
}

export async function processUpload(file: File, courseId: string) {
  if (file.size === 0) throw new Error("File is empty");
  if (file.size > MAX_FILE_SIZE) throw new Error("File is larger than 15 MB");
  const extension = path.extname(file.name).toLowerCase();
  if (![".pdf", ".md", ".markdown", ".txt"].includes(extension)) {
    throw new Error("Only PDF, Markdown and TXT files are supported");
  }

  const id = crypto.randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, `${id}-${safeName}`), buffer);

  const parsed = extension === ".pdf" ? await parsePdf(buffer, id) : parseMarkdown(buffer.toString("utf8"), id);
  const bareChunks: DocumentChunk[] = parsed.pages.flatMap((page) =>
    chunksOf(page.content).map((content) => ({
      id: crypto.randomUUID(),
      documentId: id,
      content,
      type: extension === ".pdf" ? "slide" : "transcript",
      pageNumber: page.pageNumber,
      slideNumber: page.slideNumber
    }))
  );
  let embeddings: number[][] = [];
  try {
    embeddings = await openAI.embeddings(bareChunks.map((chunk) => chunk.content));
  } catch (error) {
    console.warn("Embedding failed; lexical retrieval remains available", error);
  }
  const chunks = bareChunks.map((chunk, index) => ({ ...chunk, embedding: embeddings[index] }));
  const kind: LearningDocument["kind"] = extension === ".pdf" ? "pdf" : extension === ".txt" ? "txt" : "markdown";
  const document: LearningDocument = {
    id,
    courseId,
    title: file.name.replace(/\.[^.]+$/, ""),
    day: "Uploaded",
    chapter: kind === "pdf" ? "Slides" : "Transcript",
    kind,
    status: "ready",
    pageCount: parsed.pages.length,
    transcriptText: parsed.transcriptText
  };
  await saveProcessedDocument(document, parsed.pages, chunks);
  return document;
}
