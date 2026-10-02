import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, INTERVIEWER_MODEL } from "./anthropic";
import { InterviewerTurnSchema, type InterviewerTurn } from "./schemas";
import type { CaseContent } from "./schemas";
import type { Phase, Tone, TranscriptTurn } from "./types";

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  strict:
    "Voice: strict MBB-style final-round interviewer. Terse, neutral, professional. Minimal encouragement or small talk. Push back and pressure-test hard. Don't soften critiques, but stay respectful - never rude.",
  coaching:
    "Voice: a coaching, encouraging interviewer. Still realistic and will pressure-test, but warmer - acknowledges what the candidate did well before nudging, uses a supportive tone, aims to build confidence while still being honest about gaps.",
};

const PHASE_RULES = `
Phase state machine (you control next_phase; only move forward, never backward, except you may stay in the same phase across multiple turns):

1. clarifying - candidate asks setup questions. Match against clarifying_qa_bank (semantic match, not exact string match - recognize when a question is "close enough" to a bank entry). If no bank entry matches: improvise a plausible, consistent answer OR say something like "good question, let's assume X" OR "that's not really a factor here" the way a real interviewer would. NEVER reveal exhibit data, framework guidance, math step values, or the model answer during this phase. Move to "framework" once the candidate signals they're ready to lay out their approach (or once they start doing so).

2. framework - candidate states their structure/approach. Give brief, realistic real-time feedback - a human interviewer doesn't stay silent for 3 minutes. You may nudge lightly ("anything else you'd want to consider on the cost side?") without revealing framework_guidance or the model answer's conclusion. Do not give a structure score out loud. Move to "data" once the candidate has laid out a structure and is starting to ask for information, or asks for data directly.

3. data - candidate asks for specific data/information relevant to their framework. Reveal exhibits one at a time: set reveal_exhibit_ids to the IDs of any NOT-yet-revealed exhibits (listed below under "Exhibits not yet revealed") whose trigger_condition is now satisfied by what the candidate just asked. Do not dump every exhibit at once - only what's been earned by the question asked. If the candidate asks something not tied to any exhibit, improvise a brief, plausible answer in the spirit of a real interview. Move to "math" once the candidate starts doing calculations, or stay in "data" while they're still gathering info.

4. math - candidate shows calculations. Check their work silently against math_steps (given below with expected values - NEVER state these numbers directly to the candidate). React the way a real interviewer does: often just acknowledge and let them continue, sometimes give a small nudge if they're on the wrong track ("are you sure about that?" / "double check that number"), but do NOT instantly correct arithmetic errors UNLESS the candidate explicitly asks you to check their work - only then confirm whether they're right or wrong (still without stating the correct number outright; prompt them to recheck instead). Move to "synthesis" once the candidate is ready to give a final recommendation, or they explicitly say so.

5. synthesis - candidate gives their final recommendation. You MUST ask at least one tough follow-up/pressure-test question challenging their recommendation before wrapping up (set asked_pressure_test true on the turn where you do this). Do not reveal the model_answer or grading_rubric. Only after they've responded to at least one pressure-test question should you set next_phase to "debrief" and ready_for_debrief to true.

6. debrief / done - the live interview portion is over; a separate grading step handles scoring. In this phase just acknowledge warmly/neutrally (per your voice) that the case is complete.

General rules:
- Never reveal exhibit_content for an exhibit that hasn't been triggered yet.
- Never state clarifying_qa_bank answers verbatim if they would spoil exhibit data - treat the qa bank as dialogue, not as a content dump.
- Never say math_steps expected_value numbers, framework_guidance text, grading_rubric text, or model_answer content to the candidate, ever, in any phase.
- Keep replies realistically short - a sentence or two to a short paragraph, like real interview dialogue, not an essay.
- If the candidate asks you directly to check their math, answer honestly (correct/incorrect) but still don't just hand them the right number - prompt them to find their own error.
`;

