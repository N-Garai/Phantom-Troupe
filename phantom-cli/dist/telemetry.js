import { loadConfig } from "./util/paths.js";
let mod = null;
let probePromise = null;
async function probe() {
    if (!probePromise) {
        probePromise = (async () => {
            try {
                const cfg = loadConfig();
                const dsn = process.env.PHANTOM_SENTRY_DSN ?? cfg.sentryDsn;
                if (!dsn)
                    return;
                const m = (await import("@sentry/node"));
                m.init({ dsn, tracesSampleRate: 1.0, sendDefaultPii: false });
                mod = m;
            }
            catch {
                mod = null; // no DSN, no SDK installed, or init refused — carry on bare
            }
        })();
    }
    return probePromise;
}
/** Fire-and-forget: called at daemon boot so the SDK warms up in the background. */
export function initSentry() {
    void probe();
}
/** Run work inside a span when Sentry is present; otherwise just run it. */
export async function traced(op, name, fn) {
    await probe();
    if (!mod)
        return fn();
    try {
        return await mod.startSpan({ op, name }, async () => fn());
    }
    catch (err) {
        // the work itself threw — surface it untouched
        throw err;
    }
}
