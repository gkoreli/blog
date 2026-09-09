# Installed Promptfoo evidence probe

Executed September 8, 2026 by Codex for this worklist. This extends the earlier [module probe](../README.md). It uses the installed npm package, a real loopback HTTP server, the public evaluation API, its transport cache, and JSON serialization of `toEvaluateSummary()`. All model responses are invented fixtures. Author review and live-provider validation remain open.

## Reproduce

Use Node 24. The recorded runtime was v24.19.0 on Linux x64. From this directory:

```sh
gzip -dk package-lock.json.gz
npm ci --ignore-scripts --omit=optional --no-audit --no-fund
node probe-installed.ts
```

The compressed lockfile retains the exact dependency resolution while keeping this research packet small. Decompress into a clean directory; `gzip -k` retains the archive. Installation needs npm access. The probe allows `fetch` only to its own loopback origin and rejects redirects. It uses a fake key, isolated Promptfoo configuration and cache directories, telemetry/update opt-outs, and no model-graded assertions. No API account is required. It does not provide an operating-system network sandbox for arbitrary code.

The script writes fresh files to ignored `outputs/`. Compare them with [recorded outputs](recorded/result.json); run IDs, ports, cache keys, timings, and timestamps will differ. The substantive checks run inside the probe. Its three evaluations are controlled transport checks on one payload, not three independent model answers.

## Result

| Path | Local HTTP requests | Answer text | Structured citation URLs | Annotation records |
|---|---:|---|---:|---:|
| Built-in OpenRouter, fresh | 1 | Preserved | 0 | 0 |
| Built-in OpenRouter, cached | 0 | Preserved | 0 | 0 |
| Custom capture provider, fresh | 1 | Preserved | 1 | 1 |

The fixture has **one unique URL**, represented in both its source list and annotation. The custom provider also preserved the exact response text, a SHA-256 hash, synthetic usage, and the mock request ID in the serialized summary. The built-in transport cache retained the entire **parsed** fixture, including both citation fields. Parsed-object equality is weaker than byte equality.

This is an adapter-to-summary boundary. It would be wrong to say Promptfoo erased the citations everywhere or that its framework cannot carry them. The positive result tests its documented custom-provider interface without a framework fork. It does not make this fixture-only provider ready for production.

The three text assertions passed because the answer contained the expected phrase. They do not assess citation correctness, offsets, source support, or model reasoning. The older fixture deliberately supplies fields for retention checks; its annotation end offset is not a validated answer span. No source was fetched from the URL in it.

## Files and measurement boundary

- [Probe](probe-installed.ts): server, fetch guard, provider comparison, export, and assertions.
- [Result](recorded/result.json): runtime, package/source pins, input/script/lockfile hashes, counts, and limits.
- [Fresh summary](recorded/built-in-fresh.json), [cached summary](recorded/built-in-cached.json), [custom summary](recorded/custom-capture.json): full public-API summaries serialized as JSON, without post-processing.
- [Requests](recorded/requests.json): two local request bodies; the model, prompt, settings, and fixture response match. Object-key order is immaterial. This is not a billing comparison.
- [Cache entry](recorded/transport-cache-entry.json): one entry read through the public cache API, showing full parsed response retention. A restart/recovery test did not run.
- [Dependency lock](package-lock.json.gz): gzip archive with deterministic mtime; decompressed hash appears in the result.

The installed package is Promptfoo 0.122.2. Upstream source baseline: `89052308bce06f53645b1f189ada5ac9d1897347`. Its npm tarball integrity is `sha512-biyTIbtpH3ZNcnibhYkmvVe/N6VSmf0RumMrEgB+WRLOrUoEvgq7cXsxXguYmTlz44MWV1Un+TzIpkyqZ8DQgA==`, also retained in the lockfile. Lifecycle scripts and optional dependencies were omitted; this proves the exercised library path, not every Promptfoo installation mode.

Tracing and database persistence were disabled. We wrote the public summary ourselves; CLI export, UI display, trace export, database restart, streaming, missing fields, non-200 responses, retries, and live billing remain untested. The custom provider leaves top-level usage/cost normalization unfinished and stores the fixture's values under explicitly named provider-reported metadata. Neither a summary cost of zero nor the fixture's invented charge measures a real price.

## The interrupted attempt

An earlier local run produced summaries, but automatic approval review rejected its process follow-up after detecting unexpected HTTPS to Promptfoo. Read-only inspection traced `recordTelemetryDisabled()` through `sendEvent()` to the hardcoded `r.promptfoo.app` endpoint. The payload construction includes event, environment, email, and runtime/identity metadata; source inspection did not establish what reached the remote service in that attempt.

The final probe installs a rejecting `fetch` guard **before** importing Promptfoo. It recorded and blocked one non-loopback POST; the public record contains destination and body field names, not their values. This resolves the local execution constraint without enabling the rejected transmission. The accepted rerun completed and supplies every file in `recorded/`.

[Issue #9968](https://github.com/promptfoo/promptfoo/issues/9968), opened July 4 and still open when checked September 8, reports this behavior on 0.121.17. Our pinned [telemetry code](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/telemetry.ts) and blocked attempt establish the exercised 0.122.2 path. This matters when collecting private evidence in a restricted environment. It does not prove prompt or answer disclosure, and it is not the citation-retention finding. No issue or comment was posted upstream.

## Next gate

Keep this fixture as a regression check. Extend capture to real response variants and explicit unknown/error states before the paid preflight. Then test trace/export joins and capture completeness against actual provider records. The live pilot remains governed by [the experiment plan](../../03-experiment-plan.md).
