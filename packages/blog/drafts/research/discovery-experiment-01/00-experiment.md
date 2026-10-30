# Discovery experiment 01: an entry point into dated analytics work

October 30, 2026. Owner: [Analytics Worklist](../../../../../docs/folders/FLDR-0001.md). Direction: [ADR-0019](../../../../../docs/adr/0019-agentic-engineering-publication-and-analytics-ambition.md). This is one publication experiment and a first use of the reusable discovery workflow, not a new analytics census.

## Plan, declared before the intervention

**Reader question:** I found the first-party analytics build guide. Which implementation period does it describe, and where can I inspect the later measurement findings?

**Hypothesis:** a short dated continuation note near the opening can make the historical scope and the later investigation explicit without rewriting the August account. This tests availability and placement of guidance. Human comprehension and organic discovery require separate observations.

**Primary acceptance:** both generated article HTML and its direct Markdown representation contain, before the first substantive H2, an explicit August 26, 2026 scope statement and a contextual link naming the October measurement investigation. The destination must be the existing `/building-blog-analytics-what-the-numbers-can-prove` article (or its `.md` representation). Existing title, publication date, historical body, measurements, and frozen footprint counters remain intact. A series link elsewhere on the page does not satisfy this entry-point criterion.

**Intervention:** one opening continuation note on article 020, with the required modification date and exact shaping-prompt preservation. No title, description, classifier, reporting, exclusion, collection, or distribution change. The research-footprint scope will explicitly identify the existing frozen period; no new token cost is asserted.

**Baseline and candidate:** save source revision and SHA-256 commitments to exact live and isolated-build HTML/Markdown bytes, note text, and contextual-link placement. Capture a direct Markdown baseline and a prefetch-marked HTML baseline once each. Code eligibility excludes these requests; no D1 ingestion readback or population estimate is planned. Compare baseline/candidate outputs under the same local build conditions. Keep raw responses and logs outside Git.

**Immediate window and stop:** inspect the baseline, implement once, run relevant validation and an isolated build, inspect the two representations, publish after checks, and verify the served change. Record deployment evidence only to the extent actually obtained. Do not generate repeat traffic to make a growth result or repeatedly query reports. Stop if the note changes the historical meaning or cannot be delivered correctly.

**Follow-up window:** seven complete UTC days after verified publication for attributable feedback or reported use. Search presentation is a separate 28-day window after confirmed recrawl if page-filtered Search Console becomes available. No automatic monitoring is scheduled. No response or unavailable search data is not zero demand. A later checkpoint may retain, correct, or remove the note; it cannot establish causation from a small before/after sample.

## Question map and source selection

These are task hypotheses grounded in the existing articles and owner direction, not measured search volumes:

| Question | Existing answer | Evidence and limit |
| --- | --- | --- |
| How do I build first-party blog analytics on Workers and D1? | [Article 020](../../../posts/020-first-party-analytics-for-a-personal-blog.md) | August cutover architecture; dated implementation, not a current installation guarantee. |
| What headers do AI fetchers actually send? | [Article 023](../../../posts/023-which-ai-fetchers-send-which-headers.md) | September vendor observations and October signature correction; no universal client fingerprint. |
| What can the resulting traffic numbers tell me about readers? | [Article 030](../../../posts/030-building-blog-analytics-what-the-numbers-can-prove.md) | Later misleading-growth and measurement-history investigation; no verified human-growth estimate. |

Saved [article-reach research](../analytics-retrospective/100-readership-delta-and-source-concentration.md) gives a reason to inspect the analytics material, but its request totals do not establish question demand. No fresh SQL or public analytics-report fill is needed for this experiment.

## Reconnaissance and rejected lead

Before freezing this plan, a public web-search sample used `"ChatGPT-User" "Accept" "headers"`, `"website analytics" "AI agents" "human"`, and `"referrer spam" "without deleting"`. The returned pool included an old third-party copy of the fetcher study and other publishers. The tool combines results and exposes neither a fixed Google ranking nor a complete AI-answer denominator. This is qualitative reconnaissance, not an indexed/not-indexed verdict, visibility score, or pre/post search experiment. No factual claim from a third-party excerpt is adopted.

An initial truncated frontmatter preview suggested article 024 was absent from the series. Full-file inspection disproved it: its existing `series.order` is 4, below the footprint. No metadata repair was made. The skill must parse structured metadata completely before diagnosing missing coverage or links; a clipped preview is not absence evidence.

## Results and continuation

### Baseline and local result

