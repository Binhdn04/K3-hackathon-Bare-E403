"use client";

import type { DocumentPage, LearningDocument } from "@/lib/types";
import { ChevronLeft, ChevronRight, Search, ZoomIn, ZoomOut } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  document: LearningDocument;
  pages: DocumentPage[];
  pageIndex: number;
  zoom: number;
  tab: "slide" | "transcript";
  selectedText?: string;
  transcript: string;
  loading?: boolean;
  onPageChange: (index: number) => void;
  onZoomChange: (zoom: number) => void;
  onTabChange: (tab: "slide" | "transcript") => void;
  onSelectedText: (text: string) => void;
  onSelectionAction: (action: "ask" | "explain" | "summarize" | "quiz" | "flashcard") => void;
};

export function DocumentReader({
  document,
  pages,
  pageIndex,
  zoom,
  tab,
  selectedText,
  transcript,
  loading,
  onPageChange,
  onZoomChange,
  onTabChange,
  onSelectedText,
  onSelectionAction
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const page = pages[pageIndex] ?? pages[0];
  const transcriptParagraphs = useMemo(() => transcript.split(/\n\n+/).filter(Boolean), [transcript]);

  function captureSelection() {
    const selection = window.getSelection()?.toString().trim() ?? "";
    onSelectedText(selection);
    setShowMenu(selection.length > 0);
  }

  return (
    <main className="flex h-full min-h-0 flex-col bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{document.title}</p>
          <p className="text-xs text-slate-500">{document.chapter}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-line bg-white p-0.5">
            {(["slide", "transcript"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onTabChange(item)}
                className={`rounded px-3 py-1.5 text-sm ${tab === item ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {item === "slide" ? "Slide" : "Transcript"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(0.75, zoom - 0.1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-line bg-white hover:border-brand"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-14 text-center text-sm">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(1.5, zoom + 0.1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-line bg-white hover:border-brand"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto p-5">
        {showMenu && selectedText ? (
          <div className="sticky top-0 z-10 mb-3 inline-flex flex-wrap gap-1 rounded-md border border-line bg-white p-1 shadow-soft">
            {[
              ["ask", "Ask AI"],
              ["explain", "Explain"],
              ["summarize", "Summarize"],
              ["quiz", "Create quiz"],
              ["flashcard", "Create flashcard"]
            ].map(([action, label]) => (
              <button
                key={action}
                type="button"
                onClick={() => onSelectionAction(action as "ask" | "explain" | "summarize" | "quiz" | "flashcard")}
                className="rounded px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-50 hover:text-brand"
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <article
          onMouseUp={captureSelection}
          className="mx-auto min-h-[620px] max-w-4xl rounded-md border border-line bg-white p-8 shadow-soft"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {loading ? <p className="text-sm text-slate-500">Loading document...</p> : tab === "slide" ? (
            <div className="flex min-h-[540px] flex-col">
              <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
                <span className="rounded bg-emerald-100 px-3 py-1 text-sm font-medium text-brand">Slide {page?.slideNumber ?? 1}</span>
                <Search size={18} className="text-slate-400" />
              </div>
              <h2 className="text-3xl font-semibold leading-tight text-ink">{page?.title}</h2>
              <p className="mt-8 text-xl leading-9 text-slate-700">{page?.content}</p>
              <div className="mt-auto border-t border-line pt-4 text-sm text-slate-500">{document.kind.toUpperCase()} · {page?.title}</div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <h2>Transcript - {document.chapter}</h2>
              {transcriptParagraphs.length === 0 ? <p>No transcript was parsed for this document.</p> : null}
              {transcriptParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}
        </article>
      </div>

      <div className="flex items-center justify-between border-t border-line bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
          disabled={pageIndex === 0}
          className="inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-sm disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {pageIndex + 1} / {Math.max(1, pages.length)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, Math.min(pages.length - 1, pageIndex + 1)))}
          disabled={pageIndex >= pages.length - 1}
          className="inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-sm disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
}
