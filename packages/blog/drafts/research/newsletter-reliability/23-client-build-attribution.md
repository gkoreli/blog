# Keep the client's build separate from the receiving Worker

October 30, 2026 UTC. Continues [Research 22](22-measured-diagnostic-body-limits.md) and the build-attribution requirement in [TASK-0125](../../../../../docs/tasks/TASK-0125-close-client-error-reporting-gaps-for-turnstile-and.md). The [retained-error audit](18-retained-widget-errors-and-conversion-limits.md) found 35 window reports without build identity. Those historical rows remain unchanged. This iteration supplies an identifier to new client reports and tests the actual bundle-to-storage path locally.

## Native capabilities and the chosen boundary

[Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#default-variables) documents the build UUID, commit SHA and Workers CI flag as default environment variables, explicitly noting that they can be overridden. These can identify a build's supplied metadata. They are not cryptographic attestation. The separate [version-metadata binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/) exposes the deployed receiving Worker's ID/tag/timestamp. That value cannot identify which cached client bundle produced a later report.

The production [esbuild definitions](../../../src/pipeline/client-mode.ts) now consume only those three named build variables. A Workers build requires a canonical-shape 36-character UUID and a 40-character hexadecimal SHA. Invalid/missing metadata under the explicit Workers CI flag stops the build with a static error, without logging the supplied values. Development, unbundled and manual production builds retain an unknown identity. No local HEAD fallback is used: it could misidentify an uncommitted tree.

The compiled identifier is `cf:<build UUID>:<commit SHA>`, exactly 80 characters, fitting the existing field without truncation. [esbuild's define API](https://esbuild.github.io/api/#define) injects a quoted literal into the client; no environment object or secret is shipped. The actual entry point passes it to the backward-compatible default logger, which captures the value when created. A second build can have a different UUID at the same commit. An existing bundle retains its original identity rather than fetching the latest server revision when an error occurs.

The existing redactor, schema and D1 writer preserve the optional buildId. No migration, cookie, storage identifier, third-party SDK, signup or expanded raw diagnostic capture is added. A caller can still forge an error report's field. Independent build/source/artifact evidence can locate the source named by a report; matching an ID does not authenticate the report or prove that its sender executed that code. Different identifiers can also reflect rebuilt code or configuration, so a regression claim still needs a source/configuration comparison. Bootstrap failures before the logger runs and failed-operation correlation remain separate gaps.

## Tests and a browser result with an explicit mismatch

Two [test groups](../../../test/client-build-identity.test.mjs) reject missing, malformed, whitespace/newline and free-text metadata; keep manual/development identity absent; distinguish builds at the same source commit; and execute compiled logger code through redaction and server parsing. The complete identifier survives, and environment variable names are absent from that compiled code.

The [local fixture](../../../scripts/client-build-identity-fixture.mjs) bundles the actual main entry with synthetic Workers metadata and serves it alongside the actual handler and native D1. Its prewritten plan starts with zero rows and allows one agent-operated click on a button that throws a labelled error. The browser loads the actual module before the click. No human label, real signup, email, provider challenge or production request is involved.

Independent readback finds one stored window_error report with the complete compiled 80-character identity. **The original exact-message gate fails:** the plan expected a bare message, while the browser supplied an `Uncaught Error:` prefix. The [closed receipt](client-build-browser.json) retains originalTrialAccepted=false and identityReadbackAccepted=true. The click was not repeated, the old plan/response was not overwritten, and this narrow identity result is not represented as a fully passed original trial or a population delivery rate. The prospective fixture protocol now lists the two known message forms; unfamiliar output is not silently normalized.

The controller exits on its stop signal without a final controller readback. The independent readback obtained while it was live remains the evidence; no missing final file is treated as a pass. A subsequent process check finds no owned fixture/controller or workerd server running. The completed browser tab is closed. The fixture no longer requires another D1 read during shutdown.

[Checks](client-build-identity-checks.json): 150 site tests, workspace types, all 22 Markdown validations and an isolated 33-post build pass. The browser fixture's client bytes exactly equal the production pipeline's synthetic-metadata output. No private environment file is copied. The actual hosted build must still be checked against its source/build metadata and served client; local synthetic metadata does not establish provider injection.

Reproduce locally with a fresh directory, then inspect the result endpoint before stopping:

```sh
pnpm -C packages/blog exec node --import tsx scripts/client-build-identity-fixture.mjs /tmp/client-build-identity
```

Article prose/prompts, classifier/verifier profiles, public traffic selection and historical diagnostics stay unchanged. Source delivery, deployment activation and served-build association remain separate gates. Human trials stay deferred. The full analytics goal remains open.

The private 25-file prepublication archive preserves the frozen initial plan, actual client/worker source, zero/one-row responses, message-gate mismatch, stop receipt, screenshot and checked build under SHA-256 manifest `cfc1353c4d2df24e42a80e2c97a86311b0027fdd5c84c82521b09dac079e74c1`. October 31 is a review date, not automatic deletion.

## Hosted association accepted

[Release receipt](client-build-identity-release.json) joins source `765a2acf22268fb207879f6c6cba7d673d19b492`, successful native build `a5ea68e3-1703-40d3-a210-b4df7ba9a167`, native deploy log and full Worker `60b611f9-26ef-441c-9480-d10d5cc54256` at fresh CLI 100%. Only main.js is uploaded as a changed static asset. The provider uses Node 24.22.1 versus pinned local 24.14.1; no runtime policy is changed.

A controlled local reconstruction uses that actual build UUID and commit. One frozen static/prefetch GET returns 200 and exactly matches all 28,469 bytes, including the full 80-character identifier. This independently accepts the hosted client/build association without posting a production diagnostic, querying D1 or executing a human trial. No per-request Worker trace or production browser-delivery rate is claimed. The local original-message mismatch remains failed; hosted-asset equality does not repair that earlier gate.

This receipt belongs to the inspected code-bearing build. A subsequent build has its own UUID/source metadata; do not carry these identifiers forward as proof of whichever version is latest. No undocumented commit-message skip or build-setting change is introduced. The private 16-file release archive preserves native/CLI evidence, the reconstruction, frozen request and exact response under SHA-256 manifest `f5c51a098469e54f6e3df60bf715fe6859025799bc17d3efe46bababb3b5c41f`. The pre-request plan has its separate commitment in the receipt. October 31 remains a review date, not automatic deletion.

Next: failed-operation correlation and the remaining scoped diagnostic admission/attribution requirements. These remain distinct from identifying readers or validating native managed signatures. The owner-resumed goal stays active; human trials remain deferred, with search/R1/privacy/history/native accuracy gaps still open. No fixture server, test/build job or tail remains running.
