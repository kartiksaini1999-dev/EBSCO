import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { caseRowToContent } from "@/lib/case-repo";
import { AdminCaseEditor } from "./AdminCaseEditor";

export default async function AdminCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.case.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <AdminCaseEditor
      caseId={id}
      initialContent={caseRowToContent(row)}
      initialStatus={row.status as "needs_review" | "live"}
      parseConfidence={row.parseConfidence}
      parseNotes={row.parseNotes}
    />
  );
}
