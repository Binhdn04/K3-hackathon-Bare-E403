# Codebase Status

## Current Architecture

### Frontend Structure

The application is a Next.js 14 App Router prototype in `codebase/`.

- `codebase/app/layout.tsx`: root layout and metadata.
- `codebase/app/page.tsx`: client-side shell for the three-column tutor experience. It imports mock documents/pages directly, owns active document/page/selection/chat state, and wires citations back to the reader.
- `codebase/components/MaterialsColumn.tsx`: left column for document grouping, status display, and upload UI.
- `codebase/components/DocumentReader.tsx`: center reader for slide/transcript tabs, pagination, zoom, text selection, and selection actions.
- `codebase/components/TutorPanel.tsx`: right panel for chat, quiz generation/grading, summaries, and flashcards.
- `codebase/components/CitationList.tsx`: reusable citation buttons for slide/transcript/web sources.
- `codebase/app/globals.css`, `codebase/tailwind.config.ts`: styling and Tailwind theme.

Current frontend state is local React state. There is no global state store, no server-loaded document list, no authenticated user/session model, and no persisted client data.

### Backend Structure

The backend is implemented as Next.js route handlers under `codebase/app/api/`.

- `codebase/app/api/chat/route.ts`: validates `question` and `context.courseId`, then calls `answerQuestion`.
- `codebase/app/api/documents/upload/route.ts`: accepts multipart form data and returns a synthetic processing document response.
- `codebase/app/api/documents/[id]/pages/route.ts`: returns mock pages for a document id.
- `codebase/app/api/documents/[id]/status/route.ts`: returns mock status for a document id.
- `codebase/app/api/summary/generate/route.ts`: validates `kind` and context, then calls `generateSummary`.
- `codebase/app/api/quiz/generate/route.ts`: validates quiz options/context, then calls `generateQuiz`.
- `codebase/app/api/quiz/grade/route.ts`: validates answer/question, then calls `gradeQuiz`.
- `codebase/app/api/flashcards/generate/route.ts`: validates context, then calls `generateFlashcards`.

There is no separate backend server, worker, queue, file storage adapter, OpenAI SDK client, database client, auth middleware, or background processing process.

### Database

`codebase/lib/db/schema.sql` defines a PostgreSQL + pgvector schema, but it is not connected to runtime code.

Defined tables include:

- Course/session/document storage: `courses`, `learning_sessions`, `documents`, `document_pages`, `document_chunks`, `transcript_segments`.
- Chat history and citations: `conversations`, `messages`, `message_citations`.
- Quiz data: `quizzes`, `quiz_questions`, `quiz_attempts`.
- Flashcards: `flashcard_decks`, `flashcards`.

The schema includes vector columns for `document_chunks.embedding` and `transcript_segments.embedding`, plus an ivfflat cosine index for document chunk embeddings. No migration runner, database URL config, query layer, or ORM is present.

### Services

- `codebase/lib/services/ai.ts`: central mocked AI service. It names `gpt-4o-mini` as the intended model, but does not call OpenAI or any model provider. It returns deterministic chat, quiz, grade, summary, and flashcard outputs.
- `codebase/lib/services/retrieval.ts`: mocked retrieval service. It performs simple keyword matching over local arrays from `codebase/lib/mock-data.ts` and follows this priority order: selected text, current slide, other slides, transcript, other materials, web fallback.
- `codebase/lib/mock-data.ts`: in-memory course id, documents, pages, and transcript segments.
- `codebase/lib/types.ts`: shared TypeScript types for documents, pages, chat context/messages, citations, quiz options/questions, and flashcards.

### API Routes

All API routes exist for the prototype surface, but all route results are backed by mocks or deterministic helpers:

