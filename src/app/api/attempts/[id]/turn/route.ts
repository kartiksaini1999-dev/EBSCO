import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { caseRowToContent } from "@/lib/case-repo";
import { getRevealedExhibitIds, getTranscript } from "@/lib/attempt-repo";
import { runInterviewerTurn } from "@/lib/interviewer";
import { toJson } from "@/lib/json";
import type { TranscriptTurn } from "@/lib/types";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const message: string = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

  const attempt = await prisma.attempt.findUnique({ where: { id }, include: { case: true } });
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (attempt.phase === "done") {
    return NextResponse.json({ error: "this attempt is already complete" }, { status: 409 });
  }

  const caseContent = caseRowToContent(attempt.case);
  const transcript = getTranscript(attempt);
  const revealedExhibitIds = getRevealedExhibitIds(attempt);

  const { turn, newlyRevealedExhibits } = await runInterviewerTurn({
    caseContent,
    tone: attempt.tone as "strict" | "coaching",
    currentPhase: attempt.phase as TranscriptTurn["phase"],
    revealedExhibitIds,
    transcript,
    candidateMessage: message,
  });

  const now = new Date().toISOString();
  const candidateTurn: TranscriptTurn = {
    turn: transcript.length + 1,
    phase: attempt.phase as TranscriptTurn["phase"],
    role: "candidate",
    content: message,
    timestamp: now,
  };
  const interviewerTurn: TranscriptTurn = {
    turn: transcript.length + 2,
    phase: turn.next_phase,
    role: "interviewer",
    content: turn.reply,
    revealed_exhibits: newlyRevealedExhibits.length ? newlyRevealedExhibits : undefined,
    timestamp: new Date().toISOString(),
  };

  const updatedTranscript = [...transcript, candidateTurn, interviewerTurn];
  const updatedRevealedIds = [...revealedExhibitIds, ...newlyRevealedExhibits.map((e) => e.id)];

  await prisma.attempt.update({
    where: { id },
    data: {
      phase: turn.next_phase,
      transcript: toJson(updatedTranscript),
      revealedExhibits: toJson(updatedRevealedIds),
    },
  });

  return NextResponse.json({
    reply: turn.reply,
    phase: turn.next_phase,
    revealedExhibits: newlyRevealedExhibits,
    readyForDebrief: turn.ready_for_debrief,
  });
}
