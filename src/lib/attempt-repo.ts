import type { Attempt, Case } from "@prisma/client";
import { z } from "zod";
import type { Phase, Tone, TranscriptTurn } from "./types";

const TranscriptSchema = z.array(
  z.object({
    turn: z.number(),
    phase: z.string(),
    role: z.enum(["candidate", "interviewer", "system"]),
    content: z.string(),
    revealed_exhibits: z
      .array(z.object({ id: z.string(), exhibit_type: z.string(), exhibit_content: z.string() }))
      .optional(),
    timestamp: z.string(),
  }),
);

export function getTranscript(attempt: Attempt): TranscriptTurn[] {
  return TranscriptSchema.parse(attempt.transcript) as TranscriptTurn[];
}

export function getRevealedExhibitIds(attempt: Attempt): string[] {
  return z.array(z.string()).parse(attempt.revealedExhibits);
}

// Sanitized shape safe to send to the candidate-facing client: no case
// internals beyond title/prompt, and the transcript only contains what was
// actually said/revealed during the interview.
export type ClientAttemptView = ReturnType<typeof toClientAttemptView>;

export function toClientAttemptView(attempt: Attempt, caseRow: Pick<Case, "title" | "prompt">) {
  return {
    id: attempt.id,
    caseTitle: caseRow.title,
    casePrompt: caseRow.prompt,
    tone: attempt.tone as Tone,
    phase: attempt.phase as Phase,
    transcript: getTranscript(attempt),
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    durationSeconds: attempt.durationSeconds,
    scores:
      attempt.structureScore !== null && attempt.mathScore !== null && attempt.synthesisScore !== null
        ? {
            structure: attempt.structureScore,
            math: attempt.mathScore,
            synthesis: attempt.synthesisScore,
          }
        : null,
    critiques:
      attempt.structureCritique !== null && attempt.mathCritique !== null && attempt.synthesisCritique !== null
        ? {
            structure: attempt.structureCritique,
            math: attempt.mathCritique,
            synthesis: attempt.synthesisCritique,
          }
        : null,
    overallFeedback: attempt.overallFeedback,
  };
}
