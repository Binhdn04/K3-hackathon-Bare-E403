"use client";

import type { AnnotationTool } from "@/lib/types";
import {
  Circle,
  Download,
  Eraser,
  Highlighter,
  ImageIcon,
  LoaderCircle,
  Minus,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Plus,
  Printer,
  Type
} from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
  pageNumber: number;
  noteCount: number;
  zoom: number;
  downloadHref: string;
  downloadName: string;
  preparingPrint: boolean;
  expanded: boolean;
  onToolChange: (tool: AnnotationTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onExpandedChange: (expanded: boolean) => void;
  onChooseImage: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onPrint: () => void;
};

const colors = ["#ef4444", "#3b82f6", "#4ade80", "#facc15", "#fb923c", "#111827"];

export function AnnotationToolbar({
  tool,
  color,
  strokeWidth,
  pageNumber,
  noteCount,
  zoom,
  downloadHref,
  downloadName,
  preparingPrint,
  expanded,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onExpandedChange,
  onChooseImage,
  onZoomOut,
  onZoomIn,
  onPrint
}: Props) {
  return (
    <div className="annotation-toolbar relative z-30 border-b border-[#23324c] bg-[#071021] px-4 py-3 text-slate-200">
      <div className="annotation-toolbar-surface mx-auto max-w-5xl overflow-hidden rounded-[20px] border border-[#2a3e5e] bg-[#12213a] shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
        <div className="flex min-h-12 flex-wrap items-center gap-2 px-3 py-2">
          <ToolButton active={tool === "read"} label="Đọc" onClick={() => onToolChange("read")}>
            <MousePointer2 size={15} />
          </ToolButton>
          <ToolButton active={tool === "pen"} label="Bút" onClick={() => onToolChange("pen")}>
            <Pencil size={15} />
          </ToolButton>
          <ToolButton active={tool === "highlight"} label="Highlight" onClick={() => onToolChange("highlight")}>
            <Highlighter size={15} />
          </ToolButton>
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            data-active={expanded}
            className={`vlearn-tool-button inline-flex h-9 w-10 items-center justify-center rounded-xl border transition ${
              expanded ? "border-[#00a9dc] bg-[#0b4767] text-[#66ddff]" : "border-[#334866] text-[#bdc8dc] hover:border-[#4b668c]"
            }`}
            title="Công cụ khác"
            aria-label="Công cụ khác"
          >
            <MoreHorizontal size={17} />
          </button>

          <span className="mx-1 hidden h-7 w-px bg-[#31425e] sm:block" aria-hidden="true" />
          <span className="rounded-full bg-[#11344d] px-3 py-1 text-xs font-semibold text-[#62d8ff]">
            Trang {pageNumber} · {noteCount} note
          </span>

          <span className="mx-1 hidden h-7 w-px bg-[#31425e] md:block" aria-hidden="true" />
          <div className="vlearn-zoom-control flex h-9 items-center rounded-xl border border-[#334866] bg-[#0d1a30]">
            <button type="button" onClick={onZoomOut} className="inline-flex h-full w-9 items-center justify-center text-[#8fa0bc] hover:text-[#66ddff]" title="Thu nhỏ">
              <Minus size={14} />
            </button>
            <span className="w-14 text-center text-xs font-bold text-[#dce6f8]">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={onZoomIn} className="inline-flex h-full w-9 items-center justify-center text-[#8fa0bc] hover:text-[#66ddff]" title="Phóng to">
              <Plus size={14} />
            </button>
          </div>

          <span className="mx-1 hidden h-7 w-px bg-[#31425e] lg:block" aria-hidden="true" />
          <a
            href={downloadHref}
            download={downloadName}
            className="vlearn-icon-button inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#334866] text-[#bdc8dc] hover:border-[#00a9dc] hover:text-[#66ddff]"
            title="Tải PDF gốc"
            aria-label="Tải PDF gốc"
          >
            <Download size={15} />
          </a>
          <button
            type="button"
            onClick={onPrint}
            disabled={preparingPrint}
            className="vlearn-icon-button inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#334866] text-[#bdc8dc] hover:border-[#00a9dc] hover:text-[#66ddff] disabled:opacity-50"
            title={preparingPrint ? "Đang chuẩn bị bản in" : "In trang hiện tại"}
            aria-label={preparingPrint ? "Đang chuẩn bị bản in" : "In trang hiện tại"}
          >
            {preparingPrint ? <LoaderCircle className="animate-spin" size={15} /> : <Printer size={15} />}
          </button>
        </div>

        {expanded ? (
          <div className="flex min-h-12 flex-wrap items-center gap-2 border-t border-[#31425e] px-3 py-2">
          <ToolButton active={tool === "circle"} label="Khoanh" onClick={() => onToolChange("circle")}>
            <Circle size={15} />
          </ToolButton>
          <ToolButton active={tool === "text"} label="Text" onClick={() => onToolChange("text")}>
            <Type size={15} />
          </ToolButton>
          <ToolButton active={tool === "image"} label="Ảnh" onClick={onChooseImage}>
            <ImageIcon size={15} />
          </ToolButton>
          <ToolButton active={tool === "eraser"} label="Tẩy" onClick={() => onToolChange("eraser")}>
            <Eraser size={15} />
          </ToolButton>

          <span className="mx-1 h-7 w-px bg-[#31425e]" aria-hidden="true" />
          <div className="flex items-center gap-2" aria-label="Màu annotation">
            {colors.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onColorChange(item)}
                className={`h-6 w-6 rounded-full border-2 transition ${
                  color === item ? "scale-110 border-white" : "border-[#40516d] hover:border-slate-200"
                }`}
                style={{ backgroundColor: item }}
                title={`Chọn màu ${item}`}
                aria-label={`Chọn màu ${item}`}
              />
            ))}
          </div>

          <span className="mx-1 h-7 w-px bg-[#31425e]" aria-hidden="true" />
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#8fa0bc]">
            Nét
            <input
              type="range"
              min={1}
              max={12}
              value={strokeWidth}
              onChange={(event) => onStrokeWidthChange(Number(event.target.value))}
              className="w-24 accent-sky-500"
            />
          </label>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ToolButton({
  active,
  label,
  onClick,
  children
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className={`vlearn-tool-button inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
        active ? "border-[#00a9dc] bg-[#0b4767] text-[#66ddff]" : "border-[#334866] text-[#bdc8dc] hover:border-[#4b668c]"
      }`}
    >
      {children}
      {label}
    </button>
  );
}
