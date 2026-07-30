"use client";

import type { AnnotationTool, DocumentPage, LearningDocument, PdfAnnotation } from "@/lib/types";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnnotationToolbar } from "./AnnotationToolbar";
import { MarkdownContent } from "./MarkdownContent";

const PdfDocumentView = dynamic(
  () => import("./PdfDocumentView").then((module) => module.PdfDocumentView),
  { ssr: false }
);

const PdfPrintView = dynamic(
  () => import("./PdfPrintView").then((module) => module.PdfPrintView),
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
  const [pageInput, setPageInput] = useState(String(pageIndex + 1));
  const [preparingPrint, setPreparingPrint] = useState(false);
  const [annotationTool, setAnnotationTool] = useState<AnnotationTool>("read");
  const [annotationColor, setAnnotationColor] = useState("#ef4444");
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(3);
  const [annotationToolsExpanded, setAnnotationToolsExpanded] = useState(false);
  const [annotationsByPage, setAnnotationsByPage] = useState<Record<string, PdfAnnotation[]>>({});
  const [pendingImage, setPendingImage] = useState<{ src: string; aspectRatio: number }>();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const readerScrollRef = useRef<HTMLDivElement | null>(null);
  const zoomAnchorRef = useRef<{ horizontalRatio: number }>();
  const annotationKey = `${document.id}:${page?.pageNumber ?? 1}`;
  const pageAnnotations = annotationsByPage[annotationKey] ?? [];

  useEffect(() => {
    return () => persistentHighlights()?.delete("selected-context");
  }, [document.id, pageIndex]);

  useEffect(() => {
    setPageInput(String(pageIndex + 1));
  }, [document.id, pageIndex]);

  useEffect(() => {
    if (!preparingPrint) return;
    const finishPrinting = () => setPreparingPrint(false);
    window.addEventListener("afterprint", finishPrinting);
    return () => window.removeEventListener("afterprint", finishPrinting);
  }, [preparingPrint]);

  useLayoutEffect(() => {
    const scroller = readerScrollRef.current;
    const anchor = zoomAnchorRef.current;
    if (!scroller || !anchor) return;

    scroller.scrollLeft = Math.max(
      0,
      anchor.horizontalRatio * scroller.scrollWidth - scroller.clientWidth / 2
    );
    zoomAnchorRef.current = undefined;
  }, [zoom]);

  function changeZoom(nextZoom: number) {
    const boundedZoom = Math.min(3, Math.max(0.5, nextZoom));
    if (Math.abs(boundedZoom - zoom) < 0.001) return;

    const scroller = readerScrollRef.current;
    if (scroller) {
      const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
      zoomAnchorRef.current = {
        horizontalRatio: scroller.scrollWidth > 0
          ? viewportCenter / scroller.scrollWidth
          : 0.5
      };
    }
    onZoomChange(boundedZoom);
  }

  function goToInputPage() {
    const requestedPage = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(requestedPage) || pages.length === 0) {
      setPageInput(String(pageIndex + 1));
      return;
    }
    const targetPage = Math.min(pages.length, Math.max(1, requestedPage));
    setPageInput(String(targetPage));
    onPageChange(targetPage - 1);
  }

  function printPdf() {
    if (document.kind === "pdf" && !preparingPrint) setPreparingPrint(true);
  }

  function addAnnotation(annotation: PdfAnnotation) {
    setAnnotationsByPage((current) => ({
      ...current,
      [annotationKey]: [...(current[annotationKey] ?? []), annotation]
    }));
  }

  function deleteAnnotation(annotationId: string) {
    setAnnotationsByPage((current) => ({
      ...current,
      [annotationKey]: (current[annotationKey] ?? []).filter((annotation) => annotation.id !== annotationId)
    }));
  }

  function chooseAnnotationImage(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert("Ảnh annotation phải nhỏ hơn 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result ?? "");
      const image = new window.Image();
      image.onload = () => {
        setPendingImage({ src, aspectRatio: image.naturalWidth / Math.max(1, image.naturalHeight) });
        setAnnotationTool("image");
      };
      image.onerror = () => window.alert("Không thể đọc ảnh đã chọn.");
      image.src = src;
    };
    reader.readAsDataURL(file);
  }

  function captureSelection() {
    if (document.kind === "pdf" && annotationTool !== "read") return;
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
    <main className="flex h-full min-h-0 flex-col border-r border-[#23324c] bg-[#071021] text-[#f5f7ff]">
      {document.kind !== "pdf" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#23324c] bg-[#0b1529] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#eef3ff]">{document.title}</p>
            <p className="text-xs text-[#7f8eaa]">{document.chapter}</p>
          </div>
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeZoom(zoom - 0.1)}
            className="vlearn-icon-button inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#334866] bg-[#12213a] text-[#bdc8dc] hover:border-[#00a9dc] hover:text-[#66ddff]"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="w-14 text-center text-sm font-semibold text-[#dce6f8]">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => changeZoom(zoom + 0.1)}
            className="vlearn-icon-button inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#334866] bg-[#12213a] text-[#bdc8dc] hover:border-[#00a9dc] hover:text-[#66ddff]"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          </div>
        </div>
      ) : null}

      {document.kind === "pdf" ? (
        <>
          <AnnotationToolbar
            tool={annotationTool}
            color={annotationColor}
            strokeWidth={annotationStrokeWidth}
            pageNumber={page?.pageNumber ?? pageIndex + 1}
            noteCount={pageAnnotations.length}
            zoom={zoom}
            downloadHref={`/api/documents/${encodeURIComponent(document.id)}/file`}
            downloadName={`${document.title}.pdf`}
            preparingPrint={preparingPrint}
            expanded={annotationToolsExpanded}
            onToolChange={setAnnotationTool}
            onColorChange={setAnnotationColor}
            onStrokeWidthChange={setAnnotationStrokeWidth}
            onExpandedChange={setAnnotationToolsExpanded}
            onChooseImage={() => imageInputRef.current?.click()}
            onZoomOut={() => changeZoom(zoom - 0.1)}
            onZoomIn={() => changeZoom(zoom + 0.1)}
            onPrint={printPdf}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              chooseAnnotationImage(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </>
      ) : null}

      <div
        ref={readerScrollRef}
        className="vlearn-scrollbar min-h-0 flex-1 overflow-auto bg-[#071021] p-5"
      >
        <article
          onMouseUp={captureSelection}
          className={document.kind === "pdf"
            ? "mx-auto flex w-full max-w-5xl justify-center overflow-visible rounded-3xl border border-[#27405f] bg-[#0b1529] p-4 shadow-[0_0_0_2px_rgba(0,184,235,0.08)]"
            : "mx-auto min-h-[620px] max-w-4xl overflow-hidden rounded-2xl border border-[#27405f] bg-[#0b1529] p-8 shadow-2xl"}
          style={document.kind === "pdf" ? undefined : { transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {loading ? (
            <p className="p-8 text-sm text-[#8a99b5]">Đang tải tài liệu...</p>
          ) : page && document.kind === "pdf" ? (
            <div className="w-full">
              <div className="mb-3 flex items-center justify-between gap-3 font-mono text-[11px] text-[#9aabc7]">
                <span>Trang {page.pageNumber} / {Math.max(1, pages.length)}</span>
                <span className="truncate">{document.title}</span>
              </div>
              <PdfDocumentView
                documentId={document.id}
                pageNumber={page.pageNumber}
                zoom={zoom}
                annotationTool={annotationTool}
                annotationColor={annotationColor}
                annotationStrokeWidth={annotationStrokeWidth}
                annotations={pageAnnotations}
                pendingImage={pendingImage}
                onAddAnnotation={addAnnotation}
                onDeleteAnnotation={deleteAnnotation}
                onImagePlaced={() => {
                  setPendingImage(undefined);
                  setAnnotationTool("read");
                }}
              />
            </div>
          ) : page && document.kind === "markdown" ? (
            <div>
              <h1 className="mb-6 text-3xl font-semibold text-[#f5f7ff]">{page.title}</h1>
              <MarkdownContent content={page.content} />
            </div>
          ) : page ? (
            <div className="prose prose-invert max-w-none"><h2>{page.title}</h2><p className="whitespace-pre-wrap leading-8">{page.content}</p></div>
          ) : (
            <p className="text-sm text-[#8a99b5]">File này không có nội dung có thể hiển thị.</p>
          )}
        </article>
      </div>

      <div className="flex items-center justify-between border-t border-[#23324c] bg-[#03091a] px-4 py-3 text-[#9dabca]">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
          disabled={pageIndex === 0}
          className="reader-nav-button inline-flex h-10 items-center gap-2 rounded-xl border border-[#2d405f] bg-[#122039] px-3 text-sm hover:border-[#00a9dc] hover:text-[#66ddff] disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Trước
        </button>
        <label className="flex items-center gap-2 font-mono text-sm text-[#9dabca]">
          <span>Trang</span>
          <input
            type="number"
            min={1}
            max={Math.max(1, pages.length)}
            value={pageInput}
            disabled={pages.length === 0}
            onChange={(event) => setPageInput(event.target.value)}
            onBlur={goToInputPage}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            aria-label="Nhập số trang cần mở"
            className="h-9 w-16 rounded-xl border border-[#2d405f] bg-[#122039] px-2 text-center text-sm text-[#eef3ff] outline-none focus:border-[#00a9dc] disabled:opacity-50"
          />
          <span>/ {Math.max(1, pages.length)}</span>
        </label>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, Math.min(pages.length - 1, pageIndex + 1)))}
          disabled={pageIndex >= pages.length - 1}
          className="reader-nav-button inline-flex h-10 items-center gap-2 rounded-xl border border-[#2d405f] bg-[#122039] px-3 text-sm hover:border-[#00a9dc] hover:text-[#66ddff] disabled:opacity-40"
        >
          Sau
          <ChevronRight size={16} />
        </button>
      </div>
      {preparingPrint ? (
        <PdfPrintView
          key={`${document.id}:${page?.pageNumber ?? 1}`}
          documentId={document.id}
          pageNumber={page?.pageNumber ?? 1}
          title={document.title}
          onReady={() => {
            window.print();
            setPreparingPrint(false);
          }}
          onError={(message) => {
            setPreparingPrint(false);
            window.alert(`Không thể chuẩn bị bản in: ${message}`);
          }}
        />
      ) : null}
    </main>
  );
}

function persistentHighlights() {
  return (CSS as unknown as {
    highlights?: { set: (name: string, highlight: unknown) => void; delete: (name: string) => void };
  }).highlights;
}
