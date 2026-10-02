import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toClientAttemptView } from "@/lib/attempt-repo";
import { ExhibitCard } from "@/components/ExhibitCard";

const DIM_LABELS = { structure: "Structure", math: "Math", synthesis: "Synthesis" } as const;

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-neutral-500">{score}/10</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900"
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default async function AttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attempt = await prisma.attempt.findUnique({ where: { id }, include: { case: true } });
  if (!attempt) notFound();

  const view = toClientAttemptView(attempt, attempt.case);

  if (!view.scores) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm">
        <p className="mb-3">This attempt isn&apos;t finished yet.</p>
        <Link href={`/interview/${id}`} className="font-medium text-neutral-900 underline">
          Continue the interview
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{view.caseTitle}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {view.completedAt && new Date(view.completedAt).toLocaleString()} ·{" "}
          {view.durationSeconds ? `${Math.round(view.durationSeconds / 60)} min` : ""} · {view.tone} interviewer
        </p>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Scores</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ScoreBar label="Structure" score={view.scores.structure} />
          <ScoreBar label="Math" score={view.scores.math} />
          <ScoreBar label="Synthesis" score={view.scores.synthesis} />
        </div>
      </section>

      {view.critiques && (
        <section className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(DIM_LABELS) as (keyof typeof DIM_LABELS)[]).map((dim) => (
            <div key={dim} className="rounded-lg border border-neutral-200 bg-white p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {DIM_LABELS[dim]}
              </h3>
              <p className="text-sm text-neutral-700">{view.critiques![dim]}</p>
            </div>
          ))}
        </section>
      )}

      {view.overallFeedback && (
        <section className="rounded-lg border border-neutral-300 bg-neutral-50 p-5">
          <h2 className="mb-2 text-sm font-semibold">What to work on next</h2>
          <p className="text-sm text-neutral-800">{view.overallFeedback}</p>
        </section>
      )}

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold">Full transcript</h2>
        <div className="flex flex-col gap-3">
          {view.transcript.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === "candidate" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  turn.role === "candidate" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{turn.content}</p>
                {turn.revealed_exhibits?.map((ex) => (
                  <ExhibitCard key={ex.id} exhibitType={ex.exhibit_type} content={ex.exhibit_content} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
