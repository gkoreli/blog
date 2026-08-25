# Draft Fact Audit — “I Gave llms.txt a Smaller Job”

**Audit date:** 2026-08-25  
**Draft audited:** first iteration of `packages/blog/drafts/019-does-llms-txt-work.md` (renamed after this audit)  
**Blog implementation baseline:** `464c89d75bbf1d684c3f705a3df84c0c141665f1`  
**Method:** sentence-level comparison against the frozen artifacts in this folder, the current blog implementation, pinned client/skill code, and time-sensitive first-party provider documentation. No live requests were made to the blog's agent-readable endpoints during this audit.

## Verdict

**FAIL for publication in the current form; PASS on the governing thesis.**

The article's central position is supported: the browser-beacon metric does not measure direct static-resource fetches; the edge week contained only sparse unattributed traffic; Google Search ignores `llms.txt`; and maintained agent workflows do use indexes, page Markdown, or full dumps for bounded documentation tasks.

Publication should wait for the P0 corrections below. The draft currently turns an aggregate into a “request log,” says a request “proves retrieval,” calls an MCP server a client, overstates a direct tool reproduction as an end-to-end agent path, and says a still-changing benchmark was “registered.” None of those defects requires changing the thesis.

## P0 — publication blockers

### 1. Name the observed event correctly

**Draft lines 38 and 79**

> “The blog does not record an incoming article request at the server.”  
> “The first real request log mostly found me”

**Problem:** The first sentence is too broad, and the heading is false terminology. Cloudflare does record aggregate edge request data. The application Worker and D1 page-view system do not observe the original resource `GET`. The saved evidence is an `httpRequestsAdaptiveGroups` aggregate, not a raw request log: it has no request ID, exact timestamp, IP, or authenticated client identity.

**Required correction:**

> “My application analytics does not record the original article or text-resource `GET`. It records a later browser beacon.”

Rename the heading to something like:

> “The first edge request snapshot mostly found me”

