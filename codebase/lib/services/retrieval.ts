import "server-only";

import type { ChatContext, Citation, DocumentChunk } from "../types";
import { openAI } from "./openai";
import { readStore } from "./store";

export type SourceLevel = "selected_text" | "current_slide" | "transcript" | "other_materials" | "web";

export type RetrievalResult = {
  isSufficient: boolean;
  sourceLevel: SourceLevel;
  content: string;
  citations: Citation[];
};

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function terms(text: string) {
  return [...new Set(normalize(text).split(/[^a-z0-9]+/).filter((word) => word.length > 2))];
}

function lexicalScore(content: string, query: string) {
  const queryTerms = terms(query);
  if (queryTerms.length === 0) return 0;
  const contentTerms = new Set(terms(content));
  return queryTerms.filter((term) => contentTerms.has(term)).length / queryTerms.length;
}

function cosine(a?: number[], b?: number[]) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aa += a[index] * a[index];
    bb += b[index] * b[index];
  }
  return dot / (Math.sqrt(aa) * Math.sqrt(bb) || 1);
}

function citationFor(chunk: DocumentChunk, title: string): Citation {
  if (chunk.type === "transcript" && chunk.startTime !== undefined) {
    return {
      id: `citation-${chunk.id}`,
      chunkId: chunk.id,
      type: "transcript",
      title: `Transcript ${formatTime(chunk.startTime)}`,
      documentId: chunk.documentId,
      pageNumber: chunk.pageNumber,
      slideNumber: chunk.slideNumber,
      timestampStart: chunk.startTime,
      timestampEnd: chunk.endTime
    };
  }
  return {
    id: `citation-${chunk.id}`,
    chunkId: chunk.id,
    type: chunk.type,
    title: chunk.type === "transcript" ? `${title} - transcript` : `Slide ${chunk.slideNumber ?? chunk.pageNumber}: ${title}`,
    documentId: chunk.documentId,
    pageNumber: chunk.pageNumber,
    slideNumber: chunk.slideNumber
  };
}

async function rank(query: string, chunks: DocumentChunk[], limit = 4) {
  const [queryEmbedding] = await openAI.embeddings([query]);
  return chunks
    .map((chunk) => {
      const lexical = lexicalScore(chunk.content, query);
      const semantic = cosine(chunk.embedding, queryEmbedding);
      return { chunk, score: queryEmbedding ? semantic * 0.8 + lexical * 0.2 : lexical };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function resultFor(query: string, chunks: DocumentChunk[], sourceLevel: SourceLevel): Promise<RetrievalResult> {
  const store = await readStore();
  const ranked = await rank(query, chunks);
  const best = ranked[0]?.score ?? 0;
  const selected = ranked.filter((item) => item.score >= Math.max(0.12, best * 0.72));
  return {
    isSufficient: best >= (ranked[0]?.chunk.embedding ? 0.24 : 0.2),
    sourceLevel,
    content: selected.map((item) => `[${item.chunk.id}] ${item.chunk.content}`).join("\n\n"),
    citations: selected.map((item) => {
      const document = store.documents.find((doc) => doc.id === item.chunk.documentId);
      const page = store.pages.find(
        (candidate) => candidate.documentId === item.chunk.documentId && candidate.pageNumber === item.chunk.pageNumber
      );
      return citationFor(item.chunk, page?.title ?? document?.title ?? "Tai lieu");
    })
  };
}

export async function retrieve(question: string, context: ChatContext): Promise<RetrievalResult> {
  const selectedText = context.selectedText?.trim();
  if (selectedText && selectedText.length >= 12) {
    return {
      isSufficient: true,
      sourceLevel: "selected_text",
      content: `[selected-text] ${selectedText}`,
      citations: [{
        id: `selected-${context.documentId}-${context.slideNumber}`,
        type: "slide",
        title: `Selected text, Slide ${context.slideNumber ?? "?"}`,
        documentId: context.documentId,
        pageNumber: context.slideNumber,
        slideNumber: context.slideNumber
      }]
    };
  }

  const store = await readStore();
  const courseDocumentIds = new Set(store.documents.filter((doc) => doc.courseId === context.courseId).map((doc) => doc.id));
  const currentSlide = store.chunks.filter(
    (chunk) => chunk.documentId === context.documentId && chunk.type === "slide" && chunk.slideNumber === context.slideNumber
  );
  const currentResult = await resultFor(question, currentSlide, "current_slide");
  if (currentResult.isSufficient) return currentResult;

  const transcript = store.chunks.filter(
    (chunk) => courseDocumentIds.has(chunk.documentId) && chunk.type === "transcript"
  );
  const transcriptResult = await resultFor(question, transcript, "transcript");
  if (transcriptResult.isSufficient) return transcriptResult;

  const otherMaterials = store.chunks.filter(
    (chunk) => courseDocumentIds.has(chunk.documentId) && !(chunk.documentId === context.documentId && chunk.slideNumber === context.slideNumber)
  );
  const materialResult = await resultFor(question, otherMaterials, "other_materials");
  if (materialResult.isSufficient) return materialResult;

  return { isSufficient: false, sourceLevel: "web", content: "", citations: [] };
}

export async function retrieveForGeneration(context: ChatContext, scope: string): Promise<RetrievalResult> {
  const store = await readStore();
  if (scope === "selected_text" && context.selectedText?.trim()) return retrieve("", context);
  let chunks = store.chunks.filter((chunk) => chunk.documentId === context.documentId);
  if (scope === "current_slide") chunks = chunks.filter((chunk) => chunk.slideNumber === context.slideNumber);
  if (scope === "transcript") chunks = chunks.filter((chunk) => chunk.type === "transcript");
  if (scope === "slide_range") {
    chunks = chunks.filter((chunk) => chunk.type === "slide" && Math.abs((chunk.slideNumber ?? 0) - (context.slideNumber ?? 0)) <= 2);
  }
  if (chunks.length === 0) {
    chunks = store.chunks.filter((chunk) => store.documents.some((doc) => doc.id === chunk.documentId && doc.courseId === context.courseId));
  }
  const limited = chunks.slice(0, 18);
  const documents = new Map(store.documents.map((doc) => [doc.id, doc]));
  const pages = new Map(store.pages.map((page) => [`${page.documentId}:${page.pageNumber}`, page]));
  return {
    isSufficient: limited.length > 0,
    sourceLevel: scope === "transcript" ? "transcript" : "current_slide",
    content: limited.map((chunk) => `[${chunk.id}] ${chunk.content}`).join("\n\n"),
    citations: limited.slice(0, 6).map((chunk) =>
      citationFor(chunk, pages.get(`${chunk.documentId}:${chunk.pageNumber}`)?.title ?? documents.get(chunk.documentId)?.title ?? "Tai lieu")
    )
  };
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
