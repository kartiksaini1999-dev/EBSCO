import { Ollama } from "ollama";
import type { Message } from "ollama";
import { Agent, fetch as undiciFetch } from "undici";
import { z, type ZodType } from "zod";

// Local CPU inference with a large context window can legitimately take
// several minutes per request, especially for the longer structured-output
// schemas (debrief, ingestion). undici's default headers/body timeouts
// (~5 min) are tuned for network APIs, not local model generation, so they
// need to be raised well past that rather than left at their default.
const SLOW_LOCAL_INFERENCE_TIMEOUT_MS = 20 * 60 * 1000;
const longTimeoutAgent = new Agent({
  headersTimeout: SLOW_LOCAL_INFERENCE_TIMEOUT_MS,
  bodyTimeout: SLOW_LOCAL_INFERENCE_TIMEOUT_MS,
});

const globalForOllama = globalThis as unknown as { ollama: Ollama | undefined };

export const ollama =
  globalForOllama.ollama ??
  new Ollama({
    host: process.env.OLLAMA_HOST || "http://localhost:11434",
    fetch: (input, init) =>
      undiciFetch(input as string, { ...init, dispatcher: longTimeoutAgent } as never) as unknown as Promise<Response>,
  });

if (process.env.NODE_ENV !== "production") globalForOllama.ollama = ollama;

export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1";
export const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 16384;

/**
 * Runs a chat completion constrained to a Zod schema via Ollama's structured
 * outputs (JSON-schema-constrained decoding). Local models follow schemas
 * less reliably than hosted frontier models, so this validates the result
 * and retries once with the validation error fed back before giving up.
 */
export async function runStructured<T>(params: {
  schema: ZodType<T>;
  system: string;
  messages: Message[];
  temperature?: number;
}): Promise<T> {
  const { schema, system, messages, temperature = 0.4 } = params;
  const jsonSchema = z.toJSONSchema(schema);

  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const correction: Message[] = lastError
      ? [
          {
            role: "user",
            content: `Your previous reply did not match the required JSON schema (error: ${lastError}). Reply again with ONLY valid JSON matching the schema - no extra commentary.`,
          },
        ]
      : [];

    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages: [{ role: "system", content: system }, ...messages, ...correction],
      format: jsonSchema as object,
      stream: false,
      options: { temperature, num_ctx: OLLAMA_NUM_CTX },
    });

    try {
      const parsed = JSON.parse(response.message.content);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  throw new Error(`Ollama failed to produce output matching the schema after retrying: ${lastError}`);
}
