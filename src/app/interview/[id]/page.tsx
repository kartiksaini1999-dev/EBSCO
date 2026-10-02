import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClientAttemptView } from "@/lib/attempt-repo";
import { InterviewChat } from "./InterviewChat";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await prisma.attempt.findUnique({ where: { id }, include: { case: true } });
  if (!attempt) notFound();

  const view = toClientAttemptView(attempt, attempt.case);

  return <InterviewChat attemptId={id} initial={view} />;
}
