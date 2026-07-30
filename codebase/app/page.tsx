"use client";

import { DocumentReader } from "@/components/DocumentReader";
import { MaterialsColumn } from "@/components/MaterialsColumn";
import { TutorPanel } from "@/components/TutorPanel";
import { VLearnHeader } from "@/components/VLearnHeader";
import { courseId } from "@/lib/config";
import type { ChatContext, ChatMessage, Citation, DocumentPage, LearningDocument } from "@/lib/types";
import { FileUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type PageResponse = { pages: DocumentPage[]; error?: string };
type Theme = "light" | "dark";

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
  const [theme, setTheme] = useState<Theme>("dark");

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

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("vlearn-theme");
    const preferredTheme: Theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    setTheme(preferredTheme);
    document.documentElement.dataset.theme = preferredTheme;
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
    setZoom(1);
    setSelectedText("");
  }

  function handleUploaded(document: LearningDocument) {
    setDocuments((current) => [...current.filter((item) => item.id !== document.id), document]);
    selectDocument(document.id);
  }

  async function deleteUploadedDocument(documentId: string) {
    const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`, {
      method: "DELETE"
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(result.error ?? "Không thể xóa tài liệu");

    const remainingDocuments = documents.filter((document) => document.id !== documentId);
    setDocuments(remainingDocuments);
    setPagesByDocument((current) => {
      const next = { ...current };
      delete next[documentId];
      return next;
    });

    if (pendingCitation.current?.documentId === documentId) {
      pendingCitation.current = undefined;
    }

    if (activeDocumentId === documentId) {
      setActiveDocumentId(remainingDocuments.find((document) => document.status === "ready")?.id ?? "");
      setPageIndex(0);
      setZoom(1);
      setSelectedText("");
    }
  }

  function toggleTheme() {
    setTheme((current) => {
      const nextTheme: Theme = current === "dark" ? "light" : "dark";
      window.localStorage.setItem("vlearn-theme", nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      return nextTheme;
    });
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
    <div className={`theme-${theme} flex min-h-screen flex-col overflow-auto bg-[#03091a] lg:h-screen lg:min-h-[760px] lg:overflow-hidden`}>
      <VLearnHeader document={activeDocument} theme={theme} onThemeToggle={toggleTheme} />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[318px_minmax(520px,1fr)_395px]">
        <MaterialsColumn
          documents={documents}
          activeDocumentId={activeDocumentId}
          onSelect={selectDocument}
          onUploaded={handleUploaded}
          onDelete={deleteUploadedDocument}
        />
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
          <main className="flex min-h-[420px] items-center justify-center bg-[#071021] p-8 text-center">
            <div className="rounded-3xl border border-[#27405f] bg-[#0b1529] px-10 py-12 shadow-2xl">
              <FileUp className="mx-auto mb-3 text-[#12c8ff]" size={34} />
              <h2 className="text-lg font-semibold text-[#f5f7ff]">Chưa có tài liệu</h2>
              <p className="mt-2 text-sm text-[#7f8eaa]">Tải file lên để xem nội dung và bắt đầu học.</p>
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
    </div>
  );
}
