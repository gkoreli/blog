# llms.txt and GEO — Draft Review Synthesis

**Synthesized:** 2026-08-25  
**Input draft:** first iteration of [`019-does-llms-txt-work.md`](../../019-does-llms-txt-work.md), renamed after review  
**Inputs:** [`09a-draft-fact-audit.md`](./09a-draft-fact-audit.md), [`09b-draft-editorial-review.md`](./09b-draft-editorial-review.md), [`09c-draft-technical-reader-review.md`](./09c-draft-technical-reader-review.md), [`09d-evergreen-search-landscape.md`](./09d-evergreen-search-landscape.md)

## Decision

The first draft will not be polished in place. It will be structurally rebuilt as an **engineering decision guide backed by a first-person field investigation**.

The traffic requirement changes the doorway, not the verdict. The revised article will answer the recurring question immediately, then use the live implementation, failed measurement model, edge aggregates, maintained client code, representation comparison, and GEO research to earn the answer.

No review or search snapshot can guarantee substantial traffic. The controllable goal is a page capable of satisfying durable, relevant intent better than generic competitors, then measuring query fit after publication.

## Resolved metadata

- **H1 / article title:** `Does llms.txt Work? What a Live Implementation Revealed`
- **SEO title:** `llms.txt: What Works, What Doesn't, and How to Test It`
- **Slug:** `does-llms-txt-work`
- **Alternative headline:** `A live audit of llms.txt, page Markdown, agent tools, crawler measurement, and GEO evidence`
- **Description:** `Does llms.txt improve AI search? This live audit examines edge data, agent tools, Markdown, and GEO evidence—then shows what to build and measure.`

### Why this resolves the title disagreement

The editorial review wanted a more search-legible H1; the technical review wanted to preserve the literary `I Gave llms.txt a Smaller Job`; the search-landscape review recommended the exact reader question. The selected H1 carries the exact question and the live implementation without claiming that Goga personally performed every agent-assisted audit action. The old title remains the conclusion's governing metaphor rather than the doorway.

## Stable short answer

The first screen will state:

> `llms.txt` has no demonstrated ranking or citation benefit for open-web AI search, and Google Search explicitly ignores it. It does have bounded value after a client already knows the site: maintained coding-agent workflows use small indexes, targeted Markdown, and—in narrower jobs—full dumps. Generate the cheap pieces from canonical content; do not mistake them for an audience-acquisition strategy.

This answer is stable because it assigns jobs by pipeline stage. The dated provider/client ledger can change without invalidating the model.

## Revised movement

1. **Direct answer and site-type decision table** — satisfy the cold reader immediately.
2. **Define the artifacts** — `llms.txt`, page Markdown, `llms-full.txt`, `robots.txt`, sitemap.
3. **Minimal real implementation** — live-shaped map, proposed v2 relations, delivery checks, generation/parity rule.
4. **The first-person origin** — `I built llms.txt for a blog nobody read.` Preserve the March ADR belief as belief, not objective fact.
5. **The measurement failure** — D1 records a later browser beacon, not the original resource `GET`.
6. **Edge snapshot and population base rate** — three index requests, three Markdown requests, no full-dump/provider-UA groups; then the bounded Ahrefs cross-domain result.
7. **Stage model and testing ladder** — delivery, request, task, citation, referral stay separate.
8. **Maintained client evidence** — Google/Prismatic index-to-page; tldraw/Streamlit bounded dump; `mcpdoc` tool retrieval with precise limits.
9. **Page Markdown** — direct representation comparison, explicit URL versus content negotiation, no task-value overclaim.
10. **GEO after retrieval** — 2024 and 2026 study boundaries, durable evidence-writing rule.
11. **Final decisions and falsifiers** — one table for the live blog, exact benchmark/telemetry gates, no unowned first-person promises.
12. **Answers readers need** — concise reference tail without FAQ schema.
13. **Dated evidence ledger and update contract** — stable body, volatile sources.

## Narrative table budget

Keep four tables in the main body:

1. site-type decision table;
2. stage/evidence model;
3. HTML/Markdown measurement;
4. live artifact decision/falsifier table.

Definitions will use prose/bullets. The crawler identifier matrix moves out of the narrative. Client examples use prose organized by job.

## Fact corrections that govern the rewrite

