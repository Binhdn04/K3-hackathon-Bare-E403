"use client";

import { CitationList } from "@/components/CitationList";
import type { ChatContext, ChatMessage, Citation, Flashcard, QuizOptions, QuizQuestion } from "@/lib/types";
import { BookOpen, Bot, LoaderCircle, MessageSquareText, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  context: ChatContext;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onOpenCitation: (citation: Citation) => void;
  onContextScopeChange: (scope: NonNullable<ChatContext["scope"]>) => void;
};

type Tab = "tutor" | "quiz" | "flashcard";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "tutor", label: "Tutor" },
  { id: "quiz", label: "Quiz" },
  { id: "flashcard", label: "Flashcard" }
];

export function TutorPanel({ context, messages, onMessagesChange, onOpenCitation, onContextScopeChange }: Props) {
  const [tab, setTab] = useState<Tab>("tutor");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [error, setError] = useState("");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState(4);
  const [difficulty, setDifficulty] = useState<QuizOptions["difficulty"]>("medium");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, { feedback: { correct: string; missing: string } }>>({});
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const contextLabel = useMemo(() => {
    if (context.scope === "entire_document") return "Toàn bộ file đang mở";
    if (context.selectedText && context.slideNumber) return `Đoạn đã chọn, trang ${context.slideNumber}`;
    if (context.slideNumber) return `Trang ${context.slideNumber}`;
    return "Chưa có tài liệu";
  }, [context.scope, context.selectedText, context.slideNumber]);

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Request failed");
    return result;
  }

  async function sendChat(forcedQuestion?: string) {
    const question = forcedQuestion ?? input.trim();
    if (!question) return;
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: question };
    onMessagesChange([...messages, userMessage]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const assistant = await postJson<ChatMessage>("/api/chat", { question, context });
      onMessagesChange([...messages, userMessage, assistant]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz() {
    setGeneratingQuiz(true);
    setError("");
    const options: QuizOptions = {
      questionCount,
      difficulty,
      types: ["multiple_choice"]
    };
    try {
      const result = await postJson<{ questions: QuizQuestion[] }>("/api/quiz/generate", { options, context });
      setQuiz(result.questions);
      setQuizAnswers({});
      setGrades({});
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Quiz generation failed");
    } finally {
      setGeneratingQuiz(false);
    }
  }

  function gradeQuestion(question: QuizQuestion) {
    const answer = quizAnswers[question.id];
    if (!answer) return;
    const correct = isCorrectMultipleChoice(answer, question.answer, question.options ?? []);
    setGrades((current) => ({
      ...current,
      [question.id]: {
        feedback: {
          correct: correct ? "Đáp án đúng" : "Đáp án sai",
          missing: correct ? "Không có nội dung còn thiếu." : "Hãy xem lại đáp án và tài liệu tham khảo bên dưới."
        }
      }
    }));
  }

  function selectQuizAnswer(questionId: string, answer: string) {
    setQuizAnswers((current) => ({ ...current, [questionId]: answer }));
    setGrades((current) => {
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }

  async function generateFlashcards() {
    setGeneratingFlashcards(true);
    setError("");
    try {
      const result = await postJson<{ flashcards: Flashcard[] }>("/api/flashcards/generate", { context });
      setFlashcards(result.flashcards);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Flashcard generation failed");
    } finally {
      setGeneratingFlashcards(false);
    }
  }

  return (
    <aside className="vlearn-tutor flex h-full min-h-0 flex-col bg-[#030a1b] text-[#f5f7ff]">
      <div className="border-b border-[#23324c] px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#065f80] bg-[#071a30] text-[#12c8ff]">
            <Bot size={17} />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-white">VLearn Tutor</h2>
            <p className="text-[11px] font-semibold text-[#00e2a4]">Trợ lý học theo ngữ cảnh</p>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-[#0b152b] p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              data-active={tab === item.id}
              className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
                tab === item.id ? "bg-[#11344d] text-[#62d8ff] shadow-sm" : "text-[#7f8eaa] hover:text-[#c8d3e8]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="rounded-xl border border-[#1e2e48] bg-[#020719] px-3 py-2 text-xs text-[#9dabca]">
          <span className="font-semibold text-[#62d8ff]">Ngữ cảnh:</span> {contextLabel}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#0b152b] p-1" aria-label="Phạm vi ngữ cảnh">
          <button
            type="button"
            onClick={() => onContextScopeChange("current_slide")}
            data-active={context.scope !== "entire_document"}
            className={`rounded-lg px-2 py-1.5 text-xs font-semibold ${
              context.scope !== "entire_document" ? "bg-[#082c4e] text-[#66ddff] shadow-sm" : "text-[#7f8eaa]"
            }`}
          >
            Trang hiện tại
          </button>
          <button
            type="button"
            onClick={() => onContextScopeChange("entire_document")}
            disabled={!context.documentId}
            data-active={context.scope === "entire_document"}
            className={`rounded-lg px-2 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
              context.scope === "entire_document" ? "bg-[#082c4e] text-[#66ddff] shadow-sm" : "text-[#7f8eaa]"
            }`}
          >
            Toàn bộ file
          </button>
        </div>
        {generatingQuiz || generatingFlashcards ? (
          <p role="status" className="mt-2 flex items-center gap-2 rounded-xl border border-sky-900 bg-sky-950/50 px-3 py-2 text-sm text-sky-300">
            <LoaderCircle className="animate-spin" size={15} />
            {generatingQuiz ? "Hệ thống đang tạo quiz..." : "Hệ thống đang tạo flashcard..."}
          </p>
        ) : null}
        {error ? <p className="mt-2 rounded-xl border border-rose-900 bg-rose-950/50 px-3 py-2 text-xs text-rose-300">{error}</p> : null}
      </div>

      <div className="vlearn-scrollbar min-h-0 flex-1 overflow-auto p-4">
        {tab === "tutor" ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl border p-3 ${
                  message.role === "user"
                    ? "ml-8 border-[#0d7198] bg-[#082c4e]"
                    : "mr-8 border-[#1e2e48] bg-[#020719]"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-[#71809e]">
                  <MessageSquareText size={13} />
                  {message.role}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-[#edf3ff]">{message.content}</p>
                {message.sourceLevel === "web" ? <p className="mt-2 text-xs font-semibold text-amber-300">Nguồn Internet</p> : null}
                <CitationList citations={message.citations ?? []} onOpenCitation={onOpenCitation} />
              </div>
            ))}
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-[#1e2e48] bg-[#020719] p-4 text-sm leading-6 text-[#d7e0f2]">
                Xin chào! Mình là VLearn Tutor. Bạn có thể bôi đen một đoạn trên slide hoặc gửi câu hỏi tự do nhé!
              </div>
            ) : null}
            {loading ? <p className="text-sm text-[#7f8eaa]">Đang tạo câu trả lời...</p> : null}
          </div>
        ) : null}

        {tab === "quiz" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
              {context.scope === "entire_document"
                ? "Quiz sẽ dùng toàn bộ file đang mở làm ngữ cảnh."
                : context.selectedText
                ? "Quiz sẽ dùng đoạn văn bản bạn đang bôi đen làm ngữ cảnh."
                : "Quiz sẽ dùng trang hiện tại làm ngữ cảnh."}
            </div>
            <div className="rounded-2xl border border-[#2a3955] bg-[#0b152a] p-3">
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase text-[#7f8eaa]">Questions</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  className="w-full rounded-xl border border-[#30425f] bg-[#0d1830] px-2 py-1.5 text-[#f4f7ff] outline-none focus:border-[#00aee8]"
                />
              </label>
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase text-[#7f8eaa]">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as QuizOptions["difficulty"])}
                  className="w-full rounded-xl border border-[#30425f] bg-[#0d1830] px-2 py-1.5 text-[#f4f7ff] outline-none focus:border-[#00aee8]"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </label>
              <p className="text-xs font-semibold uppercase text-[#7f8eaa]">Multiple choice</p>
            </div>
            <button
              type="button"
              onClick={generateQuiz}
              disabled={generatingQuiz || generatingFlashcards || !context.documentId}
              className="vlearn-primary-button inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#00aee8] bg-[#073b68] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingQuiz ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {generatingQuiz ? "Đang tạo quiz..." : "Tạo quiz"}
            </button>
            {quiz.map((question, index) => (
              <div key={question.id} className="rounded-2xl border border-[#2a3955] bg-[#0b152a] p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-[#71809e]">Question {index + 1} · {question.type}</p>
                <p className="text-sm font-medium leading-6 text-[#edf3ff]">{question.prompt}</p>
                <div className="mt-3 space-y-2">
                  {(question.options ?? []).map((option) => (
                    <label key={option} className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm text-[#c8d3e8] hover:border-[#2d405f] hover:bg-[#101c33]">
                      <input
                        type="radio"
                        name={question.id}
                        checked={quizAnswers[question.id] === option}
                        onChange={() => selectQuizAnswer(question.id, option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => gradeQuestion(question)}
                  disabled={!quizAnswers[question.id]}
                  className="vlearn-secondary-button mt-3 rounded-xl border border-[#0d7198] bg-[#082c4e] px-3 py-1.5 text-xs font-semibold text-[#e8f8ff] hover:border-[#00aee8] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Grade
                </button>
                {grades[question.id] ? (
                  <div className="mt-3 rounded-xl border border-[#23324c] bg-[#071021] p-3 text-xs leading-5 text-[#c8d3e8]">
                    <p className="font-semibold">{grades[question.id].feedback.correct}</p>
                    <p>Missing: {grades[question.id].feedback.missing}</p>
                    <p className="mt-2 font-medium">Reference: {question.referenceAnswer ?? question.answer}</p>
                    <CitationList citations={question.citations} onOpenCitation={onOpenCitation} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {tab === "flashcard" ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={generateFlashcards}
              disabled={generatingQuiz || generatingFlashcards || !context.documentId}
              className="vlearn-primary-button inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#00aee8] bg-[#073b68] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingFlashcards ? <LoaderCircle className="animate-spin" size={16} /> : <BookOpen size={16} />}
              {generatingFlashcards ? "Đang tạo flashcard..." : "Tạo flashcard"}
            </button>
            {flashcards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-[#2a3955] bg-[#0b152a] p-4">
                <button
                  type="button"
                  onClick={() => setFlipped((current) => ({ ...current, [card.id]: !current[card.id] }))}
                  className="mb-3 flex min-h-32 w-full items-center justify-center rounded-xl border border-dashed border-[#30425f] bg-[#071021] p-4 text-center text-sm font-medium leading-6 text-[#edf3ff]"
                >
                  {flipped[card.id] ? card.back : card.front}
                </button>
                <CitationList citations={[card.source]} onOpenCitation={onOpenCitation} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {tab === "tutor" ? (
        <form
          className="border-t border-[#23324c] bg-[#03091a] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendChat();
          }}
        >
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-12 flex-1 resize-none rounded-2xl border border-[#30425f] bg-[#0d1830] p-3 text-sm text-[#f4f7ff] outline-none placeholder:text-[#607190] focus:border-[#00aee8]"
              placeholder="Nhập câu hỏi hoặc bôi đen tài liệu..."
            />
            <button type="submit" className="vlearn-send-button inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0d7198] bg-[#082c4e] text-[#66ddff] hover:border-[#00aee8]" title="Gửi">
              <Send size={17} />
            </button>
          </div>
        </form>
      ) : null}
    </aside>
  );
}

function normalizeAnswer(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("vi").replace(/\s+/g, " ");
}

function isCorrectMultipleChoice(selected: string, expected: string, options: string[]) {
  const normalizedSelected = normalizeAnswer(selected);
  const normalizedExpected = normalizeAnswer(expected);
  if (normalizedSelected === normalizedExpected) return true;

  if (/^[a-z]$/.test(normalizedExpected)) {
    const optionIndex = normalizedExpected.charCodeAt(0) - "a".charCodeAt(0);
    if (options[optionIndex] && normalizeAnswer(options[optionIndex]) === normalizedSelected) return true;
  }
  if (/^\d+$/.test(normalizedExpected)) {
    const optionIndex = Number(normalizedExpected) - 1;
    if (options[optionIndex] && normalizeAnswer(options[optionIndex]) === normalizedSelected) return true;
  }

  const selectedMarker = normalizedSelected.match(/^([a-z])(?:[.):\-]|\s)/)?.[1];
  if (/^[a-z]$/.test(normalizedExpected) && selectedMarker === normalizedExpected) return true;

  const withoutMarker = (value: string) => value.replace(/^[a-z](?:[.):\-]|\s)+/, "").trim();
  return withoutMarker(normalizedSelected) === withoutMarker(normalizedExpected);
}
