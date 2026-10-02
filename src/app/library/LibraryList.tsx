"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StartAttemptButton } from "@/components/StartAttemptButton";
import type { CasePublicSummary } from "@/lib/types";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export function LibraryList({ cases }: { cases: CasePublicSummary[] }) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [showNeedsReview, setShowNeedsReview] = useState(false);

  const types = useMemo(() => Array.from(new Set(cases.map((c) => c.caseType))).sort(), [cases]);

  const filtered = cases.filter((c) => {
    if (!showNeedsReview && c.status === "needs_review") return false;
    if (typeFilter !== "all" && c.caseType !== typeFilter) return false;
    if (difficultyFilter !== "all" && c.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded border border-neutral-300 bg-white px-2 py-1"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded border border-neutral-300 bg-white px-2 py-1"
        >
          <option value="all">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-neutral-600">
          <input
            type="checkbox"
            checked={showNeedsReview}
            onChange={(e) => setShowNeedsReview(e.target.checked)}
          />
          Show cases needing review
        </label>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-500">No cases match these filters.</p>
        )}
        {filtered.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.title}</span>
                {c.status === "needs_review" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                    needs review
                  </span>
                )}
              </div>
              <div className="text-sm text-neutral-500">
                {c.industry} · {c.caseType.replace("_", " ")} · {c.difficulty} ·{" "}
                {c.attemptCount} attempt{c.attemptCount === 1 ? "" : "s"}
                {c.avgScores.structure !== null && (
                  <>
                    {" "}
                    · avg S {c.avgScores.structure.toFixed(1)} / M {c.avgScores.math?.toFixed(1)} / Y{" "}
                    {c.avgScores.synthesis?.toFixed(1)}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/cases/${c.id}`} className="text-xs text-neutral-500 hover:underline">
                Edit
              </Link>
              <StartAttemptButton caseId={c.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
