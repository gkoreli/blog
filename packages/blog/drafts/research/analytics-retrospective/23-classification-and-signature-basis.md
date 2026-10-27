# Show which signature evidence supports each classification

October 27, 2026 UTC. Continues [TASK-0119](../../../../../docs/tasks/TASK-0119.md), the [classification audit](19-explicit-classification-uncertainty.md), [verification policy](18-webbotauth-verification.md) and [labelled production stages](../edge-vs-rum/08-production-stage-protocol.md). This iteration changes reporting, not collection, historical classifications or operator labels.

## The missing intersection

The dashboard already reports classifications, verified signing outcomes, signed components, vendor-origin checks and published-IP results. Separate totals do not reveal their intersection. A reader could see AI-search events and verified signatures without knowing whether those signatures belonged to those AI-search events, covered their declared User-Agent, or had any recorded coverage detail.

The [native D1 counterexample](kind-signature-local.json) constructs two **stored-record fixtures**, each containing 512 observations. Both have 256 AI-search and 256 assistant classifications, 256 locally verified results and 256 unsigned results. In A, signatures support the AI-search rows; in B, they support the assistant rows. Every old report output is identical. The new joint projection differs. These are supplied database facts, not observed operators, human controls or newly verified signatures.

## Primary-source cross-reference

| Authority | Consequence in this implementation |
|---|---|
| [RFC 9421 §3.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.2.1) and [§7.2.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.2) | Verification and application requirements are separate; covered fields constrain what a signature protects. Missing coverage cannot be treated as an unsigned field or an authenticated role. |
| [Web Bot Auth draft §4.6](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) | Human identity, authorization and delegation stay outside this signature proof. The table must not become a human/automation accuracy claim. |
| [Cloudflare's current verified-bot taxonomy](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) and [native profile](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Provider verification, behavioral categories and Direct/Intermediary operation are different dimensions. Our nullable native booleans do not supply those categories or prove an initiating person. We do not copy provider reputation claims into a local signature result. |
| [Pinned Cloudflare library](https://github.com/cloudflare/web-bot-auth/blob/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c/packages/web-bot-auth/src/index.ts), [source manifest](webbotauth-reference-sources.json) | Its verified result retains components and parameters separately from resolver/profile validation. Keep that distinction in reports instead of collapsing it into a trusted-agent score. This is the previously hash-checked source review, not fresh provider deployment evidence. |
| [W3C table headers](https://www.w3.org/WAI/tutorials/tables/two-headers/) | Use a native table with caption, column headers and row headers; preserve readable labels and links across narrow screens. |

The first attempted verified-bot documentation URL was unavailable; following the native profile's visible documentation link resolved the canonical primary page. No claim follows from the failed URL itself.

## Prepared reporting capability

[`signature-basis.ts`](../../../../analytics/src/signature-basis.ts) defines nine closed reporting bases: verified UA covered, verified UA uncovered, verified coverage unknown, not verified, unsigned, stored verified outcome only, detail unrecorded, test-injected and unrecognized/inconsistent record. It understands the two existing evidence schemas; future schemas and conflicting stored statuses cannot acquire a stronger interpretation. Actual JSON booleans distinguish true/false from a numeric or missing value. Legacy `signature_status=verified` without evidence stays an **outcome-only record**, not a current re-verification.

[`stats.ts`](../../../../analytics/src/stats.ts) groups those bases with the original classification, including a null projection for missing/unrecognized kinds. Each included observation contributes once. Counts must reconcile to the selected total; malformed bases, duplicate groups, nonpositive counts or a mismatched denominator reject the report. Owner, current-day owner-client, referral, time, path, traffic and kind selections remain shared. No raw origins, headers, key IDs or diagnostic objects enter this projection. No observation is rewritten and no extra field is collected.

The existing single report statement gains one grouped section over its materialized included population. Report/cache version advances to `2026-10-27.6`; collector, classifier and verifier versions do not change. Native D1 accepts the prepared query and the closed state cases. UI headings now say **Request classifications** and **Stored verified signing outcomes**. The latter explicitly describes recorded status rather than claiming fresh proof. The policy row no longer incorrectly limits rejections to time/coverage; discovery and public-key policy are included. Kind links scope the existing vendor/network panels to the same selected cohort; they do not assert an identity or purpose.

## Experiments, costs and limits

The [maintained native helper](../../../scripts/check-kind-signature-report.mjs) compiles the old report from pinned source `ad5133a`, executes old/new queries on the same native D1 fixture inputs and confirms every common output stays identical. Nine further supplied stored-record cases cover every closed basis, missing kind, exclusions, scoped and empty reports. Unit tests additionally exercise inconsistent status/schema/coverage fields and malformed output. The first local run rejected the added section because the decoder's expected-section set had not been extended; the repaired decoder and updated contract fixture pass. No broken report was deployed.

On each 512-record A/B fixture, old query work is **21,132 reads**, new work **22,160**, an extra **1,028**. These are local metered row counters, not production latency or an account-wide cost forecast. The extra intersection has a measurable cost; it is not described as an optimization.

The [prepared production plan](kind-signature-local-production-plan.json) permits one seven-day signed-client cohort SELECT, capped at 50,000 direct reads. [Pre-release production acceptance](kind-signature-pre-release.json) records **42,512 reads, zero writes**, with **225 included observations**, all `verified-outcome-only`. This is an important retained-data limit: their stored successful outcomes lack the detailed proof record. It does not establish that the original signatures were invalid or map the separately captured nineteen Exa log records to these observations. Public cache fills and later browser requests are additional work.

Local browser fixtures use the actual isolated production HTML/CSS/JS with nine supplied report rows; external scripts are removed from the fixture HTML to avoid unrelated collection. Same-kind navigation returns four rows and Back restores nine. A 390-pixel viewport has no document overflow (354-pixel table). These are UI/viewport checks, not physical-device or human controls. Final UI source/build acceptance and production activation are separate from these prepared results.

[Scoped source checks](kind-signature-source-checks.json) pass 144 analytics tests, 106 site tests, workspace types, post validation and an isolated 32-post build. The article is 1,249 words and its thirty original shaping messages remain unchanged. The owned fixture server is stopped and the temporary viewport reset.

## Next acceptance and remaining goal

Verify the checked source build and activation, the new API shape and cache version, actual displayed historical row/selection, scoped navigation/Back, empty handling and served article. Keep raw captures outside Git. Accept publication separately from local fixtures.

The broader goal remains open for organic signed/native agreement, resolved-address/egress and replay policy, actual human/real-device/JavaScript-off controls, and native beacon/sampling reconciliation. A joint table improves visibility into retained evidence; it supplies none of those missing measurements. The retrospective stays concise and links this research rather than reproducing every state and operational receipt.
