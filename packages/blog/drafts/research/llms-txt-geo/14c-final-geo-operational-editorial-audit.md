# Final GEO operational and authenticity audit

**Draft reviewed:** `packages/blog/drafts/019-does-llms-txt-work.md`  
**Review date:** 2026-08-25  
**Lens:** skeptical technical publisher, cold reader, and authenticity editor  
**Article edits:** none  
**Verdict:** **conditional pass after one P0 release gate and three P1 editorial changes**

## Short verdict

The GEO complement is genuinely useful and unusually well bounded. It gives a publisher real instruments, explains their blind spots, names answer volatility, rejects manufactured mentions, and never promises that a formatting tactic creates citations or traffic. The practical center remains honest: publish first-party engineering evidence, keep the canonical page eligible and connected, then measure the event that matters.

The section is currently too large for the article that earned it. From `## What GEO covers beyond llms.txt` through the sentence before `## The smaller job each artifact earned`, it contains roughly **1,514 words and 22 external links**—about **27% of the 5,655-word article**. It repeats the same event separation in the eight-stage table, provider-evidence table, five-part production pipeline, research distinctions, established/emerging/speculative lists, and seven-step workflow.

That density does not make the article fake, but it makes the author's live failure disappear behind a frontier survey for too long. A cold reader can feel the article trying to prove that it has covered GEO rather than hearing Goga decide what he will do. The fix is not more research. Cut the complement to its operational core and end it with the blog's actual choice.

## Gate summary

| Gate | Result | Finding |
|---|---|---|
| Useful to a technical publisher | **Pass** | The evidence-surface table and workflow distinguish provider impressions, citations, prompt samples, requests, and referrals. |
| Operational rather than conceptual | **Pass with P1** | The workflow is executable, but it needs a blog-specific stopping decision rather than an implied ongoing monitoring program. |
| GEO evidence bounded by stage | **Pass with one P1 wording correction** | Fixed/supplied retrieval, provider-specific telemetry, preprints, and bundled production interventions are labeled correctly. One traffic bullet conflates citation visibility with answer-surface click substitution. |
| Non-farming | **Pass** | It rejects guessed machine phrases, query-variant page farms, citation spells, universal schemas, and screenshot ranks. |
| Authentic to Goga's stated values | **Pass with P1** | The conclusions fit the builder's journal; the long paper parade temporarily shifts the voice from builder deciding under uncertainty to analyst demonstrating coverage. |
| Repetition | **Fail at P1** | The event model is explained five or six times in adjacent forms. |
| Proportion and pace | **Fail at P1** | A 1,514-word complement inside a 5,655-word `llms.txt` investigation is too large and delays the smaller-job decision. |
| Traffic-facing metadata | **Partial at P1** | `llms.txt and GEO: What Works and How to Test It` can promise a general GEO testing guide broader than the article's demonstrated experiment. |
| Public evidence links | **Fail at P0 until release** | Two `main`-branch companion-artifact links still target locally untracked files. |

## What is already right

### The complement does not farm engagement

The section explicitly refuses the common bad incentives:

- no page per guessed fan-out query;
- no special schema or Markdown claim for Google visibility;
- no claim that one screenshot represents a rank;
- no collapse of request, citation, answer influence, referral, and outcome;
- no claim that Pinterest's bundled production intervention transfers to a personal blog;
- no promise that publisher-side rewrites recover clicks lost to answer surfaces;
- no recommendation to manufacture third-party mentions;
- no fake precision around prompt monitoring.

This is the strongest authenticity result. Do not soften it to sound more optimistic.

### The operational table earns its place

Lines 237–247 are the cleanest bridge from the `llms.txt` measurement failure into wider GEO practice. The table tells a publisher exactly what each surface can establish and what it cannot. It should survive the cut.

### The volatility evidence changes the workflow

Lines 291–293 turn repeated runs from a vendor ritual into a methodological requirement. “One screenshot is not a rank” is concise, useful, and supported by a peer-reviewed live audit. Keep it.

