# Final Draft Fact Check — `019-does-llms-txt-work.md`

**Checked:** 2026-08-25  
**Draft:** `packages/blog/drafts/019-does-llms-txt-work.md`  
**Implementation baseline:** `464c89d75bbf1d684c3f705a3df84c0c141665f1`  
**Method:** sentence-level delta against [`09a-draft-fact-audit.md`](./09a-draft-fact-audit.md), the research artifacts, the pinned implementation/client baselines, and current first-party provider documentation.

## Publication verdict

**CONDITIONAL PASS.** The rewrite resolves every P0 category from the first fact audit and preserves the bounded thesis. It is publication-ready after the two factual fixes below and the citation tightening. No benchmark or organic-visibility result is overstated in the rewritten core argument.

The article's governing form remains honest: it is an engineering decision guide backed by a time-bounded field investigation, not a universal verdict. The first-person stakes do not need further qualification.

## Required factual fixes

### 1. Correct the abridged beacon's content type

**Draft line 115** currently shows:

```javascript
headers: { 'Content-Type': 'application/json' },
```

The deployed implementation at the audited baseline sends:

```javascript
headers: { 'Content-Type': 'text/plain' },
```

The Worker still parses the body with `request.json()`, but the article says the snippet is an abridged version of the live path, so changing the media type is not a permissible abbreviation. Replace `application/json` with `text/plain`.

