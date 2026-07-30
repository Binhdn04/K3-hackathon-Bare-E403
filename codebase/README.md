# AI Tutor Demo

Next.js demo with real OpenAI Responses API calls, local document ingestion, retrieval, and source citations.

## Quick start

```bash
cp .env.example .env.local
# Set OPENAI_API_KEY in .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Demo architecture

- `OpenAIService` calls `/v1/responses` directly with `fetch` for chat, quiz, grading, summary, flashcards, and hosted `web_search` fallback.
- PDF files are stored under `.data/uploads` and parsed page by page with PDF.js.
- Markdown/TXT files are stored, converted to text sections, and exposed in the Transcript tab.
- Pages and chunks are persisted to `.data/store.json`. This keeps the demo runnable without Docker or a database server.
- Embeddings use `text-embedding-3-small` when `OPENAI_API_KEY` is present. Lexical retrieval remains available if embedding creation fails.
- Retrieval priority is selected text, current slide, transcript, other course materials, then Internet.
- Citations carry the real document, chunk, page/slide, or URL. Clicking one opens the correct reader location or web page.

The local store is intentionally a demo adapter. `lib/db/schema.sql` contains the PostgreSQL + pgvector production schema, including document pages, chunks, embeddings, and chunk-linked citations. The service boundaries allow replacing `lib/services/store.ts` with a PostgreSQL repository without changing the routes or UI.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | required for AI features | OpenAI API key, server-side only |
| `OPENAI_MODEL` | `gpt-5-mini` | Responses API model |
| `OPENAI_EMBEDDING_MODEL` | `text-embedding-3-small` | Chunk/query embeddings |

Uploads accept PDF, Markdown, and TXT up to 15 MB. Scanned PDFs without an embedded text layer require OCR, which is outside this demo.

## Verification

```bash
npm run typecheck
npm run build
```
