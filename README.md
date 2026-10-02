# Case Prep Agent

A live, interactive consulting case-interview practice app. You play the candidate; the app plays the
interviewer - it holds each case privately, reveals information only as you ask the right questions,
critiques your structure, checks your math, and grades your final synthesis. It tracks attempts over time
so you can see where you lose points (structure vs. math vs. synthesis) across many cases.

## Setup

1. Install dependencies (already done if you're reading this right after the initial build):

   ```bash
   npm install
   ```

2. Install [Ollama](https://ollama.com/download) and pull a model. Everything in this app except the two
   hand-written seed cases (already in the database) requires a local model to be running - the
   interviewer, grading, and case ingestion all run through it, no API key or account needed.

   ```bash
   ollama pull llama3.1
   ollama serve   # if it isn't already running as a background service
   ```

   `llama3.1` (8B) is the default in `.env` (`OLLAMA_MODEL`) and is a reasonable baseline on most
   laptops. If your machine can run something bigger (e.g. `qwen2.5:14b` or `llama3.1:70b`), use it -
   grading and roleplay quality scale noticeably with model size and instruction-following ability.
   Change `OLLAMA_MODEL` in `.env` to match whatever you pull. `OLLAMA_HOST` defaults to
   `http://localhost:11434`; change it if Ollama runs elsewhere.

3. The SQLite database (`prisma/dev.db`) is already created and seeded with two example cases (a
   profitability case and a market-sizing case). If you ever need to reset it:

   ```bash
   rm prisma/dev.db
   npx prisma migrate dev
   npm run seed
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Using it

- **Dashboard** (`/`) - score trends, breakdowns by case type/industry, a suggested next case, and recent
  attempts.
- **Library** (`/library`) - browse cases, filter by type/difficulty, start a practice attempt (choose
  strict or coaching interviewer tone).
- **Interview** (`/interview/[id]`) - the live chat. Ask clarifying questions, state your framework, ask
  for data, show your math, give a recommendation, handle the pressure-test question, then hit Finish.
- **Debrief** (`/attempts/[id]`) - scores (0-10) on structure/math/synthesis with specific critiques, plus
  the full transcript.
- **Upload a case** (`/upload`) - drop in a PDF or paste text mid-session; it's parsed into the case
  structure, shown to you for review/correction, and you can start practicing it immediately.
- **Admin** (`/admin/cases`) - review and edit any case's full private content (framework guidance,
  exhibits, math steps, model answer, rubric), and flip its status between "needs review" and "live".
  Cases needing review don't show up in the library by default (toggle to see them) but can still be
  practiced directly from the admin page.

## Ingesting your own case books

To parse a whole case book (PDF or `.txt`) into the library, rather than uploading one case at a time
through the app:

```bash
npm run ingest:book -- /path/to/your/casebook.pdf
```

This extracts the text, asks the local model to split it into individual case segments (case books vary -
some are Q&A transcripts, some are narrative with an answer key at the back), then parses each segment
into the full case schema. Every ingested case is created with status **needs review** - go to
`/admin/cases` afterward to check each one over (the ingestion confidence score and notes tell you what to
look at closely) before marking it live.

Local models are noticeably less reliable than hosted frontier models at precisely splitting a long,
oddly-formatted document into segments - for a big or unusual case book, check the resulting segments
(and lean on a bigger `OLLAMA_MODEL` if you have the hardware for it) rather than trusting the split
blindly. The single-case parse (used by both this script and the in-app upload) is more robust since it's
a simpler task for the model.

## Architecture notes

- **Next.js App Router**, SQLite via **Prisma**, a local **Ollama** model with structured outputs
  (JSON-schema-constrained decoding from Zod schemas, via `src/lib/ollama.ts`) for the interviewer engine,
  grading, and ingestion. No external API calls, no API key, no per-use cost.
- `runStructured()` in `src/lib/ollama.ts` converts a Zod schema to JSON Schema (`z.toJSONSchema`), passes
  it as Ollama's `format`, and validates/retries once if the model's output doesn't parse or match the
  schema - local models follow structured-output constraints less reliably than hosted frontier models, so
  this is a real path, not just a safety net.
- The interviewer is a single structured-output LLM call per candidate turn
  (`src/lib/interviewer.ts`) - it's given the full private case data (clarifying Q&A bank, framework
  guidance, math steps with expected values, model answer, grading rubric) plus exhibits split into
  "already revealed" (full content) and "not yet revealed" (trigger condition only, no content) so the
  model physically can't leak exhibit data it hasn't decided to reveal.
- The candidate-facing API (`/api/attempts/*`) never sends exhibits, the qa bank, framework guidance,
  math steps, the model answer, or the rubric to the browser - only the case title/prompt and whatever the
  interviewer actually said and revealed. The full case content is only ever returned by the `/api/cases/[id]`
  admin route.
- Grading (`src/lib/grading.ts`) is a separate call made once, at the end of an attempt, over the full
  transcript plus the rubric/model answer.
- PDF parsing uses `pdf-parse` (built on `pdfjs-dist`); `src/lib/ingestion.ts` handles both single-case
  parsing and splitting a multi-case document into segments.

## Known limitations / next steps

- No auth (single-user, as scoped). If you ever want to share this, you'll need to add it.
- Case interviews are untimed - `durationSeconds` is recorded on each attempt, but there's no countdown.
- The interviewer's phase transitions and exhibit reveals are judgment calls by the model each turn, not
  a hard state machine - it's instructed carefully (see `PHASE_RULES` in `src/lib/interviewer.ts`) but
  isn't literally incapable of error the way the exhibit-content split is.
- Output quality (nuanced grading critiques, realistic interviewer dialogue, reliable JSON formatting) is
  bounded by whatever local model you run - smaller models (e.g. `llama3.1:8b`) will occasionally produce
  flatter critiques or need the one built-in retry for malformed JSON. If the feel is off, the first thing
  to try is a bigger `OLLAMA_MODEL`, not a prompt change.
- `OLLAMA_NUM_CTX` (default 16384) has to comfortably fit the case's full private content plus the whole
  running transcript. A very long interview or a case with large exhibits could exceed it on a long
  attempt - raise it in `.env` if your hardware can take the larger KV cache.
