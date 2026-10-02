"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaseContentForm } from "@/components/CaseContentForm";
import type { CaseContent } from "@/lib/schemas";

const BLANK: CaseContent = {
  title: "",
  source: "Manually created",
  industry: "",
  caseType: "other",
  difficulty: "medium",
  prompt: "",
  clarifying_qa_bank: [],
  framework_guidance: "",
  exhibits: [],
  math_steps: [],
  model_answer: "",
  grading_rubric: {
    structure: { strong: "", weak: "" },
    math: { strong: "", weak: "" },
    synthesis: { strong: "", weak: "" },
  },
};

export function NewCaseForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(content: CaseContent) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    if (!res.ok) {
      setError("Couldn't save - check required fields.");
      setSaving(false);
      return;
    }
    const data = await res.json();
    router.push(`/admin/cases/${data.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <CaseContentForm initial={BLANK} onSave={create} saving={saving} saveLabel="Create case" />
    </div>
  );
}
