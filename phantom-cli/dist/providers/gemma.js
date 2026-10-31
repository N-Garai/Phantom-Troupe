/**
 * Gemma API — the open-weight model served by its maker, used when the user
 * opts for the bigger sibling instead of a local brain. The key is read from
 * the environment (GEMMA_API_KEY); the troupe never writes it to disk.
 */
export async function askGemmaApi(cfg, system, user, timeoutMs = 30_000) {
    const key = process.env.GEMMA_API_KEY;
    if (!key)
        throw new Error("GEMMA_API_KEY is not set");
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`, {
            method: "POST",
            headers: { "content-type": "application/json", "x-goog-api-key": key },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: system }] },
                contents: [{ role: "user", parts: [{ text: user }] }],
                generationConfig: { temperature: 0.4, maxOutputTokens: 900 },
            }),
            signal: ctrl.signal,
        });
        if (!res.ok)
            throw new Error(`gemma-api ${res.status}`);
        const j = (await res.json());
        const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
        return { text, tokens: j.usageMetadata?.totalTokenCount };
    }
    finally {
        clearTimeout(t);
    }
}
