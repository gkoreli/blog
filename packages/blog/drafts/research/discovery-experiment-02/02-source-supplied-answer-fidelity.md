# Can the fetcher reference support an accurate agent answer?

October 31, 2026 UTC. Continues [the discovery workbench decision](01-repeat-and-decision.md) and [the retained-window audit](../analytics-retrospective/126-retained-windows-and-resource-trends.md). The previous turn was progress: it separated descriptive resource events from unsupported growth claims. This experiment tests one supported-answer outcome, not another search-presence count.

## Frozen experiment

Question: **Does DuckAssistBot's Web Bot Auth signature cover User-Agent and request path, and what can a site owner actually conclude from a verified request?** This extends the existing coverage question; it is an operator question, not measured search demand.

One fresh Codex collaboration worker receives only the unchanged article snapshot and the question, with no copied conversation, rubric, external browsing or independent verification. It may read the snapshot and save one complete answer. The actual model identifier and sampling settings are not exposed; no override is requested. Stop after one completed answer or terminal failure. No retry, follow-up coaching or article intervention is planned to obtain a favorable result.

The rubric is frozen before dispatch: six required checks cover the measured signed fields, unsigned fields/replay, proof association, reading/action limits, date/sample scope, and citation fidelity. Freshness-policy and unavailable-lookup handling are two separate diagnostic checks. Root review must inspect claim support and actual links; keyword presence alone is not a score.

Hypothesis: the corrected reference can supply a practical answer while preserving signature-coverage boundaries. Competing explanation: the worker may already know the standards. With no no-article control, a correct answer cannot establish causal improvement from this article. Source-supplied citation is a controlled task observation; it is not unseeded discovery, organic adoption or a general answer-accuracy rate.

Article source SHA-256 `59c96f4351e3325b7dc8b49e90ac1ddea946f538ff78842b7c568d69ace5a7aa`. The pre-execution manifest SHA-256 is `9e3c2001168595534931bbb5873cb4fdbb11fdb8ca0e43ec64049c7234258040`; exact inputs and prompt are retained privately. No production request, current vendor fetch, human label, account access or new analytics collection is involved.

## Result

The one fresh worker returned a 313-word answer with six links to three distinct sections. Root review and a separate read-only reviewer agree: **five of six required criteria fully pass; citation fidelity partially fails; both diagnostics pass**. The strict primary outcome is **not passed**. This is one controlled answer, not an 83% population accuracy estimate.

The answer correctly keeps measured `@authority`/`signature-agent` coverage separate from unsigned User-Agent, method, path and query; limits key association and possible reuse; avoids human-reading claims; dates the September captures and October replay; and keeps unavailable key lookup separate from an invalid proof. It cites the supplied canonical article rather than pretending to have independently read linked standards. These are positive substantive task observations. The failed criterion is delivery: the section subjects are correct, but **none of the three fragment targets exists in the baseline HTML**. A heading in Markdown is not automatically an HTML anchor.

The [frozen result and repair receipt](answer-fidelity-checks.json) retains each criterion, input/output hashes and the original failure. The full answer remains private with the exact snapshot and prompt. No second answer, coaching, source rewrite or favorable retry occurs.

## Repair plan after the frozen trial

The single answer is terminal. Content review finds the requested distinctions, but local baseline rendering has zero of the three cited section IDs. Preserve the original answer and strict citation failure; do not coach or rerun it. Add Marked's maintained `marked-gfm-heading-id` 4.1.4 extension (peer range includes installed Marked 17.0.4), with its `github-slugger` 2.0.0 dependency, at the existing server renderer. No prose or model-output change is needed. This is a rendering repair driven by an actual failed task artifact.

Check the exact three destinations in the real article, per-document duplicate/reset behavior, inline formatting and Unicode; compare the generated body to baseline after removing only newly generated heading IDs. Use an isolated build and inspect all Markdown article IDs for empty/duplicate targets and existing explicit-ID collisions. Verify native fragment navigation without JavaScript where the browser surface permits. Keep local output, source delivery, hosted activation and served acceptance separate. The first failed trial remains a failed trial after this repair.

## Local repair and evidence

