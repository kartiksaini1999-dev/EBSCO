import { z } from "zod";

export const CaseTypeSchema = z.enum([
  "profitability",
  "market_entry",
  "ma",
  "market_sizing",
  "growth_strategy",
  "operations",
  "pricing",
  "other",
]);

export const DifficultySchema = z.enum(["easy", "medium", "hard"]);

export const ToneSchema = z.enum(["strict", "coaching"]);

export const PhaseSchema = z.enum([
  "clarifying",
  "framework",
  "data",
  "math",
  "synthesis",
  "debrief",
  "done",
]);

export const ClarifyingQaSchema = z.object({
  question_pattern: z.string(),
  answer: z.string(),
});

export const ExhibitSchema = z.object({
  id: z.string(),
  trigger_condition: z.string(),
  exhibit_type: z.enum(["table", "chart", "text"]),
  exhibit_content: z.string(),
  order: z.number(),
});

export const MathStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  expected_value: z.string(),
  unit: z.string().optional(),
  depends_on: z.array(z.string()).optional(),
});

export const RubricLevelSchema = z.object({
  strong: z.string(),
  weak: z.string(),
});

export const GradingRubricSchema = z.object({
  structure: RubricLevelSchema,
  math: RubricLevelSchema,
  synthesis: RubricLevelSchema,
});

// Full structured content of a case, as produced by ingestion and edited by
// the admin UI. This is the shape that lives in Case's JSON columns plus its
// scalar columns.
export const CaseContentSchema = z.object({
  title: z.string(),
  source: z.string(),
  industry: z.string(),
  caseType: CaseTypeSchema,
  difficulty: DifficultySchema,
  prompt: z.string(),
  clarifying_qa_bank: z.array(ClarifyingQaSchema),
  framework_guidance: z.string(),
  exhibits: z.array(ExhibitSchema),
  math_steps: z.array(MathStepSchema),
  model_answer: z.string(),
  grading_rubric: GradingRubricSchema,
});
export type CaseContent = z.infer<typeof CaseContentSchema>;

// Ingestion adds confidence + notes on top of the parsed content.
export const IngestedCaseSchema = z.object({
  case: CaseContentSchema,
  parse_confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "0-1 confidence that every field was extracted accurately from the source text. Use <0.7 whenever a field was inferred/guessed rather than clearly present in the source.",
    ),
  parse_notes: z
    .string()
    .describe(
      "Specific flags for manual review, e.g. 'math_steps intermediate values were not stated in the source and were inferred' or 'could not find an explicit model answer, synthesized one from the narrative'. Empty string if nothing to flag.",
    ),
});
export type IngestedCase = z.infer<typeof IngestedCaseSchema>;

// Per-turn interviewer engine output.
export const InterviewerTurnSchema = z.object({
  reply: z
    .string()
    .describe(
      "What the interviewer says out loud to the candidate this turn. Natural spoken dialogue, never leaking exhibit content, the qa bank, framework guidance, math step values, grading rubric, or the model answer verbatim.",
    ),
  next_phase: PhaseSchema.describe(
    "The phase the interview should be in AFTER this turn, based on what the candidate has done so far.",
  ),
  reveal_exhibit_ids: z
    .array(z.string())
    .describe(
      "IDs of exhibits (from the ones not yet revealed) whose trigger_condition is now satisfied by the candidate's question. Empty array if none apply this turn.",
    ),
  asked_pressure_test: z
    .boolean()
    .describe(
      "True if this turn's reply includes a follow-up/pressure-test question challenging the candidate's synthesis.",
    ),
  ready_for_debrief: z
    .boolean()
    .describe(
      "True once the candidate has given a final recommendation AND been pressure-tested at least once, and the interview is ready to wrap up.",
    ),
});
export type InterviewerTurn = z.infer<typeof InterviewerTurnSchema>;

// Final debrief / grading output.
export const DebriefSchema = z.object({
  structure_score: z.number().int().min(0).max(10),
  structure_critique: z.string(),
  math_score: z.number().int().min(0).max(10),
  math_critique: z.string(),
  synthesis_score: z.number().int().min(0).max(10),
  synthesis_critique: z.string(),
  overall_feedback: z
    .string()
    .describe("2-4 sentences: the single biggest thing to work on next time, stated concretely."),
});
export type Debrief = z.infer<typeof DebriefSchema>;
