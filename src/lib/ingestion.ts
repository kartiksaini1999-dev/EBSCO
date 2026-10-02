import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { anthropic, INTERVIEWER_MODEL } from "./anthropic";
import { IngestedCaseSchema, type IngestedCase } from "./schemas";

const INGEST_SYSTEM_PROMPT = `You are extracting a structured consulting case-interview record from raw text pulled from a case book (PDF or pasted text). Case books vary widely in structure - some are Q&A transcripts, some are narrative prose with embedded exhibits/tables, some put the answer key or exhibits at the very end referenced by callback, some use headers like "Interviewer:"/"Candidate:" for a sample dialogue.

Your job: read the full source text and produce ONE structured case matching the schema. Extract real content - don't invent facts that aren't grounded in the source, but you may lightly infer reasonable structure when the source is clearly narrative (e.g., if clarifying answers are embedded in prose rather than listed as Q&A, convert them into question_pattern/answer pairs that capture the same information).

Guidance per field:
- title/industry/caseType/difficulty: infer from context; difficulty from complexity of the math and ambiguity of the prompt if not stated explicitly.
- prompt: the opening question/situation given to the candidate, as it would be read aloud to start the interview.
- clarifying_qa_bank: any setup facts/answers a real interviewer would give if asked (company size, timeframe, goal, etc).
- framework_guidance: a description of what a strong structure/approach looks like for this case - for grading only, candidate never sees this.
- exhibits: any data tables, charts, or additional info the interviewer reveals when asked - each needs a trigger_condition describing when a candidate's question would surface it, preserving exhibit content (tables as markdown tables) as faithfully as possible to the source.
- math_steps: the core calculations with correct intermediate and final values, in the order they'd naturally be computed.
- model_answer: the ideal final recommendation/synthesis, as given in the source's answer key if present, else a well-reasoned synthesis from the available data.
- grading_rubric: strong vs weak criteria for structure, math, and synthesis - derive from the source if it has grading notes, else construct reasonable criteria from the case's content.

Set parse_confidence low (below 0.7) whenever you had to infer rather than extract a field directly, and use parse_notes to flag exactly which fields were uncertain or inferred, so a human can review before this case goes live. Be honest about uncertainty - this flagging is the whole point, don't skip it to seem more confident.`;

export async function parseCaseFromText(
  rawText: string,
  sourceLabel: string,
): Promise<IngestedCase> {
  const response = await anthropic.messages.parse({
    model: INTERVIEWER_MODEL,
    max_tokens: 16000,
    output_config: { effort: "high", format: zodOutputFormat(IngestedCaseSchema) },
    system: INGEST_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Source: ${sourceLabel}\n\n--- RAW TEXT ---\n${rawText}`,
      },
    ] satisfies Anthropic.MessageParam[],
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Ingestion engine failed to produce structured output");
  }
  return parsed;
}

const CaseSegmentsSchema = z.object({
  segments: z.array(
    z.object({
      title: z.string().describe("Best-guess title or short label for this case"),
      start_index: z
        .number()
        .int()
        .describe("Character offset into the source text where this case begins"),
      end_index: z
        .number()
        .int()
        .describe("Character offset into the source text where this case ends (exclusive)"),
    }),
  ),
});

/**
 * Splits a multi-case document (a whole case book, or a chapter of one) into
 * per-case text segments so each can be run through parseCaseFromText individually.
 * Returns a single segment spanning the whole text if only one case is detected.
 */
export async function splitIntoCaseSegments(
  rawText: string,
): Promise<{ title: string; rawText: string }[]> {
  const response = await anthropic.messages.parse({
    model: INTERVIEWER_MODEL,
    max_tokens: 8192,
    output_config: { effort: "medium", format: zodOutputFormat(CaseSegmentsSchema) },
    system: `You are splitting a case book document into individual case-interview segments. The text may contain one case or many (e.g. a table of contents, multiple chapters each a self-contained case, an appendix of answer keys that belongs with earlier cases). Identify each distinct case and return start/end character offsets (0-indexed, end exclusive) into the EXACT source text provided - offsets must be precise since they'll be used to slice the raw string. If an answer key/exhibits appendix at the end belongs to an earlier case, include that appendix's range as part of that same case's segment (segments may be non-contiguous in spirit, but since this schema only allows one contiguous range per segment, prefer to span from the case's start through to the end of whatever appendix material belongs to it, even if that means including intervening unrelated content - a human will review afterward). If the whole document is a single case, return exactly one segment covering the whole text.`,
    messages: [
      {
        role: "user",
        content: `Total length: ${rawText.length} characters.\n\n--- SOURCE TEXT ---\n${rawText}`,
      },
    ] satisfies Anthropic.MessageParam[],
  });

  const parsed = response.parsed_output;
  if (!parsed || parsed.segments.length === 0) {
    return [{ title: "Untitled case", rawText }];
  }

  return parsed.segments.map((seg) => {
    const start = Math.max(0, Math.min(seg.start_index, rawText.length));
    const end = Math.max(start, Math.min(seg.end_index, rawText.length));
    return { title: seg.title, rawText: rawText.slice(start, end) || rawText };
  });
}
