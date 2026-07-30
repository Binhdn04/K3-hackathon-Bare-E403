"use client";

import type { LearningDocument } from "@/lib/types";
import { courseId } from "@/lib/config";
import { BookOpen, ChevronDown, CirclePlay, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  documents: LearningDocument[];
  activeDocumentId: string;
  onSelect: (documentId: string) => void;
  onUploaded: (document: LearningDocument) => void;
  onDelete: (documentId: string) => Promise<void>;
};

const statusClass: Record<LearningDocument["status"], string> = {
  uploading: "bg-amber-950/70 text-amber-300",
  processing: "bg-sky-950/70 text-sky-300",
  ready: "bg-emerald-950/70 text-emerald-300",
  failed: "bg-rose-950/70 text-rose-300"
};

export function MaterialsColumn({ documents, activeDocumentId, onSelect, onUploaded, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState("");
  const [error, setError] = useState("");
  const grouped = documents.reduce<Record<string, LearningDocument[]>>((acc, document) => {
    acc[document.day] = [...(acc[document.day] ?? []), document];
    return acc;
  }, {});

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", courseId);
    try {
      const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const result = (await response.json()) as LearningDocument & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Upload failed");
      onUploaded(result);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeDocument(document: LearningDocument) {
    const confirmed = window.confirm(`Xóa “${document.title}” và file đã upload?`);
    if (!confirmed) return;

    setDeletingDocumentId(document.id);
    setError("");
    try {
      await onDelete(document.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa tài liệu");
    } finally {
      setDeletingDocumentId("");
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-[#23324c] bg-[#071126] text-[#f5f7ff]">
      <div className="border-b border-[#23324c] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#065f80] bg-[#071a30] text-[#12c8ff]">
              <BookOpen size={17} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-[#f5f7ff]">Học liệu môn học</h1>
              <p className="truncate text-[11px] text-[#7f8eaa]">Tài liệu và nội dung đã upload</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="vlearn-icon-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2a3b58] bg-[#0c172c] text-[#c8d3e8] hover:border-[#12c8ff] hover:text-[#12c8ff]"
            title="Tải học liệu lên"
          >
            <Upload size={17} />
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt"
          className="hidden"
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </div>

      {uploading ? <p className="border-b border-[#23324c] bg-sky-950/40 px-4 py-2 text-xs text-sky-300">Đang phân tích và lập chỉ mục...</p> : null}
      {error ? <p className="border-b border-[#23324c] bg-rose-950/40 px-4 py-2 text-xs text-rose-300">{error}</p> : null}

      <div className="vlearn-scrollbar min-h-0 flex-1 overflow-auto px-3 py-4">
        {Object.entries(grouped).map(([day, items]) => (
          <section
            key={day}
            className={`mb-4 overflow-hidden rounded-2xl border ${
              items.some((item) => item.id === activeDocumentId)
                ? "border-[#087fb4] bg-[#061d35]"
                : "border-[#2a3b58] bg-[#0c172c]"
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#233b57] px-4 py-3">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#edf3ff]">
                  <CirclePlay size={15} className="text-[#12c8ff]" />
                  {day}
                </h2>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-[#71809e]">
                  {items.length} tài liệu · Published
                </p>
              </div>
              <ChevronDown size={15} className="text-[#71809e]" />
            </div>
            <div className="space-y-2 p-2">
              {items.map((document) => (
                <div
                  key={document.id}
                  data-active={activeDocumentId === document.id}
                  className={`material-button group relative w-full rounded-xl border text-left transition ${
                    activeDocumentId === document.id
                      ? "border-[#00bce8] border-l-[5px] bg-[#06304a]"
                      : "border-[#2b3a55] bg-[#0b172d] hover:border-[#3f5577]"
                  } ${document.status !== "ready" ? "opacity-80" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => document.status === "ready" && onSelect(document.id)}
                    disabled={deletingDocumentId === document.id}
                    className="block w-full p-3 pr-10 text-left disabled:cursor-wait"
                  >
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 shrink-0 text-[#12c8ff]" size={16} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#e7edfb]">{document.title}</p>
                      <p className="mt-1 text-[11px] text-[#7585a3]">{document.pageCount} trang · {document.chapter}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          data-status={document.status}
                          className={`document-status rounded px-2 py-0.5 text-[11px] font-medium ${statusClass[document.status]}`}
                        >
                          {document.status}
                        </span>
                        <span className="text-[10px] font-semibold text-[#7585a3]">{document.kind.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  </button>
                  {document.day === "Uploaded" ? (
                    <button
                      type="button"
                      onClick={() => void removeDocument(document)}
                      disabled={Boolean(deletingDocumentId)}
                      className="material-delete-button absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#2b3a55] bg-[#0c172c] text-[#7585a3] opacity-75 transition hover:border-rose-500 hover:bg-rose-950/40 hover:text-rose-300 disabled:cursor-wait disabled:opacity-40"
                      title={`Xóa ${document.title}`}
                      aria-label={`Xóa ${document.title}`}
                    >
                      {deletingDocumentId === document.id
                        ? <LoaderCircle className="animate-spin" size={14} />
                        : <Trash2 size={14} />}
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