The installed Marked 17.0.4 heading renderer emits `<hN>` without IDs. [Marked's renderer extension contract](https://marked.js.org/using_pro#renderer) provides the integration point; the [HTML fragment algorithm](https://html.spec.whatwg.org/multipage/browsing-the-web.html#scroll-to-the-fragment) supplies native navigation once the target exists. We use the maintained [heading-ID extension](https://github.com/markedjs/marked-gfm-heading-id) and its collision-aware GitHub slugger rather than inventing a slug convention. Raw HTML headings and TypeScript page templates remain outside this Markdown-token extension.

Reading the installed package exposed module-global slug state. A concurrent-render regression reproduced counters leaking between documents while asynchronous Shiki work was pending. The renderer now serializes its parses, releasing the queue after errors, so each extension preprocessing reset belongs to one complete document. The first typecheck also caught the package declaration's missing `globalSlugs` option; the inspected default is already false, so no cast or upstream type override is needed.

All **169 site tests**, workspace typechecks, **27 Markdown validations** and the isolated **38-post build** pass. The three actual article targets change **0→3**. All 27 built Markdown article pages have nonempty generated IDs and no duplicate page IDs, including collisions with explicit IDs. Removing only generated heading-ID attributes makes the article body byte-equal to baseline. Article source and the captured answer remain unchanged.

The in-app browser reaches all three headings using native fragments in the isolated preview, with CSP blocking application scripts, connections and frames. Each target is positioned within one pixel of the viewport top. The owned tab is closed, server terminal and port unreachable. This is local navigation evidence; it does not establish current served production behavior. An initial build preflight hit sandbox-denied tsx IPC; the permitted isolated build passes. Failed type/concurrency/build controls remain separate from the model trial.

The 40-file private archive verifies under manifest SHA-256 `261d4b1a7ae56eb51b73a9023ea94ba18b93001c5cf0be84698c05a4f7982e76`. [Checks and cross-references](answer-fidelity-checks.json) record the versions and source hashes. No runtime collector field, classifier, privacy policy, human label or vendor-fetch behavior changes. The concise retrospective and fetcher prose remain unchanged.

## Interpretation and next action

The reference supplied a substantively useful answer in this controlled task. The test also found a real obstacle to inspecting its evidence. Search presence, factual support, working citation destinations and organic use are different outcomes; the original failed destination check stays failed after the repair.

Fresh [RFC 9421 coverage/replay review](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) and [Web Bot Auth draft 01](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol-01/) support the evidence boundary. DuckDuckGo's [current public description](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot) declares Search AI-answer crawling; this does not authenticate a particular request's purpose. Reading documentation is not a new vendor trial or fresh cryptographic verification.

Next: deliver the checked source, then accept its exact build/activation and one bounded, explicitly prefetch-marked HTML response for these destinations. Only make that request after positive source-linked activation evidence; do not retry D1 authorization, force a stats calculation, expand account scope or alter the frozen model result. Human/native/search/privacy inputs retain their claim-specific gates; the wider goal stays active and incomplete.

## Source activated; served check rejected

[Release evidence](answer-fidelity-release.json) joins source `762e3b5` to native build `019b0ea5-b801-49dd-b14c-ac6734950cf5` and full Worker `c1c6a99c-8d8b-4a85-a4fc-960d5fca9da4`. The downloaded native log records successful build/deploy/completion at `2026-10-31T08:25:10.082Z`; a fresh source-linked deployment row is Ready with a 100% meter and the active version prefix matches. Hosted Node is 24.22.1 versus pinned local 24.14.1. The first GitHub check read had no rows; native evidence, rather than an invented green check, establishes this activation.

The single frozen `Accept: text/html`, `Purpose: prefetch` GET returns **HTTP 403 and Cloudflare's Access denied page**, not the article. No target or expected post body matches that denial response. The exact rule and whether the request reached the Worker remain unestablished. Local eligibility controls support source-ineligible intent, but no storage-absence or request-level Worker/version join was measured. No D1 query, second request, alternate-client fallback, challenge action or protection change occurs. Served destination acceptance remains **open**; source activation and local navigation stay accepted, and the original model trial stays a strict failure.

The separate release archive and original trial archive are hash-verified in their owning receipts. Two preparer issues occurred before any site request: a raw-renderer versus serialized-build-body oracle mismatch, and a cwd-relative source read. The corrected frozen plan uses the actual isolated serialized post body and absolute source input. Those failures are not extra HTTP attempts. The owned dashboard tab was closed and the user's existing tab left unchanged. No preview or tail remains active.

This supersedes the preceding next-action proposal: inspect existing edge access-policy or retained request evidence for this specific rejected control before considering another served trial. Do not infer the cause from403alone, loosen protection or rerun the request to get a favorable outcome. The analytics goal remains active/incomplete; human/native/search/privacy gates remain unchanged. Later documentation deployments have their own identities and do not reopen this source-activation point-in-time acceptance.
