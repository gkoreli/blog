# Exa/Ahrefs classification repair — October 25 Pacific / October 26 UTC

Explicit follow-up request: fix the Exa/Ahrefs classification gaps, preserve evidence and update the retrospective as learning continues. This is a runtime repair after the original writing request, governed by [ADR-0016.8](../../../../../docs/adr/0016.8-declared-client-roles-and-signer-evidence.md). TASK-0119 remains open.

## Before and after

The unchanged [baseline](ua-coverage.json) records all four official declarations as generic bot/null name. The unchanged [Wrangler capture](03-wrangler-followup.md) records 1,003 Exa and 42 Ahrefs signer outcomes in the frozen audit. Raw User-Agents were not retained in those rows. No historical role can be reconstructed solely from Exa's shared signing directory.

The new [after probe](ua-coverage-after.json) uses the unchanged [probe](probe-ua-coverage.mts) against the modified classifier. Its `sourceCommit` is the parent checkout, `55bbf0d`, because the probe preceded the source commit; `classifierSha256` commits to the actual tested bytes (`9089e6562e7a7753135e3b47ec0d88da730d0068571b1e0d6636558c6e8016be`). No network calls or production observations are made by the probe.

| Documented token | Stored class/name | Declared kind | Public group |
|---|---|---|---|
| ExaUser | ai / ExaUser | ai-assistant | Assistants & signed clients |
| ExaSearchBot | ai / ExaSearchBot | ai-search | Crawlers |
| AhrefsBot | bot / AhrefsBot | seo-crawler | Crawlers |
| AhrefsSiteAudit | bot / AhrefsSiteAudit | seo-crawler | Crawlers |

Primary vendor docs rechecked October 25 Pacific: [ExaSearchBot](https://crawler.exa.ai/) (page dated July 30, 2026), [ExaUser](https://crawler.exa.ai/exauser) (September 30, 2026), [AhrefsBot and SiteAudit](https://ahrefs.com/robot). Full documented UA strings and the mobile SiteAudit variant are in the fixtures. Matching is case-insensitive with token boundaries, rejecting prefix/suffix and URL-path lookalikes. It does not prevent spoofing a complete declaration.

## The second gap: verification overwrote the role

A name-only repair would still have classified signed Ahrefs and ExaSearchBot requests as signed-agent/AI agents. Recognized named roles now survive verified signatures. Existing `signature_status` and `signature_agent` fields preserve the independent key outcome. Unknown roles retain signed-agent; failed verification keeps the declared kind and failure reason. No verifier policy changes.

`bySigner` reports stored verified-key outcomes over the same included selection as totals, including path/kind/agent/time, owner and referral boundaries. The existing consolidated SQL gains a thirteenth section, not another D1 statement. All-time has fourteen sections including its boundary. Named declarations and signer outcomes appear separately on stats; overlap is explicit, and neither is an additional audience total. Signers are plain text, not promoted links. The public agents pill is renamed Assistants & signed clients; historical/unknown-role signed clients remain explicit. `seo-crawler` joins Crawlers. Report cache version: `2026-10-26.1`.

No D1 migration or historical update. Old null names stay null; old kinds/reasons and signature outcomes stay unchanged. The change affects new observations. The code commit/report version dates the method boundary; per-observation collector/classifier versions remain future work.

## Local acceptance

- Analytics package: **57/57 tests** pass. Exact four UAs, lowercase variants, mobile Ahrefs, lookalikes, absent/verified/failed signatures, original evidence preservation, unsigned ingestion and real signed ingestion are covered.
- Signed ingestion generates a fixture Ed25519 key/directory and goes through the actual verifier and collector. It checks all four retained names/roles plus verified signer fields. It proves controlled-key behavior; it does not authenticate vendor traffic or establish draft conformance.
- Report fixtures reconcile named/unsigned/signed rows, an old unknown signed row, owners, abuse and future rows; all selection boundaries share the signer aggregate, and rows remain unchanged.
- Blog package: **104/104 tests** pass. Workspace typechecks pass.
- [Cloudflare-local D1 result](classification-local-d1.json): Miniflare 4.20260301.1/workerd, twelve fixture rows, eight complete report executions. Fixed/all-time each return nine included, eight named, five signed, one abuse-excluded; crawler/assistant groups reconcile as six/three. Four name/kind selections each return two included and one signed. Original rows unchanged. This is runtime SQL acceptance, not production cost measurement.
- [Reproduce](check-classification-local-d1.mjs) from repository root after `pnpm -C packages/analytics test`: `node packages/blog/drafts/research/analytics-retrospective/check-classification-local-d1.mjs`. Uses the installed Wrangler/Miniflare dependency; requires a localhost listener. The first restricted local listener attempt failed with EPERM, then the authorized run passed. No production calls.

The baseline capture files remain frozen. New evidence is additive. The article explains this repair while keeping the original audit window and unknowns explicit; prompt provenance gains the complete sixth request.

## Release and next action

Source delivery, active Worker metadata and measured live behavior will be recorded separately in the acceptance receipt. No production activation is established by local tests. Before any synthetic live page GET, verify an existing referral exclusion with the current public policy hash and the pure local assessor. Use a unique labelled control under that excluded suffix and inspect aggregates, never daily IDs or IPs. Such controls test prospective UA capture and exclusion, not real vendor ownership or the authenticated owner-browser flow.

Remaining: per-observation versions, actual owner-browser exclusion, native verification/entitlements, the supported signature profile, organic vendor-signed acceptance, and R1 attribution/policy. A copied UA or a valid fixture directory never establishes who operated an ordinary public request or why.
