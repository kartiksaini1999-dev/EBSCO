import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toClientAttemptView } from "@/lib/attempt-repo";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await prisma.attempt.findUnique({ where: { id }, include: { case: true } });
  if (!attempt) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(toClientAttemptView(attempt, attempt.case));
}
