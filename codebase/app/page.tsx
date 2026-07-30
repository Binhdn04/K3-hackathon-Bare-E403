"use client";

import { DocumentReader } from "@/components/DocumentReader";
import { MaterialsColumn } from "@/components/MaterialsColumn";
import { TutorPanel } from "@/components/TutorPanel";
import { courseId, documents as seededDocuments, pages as seededPages } from "@/lib/mock-data";
import type { ChatContext, ChatMessage, Citation, DocumentPage, LearningDocument } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

type PageResponse = { pages: DocumentPage[]; transcript: string; error?: string };

export default function Home() {
  const readyDocument = seededDocuments.find((document) => document.status === "ready") ?? seededDocuments[0];
  const [documents, setDocuments] = useState<LearningDocument[]>(seededDocuments);
  const [activeDocumentId, setActiveDocumentId] = useState(readyDocument.id);
  const [pagesByDocument, setPagesByDocument] = useState<Record<string, DocumentPage[]>>({});
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState<"slide" | "transcript">("slide");
  const [selectedText, setSelectedText] = useState("");
  const [readerLoading, setReaderLoading] = useState(false);
  const pendingCitation = useRef<{ documentId: string; page?: number }>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "assistant-welcome", role: "assistant", content: "Context hien tai da san sang.", citations: [] }
  ]);

  useEffect(() => {
    const seeded = seededPages.reduce<Record<string, DocumentPage[]>>((result, page) => {
      result[page.documentId] = [...(result[page.documentId] ?? []), page];
      return result;
    }, {});
    setPagesByDocument(seeded);
    void fetch(`/api/documents?courseId=${encodeURIComponent(courseId)}`)
      .then((response) => response.json())
      .then((result: { documents?: LearningDocument[] }) => result.documents && setDocuments(result.documents))
      .catch(() => undefined);
  }, []);

  const loadDocument = useCallback(async (documentId: string) => {
    setReaderLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/pages`);
      const result = (await response.json()) as PageResponse;
      if (!response.ok) throw new Error(result.error ?? "Cannot load document");
      setPagesByDocument((current) => ({ ...current, [documentId]: result.pages }));
      setTranscripts((current) => ({ ...current, [documentId]: result.transcript }));
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

  const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? readyDocument;
  const pages = pagesByDocument[activeDocumentId] ?? [];
  const activePage = pages[pageIndex] ?? pages[0];
  const context: ChatContext = {
    courseId,
    documentId: activeDocumentId,
    slideNumber: activePage?.slideNumber,
    selectedText: selectedText || undefined
  };

  function selectDocument(documentId: string) {
    setActiveDocumentId(documentId);
    setPageIndex(0);
    setSelectedText("");
    setTab("slide");
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
    if (targetDocumentId !== activeDocumentId || !pagesByDocument[targetDocumentId]) {
      pendingCitation.current = { documentId: targetDocumentId, page: targetPage };
      setActiveDocumentId(targetDocumentId);
    } else if (targetPage !== undefined) {
      const targetIndex = pagesByDocument[targetDocumentId].findIndex(
        (page) => page.slideNumber === targetPage || page.pageNumber === targetPage
      );
      setPageIndex(Math.max(0, targetIndex));
    }
    setTab(citation.type === "transcript" ? "transcript" : "slide");
  }

  function handleSelectionAction(action: "ask" | "explain" | "summarize" | "quiz" | "flashcard") {
    const labels = { ask: "Ask AI", explain: "Explain", summarize: "Summarize", quiz: "Create quiz", flashcard: "Create flashcard" };
    setMessages((current) => [...current, {
      id: `selection-${Date.now()}`,
      role: "assistant",
      content: `${labels[action]} requested for selected text on Slide ${context.slideNumber}.`,
      citations: [{
        id: `selection-citation-${Date.now()}`,
        type: "slide",
        title: `Selected text, Slide ${context.slideNumber}`,
        documentId: context.documentId,
        pageNumber: activePage?.pageNumber,
        slideNumber: context.slideNumber
      }]
    }]);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-auto lg:h-screen lg:min-h-[760px] lg:grid-cols-[310px_minmax(520px,1fr)_390px] lg:overflow-hidden">
      <MaterialsColumn documents={documents} activeDocumentId={activeDocumentId} onSelect={selectDocument} onUploaded={handleUploaded} />
      <DocumentReader
        document={activeDocument}
        pages={pages}
        transcript={transcripts[activeDocumentId] ?? activeDocument.transcriptText ?? ""}
        loading={readerLoading}
        pageIndex={pageIndex}
        zoom={zoom}
        tab={tab}
        selectedText={selectedText}
        onPageChange={setPageIndex}
        onZoomChange={setZoom}
        onTabChange={setTab}
        onSelectedText={setSelectedText}
        onSelectionAction={handleSelectionAction}
      />
      <TutorPanel context={context} messages={messages} onMessagesChange={setMessages} onOpenCitation={openCitation} />
    </div>
  );
}
