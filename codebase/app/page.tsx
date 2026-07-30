"use client";

import { DocumentReader } from "@/components/DocumentReader";
import { MaterialsColumn } from "@/components/MaterialsColumn";
import { TutorPanel } from "@/components/TutorPanel";
import { courseId, documents, pages as allPages } from "@/lib/mock-data";
import type { ChatContext, ChatMessage, Citation } from "@/lib/types";
import { useMemo, useState } from "react";

export default function Home() {
  const readyDocument = documents.find((document) => document.status === "ready") ?? documents[0];
  const [activeDocumentId, setActiveDocumentId] = useState(readyDocument.id);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [tab, setTab] = useState<"slide" | "transcript">("slide");
  const [selectedText, setSelectedText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      content: "Context hien tai da san sang.",
      citations: []
    }
  ]);

  const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? readyDocument;
  const pages = useMemo(() => allPages.filter((page) => page.documentId === activeDocumentId), [activeDocumentId]);
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

  function openCitation(citation: Citation) {
    if (citation.type === "web" && citation.url) {
      window.open(citation.url, "_blank", "noopener,noreferrer");
      return;
    }

    if (citation.documentId) {
      setActiveDocumentId(citation.documentId);
    }
    if (citation.slideNumber) {
      const targetPages = allPages.filter((page) => page.documentId === (citation.documentId ?? activeDocumentId));
      const targetIndex = targetPages.findIndex((page) => page.slideNumber === citation.slideNumber);
      setPageIndex(Math.max(0, targetIndex));
      setTab(citation.type === "transcript" ? "transcript" : "slide");
    }
  }

  function handleSelectionAction(action: "ask" | "explain" | "summarize" | "quiz" | "flashcard") {
    const labels = {
      ask: "Ask AI",
      explain: "Explain",
      summarize: "Summarize",
      quiz: "Create quiz",
      flashcard: "Create flashcard"
    };
    setMessages((current) => [
      ...current,
      {
        id: `selection-${Date.now()}`,
        role: "assistant",
        content: `${labels[action]} requested for selected text on Slide ${context.slideNumber}. Use the right panel tab to continue.`,
        citations: [
          {
            id: `selection-citation-${Date.now()}`,
            type: "slide",
            title: `Selected text, Slide ${context.slideNumber}`,
            documentId: context.documentId,
            slideNumber: context.slideNumber
          }
        ]
      }
    ]);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-auto lg:h-screen lg:min-h-[760px] lg:grid-cols-[310px_minmax(520px,1fr)_390px] lg:overflow-hidden">
      <MaterialsColumn documents={documents} activeDocumentId={activeDocumentId} onSelect={selectDocument} />
      <DocumentReader
        document={activeDocument}
        pages={pages}
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
