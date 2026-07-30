"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `/api/pdf-worker?version=${encodeURIComponent(pdfjs.version)}`;

type Props = {
  documentId: string;
  pageNumber: number;
  title: string;
  onReady: () => void;
  onError: (message: string) => void;
};

export function PdfPrintView({ documentId, pageNumber, title, onReady, onError }: Props) {
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>();
  const readySent = useRef(false);

  function markPageRendered() {
    if (pageSize && !readySent.current) {
      readySent.current = true;
      window.requestAnimationFrame(() => window.requestAnimationFrame(onReady));
    }
  }

  return createPortal(
    <div className="pdf-print-root" aria-hidden="true">
      {pageSize ? (
        <style>{`@media print { @page { size: ${(pageSize.width / 72).toFixed(4)}in ${(pageSize.height / 72).toFixed(4)}in; margin: 0; } }`}</style>
      ) : null}
      <Document
        file={`/api/documents/${encodeURIComponent(documentId)}/file`}
        onLoadSuccess={async (pdf) => {
          try {
            const selectedPage = await pdf.getPage(pageNumber);
            const viewport = selectedPage.getViewport({ scale: 1 });
            setPageSize({ width: viewport.width, height: viewport.height });
          } catch (error) {
            onError(error instanceof Error ? error.message : "Không đọc được kích thước trang PDF");
          }
        }}
        onLoadError={(error) => onError(error.message)}
        loading={<p>Đang chuẩn bị bản in...</p>}
        error={<p>Không thể chuẩn bị bản in.</p>}
      >
        {pageSize ? (
          <div className="pdf-print-page">
            <Page
              pageNumber={pageNumber}
              width={960}
              devicePixelRatio={1}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={markPageRendered}
            />
          </div>
        ) : null}
      </Document>
      <span className="sr-only">{title}</span>
    </div>,
    window.document.body
  );
}
