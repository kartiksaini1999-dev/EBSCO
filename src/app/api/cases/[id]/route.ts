import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CaseContentSchema } from "@/lib/schemas";
import { caseRowToContent, updateCaseFromContent } from "@/lib/case-repo";

// Admin-only route: returns the FULL case content including exhibits, qa
// bank, framework guidance, math steps, model answer, and rubric. Never
// call this from the candidate-facing interview UI.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.case.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    id: row.id,
    status: row.status,
    parseConfidence: row.parseConfidence,
    parseNotes: row.parseNotes,
    rawSourceText: row.rawSourceText,
    content: caseRowToContent(row),
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = CaseContentSchema.safeParse(body.content);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const status = body.status === "live" || body.status === "needs_review" ? body.status : undefined;
  await updateCaseFromContent(id, parsed.data, status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.case.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
