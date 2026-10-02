"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendPoint {
  attemptId: string;
  caseTitle: string;
  completedAt: string | Date | null;
  structure: number | null;
  math: number | null;
  synthesis: number | null;
}

const COLORS = { structure: "#2563eb", math: "#16a34a", synthesis: "#d97706" };

export function ScoreTrendChart({ trend }: { trend: TrendPoint[] }) {
  if (trend.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500">
        Complete your first case to start seeing score trends here.
      </div>
    );
  }

  const data = trend.map((t, i) => ({
    index: i + 1,
    label: new Date(t.completedAt ?? 0).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    caseTitle: t.caseTitle,
    structure: t.structure,
    math: t.math,
    synthesis: t.synthesis,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
        <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
        <Tooltip
          labelFormatter={(_, payload) => payload?.[0]?.payload?.caseTitle ?? ""}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="structure" stroke={COLORS.structure} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="math" stroke={COLORS.math} strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="synthesis" stroke={COLORS.synthesis} strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
