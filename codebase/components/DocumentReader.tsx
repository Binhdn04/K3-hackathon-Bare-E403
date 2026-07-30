"use client";

import type { DocumentPage, LearningDocument } from "@/lib/types";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { MarkdownContent } from "./MarkdownContent";

const PdfDocumentView = dynamic(
  () => import("./PdfDocumentView").then((module) => module.PdfDocumentView),
  { ssr: false }
);

type Props = {
  document: LearningDocument;
  pages: DocumentPage[];
  pageIndex: number;
  zoom: number;
  loading?: boolean;
  onPageChange: (index: number) => void;
  onZoomChange: (zoom: number) => void;
  onSelectedText: (text: string) => void;
};

export function DocumentReader({
  document,
  pages,
  pageIndex,
  zoom,
  loading,
  onPageChange,
  onZoomChange,
  onSelectedText
}: Props) {
  const page = pages[pageIndex] ?? pages[0];

  useEffect(() => {
    return () => persistentHighlights()?.delete("selected-context");
  }, [document.id, pageIndex]);

  function captureSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    const highlights = persistentHighlights();
    const HighlightConstructor = (window as unknown as {
      Highlight?: new (...ranges: Range[]) => unknown;
    }).Highlight;

    highlights?.delete("selected-context");
    if (text && selection?.rangeCount && HighlightConstructor) {
      highlights?.set("selected-context", new HighlightConstructor(selection.getRangeAt(0).cloneRange()));
    }
    onSelectedText(text);
  }

  return (
    <main className="flex h-full min-h-0 flex-col bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{document.title}</p>
          <p className="text-xs text-slate-500">{document.chapter}</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="min-h-0 flex-1 overflow-auto p-5">
        <article
          onMouseUp={captureSelection}
          className={`mx-auto min-h-[620px] rounded-md border border-line bg-white shadow-soft ${document.kind === "pdf" ? "flex w-fit justify-center overflow-visible" : "max-w-4xl overflow-hidden p-8"}`}
          style={document.kind === "pdf" ? undefined : { transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {loading ? (
            <p className="text-sm text-slate-500">Đang tải tài liệu...</p>
          ) : page && document.kind === "pdf" ? (
            <PdfDocumentView documentId={document.id} pageNumber={page.pageNumber} zoom={zoom} />
          ) : page && document.kind === "markdown" ? (
            <div>
              <h1 className="mb-6 text-3xl font-semibold text-ink">{page.title}</h1>
              <MarkdownContent content={page.content} />
            </div>
          ) : page ? (
            <div className="prose max-w-none"><h2>{page.title}</h2><p className="whitespace-pre-wrap leading-8">{page.content}</p></div>
          ) : (
            <p className="text-sm text-slate-500">File này không có nội dung có thể hiển thị.</p>
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
          Trước
        </button>
        <span className="text-sm text-slate-600">
          Trang {pageIndex + 1} / {Math.max(1, pages.length)}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, Math.min(pages.length - 1, pageIndex + 1)))}
          disabled={pageIndex >= pages.length - 1}
          className="inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-sm disabled:opacity-40"
        >
          Sau
          <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
}

function persistentHighlights() {
  return (CSS as unknown as {
    highlights?: { set: (name: string, highlight: unknown) => void; delete: (name: string) => void };
  }).highlights;
}
