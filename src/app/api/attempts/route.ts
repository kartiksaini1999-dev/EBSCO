import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ToneSchema } from "@/lib/schemas";
import { toJson } from "@/lib/json";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const toneParsed = ToneSchema.safeParse(body.tone);
  const tone = toneParsed.success ? toneParsed.data : "strict";

  const caseRow = await prisma.case.findUnique({ where: { id: body.caseId } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const attempt = await prisma.attempt.create({
    data: {
      caseId: caseRow.id,
      tone,
      phase: "clarifying",
      transcript: toJson([]),
      revealedExhibits: toJson([]),
    },
  });

  return NextResponse.json({
    id: attempt.id,
    caseId: caseRow.id,
    caseTitle: caseRow.title,
    casePrompt: caseRow.prompt,
    tone: attempt.tone,
    phase: attempt.phase,
  });
}
