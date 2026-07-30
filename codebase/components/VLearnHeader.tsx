import type { LearningDocument } from "@/lib/types";
import { BookOpen, Check, ChevronLeft, Moon, Sun } from "lucide-react";

type Props = {
  document?: LearningDocument;
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

export function VLearnHeader({ document, theme, onThemeToggle }: Props) {
  return (
    <header className="vlearn-header flex h-[70px] shrink-0 items-center justify-between border-b border-[#23324c] bg-[#020719] px-4 text-[#f5f7ff] lg:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="vlearn-icon-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#263550] bg-[#0a1428] text-[#c8d3e8]">
          <ChevronLeft size={18} />
        </div>

        <div className="flex shrink-0 items-center gap-2 border-r border-[#23324c] pr-4">
          <svg className="vlearn-logo-mark" viewBox="0 0 28 28" aria-hidden="true">
            <path className="vlearn-logo-blue" d="M3 6.5 14 17.5 25 6.5v8L14 25.5 3 14.5z" />
            <path className="vlearn-logo-red" d="m3 1.5 6 5-6 5z" />
          </svg>
          <span className="vlearn-logo-word text-xl font-black tracking-tight">
            <span className="vlearn-logo-v">V</span>Learn
          </span>
        </div>

        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#065f80] bg-[#071a30] text-[#12c8ff]">
          <BookOpen size={17} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#eef3ff] lg:max-w-[620px] lg:text-base">
            {document?.title ?? "AI Tutor Workspace"}
          </p>
          <p className="truncate text-[11px] text-[#7f8daa]">
            {document
              ? `${document.kind.toUpperCase()} · ${document.pageCount} trang · ${document.chapter}`
              : "Tải học liệu lên để bắt đầu"}
          </p>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2">
        {document?.status === "ready" ? (
          <span className="vlearn-ready-badge hidden items-center gap-2 rounded-full border border-emerald-800 bg-emerald-950/70 px-3 py-1.5 text-xs font-semibold text-emerald-200 sm:inline-flex">
            <Check size={13} />
            Học liệu sẵn sàng
          </span>
        ) : null}
        <button
          type="button"
          onClick={onThemeToggle}
          aria-label={theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
          className="vlearn-icon-button inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#263550] bg-[#0a1428] text-[#c8d3e8] transition hover:border-[#00a9dc] hover:text-[#12c8ff]"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
