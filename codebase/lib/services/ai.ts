import type { ChatContext, ChatMessage, Citation, Flashcard, QuizOptions, QuizQuestion } from "../types";
import { openAI } from "./openai";
import { retrieve, retrieveForGeneration } from "./retrieval";

const tutorInstructions = `Ban la AI Tutor. Chi danh dau answerable=true khi SOURCE CONTEXT chua thong tin truc tiep de tra loi QUESTION.
Neu cau hoi yeu cau thong tin hien tai, moi nhat, gia ca hoac thoi diem ma context khong co du lieu cap nhat, phai dat answerable=false.
Khi answerable=true, tra loi bang tieng Viet ro rang, ngan gon va khong bo sung kien thuc ben ngoai context.
sourceIds chi duoc chua ID cua cac doan truc tiep ho tro cau tra loi. Khong viet [Trang ...] hoac citation vao answer vi giao dien se hien citation tu sourceIds.
Khi answerable=false, dat answer thanh chuoi rong va sourceIds thanh mang rong.`;

type GroundedAnswer = {
  answerable: boolean;
  answer: string;
  sourceIds: string[];
};

function contextWithCitations(content: string, citations: Citation[]) {
  const labels = citations.map((citation) => {
    const label = citation.type === "transcript"
      ? `[Transcript ${formatTime(citation.timestampStart ?? 0)}]`
      : `[Trang ${citation.slideNumber ?? citation.pageNumber ?? "?"}]`;
    return `${citation.chunkId ?? citation.id} => ${label}`;
  });
  return `${content}\n\nCITATION LABELS:\n${labels.join("\n")}`;
}

export async function answerQuestion(question: string, context: ChatContext): Promise<ChatMessage> {
  const conversational = conversationalMessage(question);
  if (conversational) return conversational;

  const found = await retrieve(question, context);
  if (found.isSufficient) {
    const validSourceIds = citationSourceIds(found.citations);
    const grounded = await openAI.createJson<GroundedAnswer>(
      tutorInstructions,
      `QUESTION:\n${question}\n\nSOURCE CONTEXT:\n${contextWithCitations(found.content, found.citations)}`,
      "grounded_tutor_answer",
      {
        type: "object",
        additionalProperties: false,
        required: ["answerable", "answer", "sourceIds"],
        properties: {
          answerable: { type: "boolean" },
          answer: { type: "string" },
          sourceIds: {
            type: "array",
            items: { type: "string", enum: validSourceIds }
          }
        }
      }
    );
    const content = cleanTutorAnswer(grounded.answer);
    const citations = mapTutorCitations(grounded.sourceIds, found.citations);
    if (grounded.answerable && content && citations.length > 0) {
      return assistantMessage(content, citations, found.sourceLevel);
    }
  }

  if (!context.allowWebFallback) {
    return webFallbackMessage(question);
  }

  const web = await openAI.searchWeb(question);
  const citations: Citation[] = web.sources.map((source, index) => ({
    id: `web-${index}-${source.url}`,
    type: "web",
    title: source.title,
    url: source.url
  }));
  return assistantMessage(
    web.text,
    citations,
    "web"
  );
}

function webFallbackMessage(question: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "Không tìm thấy nội dung phù hợp trong học liệu hiện tại. Bạn nên liên hệ Lab Coach hoặc giảng viên để được hỗ trợ thêm. Nếu muốn, bạn có thể cho phép tìm nguồn Internet cho riêng câu hỏi này.",
    citations: [],
    requiresWebFallback: true,
    fallbackQuestion: question
  };
}

type GeneratedQuiz = {
  questions: Array<{
    type: QuizQuestion["type"];
    prompt: string;
    options: string[] | null;
    answer: string;
    referenceAnswer: string | null;
    rubric: string | null;
    points: number;
    sourceIds: string[];
  }>;
};

export async function generateQuiz(options: QuizOptions, context: ChatContext): Promise<QuizQuestion[]> {
  const requestedCount = Number.isFinite(options.questionCount) ? Math.trunc(options.questionCount) : 1;
  const normalizedOptions: QuizOptions = {
    ...options,
    questionCount: Math.min(10, Math.max(1, requestedCount))
  };
  const scope = context.scope === "entire_document"
    ? "entire_document"
    : context.selectedText?.trim() ? "selected_text" : "current_slide";
  const found = await retrieveForGeneration(context, scope);
  if (!found.isSufficient) throw new Error("No material is available for this quiz");
  const validSourceIds = citationSourceIds(found.citations);
  if (validSourceIds.length === 0) throw new Error("No valid source is available for this quiz");
  const result = await openAI.createJson<GeneratedQuiz>(
    "Tao quiz bang tieng Viet chi tu hoc lieu. Cau hoi phai co dap an ro rang. sourceIds chi chua ID nam trong context.",
    `OPTIONS: ${JSON.stringify(normalizedOptions)}\n\nCONTEXT:\n${found.content}`,
    "quiz",
    {
      type: "object",
      additionalProperties: false,
      required: ["questions"],
      properties: {
        questions: {
          type: "array",
          minItems: normalizedOptions.questionCount,
          maxItems: normalizedOptions.questionCount,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "prompt", "options", "answer", "referenceAnswer", "rubric", "points", "sourceIds"],
            properties: {
              type: { type: "string", enum: normalizedOptions.types },
              prompt: { type: "string" },
              options: { type: ["array", "null"], items: { type: "string" } },
              answer: { type: "string" },
              referenceAnswer: { type: ["string", "null"] },
              rubric: { type: ["string", "null"] },
              points: { type: "integer", minimum: 1, maximum: 1 },
              sourceIds: {
                type: "array",
                items: { type: "string", enum: validSourceIds },
                minItems: 1
              }
            }
          }
        }
      }
    }
  );
  return result.questions.map((question) => ({
    id: crypto.randomUUID(),
    type: question.type,
    prompt: question.prompt,
    options: question.options ?? undefined,
    answer: question.answer,
    referenceAnswer: question.referenceAnswer ?? undefined,
    rubric: question.rubric ?? undefined,
    points: 1,
    citations: mapCitations(question.sourceIds, found.citations)
  }));
}

