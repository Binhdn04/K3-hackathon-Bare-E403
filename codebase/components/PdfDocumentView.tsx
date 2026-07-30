"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// react-pdf can use its own nested pdfjs-dist version. Tell the server which
// worker version is required so PDF.js does not reject a mismatched worker.
pdfjs.GlobalWorkerOptions.workerSrc = `/api/pdf-worker?version=${encodeURIComponent(pdfjs.version)}`;

type Props = {
  documentId: string;
  pageNumber: number;
  zoom: number;
};

export function PdfDocumentView({ documentId, pageNumber, zoom }: Props) {
  return (
    <Document
      file={`/api/documents/${encodeURIComponent(documentId)}/file`}
      loading={<p className="p-8 text-sm text-slate-500">Đang mở PDF...</p>}
      error={<p className="p-8 text-sm text-rose-700">Không thể hiển thị PDF.</p>}
    >
      <Page pageNumber={pageNumber} scale={zoom} renderTextLayer renderAnnotationLayer />
    </Document>
  );
}
