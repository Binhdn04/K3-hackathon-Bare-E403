import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { documents as seedDocuments, pages as seedPages, transcriptSegments } from "../mock-data";
import type { DocumentChunk, DocumentPage, LearningDocument } from "../types";

type DemoStore = {
  documents: LearningDocument[];
  pages: DocumentPage[];
  chunks: DocumentChunk[];
};

const dataDir = path.join(process.cwd(), ".data");
const storePath = path.join(dataDir, "store.json");
export const uploadDir = path.join(dataDir, "uploads");

function seedStore(): DemoStore {
  const transcriptByDocument = new Map<string, string[]>();
  for (const segment of transcriptSegments) {
    const values = transcriptByDocument.get(segment.documentId) ?? [];
    values.push(segment.text);
    transcriptByDocument.set(segment.documentId, values);
  }
  return {
    documents: seedDocuments.map((document) => ({
      ...document,
      transcriptText: transcriptByDocument.get(document.id)?.join("\n\n") ?? ""
    })),
    pages: seedPages,
    chunks: [
      ...seedPages.map((page) => ({
        id: `chunk-${page.id}`,
        documentId: page.documentId,
        content: page.content,
        type: "slide" as const,
        pageNumber: page.pageNumber,
        slideNumber: page.slideNumber
      })),
      ...transcriptSegments.map((segment) => ({
        id: `chunk-${segment.id}`,
        documentId: segment.documentId,
        content: segment.text,
        type: "transcript" as const,
        startTime: segment.start,
        endTime: segment.end
      }))
    ]
  };
}

async function ensureStore() {
  await fs.mkdir(uploadDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(seedStore(), null, 2), "utf8");
  }
}

export async function readStore(): Promise<DemoStore> {
  await ensureStore();
  return JSON.parse(await fs.readFile(storePath, "utf8")) as DemoStore;
}

export async function writeStore(store: DemoStore) {
  await ensureStore();
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(store), "utf8");
  await fs.rename(temporaryPath, storePath);
}

export async function listDocuments(courseId?: string) {
  const store = await readStore();
  return courseId ? store.documents.filter((document) => document.courseId === courseId) : store.documents;
}

export async function getDocument(documentId: string) {
  const store = await readStore();
  return store.documents.find((document) => document.id === documentId);
}

export async function getDocumentPages(documentId: string) {
  const store = await readStore();
  return store.pages
    .filter((page) => page.documentId === documentId)
    .sort((a, b) => a.pageNumber - b.pageNumber);
}

export async function saveProcessedDocument(document: LearningDocument, pages: DocumentPage[], chunks: DocumentChunk[]) {
  const store = await readStore();
  store.documents = [...store.documents.filter((item) => item.id !== document.id), document];
  store.pages = [...store.pages.filter((item) => item.documentId !== document.id), ...pages];
  store.chunks = [...store.chunks.filter((item) => item.documentId !== document.id), ...chunks];
  await writeStore(store);
}

export async function saveDocumentStatus(document: LearningDocument) {
  const store = await readStore();
  store.documents = [...store.documents.filter((item) => item.id !== document.id), document];
  await writeStore(store);
}
