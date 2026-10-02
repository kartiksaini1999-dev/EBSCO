import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { anthropic, INTERVIEWER_MODEL } from "./anthropic";
import { DebriefSchema, type Debrief } from "./schemas";
import type { CaseContent } from "./schemas";
import type { TranscriptTurn } from "./types";

export async function runDebrief(
  caseContent: CaseContent,
  transcript: TranscriptTurn[],
): Promise<Debrief> {
  const systemText = `You are grading a completed management consulting case interview practice session. You will be shown the full transcript plus the case's private grading materials. Grade honestly and specifically - this is for the candidate's long-term improvement, not to make them feel good.

CASE: ${caseContent.title} (${caseContent.industry}, ${caseContent.caseType}, ${caseContent.difficulty})
Opening prompt: "${caseContent.prompt}"

--- FRAMEWORK GUIDANCE (what a strong structure looks like) ---
${caseContent.framework_guidance}

--- MATH STEPS (correct intermediate/final values) ---
${caseContent.math_steps
  .map((m) => `- ${m.description}: ${m.expected_value}${m.unit ? " " + m.unit : ""}`)
  .join("\n")}

--- MODEL ANSWER ---
${caseContent.model_answer}

--- GRADING RUBRIC ---
Structure - strong: ${caseContent.grading_rubric.structure.strong}
Structure - weak: ${caseContent.grading_rubric.structure.weak}
Math - strong: ${caseContent.grading_rubric.math.strong}
Math - weak: ${caseContent.grading_rubric.math.weak}
Synthesis - strong: ${caseContent.grading_rubric.synthesis.strong}
Synthesis - weak: ${caseContent.grading_rubric.synthesis.weak}

Score each dimension 0-10 against the rubric above. Each critique should be specific and actionable, citing what the candidate actually said in the transcript (quote or paraphrase it) rather than generic advice. overall_feedback should name the single biggest thing to work on next time.`;

  const transcriptText = transcript
    .filter((t) => t.role !== "system")
    .map((t) => `[${t.phase}] ${t.role === "candidate" ? "CANDIDATE" : "INTERVIEWER"}: ${t.content}`)
    .join("\n\n");

  const response = await anthropic.messages.parse({
    model: INTERVIEWER_MODEL,
    max_tokens: 4096,
    output_config: { effort: "high", format: zodOutputFormat(DebriefSchema) },
    system: systemText,
    messages: [
      {
        role: "user",
        content: `Here is the full transcript of the interview:\n\n${transcriptText || "(no transcript - candidate ended immediately)"}`,
      },
    ] satisfies Anthropic.MessageParam[],
  });

  const debrief = response.parsed_output;
  if (!debrief) {
    throw new Error("Grading engine failed to produce structured output");
  }
  return debrief;
}
