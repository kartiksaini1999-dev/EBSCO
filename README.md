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

2. Add your Anthropic API key to `.env`:

   ```
   ANTHROPIC_API_KEY="sk-ant-..."
   ```

   Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys). Everything in this
   app except the two hand-written seed cases (already in the database) requires this key - the
   interviewer, grading, and case ingestion are all Claude API calls.

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

This extracts the text, asks Claude to split it into individual case segments (case books vary - some are
Q&A transcripts, some are narrative with an answer key at the back), then parses each segment into the
full case schema. Every ingested case is created with status **needs review** - go to `/admin/cases`
afterward to check each one over (the ingestion confidence score and notes tell you what to look at
closely) before marking it live.

## Architecture notes

- **Next.js App Router**, SQLite via **Prisma**, **Anthropic SDK** with structured outputs (Zod schemas)
  for the interviewer engine, grading, and ingestion.
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