| Route | Method | Current behavior | Mock or real | Files involved |
| --- | --- | --- | --- | --- |
| `/api/chat` | POST | Returns an assistant message from mocked retrieval/AI pipeline. | Mock | `codebase/app/api/chat/route.ts`, `codebase/lib/services/ai.ts`, `codebase/lib/services/retrieval.ts` |
| `/api/documents/upload` | POST | Accepts a file object and returns synthetic `upload-{Date.now()}` id with `processing` status. | Mock upload | `codebase/app/api/documents/upload/route.ts`, `codebase/components/MaterialsColumn.tsx` |
| `/api/documents/[id]/pages` | GET | Returns pages filtered from mock data. | Mock data | `codebase/app/api/documents/[id]/pages/route.ts`, `codebase/lib/mock-data.ts` |
| `/api/documents/[id]/status` | GET | Returns document status from mock data or 404. | Mock data | `codebase/app/api/documents/[id]/status/route.ts`, `codebase/lib/mock-data.ts` |
| `/api/summary/generate` | POST | Returns fixed bullet summary with citation. | Mock AI | `codebase/app/api/summary/generate/route.ts`, `codebase/lib/services/ai.ts` |
| `/api/quiz/generate` | POST | Returns generated quiz objects based on requested count/types, but prompts/answers are fixed templates. | Mock AI | `codebase/app/api/quiz/generate/route.ts`, `codebase/lib/services/ai.ts` |
| `/api/quiz/grade` | POST | Grades by lowercase substring comparison against expected answer. | Mock grading | `codebase/app/api/quiz/grade/route.ts`, `codebase/lib/services/ai.ts` |
| `/api/flashcards/generate` | POST | Returns two fixed flashcards. | Mock AI | `codebase/app/api/flashcards/generate/route.ts`, `codebase/lib/services/ai.ts` |

## Completed Features

### Fully Implemented

- Three-column UI layout with materials, reader, and tutor panel.
- Mock document list grouped by day/chapter/status.
- File picker and upload request flow from the frontend to `/api/documents/upload`.
- Reader tab switching between slide and transcript views.
- Slide pagination and zoom controls.
- Text selection capture with action menu.
- Chat UI that sends context to `/api/chat` and renders assistant responses.
- Citation display and navigation back to slide/transcript context.
- Web citation opening for `web` citation types.
- Quiz controls for source, question count, difficulty, type selection, and transcript inclusion.
- Quiz rendering for multiple choice and short answer style inputs.
- Per-question grading request flow.
- Summary generation UI and rendering.
- Flashcard generation, flip interaction, and source citation display.
- Shared TypeScript domain types.
- SQL schema draft for PostgreSQL + pgvector.

### Partially Implemented

- Upload flow: frontend and route exist, but uploaded files are not stored, parsed, embedded, or made ready.
- Document APIs: pages/status routes exist, but the main page still imports mock data directly instead of loading documents/pages from APIs.
- Retrieval priority: priority order is implemented, but matching is lexical and in-memory, not vector/hybrid retrieval.
- Citations: citation objects are produced and clickable, but they are not grounded in real extracted file offsets, bounding boxes, transcript timestamps from parsed media, or persisted message citation records.
- Quiz options: UI captures source/count/difficulty/types/includeTranscript, but the backend mostly ignores content source and difficulty when generating questions.
- Flashcard status controls: buttons are shown, but they do not update card status or persist spaced repetition data.
- Database design: schema exists, but no migrations or runtime database access are implemented.
- PDF support: `react-pdf` and `pdfjs-dist` are installed, but `DocumentReader` renders mock slide text instead of real PDF pages.

### Still Mocked

- Course/material dataset at runtime.
- File storage.
- Document parsing for PDF/PPTX/Markdown/TXT.
- Transcript loading and segmentation beyond in-memory samples.
- Chunking and embeddings.
- Vector search and ranking.
- LLM chat, summaries, quiz generation, grading, and flashcard generation.
- Internet/web search fallback.
- Conversation, quiz, attempt, flashcard, and citation persistence.
- Authentication and per-user data ownership.
- Background processing queue for uploads.

## AI Pipeline Status

