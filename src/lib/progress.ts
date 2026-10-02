import { prisma } from "./prisma";

export async function getProgressData() {
  const [completedAttempts, liveCases, totalCases] = await Promise.all([
    prisma.attempt.findMany({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: "asc" },
      include: { case: { select: { title: true, caseType: true, industry: true, difficulty: true } } },
    }),
    prisma.case.findMany({ where: { status: "live" } }),
    prisma.case.count(),
  ]);

  const trend = completedAttempts.map((a) => ({
    attemptId: a.id,
    caseTitle: a.case.title,
    completedAt: a.completedAt,
    structure: a.structureScore,
    math: a.mathScore,
    synthesis: a.synthesisScore,
  }));

  function aggregateBy<K extends string>(keyFn: (a: (typeof completedAttempts)[number]) => K) {
    const buckets = new Map<K, { structure: number; math: number; synthesis: number; count: number }>();
    for (const a of completedAttempts) {
      const key = keyFn(a);
      const bucket = buckets.get(key) ?? { structure: 0, math: 0, synthesis: 0, count: 0 };
      bucket.structure += a.structureScore ?? 0;
      bucket.math += a.mathScore ?? 0;
      bucket.synthesis += a.synthesisScore ?? 0;
      bucket.count += 1;
      buckets.set(key, bucket);
    }
    return Array.from(buckets.entries()).map(([key, b]) => ({
      key,
      count: b.count,
      avgStructure: b.structure / b.count,
      avgMath: b.math / b.count,
      avgSynthesis: b.synthesis / b.count,
      avgOverall: (b.structure + b.math + b.synthesis) / (3 * b.count),
    }));
  }

  const byCaseType = aggregateBy((a) => a.case.caseType);
  const byIndustry = aggregateBy((a) => a.case.industry);

  const recentAttempts = [...completedAttempts]
    .reverse()
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      caseTitle: a.case.title,
      caseType: a.case.caseType,
      completedAt: a.completedAt,
      scores: { structure: a.structureScore, math: a.mathScore, synthesis: a.synthesisScore },
    }));

  const attemptedCaseIds = new Set(completedAttempts.map((a) => a.caseId));
  const typeWeakness = new Map(byCaseType.map((b) => [b.key, b.avgOverall]));

  let suggestedCase: (typeof liveCases)[number] | null = null;
  let bestPriority = Infinity;
  for (const c of liveCases) {
    const weakness = typeWeakness.get(c.caseType) ?? -1;
    const unattemptedBoost = attemptedCaseIds.has(c.id) ? 0 : -0.01;
    const priority = weakness + unattemptedBoost;
    if (priority < bestPriority) {
      bestPriority = priority;
      suggestedCase = c;
    }
  }

  return {
    casesCompletedCount: attemptedCaseIds.size,
    libraryTotalCount: totalCases,
    trend,
    byCaseType,
    byIndustry,
    recentAttempts,
    suggestedCase: suggestedCase
      ? {
          id: suggestedCase.id,
          title: suggestedCase.title,
          caseType: suggestedCase.caseType,
          difficulty: suggestedCase.difficulty,
          reason: attemptedCaseIds.has(suggestedCase.id)
            ? "weighted toward a case type you're weakest in"
            : "haven't attempted this one yet, and it's a type worth practicing",
        }
      : null,
  };
}

export type ProgressData = Awaited<ReturnType<typeof getProgressData>>;
