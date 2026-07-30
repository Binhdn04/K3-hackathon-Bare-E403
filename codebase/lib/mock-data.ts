import type { DocumentPage, LearningDocument } from "./types";

export const courseId = "course-ai-product-k3";

export const documents: LearningDocument[] = [
  {
    id: "doc-day2-business-problem",
    courseId,
    title: "Day 2 - Xac dinh bai toan kinh doanh cho AI",
    day: "Day 2",
    chapter: "Business Problem",
    kind: "pdf",
    status: "ready",
    pageCount: 22,
    transcript: "transcript-01-clean.md"
  },
  {
    id: "doc-day2-metrics",
    courseId,
    title: "Day 2 - Chi so thanh cong va tu dong hoa",
    day: "Day 2",
    chapter: "Success Metrics",
    kind: "markdown",
    status: "processing",
    pageCount: 12,
    transcript: "transcript-02-clean.md"
  },
  {
    id: "doc-foundation-llm",
    courseId,
    title: "Day 1 - Foundation LLM",
    day: "Day 1",
    chapter: "LLM Foundation",
    kind: "pdf",
    status: "ready",
    pageCount: 18,
    transcript: "transcript-04-clean.md"
  },
  {
    id: "doc-transformer-attention",
    courseId,
    title: "Foundation - Transformer va Attention",
    day: "Foundation",
    chapter: "Transformer",
    kind: "txt",
    status: "failed",
    pageCount: 0,
    transcript: "transcript-06-clean.md"
  }
];

export const pages: DocumentPage[] = [
  {
    id: "p-1",
    documentId: "doc-day2-business-problem",
    pageNumber: 1,
    slideNumber: 1,
    title: "Tu yeu cau mo ho den bai toan dung",
    content:
      "Ky nang quan trong khi dua AI vao doanh nghiep la bien muc tieu mo ho thanh mot bai toan cu the, co the trien khai trong thoi gian ngan va tao ket qua do duoc."
  },
  {
    id: "p-2",
    documentId: "doc-day2-business-problem",
    pageNumber: 2,
    slideNumber: 2,
    title: "AI khong bat dau tu cong nghe",
    content:
      "Cong nghe sinh ra de giai quyet van de. Truoc khi chon chatbot, agent hay automation, team can xac dinh ai la user, dau la pain point, va dau la tac dong kinh doanh."
  },
  {
    id: "p-3",
    documentId: "doc-day2-business-problem",
    pageNumber: 3,
    slideNumber: 3,
    title: "Double Diamond",
    content:
      "Double Diamond gom problem discovery, problem definition, solution discovery va delivery. Mo rong de tim insight, sau do hoi tu de chon bai toan va giai phap co can cu."
  },
  {
    id: "p-4",
    documentId: "doc-day2-business-problem",
    pageNumber: 4,
    slideNumber: 4,
    title: "Nguon luc huu han",
    content:
      "Khi lop co 1000 hoc vien va tro giang co han, AI nen duoc dung o diem co tan suat cao, ton nhieu thoi gian, va co the do chat luong bang golden set."
  },
  {
    id: "p-5",
    documentId: "doc-foundation-llm",
    pageNumber: 1,
    slideNumber: 1,
    title: "LLM foundation",
    content:
      "Large Language Model du doan token tiep theo dua tren context. Chatbot tot can prompt, context, guardrail va co che truy xuat nguon tai lieu."
  },
  {
    id: "p-6",
    documentId: "doc-foundation-llm",
    pageNumber: 2,
    slideNumber: 2,
    title: "ReAct pattern",
    content:
      "ReAct ket hop reasoning va action: mo hinh suy nghi ve buoc tiep theo, goi cong cu, quan sat ket qua, roi lap lai de tao cau tra loi co can cu."
  }
];

export const transcriptSegments = [
  {
    id: "t-001",
    documentId: "doc-day2-business-problem",
    start: 0,
    end: 72,
    text:
      "Giang vien nhan manh ky nang xac dinh bai toan tu yeu cau mo ho, vi nhieu cong ty muon AI nhung chua biet nen giai quyet van de nao truoc."
  },
  {
    id: "t-049",
    documentId: "doc-day2-business-problem",
    start: 1112,
    end: 1188,
    text:
      "Double Diamond giup tim dung van de truoc khi tim giai phap: mo rong va hoi tu qua hai vien kim cuong."
  },
  {
    id: "t-react",
    documentId: "doc-foundation-llm",
    start: 932,
    end: 1010,
    text:
      "ReAct la vong lap suy luan, hanh dong va quan sat, huu ich khi chatbot can dung cong cu hoac truy xuat tai lieu."
  }
];