[Local results](local-results.json) preserve the baseline source revision, frozen-plan hash, response hashes and individual checks. The two live baseline responses returned 200 at 16:37 UTC; neither opening met the declared scope-and-continuation criterion. The isolated baseline reproduced the Markdown bytes exactly. Its full HTML differed from production, so no full-document production parity is asserted. Local builds used no private environment file; the reason for the whole-document difference was not investigated.

After the one-note intervention, both isolated-build representations meet the criterion before the first H2. The original article body is byte-identical after removing the added paragraph. Existing title, description, publication date, numerical footprint counters and timestamp cutoff are unchanged. The previous prompt file remains an exact byte prefix, followed by the two complete material owner messages. The footprint scope now names the frozen period and excludes this experiment. The target article exists in the generated output.

This is **0 of 2 baseline representations → 2 of 2 candidate representations meeting a declared entry-point check**. It is not a reader-task success rate, search lift, AI citation rate, or causal comprehension result. The page already had series navigation to the later article; the improvement is explicit historical orientation and a contextual continuation near the opening, not first-ever reachability.

Markdown validation passes for all 22 Markdown posts. Both isolated production builds complete with 33 posts. The first baseline build stopped at the sandbox's tsx local-pipe restriction; the permitted retry passed. No application dependency changed. The skill validator initially lacked PyYAML in both available Python environments; its actual validator passed using a temporary uv environment with pinned PyYAML 6.0.2.

The local browser preview shows the note at desktop width 1280 and mobile width 390, with document scroll width equal to viewport width in both cases. The contextual link opens the intended retrospective. An initial Playwright click left the URL unchanged; after inspecting the actual link and current accessibility tree, the native browser link action navigated successfully. This is a tool-action distinction, not evidence of a broken site link or human task performance. The temporary tab was closed and viewport override reset after inspection.

The owned loopback preview server was stopped. Documentation checks cover six instruction/evidence documents, 29 local links and balanced code fences; `AGENTS.md` remains within its size contract. The private pre-publication archive is `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-10-30-discovery-experiment-01`: 18 frozen files, manifest SHA-256 `a808c4c37391d97299b9ffa9f0b2c3a3a55f903ac1f6a74fc870d37847a70b89`. It retains the plan, assessor, baseline/candidate inputs and local logs. Neither the archive nor its hashes independently authenticate a provider or prove audience outcomes.

### Skill iteration

The new [run-discovery-experiment skill](../../../../../.agents/skills/run-discovery-experiment/SKILL.md) owns the reusable procedure; its linked record template keeps dated evidence here. This run added the full-metadata check after the disproved series lead. It also makes merged search reconnaissance, known-URL retrieval, delivered navigation, AI-answer trials, human understanding and adoption distinct outcome layers. There were no controlled AI-answer trials, human-reader trials, external messages, account-access changes or production SQL statements.

### Publication and next decision

[Publication results](publication-results.json) accept source `4d2c475af236088e7cfe32b0ec0c9f0accb2bce2`, whose Workers build `c29536f3-9472-48b3-b50a-99802cdecae1` reports success at 16:42:33 UTC. A separate deployment-list observation, sorted by `created_on`, shows version `ea1eaa74-97a6-4b16-b651-d571a5b0134f` at 100%. The list was not newest-first. Neither source-to-Worker nor per-request version linkage was measured; the build result, allocation observation and served artifacts retain separate scopes.

One prefetch-marked HTML GET and one direct Markdown GET at 16:43 UTC both return 200 and meet the declared entry-point criterion. The Markdown matches all 27,120 checked bytes, SHA-256 `58c658c50479e8a50fa9c5f203eaca249148771c8b9be19694e84cf803654f09`. Whole HTML differs from the isolated build, as it did at baseline; the opening guidance and destination are accepted, not full-document parity or production browser layout. One HEAD confirms the continuation destination returns 200. Native eligibility controls exclude the planned GET forms, and HEAD is ineligible by method; no ingestion readback or D1 query was made.

**Decision: retain the delivered note.** The immediate delivery experiment is complete. Whether it helps readers or discovery remains unmeasured. The first feedback window is October 31 through November 6 UTC, end-exclusive November 7, covering seven complete days after verified publication. At a later requested review, inspect specific feedback, reports of use or attributable continuation evidence if available and choose retain, correct/remove, or a different experiment. Quiet traffic alone is not a failure criterion. Search comparison remains a separate 28-day window after confirmed recrawl and authorized page/query data; that clock has not started. No automatic follow-up is scheduled.

The private archive now retains 26 evidence files without replacing the frozen baseline; final manifest SHA-256 `7db50808e6573f00431af583d56a6ee6d539da5b1ed20dec0bdfcd2a6e983d9d`. This closes the publication receipt. Subsequent bookkeeping commits do not alter the accepted article bytes.