### Product/local/feed examples are properly scoped

Lines 271–273 show that operational GEO can be data and product architecture rather than prose. The Pinterest result is immediately bounded as a bundled intervention at Pinterest scale. This widens the reader's model without telling a personal blogger to copy merchant infrastructure.

### The section returns to the article's real thesis

Line 333 correctly brings the frontier back to the blog: `llms.txt` can support navigation after entry; it cannot create the reason for entry. That sentence belongs in the final compact version.

## P0 — release blocker

### Make the two companion research links resolvable

The evidence ledger still points to future GitHub `main` URLs for:

- `packages/blog/drafts/research/llms-txt-geo/06-edge-baseline-2026-08-24.md`
- `packages/blog/drafts/research/llms-txt-geo/08a-green-team-client-evidence.md`

Both files remain untracked locally. At publication, either commit them in the same reachable release, replace the URLs with stable public artifacts, or remove the external-facing links. These are not decorative references: they back the first-party edge observation and MCP reproduction.

**Pass condition:** request both public URLs after the release commit is reachable and require HTTP 200 responses.

## P1 — compress the GEO complement around decisions

### Current problem

The section explains the event pipeline repeatedly:

1. the eight-stage table at lines 155–168;
2. the provider-evidence table at lines 239–245;
3. the GEO taxonomy and survey pipeline at lines 249–259;
4. the five-stage production pipeline at lines 265–269;
5. the retrieval/citation/absorption research sequence at lines 277–293;
6. the established/emerging/unproven lists at lines 295–321;
7. the practical workflow at lines 323–331.

Each representation is defensible in isolation. Together they make the reader learn the same distinction several times and postpone the personal decision.

### Required edit

Reduce lines 249–333 from roughly 1,514 words to **about 800–950 words**. This is an editorial range, not a search target. Preserve the evidence boundaries and remove repeated teaching.

Recommended shape:

1. **Two-paragraph definition and boundary**
   - `llms.txt` is one navigation input; GEO spans selection, use, attribution, and outcomes.
   - Say the labels matter less than the event. Cross-reference the existing eight-stage table instead of restating the survey's complete pipeline.

2. **Three production paths, in prose or one compact table**
   - ordinary crawl/index eligibility for search-backed systems;
   - supported feeds/profiles for product, local, image, or video facts;
   - corpus/product architecture such as Pinterest, explicitly non-transferable as a recipe.

3. **One bounded research paragraph**
   - keep the original GEO supplied-retrieval limitation;
   - summarize the 2026 papers as one conclusion: document/topic effects remain conditional, engine-specific, competitive, and mostly tested after candidate selection;
   - keep citation absorption as the useful new outcome term.

4. **Keep the volatility paragraph**
   - retain the repeated-run result and “One screenshot is not a rank.”

5. **Keep a shortened operational workflow**
   - real reader question;
   - original first-party evidence;
   - eligible, connected canonical page and applicable supported data paths;
   - frozen prompt/sample contract with repeated runs and raw outputs;
   - provider/referral/outcome measurements kept separate.

6. **End with the blog's actual decision**
   - state what Goga will do now and what he will not build yet.

The entire `### What is established, emerging, and still speculative` block at lines 295–321 can be deleted or collapsed into three sentences. Its strongest points already appear in the stage table, evidence-surface table, research paragraphs, and workflow.

### Preserve during the cut

- the distinction between fixed/supplied retrieval and organic selection;
- provider-specific measurement definitions;
- the Pinterest bundle qualification;
- answer and source volatility;
- no citation-equals-traffic inference;
- no generic schema/format/mention recipe;
- the return to this blog's first-party evidence.

## P1 — state the blog's no-investment decision

The workflow currently tells teams how to establish a query set and repeat it across paraphrases, engines, and clean sessions. That is operational, but for a blog with little traffic it can quietly become a new growth dashboard—the same instinct that produced the misleading `ai_fetches` number.

