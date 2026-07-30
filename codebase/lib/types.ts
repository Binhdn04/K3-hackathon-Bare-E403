export type DocumentStatus = "uploading" | "processing" | "ready" | "failed";

export type Citation = {
  id: string;
  type: "slide" | "transcript" | "web";
  title: string;
  chunkId?: string;
  documentId?: string;
  pageNumber?: number;
  slideNumber?: number;
  timestampStart?: number;
  timestampEnd?: number;
  url?: string;
};

export type ChatContext = {
  courseId: string;
  documentId?: string;
  slideNumber?: number;
  selectedText?: string;
  scope?: "current_slide" | "entire_document";
};

export type LearningDocument = {
  id: string;
  courseId: string;
  title: string;
  day: string;
  chapter: string;
  kind: "pdf" | "pptx" | "markdown" | "txt";
  status: DocumentStatus;
  pageCount: number;
};

export type DocumentChunk = {
  id: string;
  documentId: string;
  content: string;
  type: "slide" | "transcript";
  pageNumber?: number;
  slideNumber?: number;
  startTime?: number;
  endTime?: number;
  embedding?: number[];
};

export type DocumentPage = {
  id: string;
  documentId: string;
  pageNumber: number;
  slideNumber: number;
  title: string;
  content: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  sourceLevel?: "selected_text" | "current_slide" | "entire_document" | "other_slides" | "transcript" | "other_materials" | "web";
};

export type QuizOptions = {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  types: Array<"multiple_choice" | "true_false" | "short_answer">;
};

export type QuizQuestion = {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  prompt: string;
  options?: string[];
  answer: string;
  referenceAnswer?: string;
  rubric?: string;
  points: number;
  feedback?: {
    correct: string;
    missing: string;
  };
  citations: Citation[];
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  source: Citation;
  status: "new" | "hard" | "known";
};

export type AnnotationTool = "read" | "pen" | "highlight" | "circle" | "text" | "image" | "eraser";

type AnnotationBase = {
  id: string;
  color: string;
};

export type PdfAnnotation =
  | (AnnotationBase & {
      type: "pen" | "highlight";
      points: Array<{ x: number; y: number }>;
      strokeWidth: number;
    })
  | (AnnotationBase & {
      type: "circle";
      x: number;
      y: number;
      width: number;
      height: number;
      strokeWidth: number;
    })
  | (AnnotationBase & {
      type: "text";
      x: number;
      y: number;
      text: string;
      fontSize: number;
    })
  | (AnnotationBase & {
      type: "image";
      x: number;
      y: number;
      width: number;
      height: number;
      src: string;
    });
