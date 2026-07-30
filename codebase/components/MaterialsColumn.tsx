"use client";

import type { LearningDocument } from "@/lib/types";
import { FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  documents: LearningDocument[];
  activeDocumentId: string;
  onSelect: (documentId: string) => void;
};

const statusClass: Record<LearningDocument["status"], string> = {
  uploading: "bg-amber-100 text-amber-800",
  processing: "bg-sky-100 text-sky-800",
  ready: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800"
};

export function MaterialsColumn({ documents, activeDocumentId, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localUploads, setLocalUploads] = useState<LearningDocument[]>([]);
  const grouped = [...documents, ...localUploads].reduce<Record<string, LearningDocument[]>>((acc, document) => {
    acc[document.day] = [...(acc[document.day] ?? []), document];
    return acc;
  }, {});

  async function upload(file?: File) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/documents/upload", { method: "POST", body: formData });
    const result = (await response.json()) as { id: string; title: string; status: LearningDocument["status"] };
    setLocalUploads((current) => [
      ...current,
      {
        id: result.id,
        courseId: "course-ai-product-k3",
        title: result.title,
        day: "Uploaded",
        chapter: "New material",
        kind: file.name.endsWith(".pdf") ? "pdf" : file.name.endsWith(".pptx") ? "pptx" : file.name.endsWith(".md") ? "markdown" : "txt",
        status: result.status,
        pageCount: 0
      }
    ]);
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
          accept=".pdf,.pptx,.md,.txt"
          className="hidden"
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </div>

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
