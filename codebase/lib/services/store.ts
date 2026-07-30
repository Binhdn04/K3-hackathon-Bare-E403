import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { DocumentChunk, DocumentPage, LearningDocument } from "../types";

type DemoStore = {
  documents: LearningDocument[];
  pages: DocumentPage[];
  chunks: DocumentChunk[];
};

const dataDir = path.join(process.cwd(), ".data");
const storePath = path.join(dataDir, "store.json");
export const uploadDir = path.join(dataDir, "uploads");
const legacyDemoDocumentIds = new Set([
  "doc-day2-business-problem",
  "doc-day2-metrics",
  "doc-foundation-llm",
  "doc-transformer-attention"
]);

const emptyStore = (): DemoStore => ({ documents: [], pages: [], chunks: [] });

async function ensureStore() {
  await fs.mkdir(uploadDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

export async function readStore(): Promise<DemoStore> {
  await ensureStore();
  const store = JSON.parse(await fs.readFile(storePath, "utf8")) as DemoStore;
  const cleanedStore: DemoStore = {
    documents: store.documents.filter((document) => !legacyDemoDocumentIds.has(document.id)),
    pages: store.pages.filter((page) => !legacyDemoDocumentIds.has(page.documentId)),
    chunks: store.chunks
      .filter((chunk) => !legacyDemoDocumentIds.has(chunk.documentId))
      .map((chunk) => ({ ...chunk, type: "slide" }))
  };
  const changed = cleanedStore.documents.length !== store.documents.length
    || cleanedStore.pages.length !== store.pages.length
    || cleanedStore.chunks.length !== store.chunks.length
    || store.chunks.some((chunk) => chunk.type !== "slide");
  if (changed) await writeStore(cleanedStore);
  return cleanedStore;
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

export async function getUploadedFile(documentId: string) {
  await ensureStore();
  const fileName = (await fs.readdir(uploadDir)).find((name) => name.startsWith(`${documentId}-`));
  if (!fileName) return undefined;
  return { fileName, path: path.join(uploadDir, fileName) };
}

export async function deleteUploadedDocument(documentId: string) {
  const store = await readStore();
  const document = store.documents.find((item) => item.id === documentId);
  if (!document) return undefined;

  const uploadedFiles = (await fs.readdir(uploadDir))
    .filter((fileName) => fileName.startsWith(`${documentId}-`));

  await writeStore({
    documents: store.documents.filter((item) => item.id !== documentId),
    pages: store.pages.filter((item) => item.documentId !== documentId),
    chunks: store.chunks.filter((item) => item.documentId !== documentId)
  });

  await Promise.all(uploadedFiles.map((fileName) => fs.unlink(path.join(uploadDir, fileName))));
  return document;
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