export async function gradeQuiz(answer: string, question: QuizQuestion) {
  const result = await openAI.createJson<{
    score: number;
    correct: string;
    missing: string;
  }>(
    "Cham bai bang tieng Viet theo dap an va rubric. Khong cho diem vuot maxScore.",
    JSON.stringify({ answer, expectedAnswer: question.answer, referenceAnswer: question.referenceAnswer, rubric: question.rubric, maxScore: 1 }),
    "quiz_grade",
    {
      type: "object",
      additionalProperties: false,
      required: ["score", "correct", "missing"],
      properties: {
        score: { type: "number", minimum: 0, maximum: 1 },
        correct: { type: "string" },
        missing: { type: "string" }
      }
    }
  );
  return {
    model: openAI.model,
    score: Math.min(1, Math.max(0, result.score)),
    maxScore: 1,
    feedback: { correct: result.correct, missing: result.missing },
    citations: question.citations
  };
}

export async function generateFlashcards(context: ChatContext): Promise<Flashcard[]> {
  const scope = context.scope === "entire_document"
    ? "entire_document"
    : context.selectedText ? "selected_text" : "current_slide";
  const found = await retrieveForGeneration(context, scope);
  if (!found.isSufficient) throw new Error("No material is available for flashcards");
  const validSourceIds = citationSourceIds(found.citations);
  if (validSourceIds.length === 0) throw new Error("No valid source is available for flashcards");
  const result = await openAI.createJson<{ cards: Array<{ front: string; back: string; sourceId: string }> }>(
    "Tao dung 5 flashcard bang tieng Viet chi tu context. sourceId phai la ID that trong context.",
    found.content,
    "flashcards",
    {
      type: "object",
      additionalProperties: false,
      required: ["cards"],
      properties: {
        cards: {
          type: "array",
          minItems: 5,
          maxItems: 5,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["front", "back", "sourceId"],
            properties: {
              front: { type: "string" },
              back: { type: "string" },
              sourceId: { type: "string", enum: validSourceIds }
            }
          }
        }
      }
    }
  );
  return result.cards.map((card) => {
    const source = mapCitations([card.sourceId], found.citations)[0];
    if (!source) throw new Error("Flashcard source validation failed");
    const flashcard: Flashcard = {
      id: crypto.randomUUID(),
      front: card.front,
      back: card.back,
      source,
      status: "new"
    };
    return flashcard;
  });
}

function mapCitations(ids: string[], citations: Citation[]) {
  const wanted = new Set(ids);
  return citations.filter((citation) => wanted.has(citation.chunkId ?? citation.id));
}

function mapTutorCitations(ids: string[], citations: Citation[]) {
  const wanted = new Set(ids);
  const seen = new Set<string>();
  return citations.filter((citation) => {
    if (!wanted.has(citation.chunkId ?? citation.id)) return false;
    const key = citation.url
      ?? `${citation.documentId ?? ""}:${citation.slideNumber ?? citation.pageNumber ?? citation.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function citationSourceIds(citations: Citation[]) {
  return citations.map((citation) => citation.chunkId ?? citation.id);
}

function cleanTutorAnswer(content: string) {
  return content
    .replace(/\s*\[(?:Trang\s+[^\]]+|Transcript\s+[^\]]+)\]/gi, "")
    .trim();
}

function conversationalMessage(question: string): ChatMessage | undefined {
  const normalized = normalizeIntent(question);

  if (/^(xin chao|chao|chao ban|hello|hi|hey)( ban)?$/.test(normalized)) {
    return assistantMessage(
      "Xin chào! Mình là VLearn Tutor. Mình có thể giúp bạn tìm hiểu học liệu, giải đáp câu hỏi, tạo quiz và flashcard.",
      [],
      undefined
    );
  }

  if (/^(ban la ai|ai la ban|ban ten gi|ban la gi|who are you|what are you)$/.test(normalized)) {
    return assistantMessage(
      "Mình là VLearn Tutor, trợ lý AI hỗ trợ bạn học từ tài liệu đang mở. Mình không phải là bot hay agent được mô tả trong slide.",
      [],
      undefined
    );
  }

  if (/^(cam on|cam on ban|thanks|thank you)$/.test(normalized)) {
    return assistantMessage("Không có gì! Mình luôn sẵn sàng hỗ trợ bạn học.", [], undefined);
  }

  if (/^(ok|oki|okay|duoc|hieu roi)$/.test(normalized)) {
    return assistantMessage("Được nhé! Bạn cứ gửi câu hỏi tiếp theo.", [], undefined);
  }

  return undefined;
}

function normalizeIntent(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assistantMessage(content: string, citations: Citation[], sourceLevel: ChatMessage["sourceLevel"]): ChatMessage {
  return { id: crypto.randomUUID(), role: "assistant", content, citations, sourceLevel };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
