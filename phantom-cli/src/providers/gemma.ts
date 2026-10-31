import type { Config } from "../util/paths.js";

export type BrainReply = { text: string; tokens?: number };

/**
 * Gemma API — the open-weight model served by its maker, used when the user
 * opts for the bigger sibling instead of a local brain. The key is read from
 * the environment (GEMMA_API_KEY); the troupe never writes it to disk.
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
