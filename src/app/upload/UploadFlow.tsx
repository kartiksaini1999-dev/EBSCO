"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaseContentForm } from "@/components/CaseContentForm";
import type { CaseContent } from "@/lib/schemas";

type Parsed = {
  id: string;
  content: CaseContent;
  parseConfidence: number;
  parseNotes: string;
};

export function UploadFlow() {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "text">("file");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState<"strict" | "coaching">("strict");

  async function submit() {
    setParsing(true);
    setError(null);
    try {
      let res: Response;
      if (mode === "file") {
        if (!file) {
          setError("Choose a PDF file first.");
          setParsing(false);
          return;
        }
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/ingest", { method: "POST", body: form });
      } else {
        if (!text.trim()) {
          setError("Paste some case text first.");
          setParsing(false);
          return;
        }
        res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sourceLabel: "pasted text" }),
        });
      }
      if (!res.ok) throw new Error("ingest failed");
      const data = await res.json();
      setParsed(data);
    } catch {
      setError("Couldn't parse that into a case. Try pasting plain text instead, or check the file.");
    } finally {
      setParsing(false);
    }
  }

  async function saveEdits(content: CaseContent) {
    if (!parsed) return content;
    setSaving(true);
    await fetch(`/api/cases/${parsed.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    return content;
  }

  async function saveAndPractice(content: CaseContent) {
    if (!parsed) return;
    await saveEdits(content);
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: parsed.id, tone }),
    });
    const data = await res.json();
    router.push(`/interview/${data.id}`);
  }

  async function saveOnly(content: CaseContent) {
    await saveEdits(content);
    router.push(`/library`);
  }

  if (parsed) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          <p className="font-medium text-amber-800">
            Parsed with {Math.round(parsed.parseConfidence * 100)}% confidence
          </p>
          {parsed.parseNotes && <p className="mt-1 text-amber-700">{parsed.parseNotes}</p>}
          <p className="mt-1 text-amber-700">
            Review the structure below and correct anything the parser got wrong before practicing.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end text-sm">
          <label className="flex items-center gap-2">
            Interviewer tone
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as "strict" | "coaching")}
              className="rounded border border-neutral-300 px-2 py-1 text-sm"
            >
              <option value="strict">Strict</option>
              <option value="coaching">Coaching</option>
            </select>
          </label>
        </div>

        <CaseContentForm
          initial={parsed.content}
          saving={saving}
          saveLabel="Save only"
          onSave={saveOnly}
        />
        <div className="flex justify-end">
          <button
            onClick={() => saveAndPractice(parsed.content)}
            disabled={saving}
            className="rounded bg-amber-500 px-5 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Save & start practicing now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => setMode("file")}
          className={`rounded px-3 py-1.5 ${mode === "file" ? "bg-neutral-900 text-white" : "border border-neutral-300"}`}
        >
          Upload PDF
        </button>
        <button
          onClick={() => setMode("text")}
          className={`rounded px-3 py-1.5 ${mode === "text" ? "bg-neutral-900 text-white" : "border border-neutral-300"}`}
        >
          Paste text
        </button>
      </div>

      {mode === "file" ? (
        <input
          type="file"
          accept="application/pdf,.pdf,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
      ) : (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Paste the full case text here…"
          className="rounded border border-neutral-300 p-3 text-sm focus:border-neutral-500 focus:outline-none"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={parsing}
        className="self-start rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {parsing ? "Parsing…" : "Parse case"}
      </button>
    </div>
  );
}
