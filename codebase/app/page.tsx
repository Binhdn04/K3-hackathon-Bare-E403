"use client";

import { DocumentReader } from "@/components/DocumentReader";
import { MaterialsColumn } from "@/components/MaterialsColumn";
import { TutorPanel } from "@/components/TutorPanel";
import { courseId } from "@/lib/config";
import type { ChatContext, ChatMessage, Citation, DocumentPage, LearningDocument } from "@/lib/types";
import { FileUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type PageResponse = { pages: DocumentPage[]; error?: string };

export default function Home() {
  const [documents, setDocuments] = useState<LearningDocument[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState("");
  const [pagesByDocument, setPagesByDocument] = useState<Record<string, DocumentPage[]>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedText, setSelectedText] = useState("");
  const [contextScope, setContextScope] = useState<NonNullable<ChatContext["scope"]>>("current_slide");
  const [readerLoading, setReaderLoading] = useState(false);
  const pendingCitation = useRef<{ documentId: string; page?: number }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    void fetch(`/api/documents?courseId=${encodeURIComponent(courseId)}`)
      .then((response) => response.json())
      .then((result: { documents?: LearningDocument[] }) => {
        const loadedDocuments = result.documents ?? [];
        setDocuments(loadedDocuments);
        setActiveDocumentId((current) => {
          if (loadedDocuments.some((document) => document.id === current && document.status === "ready")) return current;
          return loadedDocuments.find((document) => document.status === "ready")?.id ?? "";
        });
      })
      .catch(() => undefined);
  }, []);

  const loadDocument = useCallback(async (documentId: string) => {
    if (!documentId) return;
    setReaderLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/pages`);
      const result = (await response.json()) as PageResponse;
      if (!response.ok) throw new Error(result.error ?? "Cannot load document");
      setPagesByDocument((current) => ({ ...current, [documentId]: result.pages }));
      if (pendingCitation.current?.documentId === documentId) {
        const requestedPage = pendingCitation.current.page;
        const target = result.pages.findIndex((page) => page.slideNumber === requestedPage || page.pageNumber === requestedPage);
        setPageIndex(Math.max(0, target));
        pendingCitation.current = undefined;
      }
    } finally {
      setReaderLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocument(activeDocumentId);
  }, [activeDocumentId, loadDocument]);

  const activeDocument = documents.find((document) => document.id === activeDocumentId);
  const pages = pagesByDocument[activeDocumentId] ?? [];
  const activePage = pages[pageIndex] ?? pages[0];
  const context: ChatContext = {
    courseId,
    documentId: activeDocumentId || undefined,
    slideNumber: activePage?.slideNumber,
    selectedText: contextScope === "current_slide" ? selectedText || undefined : undefined,
    scope: contextScope
  };

  function selectDocument(documentId: string) {
    setActiveDocumentId(documentId);
    setPageIndex(0);
    setSelectedText("");
  }

  function handleUploaded(document: LearningDocument) {
    setDocuments((current) => [...current.filter((item) => item.id !== document.id), document]);
    selectDocument(document.id);
  }

  function openCitation(citation: Citation) {
    if (citation.type === "web" && citation.url) {
      window.open(citation.url, "_blank", "noopener,noreferrer");
      return;
    }
    const targetDocumentId = citation.documentId ?? activeDocumentId;
    const targetPage = citation.slideNumber ?? citation.pageNumber;
    if (!targetDocumentId) return;
    if (targetDocumentId !== activeDocumentId || !pagesByDocument[targetDocumentId]) {
      pendingCitation.current = { documentId: targetDocumentId, page: targetPage };
      setActiveDocumentId(targetDocumentId);
    } else if (targetPage !== undefined) {
      const targetIndex = pagesByDocument[targetDocumentId].findIndex(
        (page) => page.slideNumber === targetPage || page.pageNumber === targetPage
      );
      setPageIndex(Math.max(0, targetIndex));
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-auto lg:h-screen lg:min-h-[760px] lg:grid-cols-[310px_minmax(520px,1fr)_390px] lg:overflow-hidden">
      <MaterialsColumn documents={documents} activeDocumentId={activeDocumentId} onSelect={selectDocument} onUploaded={handleUploaded} />
      {activeDocument ? (
        <DocumentReader
          document={activeDocument}
          pages={pages}
          loading={readerLoading}
          pageIndex={pageIndex}
          zoom={zoom}
          onPageChange={(index) => {
            setPageIndex(index);
            setSelectedText("");
          }}
          onZoomChange={setZoom}
          onSelectedText={setSelectedText}
        />
      ) : (
        <main className="flex min-h-[420px] items-center justify-center bg-panel p-8 text-center">
          <div>
            <FileUp className="mx-auto mb-3 text-slate-400" size={34} />
            <h2 className="text-lg font-semibold text-ink">Chưa có tài liệu</h2>
            <p className="mt-2 text-sm text-slate-500">Tải file lên để xem nội dung và bắt đầu học.</p>
          </div>
        </main>
      )}
      <TutorPanel
        context={context}
        messages={messages}
        onMessagesChange={setMessages}
        onOpenCitation={openCitation}
        onContextScopeChange={setContextScope}
      />
    </div>
  );
}
