import { loadConfig } from "./util/paths.js";

/**
 * Crash telemetry for the tool itself — opt-in via PHANTOM_SENTRY_DSN env var
 * or `sentryDsn` in ~/.phantom/config.json. Defaults to total silence: nothing
 * is sent anywhere unless you configure it.
 *
 * The SDK is imported DYNAMICALLY and only when a DSN exists: with zero
 * packages installed the troupe still runs at full strength — traced()
 * simply executes the work bare. Telemetry must never take the troupe down.
 *
 * What gets traced:
 *  - AI invocations (agent calls, model latency, failures)
 *  - Séance operations (nightly sweep, grave tending)
 *  - Daemon lifecycle (start, stop, exec)
 *  - Shell hook captures (every failed command autopsy)
 *
 * Agent traces are sent with spans so latency, token cost, failures, and
 * fallback routing are visible in the Sentry trace view.
 */

type SpanCtx = { op: string; name: string; attributes?: Record<string, unknown> };

type SentryModule = {
  init: (opts: { dsn: string; tracesSampleRate: number; sendDefaultPii: boolean; environment?: string; release?: string }) => void;
  startSpan: <T>(ctx: SpanCtx, fn: () => Promise<T>) => Promise<T>;
  captureException: (err: unknown, opts?: { contexts?: Record<string, unknown> }) => void;
  captureMessage: (msg: string, level?: "fatal" | "error" | "warning" | "info" | "debug") => void;
  setTag: (key: string, value: string) => void;
};

let mod: SentryModule | null = null;
let probePromise: Promise<void> | null = null;
let initialized = false;

/** Recent traces kept locally for the UI showcase (only populated when Sentry DSN is configured). */
const traces: Array<{ op: string; name: string; attributes?: Record<string, unknown>; ts: number }> = [];
const MAX_TRACES = 200;

const PACKAGE_VERSION = (() => {
  try {
    return require("../package.json").version;
  } catch {
    return "unknown";
  }
})();

async function probe(): Promise<void> {
  if (!probePromise) {
    probePromise = (async () => {
      try {
        const cfg = loadConfig();
        const dsn = process.env.PHANTOM_SENTRY_DSN ?? cfg.sentryDsn;
        if (!dsn) return;
        const m = (await import("@sentry/node")) as unknown as SentryModule;
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
      } catch {
        mod = null; // no DSN, no SDK installed, or init refused — carry on bare
      }
    })();
  }
  return probePromise;
}

/** Fire-and-forget: called at daemon boot so the SDK warms up in the background. */
export function initSentry(): void {
  void probe();
}

/** Whether Sentry is actually initialized and sending. */
export function isSentryReady(): boolean {
  return initialized && mod != null;
}

/** Recent traces for the UI showcase (only when Sentry DSN is configured). */
export function getTraces(): Array<{ op: string; name: string; attributes?: Record<string, unknown>; ts: number }> {
  return [...traces].reverse();
}

/** Run work inside a span when Sentry is present; otherwise just run it. */
export async function traced<T>(op: string, name: string, fn: () => Promise<T>): Promise<T> {
  await probe();
  if (!mod) return fn();
  try {
    return await mod.startSpan({ op, name }, async () => {
      const t0 = Date.now();
      try {
        return await fn();
      } finally {
        traces.push({ op, name, attributes: { latencyMs: Date.now() - t0 }, ts: Date.now() });
        if (traces.length > MAX_TRACES) traces.shift();
      }
    });
  } catch (err) {
    traces.push({ op, name, attributes: { error: String((err as Error).message), latencyMs: 0 }, ts: Date.now() });
    if (traces.length > MAX_TRACES) traces.shift();
    // surface the work's own error untouched, but also capture it in Sentry
    try {
      mod.captureException(err, { contexts: { operation: { op, name } } });
    } catch {
      /* sentry itself failed — ignore */
    }
    throw err;
  }
}

/** Capture a one-off error (e.g. daemon crash, hook failure). */
export function captureError(err: unknown, ctx?: Record<string, unknown>): void {
  void probe();
  if (!mod) return;
  try {
    mod.captureException(err, { contexts: ctx ? { extra: ctx } : undefined });
  } catch {
    /* ignore */
  }
}

/** Capture a one-off message (e.g. séance completed, nightly sweep). */
export function captureMessage(msg: string, level: "fatal" | "error" | "warning" | "info" | "debug" = "info"): void {
  void probe();
  if (!mod) return;
  try {
    mod.captureMessage(msg, level);
  } catch {
    /* ignore */
  }
}
