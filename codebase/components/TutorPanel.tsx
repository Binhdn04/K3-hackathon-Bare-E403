"use client";

import { CitationList } from "@/components/CitationList";
import type { ChatContext, ChatMessage, Citation, Flashcard, QuizOptions, QuizQuestion } from "@/lib/types";
import { BookOpen, CheckCircle2, MessageSquareText, RotateCcw, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  context: ChatContext;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onOpenCitation: (citation: Citation) => void;
};

type Tab = "tutor" | "quiz" | "summary" | "flashcard";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "tutor", label: "Tutor" },
  { id: "quiz", label: "Quiz" },
  { id: "summary", label: "Summary" },
  { id: "flashcard", label: "Flashcard" }
];

export function TutorPanel({ context, messages, onMessagesChange, onOpenCitation }: Props) {
  const [tab, setTab] = useState<Tab>("tutor");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [quizSource, setQuizSource] = useState<QuizOptions["source"]>("current_slide");
  const [questionCount, setQuestionCount] = useState(4);
  const [difficulty, setDifficulty] = useState<QuizOptions["difficulty"]>("medium");
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [quizTypes, setQuizTypes] = useState<QuizOptions["types"]>(["multiple_choice", "true_false", "short_answer"]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [grades, setGrades] = useState<Record<string, { score: number; maxScore: number; feedback: { correct: string; missing: string } }>>({});
  const [summary, setSummary] = useState<{ bullets: string[]; citations: Citation[] } | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const contextLabel = useMemo(() => {
    if (context.selectedText && context.slideNumber) return `Selected text, Slide ${context.slideNumber}`;
    if (context.slideNumber) return `Slide ${context.slideNumber}`;
    return "Course";
  }, [context.selectedText, context.slideNumber]);

  async function sendChat(forcedQuestion?: string) {
    const question = forcedQuestion ?? input.trim();
    if (!question) return;
    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: question };
    onMessagesChange([...messages, userMessage]);
    setInput("");
    setLoading(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, context })
    });
    const assistant = (await response.json()) as ChatMessage;
    onMessagesChange([...messages, userMessage, assistant]);
    setLoading(false);
  }

  async function generateQuiz() {
    setLoading(true);
    const options: QuizOptions = {
      questionCount,
      difficulty,
      types: quizTypes.length > 0 ? quizTypes : ["multiple_choice"],
      includeTranscript,
      source: context.selectedText ? quizSource : quizSource === "selected_text" ? "current_slide" : quizSource
    };
    const response = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ options, context })
    });
    const result = (await response.json()) as { questions: QuizQuestion[] };
    setQuiz(result.questions);
    setLoading(false);
  }

  async function gradeQuestion(question: QuizQuestion) {
    const answer = quizAnswers[question.id];
    if (!answer) return;
    const response = await fetch("/api/quiz/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, question })
    });
    const result = (await response.json()) as { score: number; maxScore: number; feedback: { correct: string; missing: string } };
    setGrades((current) => ({ ...current, [question.id]: result }));
  }

  function toggleQuizType(type: QuizOptions["types"][number]) {
    setQuizTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
  }

  async function generateSummary(kind: string) {
    setLoading(true);
    const response = await fetch("/api/summary/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, context })
    });
    setSummary((await response.json()) as { bullets: string[]; citations: Citation[] });
    setLoading(false);
  }

  async function generateFlashcards() {
    setLoading(true);
    const response = await fetch("/api/flashcards/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context })
    });
    const result = (await response.json()) as { flashcards: Flashcard[] };
    setFlashcards(result.flashcards);
    setLoading(false);
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-line bg-white">
      <div className="border-b border-line px-4 py-4">
        <div className="mb-3 grid grid-cols-4 gap-1 rounded-md bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded px-2 py-1.5 text-xs font-medium ${tab === item.id ? "bg-white text-brand shadow-sm" : "text-slate-600"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="rounded border border-line bg-panel px-3 py-2 text-sm">
          <span className="font-medium">Context:</span> {contextLabel}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {tab === "tutor" ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-md border p-3 ${message.role === "user" ? "ml-8 border-brand bg-emerald-50" : "mr-8 border-line bg-white"}`}>
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                  <MessageSquareText size={13} />
                  {message.role}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                <CitationList citations={message.citations ?? []} onOpenCitation={onOpenCitation} />
              </div>
            ))}
            {loading ? <p className="text-sm text-slate-500">Generating...</p> : null}
          </div>
        ) : null}

        {tab === "quiz" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["selected_text", "Selected text"],
                ["current_slide", "Current slide"],
                ["slide_range", "Slide range"],
                ["transcript", "Transcript"],
                ["full_lesson", "Full lesson"]
              ].map(([source, label]) => (
                <button
                  key={source}
                  type="button"
                  onClick={() => setQuizSource(source as QuizOptions["source"])}
                  className={`rounded border px-3 py-2 text-sm ${quizSource === source ? "border-brand bg-emerald-50 text-brand" : "border-line hover:border-brand"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-md border border-line p-3">
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Questions</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  className="w-full rounded border border-line px-2 py-1.5"
                />
              </label>
              <label className="mb-3 block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value as QuizOptions["difficulty"])}
                  className="w-full rounded border border-line px-2 py-1.5"
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </label>
              <div className="mb-3 grid grid-cols-1 gap-2 text-sm">
                {[
                  ["multiple_choice", "Multiple choice"],
                  ["true_false", "True/false"],
                  ["short_answer", "Short answer"]
                ].map(([type, label]) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={quizTypes.includes(type as QuizOptions["types"][number])}
                      onChange={() => toggleQuizType(type as QuizOptions["types"][number])}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={includeTranscript} onChange={(event) => setIncludeTranscript(event.target.checked)} />
                Include transcript
              </label>
            </div>
            <button type="button" onClick={generateQuiz} className="inline-flex w-full items-center justify-center gap-2 rounded bg-brand px-3 py-2 text-sm font-medium text-white">
              <Sparkles size={16} />
              Generate quiz
            </button>
            {quiz.map((question, index) => (
              <div key={question.id} className="rounded-md border border-line p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Question {index + 1} · {question.type}</p>
                <p className="text-sm font-medium leading-6">{question.prompt}</p>
                {question.options ? (
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name={question.id}
                          checked={quizAnswers[question.id] === option}
                          onChange={() => setQuizAnswers((current) => ({ ...current, [question.id]: option }))}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="mt-3 min-h-20 w-full rounded border border-line p-2 text-sm"
                    value={quizAnswers[question.id] ?? ""}
                    onChange={(event) => setQuizAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                    placeholder="Short answer"
                  />
                )}
                {question.referenceAnswer ? <p className="mt-3 text-xs text-slate-600">Reference: {question.referenceAnswer}</p> : null}
                {question.rubric ? <p className="mt-1 text-xs text-slate-600">Rubric: {question.rubric}</p> : null}
                <button
                  type="button"
                  onClick={() => gradeQuestion(question)}
                  className="mt-3 rounded border border-line px-3 py-1.5 text-xs font-medium hover:border-brand"
                >
                  Grade
                </button>
                {grades[question.id] ? (
                  <div className="mt-3 rounded bg-panel p-3 text-xs leading-5">
                    <p className="font-semibold">
                      Score: {grades[question.id].score}/{grades[question.id].maxScore}
                    </p>
                    <p>Correct: {grades[question.id].feedback.correct}</p>
                    <p>Missing: {grades[question.id].feedback.missing}</p>
                  </div>
                ) : null}
                <CitationList citations={question.citations} onOpenCitation={onOpenCitation} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "summary" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                ["current_slide", "Current slide"],
                ["selected_text", "Selected text"],
                ["full_lesson", "Full lesson"],
                ["exam_cheat_sheet", "Exam cheat sheet"]
              ].map(([kind, label]) => (
                <button key={kind} type="button" onClick={() => generateSummary(kind)} className="rounded border border-line px-3 py-2 text-sm hover:border-brand">
                  {label}
                </button>
              ))}
            </div>
            {summary ? (
              <div className="rounded-md border border-line p-4">
                <ul className="list-disc space-y-2 pl-4 text-sm leading-6">
                  {summary.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <CitationList citations={summary.citations} onOpenCitation={onOpenCitation} />
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "flashcard" ? (
          <div className="space-y-4">
            <button type="button" onClick={generateFlashcards} className="inline-flex w-full items-center justify-center gap-2 rounded bg-brand px-3 py-2 text-sm font-medium text-white">
              <BookOpen size={16} />
              Generate flashcards
            </button>
            {flashcards.map((card) => (
              <div key={card.id} className="rounded-md border border-line p-4">
                <button
                  type="button"
                  onClick={() => setFlipped((current) => ({ ...current, [card.id]: !current[card.id] }))}
                  className="mb-3 flex min-h-32 w-full items-center justify-center rounded border border-dashed border-line bg-panel p-4 text-center text-sm font-medium leading-6"
                >
                  {flipped[card.id] ? card.back : card.front}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button className="rounded border border-line px-2 py-1.5 text-xs" type="button">
                    <RotateCcw size={13} className="mx-auto" />
                    Chua nho
                  </button>
                  <button className="rounded border border-line px-2 py-1.5 text-xs" type="button">
                    Kho
                  </button>
                  <button className="rounded border border-line px-2 py-1.5 text-xs" type="button">
                    <CheckCircle2 size={13} className="mx-auto" />
                    Da nho
                  </button>
                </div>
                <CitationList citations={[card.source]} onOpenCitation={onOpenCitation} />
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {tab === "tutor" ? (
        <form
          className="border-t border-line p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void sendChat();
          }}
        >
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-12 flex-1 resize-none rounded border border-line p-2 text-sm outline-none focus:border-brand"
              placeholder="Ask about the current context"
            />
            <button type="submit" className="inline-flex h-12 w-12 items-center justify-center rounded bg-brand text-white" title="Send">
              <Send size={17} />
            </button>
          </div>
        </form>
      ) : null}
    </aside>
  );
}