Add one first-person decision after the compact workflow. The substance should be:

- I am not building or buying an ongoing GEO visibility dashboard for this blog now.
- I will use the provider-native reports if the property has enough data, preserve attributable referrals, and run a small frozen prompt panel only for a declared test whose result changes a decision.
- I will invest further when repeated signal or reader contact makes manual evidence the bottleneck.

This is the green-team adaptation the article needs. It turns the operational framework into a flexible choice rather than another optimization obligation. It also reconnects the GEO complement to the article's status-costing confession: the desire for evidence can generate instrumentation that looks more meaningful than it is.

Do not invent a universal prompt count or monitoring cadence. The decision rule is the useful part.

## P1 — correct the one traffic-facing conflation

Line 321 currently says it is unproven “that citation visibility produces publisher traffic” and then says field evidence points in the opposite direction for some answer surfaces.

Those are adjacent but different claims:

- the cited studies can show that some generative answer surfaces reduce or substitute for publisher clicks under their designs;
- they do not show that **citation visibility itself** caused the reduction;
- a cited source can receive zero, some, or unobserved visits, depending on the interface and attribution path.

Rewrite the bullet so it separates them. For example in substance:

> A citation does not imply publisher traffic. Separate field studies find that some generated-answer surfaces reduce clicks, but they do not isolate a publisher-side citation tactic or remedy.

This retains the uncomfortable result without turning an answer-surface effect into a citation effect.

Also tighten line 300's “semantic relevance and original evidence are more durable” under `Established enough to operate on`. Semantic relevance is inherent to selection, and original evidence is a defensible editorial investment, but the article has not established original evidence as a durable organic-citation lever. Prefer “original evidence is the most defensible content investment” over a comparative performance claim.

## P1 — narrow the search-facing promise

The current SEO title is:

> `llms.txt and GEO: What Works and How to Test It`

It is concise, but “how to test GEO” is broader than the completed first-party experiment. The article demonstrates how to test `llms.txt` delivery, requests, representation, and future tasks; its general GEO workflow is a measurement framework, not a run GEO field experiment.

Choose a title that keeps GEO as evidence/context rather than promising a universal GEO test. Honest options include:

- `Does llms.txt Work? Live Data and GEO Evidence`
- `llms.txt: What Works, What Doesn't, and How to Test It`

The second is the closer match to the article's practical query intent. The H1 can remain unchanged. Whatever title is chosen, the first visible phrase should still name `llms.txt`, and the description can retain the GEO evidence promise because the article genuinely supplies it.

## Protected center: do not change

The following material carries the article and should not be sacrificed to preserve the expanded survey:

- the immediate opening verdict;
- the site-type decision table;
- “I built `llms.txt` for a blog nobody read”;
- the code path showing the browser beacon could not observe direct requests;
- the grouped edge snapshot that mostly found the investigation;
- the eight-stage “works” table;
- “Google Search ignores it. A Google agent uses it.”;
- the bounded MCP reproduction;
- the page-Markdown representation result and task-result qualifier;
- the staged `llms.txt` testing procedure;
- the provider-evidence table;
- the smaller-job artifact table;
- “I still want readers.”

If space or attention is limited, cut frontier coverage before any of those sections.

## Final publish judgment

This is not an engagement-farming article. It does not pretend indifference to traffic, and it does not convert that desire into unsupported tactics. The new GEO material is evidence-rich, operational, and skeptical enough to be trusted.

Its only authenticity failure is temporary over-completeness: the author disappears behind 22 links and a sequence of taxonomies. Compress the complement, correct the citation/traffic wording, and state the blog's actual no-investment decision. Then the research will serve the lived investigation instead of competing with it.

**Final gate:** **do not publish with broken companion links. After P0, pass once the GEO complement is compressed and ends with Goga's real present-tense decision.**
