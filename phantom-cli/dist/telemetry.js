import { loadConfig } from "./util/paths.js";
let mod = null;
let probePromise = null;
let initialized = false;
/** Recent traces kept locally for the UI showcase (only populated when Sentry DSN is configured). */
const traces = [];
const MAX_TRACES = 200;
const PACKAGE_VERSION = (() => {
    try {
        return require("../package.json").version;
    }
    catch {
        return "unknown";
    }
})();
async function probe() {
    if (!probePromise) {
        probePromise = (async () => {
            try {
                const cfg = loadConfig();
                const dsn = process.env.PHANTOM_SENTRY_DSN ?? cfg.sentryDsn;
                if (!dsn)
                    return;
                const m = (await import("@sentry/node"));
                m.init({
                    dsn,
                    tracesSampleRate: 1.0,
                    sendDefaultPii: false,
                    environment: process.env.NODE_ENV ?? "production",
                    release: `phantom-troupe@${PACKAGE_VERSION}`,
                });
                m.setTag("component", "phantom-cli");
                m.setTag("provider", cfg.provider);
                mod = m;
                initialized = true;
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
/** Whether Sentry is actually initialized and sending. */
export function isSentryReady() {
    return initialized && mod != null;
}
/** Recent traces for the UI showcase (only when Sentry DSN is configured). */
export function getTraces() {
    return [...traces].reverse();
}
/** Run work inside a span when Sentry is present; otherwise just run it. */
export async function traced(op, name, fn) {
    await probe();
    if (!mod)
        return fn();
    try {
        return await mod.startSpan({ op, name }, async () => {
            const t0 = Date.now();
            try {
                return await fn();
            }
            finally {
                traces.push({ op, name, attributes: { latencyMs: Date.now() - t0 }, ts: Date.now() });
                if (traces.length > MAX_TRACES)
                    traces.shift();
            }
        });
    }
    catch (err) {
        traces.push({ op, name, attributes: { error: String(err.message), latencyMs: 0 }, ts: Date.now() });
        if (traces.length > MAX_TRACES)
            traces.shift();
        // surface the work's own error untouched, but also capture it in Sentry
        try {
            mod.captureException(err, { contexts: { operation: { op, name } } });
        }
        catch {
            /* sentry itself failed — ignore */
        }
        throw err;
    }
}
/** Capture a one-off error (e.g. daemon crash, hook failure). */
export function captureError(err, ctx) {
    void probe();
    if (!mod)
        return;
    try {
        mod.captureException(err, { contexts: ctx ? { extra: ctx } : undefined });
    }
    catch {
        /* ignore */
    }
}
/** Capture a one-off message (e.g. séance completed, nightly sweep). */
export function captureMessage(msg, level = "info") {
    void probe();
    if (!mod)
        return;
    try {
        mod.captureMessage(msg, level);
    }
    catch {
        /* ignore */
    }
}