- Say the application analytics misses the original resource `GET`; Cloudflare still has aggregate edge evidence.
- Call the Cloudflare evidence an edge request aggregate/snapshot, never a raw request log.
- A request is an attempt; a successful response shows server delivery, not model-context use.
- The historical index result is three requests likely forming two Chrome sequences; the Markdown result is three `curl/8.7.1` requests.
- Call `mcpdoc` an MCP server/documentation adapter. The direct tool reproduction is not an end-to-end agent task.
- Say its origin is allowlisted; do not claim only links present in the index are permitted.
- Scope the `mcp<2` workaround to the 2026-08-25 clean-environment reproduction.
- The benchmark protocol is drafted, not frozen, registered, or run. Resolve thresholds before any later run.
- Use the existing 20% median byte/token threshold, quality within one scoring point, no unsupported-claim increase, and cross-implementation disagreement reporting as the current draft protocol. Label it proposed until Goga reviews/freezes it.
- Separate Bing citations/grounding queries from Google's page/impression visibility report.
- Date the token comparison, name the tested post and tokenizer, and call it representation cost.
- Separate Cloudflare's paid managed negotiation from Vercel's docs/application pattern and the blog's static `.md` endpoints.
- Attribute code/client/literature work to the audit or reproduction. Reserve `I` for Goga's documented experience and explicitly adopted decisions.

## Practical additions required by the traffic goal

- exact direct verdict inside the first 100 words;
- minimal real `llms.txt` example;
- `robots.txt` and sitemap distinction;
- proposed v2 `alternate` / `describedby` examples with unvalidated-client caveat;
- delivery commands and a reader-sized two-condition task test;
- Ahrefs' 137,210-domain / ~38,000-valid-file / 97%-zero-request observation with sampling and fetch/use boundaries;
- implementation choice by site type;
- exact evidence thresholds;
- concise answers to recurring questions;
- inline primary links beside load-bearing claims;
- two contextual internal links: capability versus adoption, and map-first progressive disclosure;
- a 28-day indexing check, 8–12-week query-fit review, and quarterly evidence audit after publication.

## What must remain alive

- `I built llms.txt for a blog nobody read.`
- The honest desire for readers.
- The public number becoming a different event after reading its implementation.
- The investigation contaminating its own low-volume measurement window.
- Google Search ignoring the file while a maintained Google skill uses it.
- The ability to keep a cheap option without turning skepticism into identity.
- The request for traces rather than agreement or likes.

## What the revision must remove

- the field-note H1 as the only doorway;
- research actions falsely written as Goga's first-person actions;
- “registered” benchmark language;
- the MCP client label and end-to-end task implication;
- repeated job metaphors and polished aphorisms;
- duplicated decision table plus Keep/Test/Probation lists;
- crawler matrices that will age inside the narrative;
- broad promises of a complete GEO guide;
- “request proves retrieval” or any equivalent stage collapse.

## Publication boundary

This revision remains a draft. It becomes publishable only after:

1. the factual corrections and missing primary links land;
2. the practical example and test are technically verified;
3. Goga accepts the first-person decisions and future commitments that remain;
4. the final article passes shape, shareability, prose, link, frontmatter, and local build checks.

## August 25 GEO-frontier addendum

This artifact records the decision after the first full-draft review. Goga later required the article to teach GEO beyond `llms.txt` using evidence current through August 25, 2026. The four frontier reviews and their reconciliation are preserved in [`12a`](./12a-geo-provider-frontier-2026-08-25.md), [`12b`](./12b-geo-research-frontier-2026-08-25.md), [`12c`](./12c-geo-operational-frontier-2026-08-25.md), [`12d`](./12d-geo-frontier-main-agent-notes.md), and [`13-geo-frontier-synthesis.md`](./13-geo-frontier-synthesis.md).

That evidence first expanded the SEO title to include GEO. The final green audit narrowed the promise to `llms.txt and GEO: Live Evidence and What to Test`: the article contains a GEO measurement framework, not a completed universal GEO field experiment. It also expands the stage model to include search activation, answer absorption/fidelity, and final outcome. It does not change the H1, slug, living center, or bounded verdict. The current metadata in the draft supersedes the resolved-metadata block above; the earlier block remains here as the historical editorial decision.
