import { loadConfig } from "./util/paths.js";

/**
 * Crash telemetry for the tool itself — strictly opt-in (PHANTOM_SENTRY_DSN in
 * the environment or sentryDsn in config). Defaults to silence: nothing is
 * sent anywhere unless you ask for it. Agent work is traced with spans so
 * latency, token cost and failures are visible in the trace view.
 *
 * The SDK is imported DYNAMICALLY and only when a DSN exists: with zero
 * packages installed the troupe still runs at full strength — traced()
 * simply executes the work bare. Telemetry must never take the troupe down.
 */

type SpanCtx = { op: string; name: string };

type SentryModule = {
  init: (opts: { dsn: string; tracesSampleRate: number; sendDefaultPii: boolean }) => void;
  startSpan: <T>(ctx: SpanCtx, fn: () => Promise<T>) => Promise<T>;
};

let mod: SentryModule | null = null;
let probePromise: Promise<void> | null = null;

async function probe(): Promise<void> {
  if (!probePromise) {
    probePromise = (async () => {
      try {
        const cfg = loadConfig();
        const dsn = process.env.PHANTOM_SENTRY_DSN ?? cfg.sentryDsn;
        if (!dsn) return;
        const m = (await import("@sentry/node")) as unknown as SentryModule;
        m.init({ dsn, tracesSampleRate: 1.0, sendDefaultPii: false });
        mod = m;
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

/** Run work inside a span when Sentry is present; otherwise just run it. */
export async function traced<T>(op: string, name: string, fn: () => Promise<T>): Promise<T> {
  await probe();
  if (!mod) return fn();
  try {
    return await mod.startSpan({ op, name }, async () => fn());
  } catch (err) {
    // the work itself threw — surface it untouched
    throw err;
  }
}
