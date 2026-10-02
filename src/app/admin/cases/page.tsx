import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DeleteCaseButton } from "./DeleteCaseButton";

export default async function AdminCasesPage() {
  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      caseType: true,
      difficulty: true,
      status: true,
      parseConfidence: true,
      parseNotes: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin: Cases</h1>
        <Link
          href="/admin/cases/new"
          className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          New case
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Difficulty</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Parse confidence</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-4 py-2">
                  <Link href={`/admin/cases/${c.id}`} className="font-medium hover:underline">
                    {c.title}
                  </Link>
                  {c.parseNotes && (
                    <div className="mt-0.5 text-xs text-amber-600">{c.parseNotes}</div>
                  )}
                </td>
                <td className="px-4 py-2 capitalize">{c.caseType.replace("_", " ")}</td>
                <td className="px-4 py-2 capitalize">{c.difficulty}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.status === "live" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {c.status === "live" ? "live" : "needs review"}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {c.parseConfidence !== null ? `${Math.round(c.parseConfidence * 100)}%` : "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <DeleteCaseButton caseId={c.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cases.length === 0 && <p className="p-6 text-sm text-neutral-500">No cases yet.</p>}
      </div>
    </div>
  );
}
