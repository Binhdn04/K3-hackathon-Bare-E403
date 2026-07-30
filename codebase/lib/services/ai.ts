import type { ChatContext, ChatMessage, Citation, Flashcard, QuizOptions, QuizQuestion } from "../types";
import { openAI } from "./openai";
import { retrieve, retrieveForGeneration } from "./retrieval";

const tutorInstructions = `Ban la AI Tutor. Tra loi bang tieng Viet ro rang, ngan gon va chi dua tren SOURCE CONTEXT.
Khong bo sung kien thuc ben ngoai context. Khi dung mot doan, ghi citation theo nhan da cung cap, vi du [Slide 3] hoac [Transcript 02:10].
Neu context khong du, noi ro dieu gi khong the ket luan.`;

function contextWithCitations(content: string, citations: Citation[]) {
  const labels = citations.map((citation) => {
    const label = citation.type === "transcript"
      ? `[Transcript ${formatTime(citation.timestampStart ?? 0)}]`
      : `[Slide ${citation.slideNumber ?? citation.pageNumber ?? "?"}]`;
    return `${citation.chunkId ?? citation.id} => ${label}`;
  });
  return `${content}\n\nCITATION LABELS:\n${labels.join("\n")}`;
}

export async function answerQuestion(question: string, context: ChatContext): Promise<ChatMessage> {
  const found = await retrieve(question, context);
  if (found.isSufficient) {
    const content = await openAI.createText(tutorInstructions, `QUESTION:\n${question}\n\nSOURCE CONTEXT:\n${contextWithCitations(found.content, found.citations)}`);
    return assistantMessage(content, found.citations, found.sourceLevel);
  }

  const web = await openAI.searchWeb(question);
  const citations: Citation[] = web.sources.map((source, index) => ({
    id: `web-${index}-${source.url}`,
    type: "web",
    title: `Nguon Internet: ${source.title}`,
    url: source.url
  }));
  return assistantMessage(
    `Khong tim thay noi dung nay trong hoc lieu. Cau tra loi duoi day su dung nguon Internet.\n\n${web.text}`,
    citations,
    "web"
  );
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
  const found = await retrieveForGeneration(context, options.source);
  if (!found.isSufficient) throw new Error("No material is available for this quiz");
  const result = await openAI.createJson<GeneratedQuiz>(
    "Tao quiz bang tieng Viet chi tu hoc lieu. Cau hoi phai co dap an ro rang. sourceIds chi chua ID nam trong context.",
    `OPTIONS: ${JSON.stringify(options)}\n\nCONTEXT:\n${found.content}`,
    "quiz",
    {
      type: "object",
      additionalProperties: false,
      required: ["questions"],
      properties: {
        questions: {
          type: "array",
          minItems: options.questionCount,
          maxItems: options.questionCount,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "prompt", "options", "answer", "referenceAnswer", "rubric", "points", "sourceIds"],
            properties: {
              type: { type: "string", enum: options.types },
              prompt: { type: "string" },
              options: { type: ["array", "null"], items: { type: "string" } },
              answer: { type: "string" },
              referenceAnswer: { type: ["string", "null"] },
              rubric: { type: ["string", "null"] },
              points: { type: "integer", minimum: 1, maximum: 10 },
              sourceIds: { type: "array", items: { type: "string" }, minItems: 1 }
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
    points: question.points,
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
    JSON.stringify({ answer, expectedAnswer: question.answer, referenceAnswer: question.referenceAnswer, rubric: question.rubric, maxScore: question.points }),
    "quiz_grade",
    {
      type: "object",
      additionalProperties: false,
      required: ["score", "correct", "missing"],
      properties: {
        score: { type: "number", minimum: 0, maximum: question.points },
        correct: { type: "string" },
        missing: { type: "string" }
      }
    }
  );
  return {
    model: openAI.model,
    score: Math.min(question.points, Math.max(0, result.score)),
    maxScore: question.points,
    feedback: { correct: result.correct, missing: result.missing },
    citations: question.citations
  };
}

export async function generateSummary(kind: string, context: ChatContext) {
  const found = await retrieveForGeneration(context, kind);
  if (!found.isSufficient) throw new Error("No material is available to summarize");
  const result = await openAI.createJson<{ bullets: Array<{ text: string; sourceIds: string[] }> }>(
    "Tom tat bang tieng Viet, bullet ngan gon, chi dung context. Moi bullet phai tro den sourceIds that trong context.",
    `SUMMARY TYPE: ${kind}\n\nCONTEXT:\n${found.content}`,
    "summary",
    {
      type: "object",
      additionalProperties: false,
      required: ["bullets"],
      properties: {
        bullets: {
          type: "array",
          minItems: 2,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["text", "sourceIds"],
            properties: {
              text: { type: "string" },
              sourceIds: { type: "array", items: { type: "string" }, minItems: 1 }
            }
          }
        }
      }
    }
  );
  const ids = result.bullets.flatMap((bullet) => bullet.sourceIds);
  return { model: openAI.model, bullets: result.bullets.map((bullet) => bullet.text), citations: mapCitations(ids, found.citations) };
}

export async function generateFlashcards(context: ChatContext): Promise<Flashcard[]> {
  const scope = context.selectedText ? "selected_text" : "current_slide";
  const found = await retrieveForGeneration(context, scope);
  if (!found.isSufficient) throw new Error("No material is available for flashcards");
  const result = await openAI.createJson<{ cards: Array<{ front: string; back: string; sourceId: string }> }>(
    "Tao 3-6 flashcard bang tieng Viet chi tu context. sourceId phai la ID that trong context.",
    found.content,
    "flashcards",
    {
      type: "object",
      additionalProperties: false,
      required: ["cards"],
      properties: {
        cards: {
          type: "array",
          minItems: 3,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["front", "back", "sourceId"],
            properties: { front: { type: "string" }, back: { type: "string" }, sourceId: { type: "string" } }
          }
        }
      }
    }
  );
  return result.cards.map((card) => ({
    id: crypto.randomUUID(),
    front: card.front,
    back: card.back,
    source: mapCitations([card.sourceId], found.citations)[0] ?? found.citations[0],
    status: "new"
  }));
}

function mapCitations(ids: string[], citations: Citation[]) {
  const wanted = new Set(ids);
  const matched = citations.filter((citation) => wanted.has(citation.chunkId ?? citation.id));
  return matched.length > 0 ? matched : citations.slice(0, 2);
}

function assistantMessage(content: string, citations: Citation[], sourceLevel: ChatMessage["sourceLevel"]): ChatMessage {
  return { id: crypto.randomUUID(), role: "assistant", content, citations, sourceLevel };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
