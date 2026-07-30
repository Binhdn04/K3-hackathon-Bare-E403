# AI Tutor Prototype

Next.js + TypeScript + Tailwind CSS prototype implementing `../guide.md`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Included

- Three-column UI: materials, document reader, AI Tutor.
- Upload endpoint and document status/page endpoints.
- Mocked AI service using `gpt-4o-mini` as the intended lightweight OpenAI model.
- Retrieval service with strict source priority: selected text, current slide, other slides, transcript, other materials, web fallback.
- Quiz, summary, flashcard generation APIs.
- PostgreSQL + pgvector schema in `lib/db/schema.sql`.

## Mock Boundaries

- PDF rendering is represented by a selectable slide surface. Replace `DocumentReader` internals with `react-pdf` when real files are connected.
- File storage, document parsing, embeddings, and OpenAI calls are mocked behind `lib/services/*`.
- Database models are provided as SQL schema but not connected to runtime routes yet.
