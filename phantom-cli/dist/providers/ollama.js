/** Ollama: OpenAI-compatible chat + a control endpoint to unload the model. */
export async function askOllama(cfg, system, user, timeoutMs = 20_000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const keepAlive = process.env.OLLAMA_KEEP_ALIVE ?? "5m";
        const res = await fetch(`${cfg.ollamaUrl}/v1/chat/completions`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                model: cfg.model,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user },
                ],
                stream: false,
                options: { temperature: 0.4 },
                keep_alive: keepAlive,
            }),
            signal: ctrl.signal,
        });
        if (!res.ok)
            throw new Error(`ollama ${res.status}`);
        const j = (await res.json());
        const text = j.choices?.[0]?.message?.content?.trim() ?? "";
        return { text, tokens: j.usage?.total_tokens };
    }
    finally {
        clearTimeout(t);
    }
}
/** Warmup ping — calls /api/tags so Ollama loads the model into RAM before the first autopsy. */
export async function warmupOllama(cfg) {
    try {
        const res = await fetch(`${cfg.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
        return res.ok;
    }
    catch {
        return false;
    }
}
/** Unload the model NOW (the reaper's whole job). Returns true if Ollama answered. */
export async function unloadOllama(cfg) {
    try {
        const res = await fetch(`${cfg.ollamaUrl}/api/generate`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ model: cfg.model, keep_alive: 0 }),
        });
        return res.ok;
    }
    catch {
        return false;
    }
}
export async function ollamaAlive(cfg) {
    try {
        const res = await fetch(`${cfg.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2500) });
        return res.ok;
    }
    catch {
        return false;
    }
}
