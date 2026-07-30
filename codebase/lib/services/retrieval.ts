import { documents, pages, transcriptSegments } from "../mock-data";
import type { ChatContext, Citation, DocumentPage } from "../types";

type RetrievalResult = {
  isSufficient: boolean;
  sourceLevel: "selected_text" | "current_slide" | "other_slides" | "transcript" | "other_materials" | "web";
  content: string;
  citations: Citation[];
};

const includesAny = (content: string, question: string) => {
  const words = question
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);
  const haystack = content.toLowerCase();
  return words.length === 0 || words.some((word) => haystack.includes(word));
};

const slideCitation = (page: DocumentPage): Citation => ({
  id: `slide-${page.documentId}-${page.slideNumber}`,
  type: "slide",
  title: `Slide ${page.slideNumber}: ${page.title}`,
  documentId: page.documentId,
  slideNumber: page.slideNumber
});

export async function searchSelectedText(question: string, context: ChatContext): Promise<RetrievalResult> {
  if (!context.selectedText?.trim()) {
    return { isSufficient: false, sourceLevel: "selected_text", content: "", citations: [] };
  }

  return {
    isSufficient: context.selectedText.length > 12,
    sourceLevel: "selected_text",
    content: context.selectedText,
    citations: [
      {
        id: `selected-${context.documentId ?? "unknown"}-${context.slideNumber ?? 0}`,
        type: "slide",
        title: `Selected text, Slide ${context.slideNumber ?? "?"}`,
        documentId: context.documentId,
        slideNumber: context.slideNumber
      }
    ]
  };
}

export async function searchCurrentSlide(question: string, context: ChatContext): Promise<RetrievalResult> {
  const page = pages.find((item) => item.documentId === context.documentId && item.slideNumber === context.slideNumber);
  if (!page) {
    return { isSufficient: false, sourceLevel: "current_slide", content: "", citations: [] };
  }

  return {
    isSufficient: includesAny(page.content, question),
    sourceLevel: "current_slide",
    content: page.content,
    citations: [slideCitation(page)]
  };
}

export async function searchSlides(question: string, courseId: string): Promise<RetrievalResult> {
  const docIds = documents.filter((doc) => doc.courseId === courseId).map((doc) => doc.id);
  const matches = pages.filter((page) => docIds.includes(page.documentId) && includesAny(page.content, question));

  return {
    isSufficient: matches.length > 0,
    sourceLevel: "other_slides",
    content: matches.map((page) => page.content).join("\n"),
    citations: matches.slice(0, 3).map(slideCitation)
  };
}

export async function searchTranscript(question: string, courseId: string): Promise<RetrievalResult> {
  const docIds = documents.filter((doc) => doc.courseId === courseId).map((doc) => doc.id);
  const matches = transcriptSegments.filter((segment) => docIds.includes(segment.documentId) && includesAny(segment.text, question));

  return {
    isSufficient: matches.length > 0,
    sourceLevel: "transcript",
    content: matches.map((segment) => segment.text).join("\n"),
    citations: matches.slice(0, 3).map((segment) => ({
      id: `transcript-${segment.id}`,
      type: "transcript",
      title: `Transcript ${formatTime(segment.start)}`,
      documentId: segment.documentId,
      timestampStart: segment.start,
      timestampEnd: segment.end
    }))
  };
}

export async function searchOtherMaterials(question: string, courseId: string): Promise<RetrievalResult> {
  const materials = documents
    .filter((doc) => doc.courseId === courseId && doc.status === "ready")
    .map((doc) => `${doc.title} ${doc.chapter}`);

  return {
    isSufficient: includesAny(materials.join(" "), question),
    sourceLevel: "other_materials",
    content: materials.join("\n"),
    citations: [
      {
        id: "materials-index",
        type: "slide",
        title: "Other uploaded materials",
        documentId: documents.find((doc) => doc.status === "ready")?.id
      }
    ]
  };
}

export async function searchWeb(question: string): Promise<RetrievalResult> {
  return {
    isSufficient: true,
    sourceLevel: "web",
    content: `General background answer for: ${question}`,
    citations: [
      {
        id: "web-openai-learning",
        type: "web",
        title: "Internet fallback source",
        url: "https://platform.openai.com/docs"
      }
    ]
  };
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
