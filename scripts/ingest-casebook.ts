/**
 * Ingests a case book (PDF or .txt) into the library.
 *
 * Usage: npm run ingest:book -- /path/to/casebook.pdf
 *
 * Extracts text, asks the model to split it into individual case segments,
 * then parses each segment into the full Case schema. Every case is created
 * with status "needs_review" - review and edit them at /admin/cases before
 * marking them live.
 */
import { readFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { extractTextFromPdf } from "../src/lib/pdf";
import { parseCaseFromText, splitIntoCaseSegments } from "../src/lib/ingestion";
import { CaseContentSchema } from "../src/lib/schemas";

const prisma = new PrismaClient();

function toJson<T>(value: T) {
  return value as unknown as import("@prisma/client").Prisma.InputJsonValue;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run ingest:book -- /path/to/casebook.pdf");
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  const sourceLabel = path.basename(resolved);
  console.log(`Reading ${resolved}...`);

  const buffer = await readFile(resolved);
  const rawText = resolved.toLowerCase().endsWith(".pdf")
    ? await extractTextFromPdf(buffer)
    : buffer.toString("utf-8");

  console.log(`Extracted ${rawText.length} characters. Splitting into case segments...`);
  const segments = await splitIntoCaseSegments(rawText);
  console.log(`Found ${segments.length} case segment(s).`);

  for (const [i, segment] of segments.entries()) {
    console.log(`\n[${i + 1}/${segments.length}] Parsing "${segment.title}"...`);
    try {
      const ingested = await parseCaseFromText(segment.rawText, `${sourceLabel} - ${segment.title}`);
      const validated = CaseContentSchema.parse({ ...ingested.case, source: sourceLabel });
      const created = await prisma.case.create({
        data: {
          title: validated.title,
          source: validated.source,
          industry: validated.industry,
          caseType: validated.caseType,
          difficulty: validated.difficulty,
          prompt: validated.prompt,
          clarifyingQaBank: toJson(validated.clarifying_qa_bank),
          frameworkGuidance: validated.framework_guidance,
          exhibits: toJson(validated.exhibits),
          mathSteps: toJson(validated.math_steps),
          modelAnswer: validated.model_answer,
          gradingRubric: toJson(validated.grading_rubric),
          status: "needs_review",
          parseConfidence: ingested.parse_confidence,
          parseNotes: ingested.parse_notes,
          rawSourceText: segment.rawText,
        },
      });
      console.log(
        `  -> created case ${created.id} "${validated.title}" (confidence: ${Math.round(
          ingested.parse_confidence * 100,
        )}%)`,
      );
      if (ingested.parse_notes) console.log(`     notes: ${ingested.parse_notes}`);
    } catch (err) {
      console.error(`  -> FAILED to parse this segment:`, err);
    }
  }

  console.log(`\nDone. Review the ingested cases at /admin/cases before marking them live.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
