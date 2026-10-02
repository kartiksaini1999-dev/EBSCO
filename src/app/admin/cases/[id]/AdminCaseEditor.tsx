"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CaseContentForm } from "@/components/CaseContentForm";
import { StartAttemptButton } from "@/components/StartAttemptButton";
import type { CaseContent } from "@/lib/schemas";

export function AdminCaseEditor({
  caseId,
  initialContent,
  initialStatus,
  parseConfidence,
  parseNotes,
}: {
  caseId: string;
  initialContent: CaseContent;
  initialStatus: "needs_review" | "live";
  parseConfidence: number | null;
  parseNotes: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save(content: CaseContent) {
    setSaving(true);
    await fetch(`/api/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, status }),
    });
    setSaving(false);
    setSavedAt(Date.now());
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/cases" className="text-xs text-neutral-500 hover:underline">
            ← All cases
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{initialContent.title}</h1>
          {parseConfidence !== null && (
            <p className="mt-1 text-sm text-neutral-500">
              Ingestion confidence: {Math.round(parseConfidence * 100)}%
              {parseNotes ? ` — ${parseNotes}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StartAttemptButton caseId={caseId} />
          {savedAt && <span className="text-xs text-green-600">Saved</span>}
        </div>
      </div>

      <CaseContentForm
        initial={initialContent}
        saving={saving}
        onSave={save}
        statusControl={
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "needs_review" | "live")}
              className="rounded border border-neutral-300 px-2 py-1"
            >
              <option value="needs_review">Needs review</option>
              <option value="live">Live</option>
            </select>
          </label>
        }
      />
    </div>
  );
}
