import type { Case } from "@prisma/client";
import { prisma } from "./prisma";
import {
  CaseContentSchema,
  ClarifyingQaSchema,
  ExhibitSchema,
  GradingRubricSchema,
  MathStepSchema,
  type CaseContent,
} from "./schemas";
import { z } from "zod";
import { toJson } from "./json";
import type { CasePublicSummary } from "./types";

export function caseRowToContent(row: Case): CaseContent {
  return CaseContentSchema.parse({
    title: row.title,
    source: row.source,
    industry: row.industry,
    caseType: row.caseType,
    difficulty: row.difficulty,
    prompt: row.prompt,
    clarifying_qa_bank: z.array(ClarifyingQaSchema).parse(row.clarifyingQaBank),
    framework_guidance: row.frameworkGuidance,
    exhibits: z.array(ExhibitSchema).parse(row.exhibits),
    math_steps: z.array(MathStepSchema).parse(row.mathSteps),
    model_answer: row.modelAnswer,
    grading_rubric: GradingRubricSchema.parse(row.gradingRubric),
  });
}

export async function createCaseFromContent(
  content: CaseContent,
  opts: { parseConfidence?: number | null; parseNotes?: string | null; rawSourceText?: string | null } = {},
) {
  return prisma.case.create({
    data: {
      title: content.title,
      source: content.source,
      industry: content.industry,
      caseType: content.caseType,
      difficulty: content.difficulty,
      prompt: content.prompt,
      clarifyingQaBank: toJson(content.clarifying_qa_bank),
      frameworkGuidance: content.framework_guidance,
      exhibits: toJson(content.exhibits),
      mathSteps: toJson(content.math_steps),
      modelAnswer: content.model_answer,
      gradingRubric: toJson(content.grading_rubric),
      status: "needs_review",
      parseConfidence: opts.parseConfidence ?? null,
      parseNotes: opts.parseNotes ?? null,
      rawSourceText: opts.rawSourceText ?? null,
    },
  });
}

export async function listCaseSummaries(includeNeedsReview: boolean): Promise<CasePublicSummary[]> {
  const cases = await prisma.case.findMany({
    where: includeNeedsReview ? {} : { status: "live" },
    orderBy: { createdAt: "desc" },
    include: {
      attempts: {
        select: { structureScore: true, mathScore: true, synthesisScore: true },
      },
    },
  });

  return cases.map((c) => {
    const completed = c.attempts.filter((a) => a.structureScore !== null);
    const avg = (key: "structureScore" | "mathScore" | "synthesisScore") =>
      completed.length
        ? completed.reduce((sum, a) => sum + (a[key] ?? 0), 0) / completed.length
        : null;
    return {
      id: c.id,
      title: c.title,
      source: c.source,
      industry: c.industry,
      caseType: c.caseType as CasePublicSummary["caseType"],
      difficulty: c.difficulty as CasePublicSummary["difficulty"],
      status: c.status as CasePublicSummary["status"],
      attemptCount: c.attempts.length,
      avgScores: {
        structure: avg("structureScore"),
        math: avg("mathScore"),
        synthesis: avg("synthesisScore"),
      },
    };
  });
}

export async function updateCaseFromContent(id: string, content: CaseContent, status?: "needs_review" | "live") {
  return prisma.case.update({
    where: { id },
    data: {
      title: content.title,
      source: content.source,
      industry: content.industry,
      caseType: content.caseType,
      difficulty: content.difficulty,
      prompt: content.prompt,
      clarifyingQaBank: toJson(content.clarifying_qa_bank),
      frameworkGuidance: content.framework_guidance,
      exhibits: toJson(content.exhibits),
      mathSteps: toJson(content.math_steps),
      modelAnswer: content.model_answer,
      gradingRubric: toJson(content.grading_rubric),
      ...(status ? { status } : {}),
    },
  });
}
