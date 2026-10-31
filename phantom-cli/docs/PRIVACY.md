# Privacy

Shell history is the most sensitive data on a computer. The troupe is designed around that fact.

## What is stored
- `~/.phantom/morgue.jsonl` — failed commands: timestamp, command line, exit code, optional stderr tail, autopsy notes.
- `~/.phantom/commands.jsonl` — rolling log (≈4000 lines) used only for usage statistics (e.g., "this alias was never used").
- `~/.phantom/graves.jsonl` — dead scripts/aliases/crons and their obituaries.
- `~/.phantom/memory.db` — agent conversational memory (local SQL file).

All plain files. Audit with `cat`. Delete and the dead are truly gone.

## What leaves the machine
- **Default: nothing.** The brain is a local open-weight model.
- If you switch `provider` to `gemma-api`, prompts are sent to that API — noted explicitly in the docs, key read from the environment only.
- Crash telemetry is **opt-in**: set `PHANTOM_SENTRY_DSN` (or `sentryDsn` in config) to enable. Unset means nothing is sent, ever.

## Network surface
- The séance UI binds to `127.0.0.1` only and rejects non-loopback connections.
- The helper makes outbound calls only to your configured brain.
