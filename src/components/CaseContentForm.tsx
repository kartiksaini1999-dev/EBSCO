"use client";

import { useState } from "react";
import type { CaseContent } from "@/lib/schemas";

const CASE_TYPES = [
  "profitability",
  "market_entry",
  "ma",
  "market_sizing",
  "growth_strategy",
  "operations",
  "pricing",
  "other",
] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded border border-neutral-300 px-2.5 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const textareaCls = inputCls + " resize-y";

export function CaseContentForm({
  initial,
  onSave,
  saving,
  saveLabel = "Save",
  statusControl,
}: {
  initial: CaseContent;
  onSave: (content: CaseContent) => void;
  saving: boolean;
  saveLabel?: string;
  statusControl?: React.ReactNode;
}) {
  const [content, setContent] = useState<CaseContent>(initial);

  function set<K extends keyof CaseContent>(key: K, value: CaseContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(content);
      }}
      className="flex flex-col gap-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title">
          <input className={inputCls} value={content.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Source">
          <input className={inputCls} value={content.source} onChange={(e) => set("source", e.target.value)} />
        </Field>
        <Field label="Industry">
          <input
            className={inputCls}
            value={content.industry}
            onChange={(e) => set("industry", e.target.value)}
          />
        </Field>
        <Field label="Case type">
          <select
            className={inputCls}
            value={content.caseType}
            onChange={(e) => set("caseType", e.target.value as CaseContent["caseType"])}
          >
            {CASE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Difficulty">
          <select
            className={inputCls}
            value={content.difficulty}
            onChange={(e) => set("difficulty", e.target.value as CaseContent["difficulty"])}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Opening prompt (shown to candidate)">
        <textarea
          className={textareaCls}
          rows={3}
          value={content.prompt}
          onChange={(e) => set("prompt", e.target.value)}
        />
      </Field>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Clarifying Q&A bank (private)</h3>
        <div className="flex flex-col gap-2">
          {content.clarifying_qa_bank.map((qa, i) => (
            <div key={i} className="flex gap-2 rounded border border-neutral-200 p-2">
              <div className="flex-1 space-y-1">
                <input
                  className={inputCls}
                  placeholder="Question pattern"
                  value={qa.question_pattern}
                  onChange={(e) => {
                    const next = [...content.clarifying_qa_bank];
                    next[i] = { ...next[i], question_pattern: e.target.value };
                    set("clarifying_qa_bank", next);
                  }}
                />
                <textarea
                  className={textareaCls}
                  rows={2}
                  placeholder="Answer"
                  value={qa.answer}
                  onChange={(e) => {
                    const next = [...content.clarifying_qa_bank];
                    next[i] = { ...next[i], answer: e.target.value };
                    set("clarifying_qa_bank", next);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  set(
                    "clarifying_qa_bank",
                    content.clarifying_qa_bank.filter((_, j) => j !== i),
                  )
                }
                className="h-fit rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("clarifying_qa_bank", [...content.clarifying_qa_bank, { question_pattern: "", answer: "" }])
            }
            className="self-start rounded border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-500 hover:border-neutral-400"
          >
            + Add Q&A
          </button>
        </div>
      </section>

      <Field label="Framework guidance (private - what a strong structure looks like)">
        <textarea
          className={textareaCls}
          rows={4}
          value={content.framework_guidance}
          onChange={(e) => set("framework_guidance", e.target.value)}
        />
      </Field>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Exhibits (private until revealed)</h3>
        <div className="flex flex-col gap-2">
          {content.exhibits.map((ex, i) => (
            <div key={i} className="grid gap-2 rounded border border-neutral-200 p-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className={inputCls}
                placeholder="id (e.g. exhibit-1)"
                value={ex.id}
                onChange={(e) => {
                  const next = [...content.exhibits];
                  next[i] = { ...next[i], id: e.target.value };
                  set("exhibits", next);
                }}
              />
              <select
                className={inputCls}
                value={ex.exhibit_type}
                onChange={(e) => {
                  const next = [...content.exhibits];
                  next[i] = { ...next[i], exhibit_type: e.target.value as typeof ex.exhibit_type };
                  set("exhibits", next);
                }}
              >
                <option value="table">table</option>
                <option value="chart">chart</option>
                <option value="text">text</option>
              </select>
              <button
                type="button"
                onClick={() => set("exhibits", content.exhibits.filter((_, j) => j !== i))}
                className="h-fit rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 sm:justify-self-end"
              >
                Remove
              </button>
              <input
                className={inputCls + " sm:col-span-3"}
                placeholder="Trigger condition (when should this be revealed?)"
                value={ex.trigger_condition}
                onChange={(e) => {
                  const next = [...content.exhibits];
                  next[i] = { ...next[i], trigger_condition: e.target.value };
                  set("exhibits", next);
                }}
              />
              <textarea
                className={textareaCls + " sm:col-span-3"}
                rows={3}
                placeholder="Exhibit content (markdown table for tables, e.g. | Col | Col |)"
                value={ex.exhibit_content}
                onChange={(e) => {
                  const next = [...content.exhibits];
                  next[i] = { ...next[i], exhibit_content: e.target.value };
                  set("exhibits", next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("exhibits", [
                ...content.exhibits,
                {
                  id: `exhibit-${content.exhibits.length + 1}`,
                  trigger_condition: "",
                  exhibit_type: "text",
                  exhibit_content: "",
                  order: content.exhibits.length + 1,
                },
              ])
            }
            className="self-start rounded border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-500 hover:border-neutral-400"
          >
            + Add exhibit
          </button>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Math steps (private - expected values)</h3>
        <div className="flex flex-col gap-2">
          {content.math_steps.map((m, i) => (
            <div key={i} className="grid gap-2 rounded border border-neutral-200 p-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className={inputCls}
                placeholder="id"
                value={m.id}
                onChange={(e) => {
                  const next = [...content.math_steps];
                  next[i] = { ...next[i], id: e.target.value };
                  set("math_steps", next);
                }}
              />
              <input
                className={inputCls}
                placeholder="Expected value"
                value={m.expected_value}
                onChange={(e) => {
                  const next = [...content.math_steps];
                  next[i] = { ...next[i], expected_value: e.target.value };
                  set("math_steps", next);
                }}
              />
              <button
                type="button"
                onClick={() => set("math_steps", content.math_steps.filter((_, j) => j !== i))}
                className="h-fit rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 sm:justify-self-end"
              >
                Remove
              </button>
              <input
                className={inputCls + " sm:col-span-3"}
                placeholder="Description"
                value={m.description}
                onChange={(e) => {
                  const next = [...content.math_steps];
                  next[i] = { ...next[i], description: e.target.value };
                  set("math_steps", next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              set("math_steps", [
                ...content.math_steps,
                { id: `step-${content.math_steps.length + 1}`, description: "", expected_value: "" },
              ])
            }
            className="self-start rounded border border-dashed border-neutral-300 px-3 py-1 text-xs text-neutral-500 hover:border-neutral-400"
          >
            + Add math step
          </button>
        </div>
      </section>

      <Field label="Model answer (private)">
        <textarea
          className={textareaCls}
          rows={4}
          value={content.model_answer}
          onChange={(e) => set("model_answer", e.target.value)}
        />
      </Field>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Grading rubric (private)</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["structure", "math", "synthesis"] as const).map((dim) => (
            <div key={dim} className="space-y-2 rounded border border-neutral-200 p-3">
              <h4 className="text-xs font-semibold capitalize text-neutral-500">{dim}</h4>
              <Field label="Strong looks like">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={content.grading_rubric[dim].strong}
                  onChange={(e) =>
                    set("grading_rubric", {
                      ...content.grading_rubric,
                      [dim]: { ...content.grading_rubric[dim], strong: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Weak looks like">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={content.grading_rubric[dim].weak}
                  onChange={(e) =>
                    set("grading_rubric", {
                      ...content.grading_rubric,
                      [dim]: { ...content.grading_rubric[dim], weak: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        {statusControl}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </form>
  );
}