function formatCaseContext(caseContent: CaseContent, revealedExhibitIds: string[]): string {
  const revealed = caseContent.exhibits.filter((e) => revealedExhibitIds.includes(e.id));
  const unrevealed = caseContent.exhibits.filter((e) => !revealedExhibitIds.includes(e.id));

  const revealedBlock = revealed.length
    ? revealed
        .map(
          (e) =>
            `- id: ${e.id} (${e.exhibit_type}, already revealed)\n  content: ${e.exhibit_content}`,
        )
        .join("\n")
    : "(none revealed yet)";

  const unrevealedBlock = unrevealed.length
    ? unrevealed
        .map((e) => `- id: ${e.id} (${e.exhibit_type})\n  trigger_condition: ${e.trigger_condition}`)
        .join("\n")
    : "(none remaining)";

  const qaBlock = caseContent.clarifying_qa_bank
    .map((qa) => `- Q pattern: "${qa.question_pattern}"\n  A: ${qa.answer}`)
    .join("\n");

  const mathBlock = caseContent.math_steps
    .map(
      (m) =>
        `- id: ${m.id} | ${m.description} | expected: ${m.expected_value}${m.unit ? " " + m.unit : ""}${
          m.depends_on?.length ? ` | depends on: ${m.depends_on.join(", ")}` : ""
        }`,
    )
    .join("\n");

  return `
CASE: ${caseContent.title} (${caseContent.industry}, ${caseContent.caseType}, ${caseContent.difficulty})
Opening prompt given to candidate: "${caseContent.prompt}"

--- CLARIFYING Q&A BANK (private) ---
${qaBlock || "(none provided)"}

--- FRAMEWORK GUIDANCE (private - what a strong structure looks like, never reveal) ---
${caseContent.framework_guidance}

--- EXHIBITS ALREADY REVEALED (private but shown to candidate already; content below) ---
${revealedBlock}

--- EXHIBITS NOT YET REVEALED (private - you only get the trigger condition, never the content) ---
${unrevealedBlock}

--- MATH STEPS (private - expected values, never state these numbers to the candidate) ---
${mathBlock || "(none provided)"}

--- MODEL ANSWER (private, never reveal) ---
${caseContent.model_answer}
`;
}

export interface RunTurnParams {
  caseContent: CaseContent;
  tone: Tone;
  currentPhase: Phase;
  revealedExhibitIds: string[];
  transcript: TranscriptTurn[];
  candidateMessage: string;
}

export interface RunTurnResult {
  turn: InterviewerTurn;
  newlyRevealedExhibits: { id: string; exhibit_type: string; exhibit_content: string }[];
}

export async function runInterviewerTurn(params: RunTurnParams): Promise<RunTurnResult> {
  const { caseContent, tone, currentPhase, revealedExhibitIds, transcript, candidateMessage } = params;

  const systemText = `You are role-playing as a management consulting case interviewer conducting a live practice interview. You privately hold the full case data below; the candidate (the user) can only ever see what you choose to say in "reply".

${TONE_INSTRUCTIONS[tone]}

Current phase: ${currentPhase}

${PHASE_RULES}

${formatCaseContext(caseContent, revealedExhibitIds)}

Respond with structured output matching the required schema. "reply" is the ONLY text the candidate will ever see - everything else is control data for the app.`;

  const history: Anthropic.MessageParam[] = transcript
    .filter((t) => t.role !== "system")
    .map((t) => ({
      role: t.role === "candidate" ? "user" : "assistant",
      content: t.content,
    }));

  const response = await anthropic.messages.parse({
    model: INTERVIEWER_MODEL,
    max_tokens: 4096,
    output_config: { effort: "high", format: zodOutputFormat(InterviewerTurnSchema) },
    system: [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }],
    messages: [...history, { role: "user", content: candidateMessage }],
  });

  const turn = response.parsed_output;
  if (!turn) {
    throw new Error("Interviewer engine failed to produce structured output");
  }

  const stillUnrevealed = caseContent.exhibits.filter((e) => !revealedExhibitIds.includes(e.id));
  const validIds = new Set(stillUnrevealed.map((e) => e.id));
  const newlyRevealedExhibits = stillUnrevealed
    .filter((e) => turn.reveal_exhibit_ids.includes(e.id) && validIds.has(e.id))
    .map((e) => ({ id: e.id, exhibit_type: e.exhibit_type, exhibit_content: e.exhibit_content }));

  return { turn, newlyRevealedExhibits };
}
