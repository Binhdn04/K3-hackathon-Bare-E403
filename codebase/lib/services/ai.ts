import type { ChatContext, ChatMessage, Citation, Flashcard, QuizOptions, QuizQuestion } from "../types";
import {
  searchCurrentSlide,
  searchOtherMaterials,
  searchSelectedText,
  searchSlides,
  searchTranscript,
  searchWeb
} from "./retrieval";

const model = "gpt-4o-mini";

function answerFromMaterial(question: string, content: string, citations: Citation[]) {
  return `Dua tren hoc lieu, cau hoi "${question}" lien quan den: ${content.slice(0, 260)}${content.length > 260 ? "..." : ""}\n\nKet luan ngan: hay bat dau tu van de, user va bang chung tac dong truoc khi chon giai phap AI. ${renderInlineCitation(citations[0])}`;
}

function renderInlineCitation(citation?: Citation) {
  if (!citation) return "";
  if (citation.type === "slide") return `[Slide ${citation.slideNumber ?? "?"}]`;
  if (citation.type === "transcript") return `[Transcript]`;
  return `[Web]`;
}

export async function answerQuestion(question: string, context: ChatContext): Promise<ChatMessage> {
  const selected = await searchSelectedText(question, context);
  if (selected.isSufficient) {
    return assistantMessage(answerFromMaterial(question, selected.content, selected.citations), selected.citations, "selected_text");
  }

  const currentSlide = await searchCurrentSlide(question, context);
  if (currentSlide.isSufficient) {
    return assistantMessage(answerFromMaterial(question, currentSlide.content, currentSlide.citations), currentSlide.citations, "current_slide");
  }

  const slides = await searchSlides(question, context.courseId);
  if (slides.isSufficient) {
    return assistantMessage(answerFromMaterial(question, slides.content, slides.citations), slides.citations, "other_slides");
  }

  const transcript = await searchTranscript(question, context.courseId);
  if (transcript.isSufficient) {
    return assistantMessage(answerFromMaterial(question, transcript.content, transcript.citations), transcript.citations, "transcript");
  }

  const materials = await searchOtherMaterials(question, context.courseId);
  if (materials.isSufficient) {
    return assistantMessage(answerFromMaterial(question, materials.content, materials.citations), materials.citations, "other_materials");
  }

  const web = await searchWeb(question);
  return assistantMessage(
    `Khong tim thay noi dung nay trong hoc lieu. Cau tra loi duoi day su dung nguon Internet.\n\n${web.content}`,
    web.citations,
    "web"
  );
}

export async function generateQuiz(options: QuizOptions, context: ChatContext): Promise<QuizQuestion[]> {
  const baseCitation: Citation = {
    id: `quiz-source-${context.documentId ?? "course"}-${context.slideNumber ?? 0}`,
    type: context.selectedText ? "slide" : "transcript",
    title: context.selectedText ? `Selected text, Slide ${context.slideNumber}` : "Lesson transcript",
    documentId: context.documentId,
    slideNumber: context.slideNumber
  };

  return Array.from({ length: options.questionCount }, (_, index) => {
    const type = options.types[index % options.types.length] ?? "multiple_choice";
    return {
      id: `q-${Date.now()}-${index}`,
      type,
      prompt:
        type === "short_answer"
          ? "Giai thich vi sao can xac dinh dung bai toan truoc khi chon giai phap AI."
          : "Dau la buoc nen lam truoc khi build AI tutor?",
      options: type === "multiple_choice" ? ["Chon model lon nhat", "Xac dinh user va pain point", "Viet prompt that dai", "Bo qua citation"] : undefined,
      answer: type === "true_false" ? "true" : "Xac dinh user va pain point",
      referenceAnswer:
        type === "short_answer"
          ? "Can xac dinh dung user, pain point, tan suat va tac dong de tranh build giai phap khong giai quyet van de that."
          : undefined,
      rubric: type === "short_answer" ? "2 diem: neu du user/pain point/tac dong. 1 diem: neu chi noi chung ve van de." : undefined,
      points: type === "short_answer" ? 2 : 1,
      feedback:
        type === "short_answer"
          ? {
              correct: "Neu cau tra loi noi ro ve van de that va bang chung tac dong.",
              missing: "Thieu neu khong de cap user hoac cach do chat luong."
            }
          : undefined,
      citations: [baseCitation]
    };
  });
}

export async function gradeQuiz(answer: string, question: QuizQuestion) {
  const normalized = answer.toLowerCase();
  const expected = question.answer.toLowerCase();
  const score = normalized.includes(expected) || expected.includes(normalized) ? question.points : Math.max(0, question.points - 1);

  return {
    model,
    score,
    maxScore: question.points,
    feedback: {
      correct: score > 0 ? "Cau tra loi cham dung y chinh." : "Cau tra loi co lien quan den chu de.",
      missing: score === question.points ? "Khong thieu y quan trong." : "Can neu ro hon user, pain point hoac citation nguon."
    },
    citations: question.citations
  };
}

export async function generateSummary(kind: string, context: ChatContext) {
  const citation: Citation = {
    id: `summary-${context.documentId ?? "course"}-${context.slideNumber ?? 0}`,
    type: "slide",
    title: `Slide ${context.slideNumber ?? "current"}`,
    documentId: context.documentId,
    slideNumber: context.slideNumber
  };

  const label = kind.replaceAll("_", " ");
  return {
    model,
    bullets: [
      `${label}: Bat dau tu user va pain point ro rang. [Slide ${context.slideNumber ?? "?"}]`,
      "Dung hoc lieu hien tai lam nguon uu tien truoc khi mo rong sang transcript hoac web.",
      "Moi ket luan can co citation de hoc vien quay lai nguon goc."
    ],
    citations: [citation]
  };
}

export async function generateFlashcards(context: ChatContext): Promise<Flashcard[]> {
  const citation: Citation = {
    id: `flashcard-${context.documentId ?? "course"}-${context.slideNumber ?? 0}`,
    type: "slide",
    title: `Slide ${context.slideNumber ?? "current"}`,
    documentId: context.documentId,
    slideNumber: context.slideNumber
  };

  return [
    {
      id: "fc-problem-first",
      front: "Vi sao AI tutor phai uu tien hoc lieu truoc Internet?",
      back: "De cau tra loi bam sat bai hoc, giam hallucination va giu citation ve nguon hoc tap.",
      source: citation,
      status: "new"
    },
    {
      id: "fc-double-diamond",
      front: "Double Diamond dung de lam gi?",
      back: "Mo rong va hoi tu qua problem discovery/definition, sau do solution discovery/delivery.",
      source: citation,
      status: "new"
    }
  ];
}

function assistantMessage(content: string, citations: Citation[], sourceLevel: ChatMessage["sourceLevel"]): ChatMessage {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content,
    citations,
    sourceLevel
  };
}
