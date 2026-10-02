import type { z } from "zod";
import type { CaseTypeSchema, DifficultySchema, ToneSchema, PhaseSchema } from "./schemas";

export type CaseType = z.infer<typeof CaseTypeSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type Phase = z.infer<typeof PhaseSchema>;

export interface TranscriptTurn {
  turn: number;
  phase: Phase;
  role: "candidate" | "interviewer" | "system";
  content: string;
  revealed_exhibits?: { id: string; exhibit_type: string; exhibit_content: string }[];
  timestamp: string; // ISO
}

// What's safe to ever send to the browser before/without going through the
// interviewer route: no exhibits, no qa bank, no rubric, no model answer.
export interface CasePublicSummary {
  id: string;
  title: string;
  source: string;
  industry: string;
  caseType: CaseType;
  difficulty: Difficulty;
  status: "needs_review" | "live";
  attemptCount: number;
  avgScores: { structure: number | null; math: number | null; synthesis: number | null };
}

export interface Scores {
  structure: number;
  math: number;
  synthesis: number;
}
