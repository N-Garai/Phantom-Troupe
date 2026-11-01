import type { Config } from "../util/paths.js";
import { z } from "zod";

export type BrainReply = { text: string; tokens?: number };

/**
 * Gemma API — the open-weight model served by its maker, used when the user
 * opts for the bigger sibling instead of a local brain. The key is read from
 * the environment (GEMMA_API_KEY); the troupe never writes it to disk.
 *
 * C6 — function-calling hardening: structured (JSON) verdicts with schema
 * validation + retry. The model must return JSON matching the provided schema;
 * on validation failure the troupe retries (up to 3 times) before falling
 * back to the raw text. This kills "the model invented a flag" class bugs.
 */
export async function askGemmaApi(cfg: Config, system: string, user: string, timeoutMs = 30_000): Promise<BrainReply> {
  const key = process.env.GEMMA_API_KEY;
  if (!key) throw new Error("GEMMA_API_KEY is not set");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
        }),
        signal: ctrl.signal,
      }
    );
    if (!res.ok) throw new Error(`gemma-api ${res.status}`);
    const j = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { totalTokenCount?: number };
    };
    const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
    return { text, tokens: j.usageMetadata?.totalTokenCount };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Ask Gemma with a required JSON output schema. Validates the response
 * against the schema; retries up to `maxRetries` times on failure.
 * Returns the parsed object on success, or throws on final failure.
 */
export async function askGemmaApiStructured<T extends z.ZodTypeAny>(
  cfg: Config,
  system: string,
  user: string,
  schema: T,
  maxRetries: number = 3,
  timeoutMs: number = 30_000,
): Promise<z.infer<T>> {
  const key = process.env.GEMMA_API_KEY;
  if (!key) throw new Error("GEMMA_API_KEY is not set");

  const schemaJson = JSON.stringify(schema._def, null, 2);
  const structuredUser = `${user}\n\nReply with valid JSON only, matching this schema:\n${schemaJson}`;

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system + "\n\nYou MUST reply with valid JSON only. No preamble, no markdown fences, no explanation — just the raw JSON object." }] },
            contents: [{ role: "user", parts: [{ text: structuredUser }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 900 },
          }),
          signal: ctrl.signal,
        }
      );
      if (!res.ok) throw new Error(`gemma-api ${res.status}`);
      const j = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { totalTokenCount?: number };
      };
      const raw = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";

      // Strip markdown fences if the model added them despite instructions
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

      const parsed = schema.safeParse(JSON.parse(cleaned));
      if (parsed.success) {
        return parsed.data;
      }
      lastError = new Error(`schema validation failed (attempt ${attempt}/${maxRetries}): ${parsed.error.message}`);
      continue;
    } catch (err) {
      lastError = err as Error;
      continue;
    } finally {
      clearTimeout(t);
    }
  }
  throw lastError ?? new Error("gemma-api structured output failed after all retries");
}
