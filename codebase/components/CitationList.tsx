"use client";

import type { Citation } from "@/lib/types";
import { ExternalLink } from "lucide-react";

type Props = {
  citations: Citation[];
  onOpenCitation: (citation: Citation) => void;
};

export function CitationList({ citations, onOpenCitation }: Props) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {citations.map((citation) => (
        <button
          key={citation.id}
          type="button"
          onClick={() => onOpenCitation(citation)}
          className="inline-flex max-w-full items-center gap-1 rounded border border-line bg-white px-2 py-1 text-xs text-ink hover:border-brand hover:text-brand"
          title={citation.type === "web" ? "Open web source" : "Open source in reader"}
        >
          <span className="truncate">{citation.title}</span>
          {citation.type === "web" ? <ExternalLink size={12} /> : null}
        </button>
      ))}
    </div>
  );
}
