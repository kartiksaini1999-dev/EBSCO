"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartAttemptButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [tone, setTone] = useState<"strict" | "coaching">("strict");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, tone }),
      });
      if (!res.ok) throw new Error("Failed to start attempt");
      const data = await res.json();
      router.push(`/interview/${data.id}`);
    } catch {
      setError("Couldn't start the interview. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={tone}
        onChange={(e) => setTone(e.target.value as "strict" | "coaching")}
        className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs"
        disabled={loading}
      >
        <option value="strict">Strict</option>
        <option value="coaching">Coaching</option>
      </select>
      <button
        onClick={start}
        disabled={loading}
        className="rounded bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {loading ? "Starting…" : "Practice"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