**Evidence:** [`03-crawler-classifier-audit.md`](./03-crawler-classifier-audit.md#what-the-current-system-measures); [`06-edge-baseline-2026-08-24.md`](./06-edge-baseline-2026-08-24.md#result-a--reconstructed-historical-window); [current Worker-first routing](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/wrangler.jsonc#L21-L28).

### 2. A request does not prove retrieval or consumption

**Draft line 113**

> “A request proves retrieval.”

**Problem:** A request proves an attempt. A successful edge response establishes that the server delivered a response to a presented client; it does not establish that the whole body arrived, was parsed, entered a model context, or affected an answer. This sentence contradicts the draft's own measurement boundary.

**Required correction:**

> “A successful `GET` shows that the server delivered a response to a client. It does not prove that the body entered a model context.”

If the status is unavailable, use “request attempt,” not “retrieval.”

**Evidence:** [`06-edge-baseline-2026-08-24.md`](./06-edge-baseline-2026-08-24.md#what-it-does-not-establish).

### 3. Correct the historical request count description

**Draft line 92**

> “Two requests looked like ordinary browser navigation.”

**Problem:** The edge data contained **three** `/llms.txt` requests with Chrome user agents. They likely represented **two browser request sequences** because one user-agent pair returned `301` then `200`. “Two requests” loses one observed request.

**Required correction:**

> “The three `/llms.txt` requests likely represented two Chrome request sequences; one sequence was a `301` followed by a `200`. The three Markdown requests presented `curl/8.7.1`.”

Also qualify line 96. The current aggregate was **consistent with** and dominated by the research checks; request IDs were unavailable, so it did not prove that every `curl` row was ours.

**Evidence:** [`06-edge-baseline-2026-08-24.md`](./06-edge-baseline-2026-08-24.md#result-a--reconstructed-historical-window), rows dated 2026-08-18 through 2026-08-22.

### 4. `mcpdoc` is an MCP server/adapter, not an MCP client

**Draft heading line 144 and glossary line 303**

> “An existing MCP client could read this blog”  
> “Generic `llms.txt` MCP documentation client”

**Problem:** LangChain describes `mcpdoc` as a server, and its package metadata says “Serve llms-txt documentation over MCP.” Cursor, Windsurf, Claude Code, or another host is the MCP client.

**Required correction:** Use “agent-facing MCP server” or “MCP documentation adapter” everywhere.

**Evidence:** [`mcpdoc` package metadata at `8d01c08`](https://github.com/langchain-ai/mcpdoc/blob/8d01c08598e3f19fd6318bded3ffdcda85db03a4/pyproject.toml#L1-L14); [`create_server` implementation](https://github.com/langchain-ai/mcpdoc/blob/8d01c08598e3f19fd6318bded3ffdcda85db03a4/mcpdoc/main.py).

### 5. Do not turn the `mcpdoc` tool reproduction into an end-to-end agent result

**Draft lines 148 and 152**

> “fetch an allowlisted index or linked page”  
> “The blog already had a working user-directed agent access path.”

**Problems:**

1. `mcpdoc` allowlists the configured source's **origin**, not only URLs proven to be links in the index. A same-origin URL can pass without index-membership validation.
2. The reproduction instantiated the MCP server and called its tools directly. It did not run a model through an MCP host on a scored task.

**Required correction:**

> “It exposes two MCP tools: list configured documentation sources, then fetch an index or another page from an allowlisted origin.”

> “The reproduction established a working retrieval path through an agent-facing MCP server. It did not establish that a model would choose the tools correctly or improve a task.”

**Evidence:** [`mcpdoc/main.py` domain construction and tool instructions](https://github.com/langchain-ai/mcpdoc/blob/8d01c08598e3f19fd6318bded3ffdcda85db03a4/mcpdoc/main.py); local reproduction in [`08a-green-team-client-evidence.md`](./08a-green-team-client-evidence.md#mcpdoc-against-gkorelicom).

### 6. Qualify the `mcpdoc` dependency defect as a dated reproduction

**Draft line 154**

> “`mcpdoc==0.0.10` currently needs `mcp<2`.”

**Problem:** The audit established this in one clean resolution on 2026-08-25. The package declares `mcp[cli]>=1.4.1` with no upper bound; clean resolution selected MCP 2.x and failed because `mcp.server.fastmcp` was unavailable. Pinning `mcp<2` worked. “Needs” reads like a universal compatibility theorem.

**Required correction:**

> “In my 2026-08-25 clean-environment reproduction, resolution selected MCP 2.x and failed; adding `mcp<2` made `mcpdoc==0.0.10` work. Its declared dependency range has no upper bound.”

**Evidence:** [pinned dependency declaration](https://github.com/langchain-ai/mcpdoc/blob/8d01c08598e3f19fd6318bded3ffdcda85db03a4/pyproject.toml#L13-L18); [`08a-green-team-client-evidence.md`](./08a-green-team-client-evidence.md#mcpdoc-against-gkorelicom).

### 7. The benchmark has not been registered or fully frozen

**Draft line 253**

> “I registered it before seeing results.”

**Problem:** The artifact is titled “Pre-registration,” but its status is **“Design in progress. Do not run yet.”** Its original conditions were HTML, map + Markdown, and full dump. The fourth `mcpdoc` condition was added later by the green-team. The frozen site snapshot and runs do not exist. Calling this “registered” overstates the evidence trail.

**Required correction now:**

> “I drafted the protocol before running the benchmark, and I have not run it yet.”

Before later calling it pre-registered, update and freeze one dated protocol containing the final four conditions, exact task set, answer key, model/client versions, repetitions, exclusions, and decision thresholds.

**Evidence:** [`01-agent-use-benchmark-plan.md`](./01-agent-use-benchmark-plan.md), especially status, conditions, and decision thresholds; the later four-arm proposal in [`08a-green-team-client-evidence.md`](./08a-green-team-client-evidence.md#what-should-change-in-the-planned-gkorelicom-benchmark).

### 8. State the benchmark threshold instead of saying “materially”

**Draft line 273**

> “materially reduces navigation failures or input cost”

**Problem:** The pre-declared plan uses an exact threshold: at least **20%** lower median fetched bytes or input tokens, no increase in unsupported claims, quality no more than one scoring point below HTML, and disagreement reported by implementation. The later green-team suggested different alternative thresholds (50% fewer failed routes or 25% fewer tokens with at most a two-point accuracy loss). The draft silently blends these designs.

**Required correction:** Choose one final protocol and quote its exact thresholds. Do not call the design pre-registered until this conflict is resolved and frozen.

### 9. Separate Bing telemetry from Search Console telemetry

**Draft line 232**

> “Whether Bing or Search Console exposes query or citation evidence for the actual articles.”

**Problem:** Bing AI Performance documents citations, cited pages, and grounding queries. Google's Generative AI performance report documents impressions, pages, countries, devices, and dates; it does not currently document citation or query reporting. The Google report was also rolling out to a subset of sites in June 2026.

**Required correction:**

> “Whether Bing AI Performance shows citations or grounding queries for the articles, and whether this site receives page-level visibility data in Search Console's Generative AI report.”

**Primary sources:** [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview); [Google's 2026 report announcement](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports); [current Google AI-search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## P1 — correct or qualify before publication

| Draft location and sentence | Finding | Required treatment |
|---|---|---|
| Lines 17 and 30: March baseline; “Six months later” | `11` views, `4` visitors, `0` referrers, one post, and the `97` API value are supported. `97` was checked on **2026-08-24** and is a changing all-time value. March 7 to August 25 is about 5.6 months. “Recurring audience” is not a defined metric in the artifacts. | Say “By late August” and “the API showed 97 as of August 24.” Treat “recurring audience” as the author's observation or define the measure. Frame the pre-build state as “the point that prompted the ADR,” because the ADR file itself now records Phase 1 as deployed. |
| Lines 38–48: beacon code | The excerpt omits `localStorage.analytics_ignore`, `try/catch`, `keepalive`, and the `Content-Type` header. The omission does not change the argument but “runs this browser script” implies a verbatim excerpt. | Label it “abridged” or reproduce the complete short beacon. [Pinned implementation](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/blog/src/templates/page.ts#L155-L157). |
| Line 83: “The nonempty groups were unsampled.” | Directionally correct but less precise than the recorded evidence. Every nonempty group returned `sampleInterval: 1`; the counts were not scaled through adaptive sampling. They remain aggregates. | Use that exact wording. |
| Line 107: eligibility evidence includes `robots.txt` | `robots.txt` controls crawling permission, not indexing by itself. Eligibility also depends on status, `noindex`/`X-Robots-Tag`, canonical/technical requirements, and provider rules. | Rename the row “Crawling and index eligibility” and separate crawl controls from index evidence. |
| Line 115: “The SEO market assigned it…” | This is a broad sociological claim with no supporting example in the draft. | Prefer the more genuine first-person claim: “I had assigned it an earlier job…” Otherwise add representative dated sources and say “some AEO/GEO advice,” not “the market.” |
| Line 121: Google policy | **Verified.** Google says Search does not use these files and they neither help nor harm Search visibility/rankings. The page was last updated **2026-07-10**, not “August 2026.” | Keep the claim; change the source date to “Jul 2026; accessed Aug 2026.” Google also now points to a Generative AI Search Console report. |
| Lines 125–132: Gemini skills | **Verified at `b40dd8d`.** Both general Gemini API and Live API skills prefer docs MCP, then use the docs index and page Markdown as fallback. The glossary links only the Live skill while the prose says “skills.” | Either make the prose singular or cite both pinned skills. Do not imply Google Search uses the same path. |
| Line 136: Prismatic evals | The pinned repo contains eval **assertions** for `.md` fetching, real citations, and grounded answers. No published passing result was found in this audit. | Add “configured eval assertions; no published run result found” if discussing evidence strength. |
| Line 138: Streamlit fallback | The behavior is current in Streamlit's vendored meta-skill: use package-local version-matched skills; fall back to `llms-full.txt` when the package predates skills or the expected layout is unusable. The separate `streamlit/agent-skills` repo used in the research was archived on 2026-07-23. | Cite current Streamlit source at `cd03ef10c348299c73117b6ecea61c93d327ae74`, not only the archived repo: [current fallback code](https://github.com/streamlit/streamlit/blob/cd03ef10c348299c73117b6ecea61c93d327ae74/lib/streamlit/.agents/meta-skill/developing-with-streamlit/scripts/discover.py#L262-L305). |
| Line 140: corpus shapes “benefit” from strategies | The inspected skills show maintainers **choose** these strategies. They do not supply comparative task results proving each corpus benefits. | Mark this as an inference: “These choices suggest a decision boundary…” |
| Line 162: Cloudflare and Vercel “provide serving layers” | Cloudflare offers an opt-in edge conversion feature on Pro, Business, and Enterprise plans. Vercel's own docs/blog negotiate Markdown and its article publishes an application/Next.js rewrite pattern; this is not the same as a universal Vercel platform conversion feature. | State the two mechanisms separately. Add the missing [Vercel primary source](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation). |
| Lines 164–171: local token comparison | **Verified:** `/the-agentic-product-engineer` was 27,554 bytes / 7,683 `cl100k_base` tokens; its `.md` form was 10,756 bytes / 2,476 tokens; reduction 67.8%, measured 2026-08-25. | Name the tested slug and date. Cite or publish the reproduction method. Do not generalize `cl100k_base` to every current model. |
| Line 173: “Markdown conversion” | The blog serves a generated Markdown alternative from the same source; the local comparison was not Cloudflare-style HTML conversion. | Say “Markdown representation may omit…” |
| Lines 177–179: v2 relations | The proposal and relation names are correct. No consuming mainstream client was found in the inspected set. “Validated” is unsupported: proposal conformance and build validation are not client validation. | Say “the audit found no inspected client…” and replace “cheap, validated, and reversible” with “cheap to implement and reversible.” |
| Lines 187–188: “universal-agent document”; `llms.txt` “validated” | “Universal-agent” is absolute and untested. `llms.txt` validation means local generation/link checks, not ecosystem adoption. | Use “baseline web document and fallback for agents”; define validation as local build/link validation. |
| Lines 190 and 236: `375 KB` | **Verified at the dated snapshot:** 375,443 bytes for 18 posts. It is a changing generated artifact. | Say “375,443 bytes in the August 25 snapshot” once; later “about 375 KB” is fine. |
| Line 199: GEO paper result and “headline result is often repeated” | The paper supports citations, quotations, statistics, and fluency/readability interventions inside supplied/fetched candidates. “Often repeated” is an uncited market claim. | Keep the attributed study result. Personalize the second sentence (“I had read the headline as if…”) or source representative repetition. |
| Line 201: “The experiment began later” | The intended boundary is temporal in the pipeline, not publication chronology: the main benchmark begins **after retrieval** with Google's top five results. The Perplexity arm used a **200-query subset**, uploaded files, and forced answers from those files. | Say “The main experiment began after retrieval” and add the 200-query limitation. |
| Line 203: 2026 GEO evidence | **Verified against the audited papers.** FeatGEO uses supplied/fixed candidates, MAGEO freezes retrieval, and Competitive GEO reports 252,000 paired trials with relevance and list position stronger than formatting-only changes. | Keep. Prefer the peer-reviewed ACL Anthology/ACM landing pages when available; label arXiv links as preprints if that is what is linked. |
| Line 242: “traffic that barely exists” | Only about seven reconstructable historical days were observed, with six unattributed requests. That supports “sparse in the observed week,” not a long-run traffic rate. | Say “before a clean window shows repeated traffic.” |
| Line 277: 30-day threshold | A 30-day window is supported by the later green-team synthesis, while the original edge artifact proposed seven daily slices. Cloudflare retention requires daily capture; one 30-day query cannot be run later. The draft omits the pre-declared numeric triggers. | State daily snapshots and the proposed triggers: at least one unexplained request/day over the clean month, the same material client at least three times, or a declared intervention needing request traces. |
| Frontmatter `seoTitle`: “What Works” | The article proves current consumption mechanisms and representation-size differences, not end-to-end task benefit or organic visibility. | Consider “llms.txt and GEO: What Is Used and How to Test It” or define “works” immediately as bounded known-site consumption. |

## Source-discipline defects in the current glossary

These are required even after the prose corrections:

1. **Add current implementation citations.** The ADR explains the original model but does not prove the present beacon, classification, `ai_fetches` query, or Worker-first routing. Add pinned links for `page.ts`, `analytics/src/index.ts`, `classify.ts`, `stats.ts`, and `wrangler.jsonc` at `464c89d...`.
2. **Add a dated edge-evidence source.** The three/three/zero/zero result and `sampleInterval: 1` are first-party aggregate findings. Publish or link the saved methodology/result artifact at a pinned commit; otherwise readers cannot inspect the article's most original empirical claim.
3. **Add the local reproduction source.** The `mcpdoc` calls, dependency failure, bytes, tokens, tokenizer, tested slug, and date need a public/pinned method or companion data artifact.
4. **Add Streamlit.** The body uses the fallback but the glossary has no Streamlit row. Cite current vendored source at `cd03ef10...`, not just the archived meta-skill repository.
5. **Add Vercel.** The body names Vercel but the glossary cites only Cloudflare. Use [Vercel's February 3, 2026 implementation](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation) or its [January 13 docs changelog](https://vercel.com/changelog/docs-pages-support-markdown-responses).
6. **Correct the Cloudflare date.** “Markdown for Agents” was last updated **2026-07-13**, not June. [Official documentation](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/).
7. **Correct the Google date.** The current guide was last updated **2026-07-10**; “accessed Aug 2026” may be retained separately.
8. **Add Google's Generative AI report if line 232 remains.** Its documented fields differ from Bing's citation/query fields.
9. **Remove the unused Ahrefs row or use it in the body with its full boundary.** The current body never makes the 97%-of-valid-files claim. An unused dramatic statistic in the source table distracts from the first-party article.
10. **Pin the Answer.AI proposal.** The body depends on an August 2026 proposal that can change. Add the audited `a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2` repository link beside the live proposal.
11. **Name evidence state for client examples.** Google/tldraw/Streamlit are code-inspected instructions; Prismatic is code-inspected with evals configured but no published outcome; `mcpdoc` is code-inspected and directly reproduced; the Checkly client test is first-hand reported, frozen to named February versions. They should not all read as equivalent adoption evidence.

## Claims that pass as written or need only the qualifications above

| Claim | Evidence state | Audit result |
|---|---|---|
| The March ADR recorded 11 views, 4 visitors, 0 referrers, and one post, and described discovery → consumption → measurement. | Pinned first-party ADR | Pass, with chronology framing noted above. |
| The browser beacon posts `/api/event`; the Worker classifies that POST; D1 rows with `visitor_type = 2` become `ai_fetches`. | Current code-inspected | Pass. |
| Direct `llms*` and root `.md` static assets bypass the Worker because only `/api/*` is Worker-first. | Current code-inspected plus Cloudflare routing audit | Pass. |
| The seven displayed provider identifiers produce the classifications shown in the table. | Current regex tested against current first-party provider identifiers | Pass. Keep “presented client” because user agents are claims, not authenticated identities. |
| Historical edge totals were 3 `/llms.txt`, 3 page Markdown, 0 full dump, and 0 named provider user agents. | First-party aggregate; `sampleInterval: 1`; unattributed | Pass after correcting the two-sequence wording. |
| Google Search ignores `llms.txt`, while maintained Gemini skills use an index-to-page fallback for developer docs. | Current official guidance plus pinned first-party skill code | Pass; these are different products and jobs. |
| Prismatic specifies index → targeted `.md`; tldraw specifies cached full-dump grep; Streamlit retains a full-dump fallback. | Pinned/current maintainer instructions | Pass after adding source/evidence-state qualifications. |
| `mcpdoc` returned the blog index and page Markdown and refused an off-origin URL in the dated reproduction. | Code-inspected and directly reproduced | Pass. It proves tool transport/retrieval, not model task value. |
| Three of seven tested February 2026 coding-agent fetchers requested/preferred Markdown; four did not in that snapshot. | First-hand reported protocol test with versions | Pass as a frozen snapshot, not a current market-share claim. |
| The two local representations differed by 67.8% under `cl100k_base`. | Directly reproduced, one post | Pass as a representation measurement, not a task result. |
| V2 proposes `alternate` Markdown and `describedby` index relations; no consuming client was found in the inspected set. | Proposed; negative code search | Pass with scope. |
| The 2024 GEO benchmark begins after candidate retrieval; the Perplexity test uses supplied files; 2026 studies strengthen the post-retrieval boundary. | Primary papers, peer-reviewed where stated | Pass after adding the 200-query Perplexity detail. |
| The task benchmark and clean request window have not produced results. | First-party plan artifacts | Pass. Preserve this explicit incompleteness.

## Terminology to keep consistent

| Avoid | Use |
|---|---|
| AI read / AI fetch for the D1 metric | browser analytics event whose beacon user agent matched the AI regex |
| request log for GraphQL adaptive groups | edge request aggregate or edge request snapshot |
| a request proves retrieval | a request is an attempt; a successful response shows server delivery |
| verified AI provider from user agent alone | request presenting a provider user agent |
| MCP client (`mcpdoc`) | MCP server or documentation adapter |
| linked-page allowlist (`mcpdoc`) | allowed-origin check plus model instruction to follow index links |
| registered benchmark | draft protocol, until final conditions and thresholds are frozen |
| Google/Search Console citation queries | Google page/impression visibility; Bing citations and grounding queries |
| universal-agent HTML | baseline web representation and agent fallback |
| validated v2 relations | proposal-conforming relations; client value unvalidated |

## Minimum correction set

The draft becomes factually publishable when it does all of the following:

1. replaces “server request log,” “request proves retrieval,” and “MCP client” with the correct event/interface terms;
2. fixes the three-requests/two-sequences count;
3. narrows the `mcpdoc` reproduction and dependency claim;
4. changes “registered” to “drafted,” or freezes a single final protocol and thresholds before publication;
5. separates Bing citation/query telemetry from Google's page/impression telemetry;
6. adds the missing current-code, edge-data, Streamlit, Vercel, and reproduction citations; and
7. corrects the Cloudflare and Google source dates.

After those changes, the article can honestly make its strongest claim: the shipped files have bounded, inspectable known-site uses, but neither the current analytics nor the available evidence shows that they created organic discovery, citation, or readership for this blog.
