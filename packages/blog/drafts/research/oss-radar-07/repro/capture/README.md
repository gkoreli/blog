# Capture failures, exports, and local trace joins

Executed September 9 UTC / September 8 PDT, 2026 with Promptfoo **0.122.2**, Node **24.14.1**, macOS arm64. The same upstream baseline (`89052308bce06f53645b1f189ada5ac9d1897347`) and dependency lock as the [original installed experiment](../installed/README.md) apply. Unlike that Linux run, this installation includes optional platform dependencies so the local libSQL database can run. Lifecycle scripts remain disabled.

## Result

Ten controlled evaluations made eleven loopback HTTP requests. All ten preserved the final decoded response text and all eleven attempt records through the public summary, Promptfoo's `outputPath` JSON exporter, and a fresh CLI process reopening the database. Five cases completed successfully and five deliberately produced evaluation errors. Passing the retention checks does not mean those error responses passed their answer assertion.

| Case | Attempts | Final outcome | Citation field |
|---|---:|---|---|
| Full successful payload | 1 | success | present |
| Fields omitted | 1 | success | absent |
| Empty arrays | 1 | success | empty |
| Null source list | 1 | success | null |
| Malformed JSON | 1 | invalid-json | absent |
| HTTP 429, retry disabled | 1 | http-error | absent |
| HTTP 429 then success, one explicit retry | 2 | success | present |
| HTTP 200 with an error envelope | 1 | provider-error | absent |
| No answer | 1 | missing-answer | absent |
| Length-truncated answer | 1 | incomplete-answer | present |

The full success enabled local tracing. Its three spans represent the test case, provider target, and text assertion. The captured `traceparent` names the exported target span; evaluation ID and test-case ID also match. Both JSON exporters preserve these joins. There is no remote provider trace, human-trigger inference, or independent span for each retry.

All payloads are invented. **No model API call or API charge occurred.** The fixture's `usage.cost` is synthetic and explicitly unreconciled. Field absence means unavailable evidence through that field; it does not establish that an answer contained no citations.

## Reproduce

Use Node 24. From `repro/installed`, decompress the existing lock and install with optional dependencies:

```bash
gzip -dk package-lock.json.gz
npm ci --ignore-scripts --include=optional --no-audit --no-fund
```

From this directory, make the installed dependencies available and run:

```bash
ln -s ../installed/node_modules node_modules
node probe-capture.ts
```

The script creates a fresh temporary output/config/cache directory and prints its location. It installs the loopback-only `fetch` guard before importing Promptfoo. The separate CLI export processes load `offline-cli.ts`, which blocks every `fetch`. These are guards for the exercised paths, not an operating-system network sandbox. One main-process opt-out beacon was blocked; CLI attempts are not counted. There is no cloud sharing or model grading.

The installed CLI command in each fresh process is `promptfoo export eval <id> --output <file>`. `writeLatestResults: true` persists the evaluation first; `outputPath` separately exercises the library's own exporter. The probe compares their complete provider responses to the summary and compares each attempt to its independently saved record. The full-case trace checks use explicit IDs, not timestamps.

## Files and boundaries

- [Capture provider](capture-provider.ts): saves request text and each received response before parsing; retains statuses, hashes, field states, and provider-reported usage. Authentication headers are never written to the capture files.
- [Probe](probe-capture.ts): ten cases, assertions, database/export checks, and trace joins.
- [Measured result](recorded/result.json): outcomes, runtime, source hashes, and exclusions.
- [Full CLI export](recorded/full-cli-export.json): exact local trace and captured response.
- [Retry CLI export](recorded/retry-cli-export.json): both attempts remain available after restart.
- [Manifest](recorded/manifest.json): SHA-256 commitments to all retained run files. The source hashes in the result commit to the scripts executed.

The original success-only probe remains unchanged as historical evidence. Its `as` assertions are not copied into this continuation; JSON here is narrowed with type guards. The final run follows an intermediate exporter attempt that could not read traces because `--omit=optional` excluded `@libsql/darwin-arm64`. Including the same lockfile's platform dependencies resolved that setup issue. The early attempt is not counted as an additional accepted result.

This research adapter is non-streaming and bounded to chat-completion-shaped responses. It stores exact **UTF-8 decoded text**, not compressed HTTP wire bytes. It does not archive fetched sources, establish provider identity, calculate invoices, handle every provider's schema, or prove transport-exception recovery. Missing-field states and code for transport exceptions are separate from tests; only the ten listed cases were exercised. Streaming, remote tracing, live billing, and live-model behavior remain outside this fixture result.
