"use client";

import type { AnnotationTool, PdfAnnotation } from "@/lib/types";
import { useRef, useState } from "react";

type Point = { x: number; y: number };

type PendingImage = {
  src: string;
  aspectRatio: number;
};

type Props = {
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
  annotations: PdfAnnotation[];
  pendingImage?: PendingImage;
  onAdd: (annotation: PdfAnnotation) => void;
  onDelete: (annotationId: string) => void;
  onImagePlaced: () => void;
};

export function PdfAnnotationOverlay({
  tool,
  color,
  strokeWidth,
  annotations,
  pendingImage,
  onAdd,
  onDelete,
  onImagePlaced
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [circleStart, setCircleStart] = useState<Point>();
  const [circleEnd, setCircleEnd] = useState<Point>();

  function pointFromEvent(event: React.PointerEvent<SVGSVGElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / bounds.width),
      y: clamp((event.clientY - bounds.top) / bounds.height)
    };
  }

  function normalizedStroke(multiplier = 1) {
    const width = svgRef.current?.getBoundingClientRect().width ?? 1;
    return (strokeWidth * multiplier) / width;
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (tool === "read" || tool === "eraser") return;
    const point = pointFromEvent(event);

    if (tool === "pen" || tool === "highlight") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraftPoints([point]);
      return;
    }

    if (tool === "circle") {
      event.currentTarget.setPointerCapture(event.pointerId);
      setCircleStart(point);
      setCircleEnd(point);
      return;
    }

    if (tool === "text") {
      const text = window.prompt("Nhập nội dung ghi chú:");
      if (!text?.trim()) return;
      const width = event.currentTarget.getBoundingClientRect().width || 1;
      onAdd({
        id: crypto.randomUUID(),
        type: "text",
        color,
        x: point.x,
        y: point.y,
        text: text.trim(),
        fontSize: 16 / width
      });
      return;
    }

    if (tool === "image" && pendingImage) {
      const bounds = event.currentTarget.getBoundingClientRect();
      const width = 0.28;
      const height = Math.min(0.5, (width * bounds.width) / (pendingImage.aspectRatio * bounds.height));
      onAdd({
        id: crypto.randomUUID(),
        type: "image",
        color,
        src: pendingImage.src,
        x: clamp(point.x - width / 2, 0, 1 - width),
        y: clamp(point.y - height / 2, 0, 1 - height),
        width,
        height
      });
      onImagePlaced();
    }
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const point = pointFromEvent(event);
    if (tool === "pen" || tool === "highlight") {
      setDraftPoints((current) => [...current, point]);
    } else if (tool === "circle") {
      setCircleEnd(point);
    }
  }

  function handlePointerUp(event: React.PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if ((tool === "pen" || tool === "highlight") && draftPoints.length > 1) {
      onAdd({
        id: crypto.randomUUID(),
        type: tool,
        color,
        points: draftPoints,
        strokeWidth: normalizedStroke(tool === "highlight" ? 4 : 1)
      });
    }

    if (tool === "circle" && circleStart && circleEnd) {
      const x = Math.min(circleStart.x, circleEnd.x);
      const y = Math.min(circleStart.y, circleEnd.y);
      const width = Math.abs(circleEnd.x - circleStart.x);
      const height = Math.abs(circleEnd.y - circleStart.y);
      if (width > 0.005 && height > 0.005) {
        onAdd({
          id: crypto.randomUUID(),
          type: "circle",
          color,
          x,
          y,
          width,
          height,
          strokeWidth: normalizedStroke()
        });
      }
    }

    setDraftPoints([]);
    setCircleStart(undefined);
    setCircleEnd(undefined);
  }

  function erase(event: React.PointerEvent, annotationId: string) {
    if (tool !== "eraser") return;
    event.preventDefault();
    event.stopPropagation();
    onDelete(annotationId);
  }

  const cursor = tool === "read" ? "auto" : tool === "eraser" ? "not-allowed" : tool === "text" ? "text" : "crosshair";

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      className={`absolute inset-0 z-20 h-full w-full touch-none ${tool === "read" ? "pointer-events-none" : "pointer-events-auto"}`}
      style={{ cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Lớp ghi chú PDF"
    >
      {annotations.map((annotation) => (
        <g
          key={annotation.id}
          onPointerDown={(event) => erase(event, annotation.id)}
          style={{ pointerEvents: tool === "eraser" ? "all" : "none" }}
        >
          {renderAnnotation(annotation, tool === "eraser")}
        </g>
      ))}

      {draftPoints.length > 0 ? (
        <polyline
          points={pointsValue(draftPoints)}
          fill="none"
          stroke={color}
          strokeWidth={normalizedStroke(tool === "highlight" ? 4 : 1)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={tool === "highlight" ? 0.35 : 1}
        />
      ) : null}

      {circleStart && circleEnd ? (
        <rect
          x={Math.min(circleStart.x, circleEnd.x)}
          y={Math.min(circleStart.y, circleEnd.y)}
          width={Math.abs(circleEnd.x - circleStart.x)}
          height={Math.abs(circleEnd.y - circleStart.y)}
          rx={Math.abs(circleEnd.x - circleStart.x) / 2}
          ry={Math.abs(circleEnd.y - circleStart.y) / 2}
          fill="none"
          stroke={color}
          strokeWidth={normalizedStroke()}
        />
      ) : null}
    </svg>
  );
}

function renderAnnotation(annotation: PdfAnnotation, erasing: boolean) {
  if (annotation.type === "pen" || annotation.type === "highlight") {
    return (
      <polyline
        points={pointsValue(annotation.points)}
        fill="none"
        stroke={annotation.color}
        strokeWidth={erasing ? Math.max(annotation.strokeWidth, 0.014) : annotation.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={erasing ? 0.65 : annotation.type === "highlight" ? 0.35 : 1}
      />
    );
  }

  if (annotation.type === "circle") {
    return (
      <rect
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        rx={annotation.width / 2}
        ry={annotation.height / 2}
        fill={erasing ? "rgba(255,255,255,0.01)" : "none"}
        stroke={annotation.color}
        strokeWidth={erasing ? Math.max(annotation.strokeWidth, 0.014) : annotation.strokeWidth}
      />
    );
  }

  if (annotation.type === "text") {
    return (
      <text
        x={annotation.x}
        y={annotation.y}
        fill={annotation.color}
        fontSize={annotation.fontSize}
        fontWeight={600}
        style={{ paintOrder: "stroke", stroke: "white", strokeWidth: annotation.fontSize * 0.08 }}
      >
        {annotation.text}
      </text>
    );
  }

  if (annotation.type === "image") {
    return (
      <image
        href={annotation.src}
        x={annotation.x}
        y={annotation.y}
        width={annotation.width}
        height={annotation.height}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }

  return null;
}

function pointsValue(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}