| Component | Current implementation | Mock or real | Files involved |
| --- | --- | --- | --- |
| Upload | Frontend sends selected file to `/api/documents/upload`; route reads form data and returns synthetic id/status. | Mock | `codebase/components/MaterialsColumn.tsx`, `codebase/app/api/documents/upload/route.ts` |
| Parsing | No parser is implemented. Existing page content is manually defined in mock arrays. | Mock/not implemented | `codebase/lib/mock-data.ts`, `codebase/components/DocumentReader.tsx` |
| Embedding | Schema has pgvector columns, but no embedding generation code exists. | Not implemented | `codebase/lib/db/schema.sql` |
| Retrieval | Priority chain is implemented with keyword matching over selected text, mock pages, mock transcript segments, and mock document titles. | Mock | `codebase/lib/services/retrieval.ts`, `codebase/lib/mock-data.ts` |
| Chat | `/api/chat` returns deterministic assistant text composed from retrieved mock content. No LLM call. | Mock AI | `codebase/app/api/chat/route.ts`, `codebase/lib/services/ai.ts` |
| Summary | `/api/summary/generate` returns fixed bullets with a slide citation. | Mock AI | `codebase/app/api/summary/generate/route.ts`, `codebase/lib/services/ai.ts`, `codebase/components/TutorPanel.tsx` |
| Quiz | `/api/quiz/generate` returns templated questions based on count/types. | Mock AI | `codebase/app/api/quiz/generate/route.ts`, `codebase/lib/services/ai.ts`, `codebase/components/TutorPanel.tsx` |
| Quiz grading | `/api/quiz/grade` uses substring comparison and fixed feedback. | Mock AI/rule-based | `codebase/app/api/quiz/grade/route.ts`, `codebase/lib/services/ai.ts`, `codebase/components/TutorPanel.tsx` |
| Flashcard | `/api/flashcards/generate` returns two fixed flashcards. UI can flip cards but does not persist status changes. | Mock AI | `codebase/app/api/flashcards/generate/route.ts`, `codebase/lib/services/ai.ts`, `codebase/components/TutorPanel.tsx` |
| Citation | Citation type and UI exist; citations point to mock slide/transcript/web sources. | Partial/mock | `codebase/lib/types.ts`, `codebase/components/CitationList.tsx`, `codebase/app/page.tsx`, `codebase/lib/services/retrieval.ts`, `codebase/lib/services/ai.ts` |
| Web search | `searchWeb` returns a hard-coded generic answer and OpenAI docs URL. No search API call. | Mock | `codebase/lib/services/retrieval.ts` |

## Recommended Implementation Order

1. Add runtime database access and migrations for the existing PostgreSQL + pgvector schema. The rest of the real pipeline needs durable document, chunk, citation, conversation, quiz, and flashcard records.
2. Replace mock document data with API-backed document listing, page loading, and status polling. Keep the current UI contract but move data ownership to the backend.
3. Implement real upload storage and document records. Store original files with `storage_key`, create `documents` rows, and return stable ids.
4. Add a background processing path for uploads. Update statuses from `uploading` to `processing` to `ready` or `failed`.
5. Implement parsers for Markdown/TXT first, then PDF, then PPTX. Populate `document_pages`, `document_chunks`, and transcript-related rows with stable source metadata.
6. Implement chunking and embedding generation. Fill pgvector columns and add a query helper for vector search.
7. Replace lexical retrieval with hybrid retrieval and preserve the current source priority policy: selected text, current slide, other slides, transcript, other materials, web.
8. Integrate a real LLM client in `codebase/lib/services/ai.ts` for chat, summary, quiz, grading, and flashcard generation. Enforce citations in prompts and responses.
9. Make citation grounding durable. Persist message citations, include page/slide/timestamp metadata, and add support for opening exact transcript positions or document pages.
10. Implement real web search fallback behind a clear policy. Use it only after local course material retrieval is insufficient, and label web-sourced answers clearly.
11. Persist conversations, quiz attempts, generated quizzes, flashcard decks, and flashcard review status.
12. Add tests around API validation, retrieval priority, citation generation, upload status transitions, and AI service response contracts.