**Evidence:** [`page.ts` at `464c89d`, line 157](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/blog/src/templates/page.ts#L157).

### 2. Remove the unsupported adoption claim “real users”

**Draft line 310:**

> “For developer documentation and explicitly configured tools, that door already has real users.”

The audit established maintained consuming instructions, configured tools, and one direct `mcpdoc` tool reproduction. It did **not** establish a user count, external user adoption, or completed user tasks. Replace the sentence with:

> “For developer documentation, maintained skills and explicitly configured tools already implement that path.”

For the same reason, tighten the compressed verdicts at lines 17, 174, and 288 so they do not turn code-inspected instructions into observed task use:

- line 17: “Maintained coding-agent instructions and tools implement compact-index, targeted-Markdown, and bounded full-dump workflows.”
- line 174: “Configured-agent navigation: implemented in bounded maintained workflows; comparative task benefit remains untested.”
- line 288: “Explicitly configured agent skills and tools implement the pattern in bounded documentation workflows.”

The detailed evidence section already states the correct boundary at line 193: these are maintained instructions and design choices, not comparative task results.

## Required terminology and citation tightening

### 3. Replace the remaining absolute “universal baseline”

**Draft line 300:**

> “Semantic HTML remains the universal baseline.”

“Universal” is broader than the evidence and was explicitly removed elsewhere in the rewrite. Use:

> “Semantic HTML remains the baseline web representation.”

This preserves the recommendation without claiming every agent consumes HTML in the same way.

### 4. Link the current implementation claims to the exact files

The evidence-ledger row at line 325 links only to the repository root. It should point readers directly to the code supporting the four separate claims:

- [browser beacon](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/blog/src/templates/page.ts#L157);
- [`POST /api/event` classification and D1 write](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/analytics/src/index.ts#L43-L90);
- [`Human | Bot | AI` regex classifier](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/analytics/src/classify.ts#L1-L25);
- [`visitor_type = 2` exposed as `ai_fetches`](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/analytics/src/stats.ts#L72-L91);
- [Worker-first routing limited to `/api/*`](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/wrangler.jsonc#L21-L28).

This is source precision, not a change to the article's conclusion.

### 5. Treat the two temporary research 404s as a pre-publication gate

The following links are expected to return 404 while the artifacts remain untracked:

- `.../blob/main/packages/blog/drafts/research/llms-txt-geo/06-edge-baseline-2026-08-24.md`
- `.../blob/main/packages/blog/drafts/research/llms-txt-geo/08a-green-team-client-evidence.md`

This is **not** a factual failure in the draft. Before publishing, commit the research artifacts, confirm both URLs resolve on GitHub, and run the normal external-link check. Do not replace them with claims lacking an inspectable method.

## Prior P0 resolution ledger

| Prior blocker | Rewrite location | Result |
|---|---|---|
| Application analytics versus server/edge observation | Lines 110, 128, 136–140 | **Resolved.** The draft names the original resource `GET`, application Worker, D1 model, and edge aggregate separately. |
| “A request proves retrieval” | Lines 81 and 168 | **Resolved.** Request = attempt; successful response = server delivery; no model-context inference. |
| Three requests versus two browser sequences | Lines 142–149 | **Resolved.** Three `/llms.txt` requests, likely two Chrome sequences, with the `301` → `200` boundary. |
| `mcpdoc` called a client | Lines 195–203 | **Resolved.** It is an MCP documentation server/adapter. |
| Direct tool call overstated as agent-task proof | Lines 199–201 | **Resolved.** Direct calls, origin allowlist, no model/host/task benefit. |
| `mcp<2` stated as universal requirement | Line 203 | **Resolved.** Dated clean-environment reproduction and exact dependency-range boundary. |
| Benchmark called registered | Lines 238 and 242 | **Resolved.** Drafted, not frozen or run. |
| Vague/conflicting benchmark thresholds | Lines 238–242 | **Resolved.** One-point quality boundary, 20% median efficiency threshold, no unsupported-claim increase, disagreements preserved; all labeled proposed. |
| Bing and Search Console telemetry collapsed | Line 244 | **Resolved.** Bing citation/grounding-query fields remain separate from Google's page/impression visibility. |

## Numbers, dates, and volatile claims that pass

| Claim | Verdict and boundary |
|---|---|
| March baseline: one article, 11 views, 4 visitors, 0 referrers | **Pass.** Pinned ADR baseline. |
| `97 ai_fetches` | **Pass.** Explicitly dated August 24 and immediately redefined as beacon events, not crawler reads. |
| Edge snapshot: 3 index, 3 page Markdown, 0 full dump, 0 named-provider UA | **Pass.** Aggregate, `sampleInterval: 1`, unattributed, and correctly qualified. |
| Ahrefs: 137,210 domains, about 38,000 valid files, 97% with no observed request | **Pass.** May 2026 customer sample, technical/SEO skew, root-index-only scope, and request/use boundary all present. |
| Google Search ignores `llms.txt` | **Pass.** Current guide still says the file neither helps nor harms Search visibility/rankings; ledger gives July 10 update and August 25 access dates. |
| Prismatic, tldraw, and Streamlit behaviors | **Pass.** Pinned/current instructions, no task-result overclaim in the detailed section. |
| `mcpdoc==0.0.10` reproduction | **Pass.** Direct tool path, off-origin refusal, allowed-origin limitation, and dated MCP 2.x defect are exact. |
| Checkly February client snapshot | **Pass.** Frozen tested versions are not presented as current market coverage. |
| Cloudflare versus Vercel delivery mechanisms | **Pass.** Paid opt-in edge conversion is separate from Vercel's application/docs pattern and the blog's static `.md` outputs. |
| 27,554 / 7,683 versus 10,756 / 2,476; 67.8% | **Pass.** One named post, August 25, `cl100k_base`, representation-only boundary. |
| 30-day daily edge gate; one request/day or same material client three times | **Pass.** Explicitly proposed editorial thresholds, not standards or completed results. |
| GEO: top-five Google candidates, GPT-3.5 Turbo, 200-query supplied-file Perplexity arm | **Pass.** Correct post-retrieval boundary. |
| Competitive GEO: 252,000 paired trials; relevance/position stronger than formatting | **Pass.** Linked as a May 2026 preprint; no live-discovery inference. |
| Full dump: 375,443 bytes for 18 posts | **Pass.** Dated August snapshot, not a permanent size. |

## Metadata and source verdict

- **H1:** accurate. “Live implementation” is supported by deployed artifacts, code audit, and edge aggregates.
- **`seoTitle`:** accurate after the first screen defines “works” by stage. At 54 characters it is within the project's working display range.
- **Description:** accurate and 146 characters; the article does provide build and measurement decisions.
- **Alternative headline:** accurate; it does not promise a benchmark result.
- **Dates:** all volatile sources in the evidence ledger have dates. Google and Cloudflare update dates are corrected; access dates are explicit.
- **Primary-source discipline:** strong. Provider policies, client code, implementation code, and papers are linked to original sources or pinned repositories. The exact-code links above and the expected research-artifact commit are the remaining publication mechanics.

## Final release gate

Publish when:

1. the beacon snippet says `text/plain`;
2. “real users” and the three compressed workflow claims are narrowed to maintained implementations/instructions;
3. “universal baseline” becomes “baseline web representation”;
4. the evidence ledger links the exact implementation files; and
5. the two committed research-artifact URLs resolve.

With those changes, the article's strongest conclusion is fully supported: `llms.txt` has no demonstrated open-web ranking or citation benefit, but current maintained instructions and tools give it a bounded known-site navigation job whose end-to-end task value remains untested.
