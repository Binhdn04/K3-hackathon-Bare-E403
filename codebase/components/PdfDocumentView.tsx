"use client";

import type { AnnotationTool, PdfAnnotation } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { PdfAnnotationOverlay } from "./PdfAnnotationOverlay";

// react-pdf can use its own nested pdfjs-dist version. Tell the server which
// worker version is required so PDF.js does not reject a mismatched worker.
pdfjs.GlobalWorkerOptions.workerSrc = `/api/pdf-worker?version=${encodeURIComponent(pdfjs.version)}`;

type Props = {
  documentId: string;
  pageNumber: number;
  zoom: number;
  annotationTool: AnnotationTool;
  annotationColor: string;
  annotationStrokeWidth: number;
  annotations: PdfAnnotation[];
  pendingImage?: { src: string; aspectRatio: number };
  onAddAnnotation: (annotation: PdfAnnotation) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onImagePlaced: () => void;
};

export function PdfDocumentView({
  documentId,
  pageNumber,
  zoom,
  annotationTool,
  annotationColor,
  annotationStrokeWidth,
  annotations,
  pendingImage,
  onAddAnnotation,
  onDeleteAnnotation,
  onImagePlaced
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fitWidth, setFitWidth] = useState(0);
  const [renderZoom, setRenderZoom] = useState(zoom);
  const [pageAspectRatio, setPageAspectRatio] = useState<number>();
  const [renderPreview, setRenderPreview] = useState<string>();
  const renderPreviewRef = useRef<string>();
  const requestedZoomRef = useRef(zoom);

  requestedZoomRef.current = zoom;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateFitWidth = () => setFitWidth(Math.max(1, Math.floor(container.clientWidth)));
    updateFitWidth();

    const observer = new ResizeObserver(updateFitWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setRenderZoom(requestedZoomRef.current);
    setPageAspectRatio(undefined);
    setRenderPreview(undefined);
    renderPreviewRef.current = undefined;
  }, [documentId, pageNumber]);

  useEffect(() => {
    if (Math.abs(renderZoom - zoom) < 0.001) return;

    const timer = window.setTimeout(() => {
      if (!renderPreviewRef.current) {
        const canvas = containerRef.current?.querySelector("canvas");
        if (canvas) {
          try {
            const preview = canvas.toDataURL("image/png");
            renderPreviewRef.current = preview;
            setRenderPreview(preview);
          } catch {
            // The previous canvas is only a visual buffer; zoom can continue without it.
          }
        }
      }
      setRenderZoom(zoom);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [renderZoom, zoom]);

  function finishRendering() {
    if (Math.abs(renderZoom - requestedZoomRef.current) >= 0.001) return;
    renderPreviewRef.current = undefined;
    setRenderPreview(undefined);
  }

  const targetWidth = fitWidth * zoom;
  const targetHeight = pageAspectRatio ? targetWidth * pageAspectRatio : undefined;
  const previewScale = renderZoom > 0 ? zoom / renderZoom : 1;

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={`/api/documents/${encodeURIComponent(documentId)}/file`}
        loading={<p className="p-8 text-sm text-slate-500">Đang mở PDF...</p>}
        error={<p className="p-8 text-sm text-rose-700">Không thể hiển thị PDF.</p>}
        className="mx-auto w-fit"
      >
        {fitWidth > 0 ? (
          <div
            className="relative overflow-hidden rounded-md border border-line bg-white shadow-soft"
            style={{ width: targetWidth, height: targetHeight }}
          >
            <div
              className={pageAspectRatio ? "absolute left-0 top-0" : "relative"}
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: "top left"
              }}
            >
              <Page
                pageNumber={pageNumber}
                width={fitWidth}
                scale={renderZoom}
                renderTextLayer
                renderAnnotationLayer
                onLoadSuccess={(loadedPage) => {
                  if (loadedPage.originalWidth > 0) {
                    setPageAspectRatio(loadedPage.originalHeight / loadedPage.originalWidth);
                  }
                }}
                onRenderSuccess={finishRendering}
                className="overflow-hidden bg-white"
              />
              <PdfAnnotationOverlay
                tool={annotationTool}
                color={annotationColor}
                strokeWidth={annotationStrokeWidth}
                annotations={annotations}
                pendingImage={pendingImage}
                onAdd={onAddAnnotation}
                onDelete={onDeleteAnnotation}
                onImagePlaced={onImagePlaced}
              />
            </div>
            {renderPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={renderPreview}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
              />
            ) : null}
          </div>
        ) : null}
      </Document>
    </div>
  );
}
