import Link from "next/link";
import { getProgressData } from "@/lib/progress";
import { ScoreTrendChart } from "@/components/ScoreTrendChart";
import { StartAttemptButton } from "@/components/StartAttemptButton";

function fmtScore(n: number | null) {
  return n === null ? "–" : n.toFixed(1);
}

export default async function DashboardPage() {
  const data = await getProgressData();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your Progress</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {data.casesCompletedCount} of {data.libraryTotalCount} library cases completed
        </p>
      </div>

      {data.suggestedCase && (
        <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Suggested next case
            </div>
            <div className="mt-1 font-medium">{data.suggestedCase.title}</div>
            <div className="text-sm text-neutral-500">
              {data.suggestedCase.caseType.replace("_", " ")} · {data.suggestedCase.difficulty} ·{" "}
              {data.suggestedCase.reason}
            </div>
          </div>
          <StartAttemptButton caseId={data.suggestedCase.id} />
        </div>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">Score trend</h2>
        <ScoreTrendChart trend={data.trend} />
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">By case type</h2>
          {data.byCaseType.length === 0 ? (
            <p className="text-sm text-neutral-500">No completed attempts yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-400">
                  <th className="pb-2 font-normal">Type</th>
                  <th className="pb-2 font-normal">N</th>
                  <th className="pb-2 font-normal">Structure</th>
                  <th className="pb-2 font-normal">Math</th>
                  <th className="pb-2 font-normal">Synthesis</th>
                </tr>
              </thead>
              <tbody>
                {data.byCaseType
                  .sort((a, b) => a.avgOverall - b.avgOverall)
                  .map((b) => (
                    <tr key={b.key} className="border-t border-neutral-100">
                      <td className="py-1.5 capitalize">{b.key.replace("_", " ")}</td>
                      <td className="py-1.5 text-neutral-500">{b.count}</td>
                      <td className="py-1.5">{b.avgStructure.toFixed(1)}</td>
                      <td className="py-1.5">{b.avgMath.toFixed(1)}</td>
                      <td className="py-1.5">{b.avgSynthesis.toFixed(1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold">By industry</h2>
          {data.byIndustry.length === 0 ? (
            <p className="text-sm text-neutral-500">No completed attempts yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-400">
                  <th className="pb-2 font-normal">Industry</th>
                  <th className="pb-2 font-normal">N</th>
                  <th className="pb-2 font-normal">Structure</th>
                  <th className="pb-2 font-normal">Math</th>
                  <th className="pb-2 font-normal">Synthesis</th>
                </tr>
              </thead>
              <tbody>
                {data.byIndustry
                  .sort((a, b) => a.avgOverall - b.avgOverall)
                  .map((b) => (
                    <tr key={b.key} className="border-t border-neutral-100">
                      <td className="py-1.5">{b.key}</td>
                      <td className="py-1.5 text-neutral-500">{b.count}</td>
                      <td className="py-1.5">{b.avgStructure.toFixed(1)}</td>
                      <td className="py-1.5">{b.avgMath.toFixed(1)}</td>
                      <td className="py-1.5">{b.avgSynthesis.toFixed(1)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold">Recent attempts</h2>
        {data.recentAttempts.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No attempts yet - head to the{" "}
            <Link href="/library" className="underline">
              library
            </Link>{" "}
            to get started.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {data.recentAttempts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <Link href={`/attempts/${a.id}`} className="font-medium hover:underline">
                    {a.caseTitle}
                  </Link>
                  <div className="text-xs text-neutral-500">
                    {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : ""} ·{" "}
                    {a.caseType.replace("_", " ")}
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-neutral-600">
                  <span>S {fmtScore(a.scores.structure)}</span>
                  <span>M {fmtScore(a.scores.math)}</span>
                  <span>Y {fmtScore(a.scores.synthesis)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
