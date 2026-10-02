"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExhibitCard } from "@/components/ExhibitCard";
import type { ClientAttemptView } from "@/lib/attempt-repo";
import type { Phase, TranscriptTurn } from "@/lib/types";

const PHASE_LABELS: Record<Phase, string> = {
  clarifying: "Clarifying questions",
  framework: "Framework",
  data: "Data & exhibits",
  math: "Math",
  synthesis: "Synthesis",
  debrief: "Wrapping up",
  done: "Complete",
};

export function InterviewChat({
  attemptId,
  initial,
}: {
  attemptId: string;
  initial: ClientAttemptView;
}) {
  const router = useRouter();
  const [transcript, setTranscript] = useState<TranscriptTurn[]>(initial.transcript);
  const [phase, setPhase] = useState<Phase>(initial.phase);
  const [readyForDebrief, setReadyForDebrief] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function sendMessage() {
    const message = input.trim();
    if (!message || sending) return;
    setSending(true);
    setError(null);
    setInput("");

    const optimisticCandidate: TranscriptTurn = {
      turn: transcript.length + 1,
      phase,
      role: "candidate",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setTranscript((t) => [...t, optimisticCandidate]);
    scrollToBottom();

    try {
      const res = await fetch(`/api/attempts/${attemptId}/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("turn failed");
      const data = await res.json();
      const interviewerTurn: TranscriptTurn = {
        turn: transcript.length + 2,
        phase: data.phase,
        role: "interviewer",
        content: data.reply,
        revealed_exhibits: data.revealedExhibits?.length ? data.revealedExhibits : undefined,
        timestamp: new Date().toISOString(),
      };
      setTranscript((t) => [...t, interviewerTurn]);
      setPhase(data.phase);
      setReadyForDebrief(data.readyForDebrief);
      scrollToBottom();
    } catch {
      setError("Something went wrong reaching the interviewer. Your message wasn't sent - try again.");
      setTranscript((t) => t.filter((turn) => turn !== optimisticCandidate));
      setInput(message);
    } finally {
      setSending(false);
    }
  }

  async function finishInterview() {
    if (phase !== "debrief" && phase !== "done") {
      const confirmed = window.confirm(
        "You haven't finished synthesis/pressure-testing yet. Finish and get graded on what you've done so far anyway?",
      );
      if (!confirmed) return;
    }
    setFinishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error("complete failed");
      router.push(`/attempts/${attemptId}`);
    } catch {
      setError("Couldn't generate the debrief. Try again.");
      setFinishing(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white px-5 py-4">
        <div>
          <h1 className="font-semibold">{initial.caseTitle}</h1>
          <p className="mt-1 text-sm text-neutral-600">{initial.casePrompt}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-neutral-500">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5">{PHASE_LABELS[phase]}</span>
          <span className="capitalize">{initial.tone} interviewer</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-5"
      >
        <div className="flex flex-col gap-4">
          {transcript.length === 0 && (
            <p className="text-sm text-neutral-400">
              Ask a clarifying question, or jump straight into your framework when ready.
            </p>
          )}
          {transcript.map((turn, i) => (
            <div key={i} className={`flex ${turn.role === "candidate" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  turn.role === "candidate"
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{turn.content}</p>
                {turn.revealed_exhibits?.map((ex) => (
                  <ExhibitCard key={ex.id} exhibitType={ex.exhibit_type} content={ex.exhibit_content} />
                ))}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-neutral-100 px-4 py-2.5 text-sm text-neutral-400">
                thinking…
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={sending || phase === "done"}
          placeholder="Type your response…"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none disabled:bg-neutral-50"
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim() || phase === "done"}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            Send
          </button>
          <button
            onClick={finishInterview}
            disabled={finishing || phase === "done" || transcript.length === 0}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              readyForDebrief
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {finishing ? "Grading…" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
