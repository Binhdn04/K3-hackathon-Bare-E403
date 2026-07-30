"use client";

import type { LearningDocument } from "@/lib/types";
import { courseId } from "@/lib/config";
import { FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  documents: LearningDocument[];
  activeDocumentId: string;
  onSelect: (documentId: string) => void;
  onUploaded: (document: LearningDocument) => void;
};

const statusClass: Record<LearningDocument["status"], string> = {
  uploading: "bg-amber-100 text-amber-800",
  processing: "bg-sky-100 text-sky-800",
  ready: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800"
};

export function MaterialsColumn({ documents, activeDocumentId, onSelect, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
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

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-line bg-white">
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-ink">AI Tutor</h1>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-line hover:border-brand hover:text-brand"
            title="Upload material"
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

      {uploading ? <p className="border-b border-line px-4 py-2 text-xs text-sky-700">Parsing and indexing...</p> : null}
      {error ? <p className="border-b border-line px-4 py-2 text-xs text-rose-700">{error}</p> : null}

      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {Object.entries(grouped).map(([day, items]) => (
          <section key={day} className="mb-5">
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{day}</h2>
            <div className="space-y-2">
              {items.map((document) => (
                <button
                  key={document.id}
                  type="button"
                  onClick={() => document.status === "ready" && onSelect(document.id)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    activeDocumentId === document.id ? "border-brand bg-emerald-50" : "border-line bg-white hover:border-slate-400"
                  } ${document.status !== "ready" ? "opacity-80" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 shrink-0 text-slate-500" size={16} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-5">{document.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{document.chapter}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${statusClass[document.status]}`}>
                          {document.status}
                        </span>
                        <span className="text-[11px] text-slate-500">{document.kind.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
