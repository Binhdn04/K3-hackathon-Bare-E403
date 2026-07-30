export type DocumentStatus = "uploading" | "processing" | "ready" | "failed";

export type Citation = {
  id: string;
  type: "slide" | "transcript" | "web";
  title: string;
  documentId?: string;
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
  transcript?: string;
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
  sourceLevel?: "selected_text" | "current_slide" | "other_slides" | "transcript" | "other_materials" | "web";
};

export type QuizOptions = {
  questionCount: number;
  difficulty: "easy" | "medium" | "hard";
  types: Array<"multiple_choice" | "true_false" | "short_answer">;
  includeTranscript: boolean;
  source: "selected_text" | "current_slide" | "slide_range" | "transcript" | "full_lesson";
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
