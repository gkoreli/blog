---
name: ai-bot-analytics-grilling
description: Run and document controlled trials of AI search, fetch, crawl, and research providers through APIs, MCP, CLIs, or browser interfaces, matching service results to Cloudflare requests and analytics evidence. Use for provider comparisons and investigating bot attribution or answer fidelity; ordinary analytics maintenance uses blog-maintenance.
---

# AI Bot Analytics Grilling

Build an inspectable provider field guide from actual operations. Treat the unit of comparison as **provider × product × operation × interface × conditions**, rather than one row per company. A search crawler, a prompted reader, a hosted browser, and an agent using another provider can produce different traffic.

## Resume and choose the question

Start with the [current worklist](../../../packages/blog/drafts/research/ai-bot-analytics-grilling/00-worklist.md), its latest dated result and private evidence manifest. Preserve the accepted September fetcher study and November follow-up as historical evidence. Do not silently rerun or refresh them.

Name the decision the next trial can change: can we trigger a fetch, distinguish an operation, recognize the request, verify selected fields, reproduce a stored classification, or trust an answer's citation? Select the relevant rows from [dimensions and reporting](references/dimensions-and-reporting.md). Use [provider entry points](references/provider-entry-points.md) for routing; recheck live schemas and primary docs before execution.

Keep one article draft and research index moving with the experiments. Use the repository's shape-article and blog-writing workflows for prose and complete human prompt provenance. Report failures and gaps beside successful trials.

## Freeze a bounded trial

- Record the provider, product/model, operation, interface, auth state, exact prompt or redacted request, current tool schema, UTC window, cache/freshness settings, page/result limits, and expected observable outcome.
- Assign a unique URL label per controlled attempt. Keep the expected answer out of the prompt. Query labels connect events by experimental assignment; they neither force a cache miss nor authenticate a client.
- Use a known existing page for the first retrieval. Add deliberately absent pages, HTML/Markdown, redirects, fresh-body markers, or repeated fetches only when they answer a defined question. Never relabel an accidental 404 as a planned control.
- Set provider job/page/credit and capture time/byte bounds. Record actual API/credit costs and failures. A local stopwatch is end-to-end latency; provider processing time is a separate measure.
- Use existing account access and authorized credentials without printing them. Keep keys out of URLs, prompts, screenshots, Git and ordinary tool output. Prefer the signed-in playground or a secret read directly by the request process.

## Observe the stages

Capture the provider result and, when authorized, a bounded private `wrangler tail` stream before submission. Inspect the current deployment/collector versions from actual captures. Collection settings and historical receipts do not guarantee complete logging.

For each assigned URL, reconcile:

1. Confirmed service submission and completed answer, result, error, or gate.
2. Actual request URL/time/method, origin status, selected request headers and Cloudflare facts.
3. Collection attempt → storage acknowledgement joined by operation ID.
4. Returned storage reference → exact bounded D1 row, if persistence is claimed.
5. Full current receipt projection equality, rather than agreement on one label.

Use the [operations reference](../blog-maintenance/references/operations-and-handoffs.md) for production SQL, native local D1 preflight, metering and authorization/quota failures. Select exact returned IDs through the primary key; keep SQL and identifiers private. Run no broad traffic census merely to verify a handful of test rows. An acknowledgement is evidence of the reported insert; independent readback is a further stage.

Preserve malformed frames, incomplete suffixes, dropped-event notices and excluded side requests. A missing tail match means no match in that capture. Consult relevant retained Worker/security evidence before proposing an edge block; keep unavailable evidence explicit.

## Interpret without merging evidence

Keep these separate: experimental assignment, User-Agent declaration, address/feed or DNS assessment, cryptographic verification and covered components, native Cloudflare fields, stored classifier verdict, answer accuracy, citation, and use. An unavailable field stays unavailable.

Inspect `Signature-Input` and verifier coverage. A verified authority-only proof does not bind the URL, method, User-Agent, operator delegation or human trigger. A nonce alone does not demonstrate replay prevention. Capture the exact verifier/profile outcome; independent replay is a separate experiment.

Compare returned H1s with body H1s, titles with title metadata, quoted sentences with their source, and publication/crawl dates with their named fields. Audit whether summaries preserve qualifications. A correct quote or visible citation can be reported as a controlled agent-mediated outcome even when no origin fetch is observed.

Never generate vendor-looking headers and call that a provider trial. Local regression cases may test the collector, but must retain their synthetic label. Browser classification does not establish a person; controlled trials do not establish organic growth.

## Leave durable, reviewable results

For every executed operation, record conditions, exact reviewed input, result, source links, origin/storage evidence state, limits, failures, and the next useful test. Keep raw requests, IDs, account UI, keys and session logs in ignored private storage; publish only an allowlisted projection and artifact hashes. Update the comparison and provider subsections with everything consequential learned, including contradictions between metadata and body content.

Stop owned tails and jobs at their bounds; do not stop another session's servers. Update the worklist and private manifest before handoff. Validate links, skill frontmatter, provenance and the scoped diff, then follow repository commit/push delivery. Keep a requested starting draft unpublished until publication is actually in scope.
