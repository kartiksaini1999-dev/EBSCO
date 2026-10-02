import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { caseRowToContent } from "@/lib/case-repo";
import { getTranscript } from "@/lib/attempt-repo";
import { runDebrief } from "@/lib/grading";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await prisma.attempt.findUnique({ where: { id }, include: { case: true } });
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (attempt.phase === "done" && attempt.completedAt) {
    return NextResponse.json({ error: "already completed" }, { status: 409 });
  }

  const caseContent = caseRowToContent(attempt.case);
  const transcript = getTranscript(attempt);

  const debrief = await runDebrief(caseContent, transcript);

  const completedAt = new Date();
  const durationSeconds = Math.round((completedAt.getTime() - attempt.startedAt.getTime()) / 1000);

  await prisma.attempt.update({
    where: { id },
    data: {
      phase: "done",
      completedAt,
      durationSeconds,
      structureScore: debrief.structure_score,
      mathScore: debrief.math_score,
      synthesisScore: debrief.synthesis_score,
      structureCritique: debrief.structure_critique,
      mathCritique: debrief.math_critique,
      synthesisCritique: debrief.synthesis_critique,
      overallFeedback: debrief.overall_feedback,
    },
  });

  return NextResponse.json({
    scores: {
      structure: debrief.structure_score,
      math: debrief.math_score,
      synthesis: debrief.synthesis_score,
    },
    critiques: {
      structure: debrief.structure_critique,
      math: debrief.math_critique,
      synthesis: debrief.synthesis_critique,
    },
    overallFeedback: debrief.overall_feedback,
    durationSeconds,
  });
}
