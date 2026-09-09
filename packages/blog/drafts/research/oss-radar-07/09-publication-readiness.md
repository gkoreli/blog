# OSS Radar #07 publication readiness — earlier assessment

**Historical checkpoint.** The desktop continuation supersedes the open layout, failure-handling, and local trace/export work below. See [the current candidate review](11-publication-candidate-review.md) for completed checks and the remaining one-answer access gate. The original assessment is retained to show what changed.

Reviewed September 8, 2026 against blog commit `dabd081506de2e0a8dba6778b4e43c0bb83d5c13`.

**Decision: the article is still an unpublished working draft.** It has a defensible result about an installed Promptfoo adapter and a tested capture repair. The reader-facing sources and glossary are now present. The broader workload still lacks a captured real answer, and the manuscript has not gone through the publication layout and rendered checks.

## The publication pattern checked

I read the actual source of [OSS Radar #05, Bun 1.4](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/posts/021-oss-radar-05-bun-1-4.ts) and [OSS Radar #06, interp-engine](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/packages/blog/posts/022-oss-radar-06-interp-engine.ts), including their introductions, mechanisms, owned-workload results, adoption decisions, source entries, and research records.

Both use immersive TypeScript publication modules with metadata, a hero, exact comparison tables, a bounded adoption verdict, and the shared `Sources` component. Each material source carries a claim and a short reason it matters. Both publish research-footprint records backed by manifests. Their appendix is called **Sources & Evidence**, not literally **Glossary**. The [blog-writing rule](https://github.com/gkoreli/blog/blob/dabd081506de2e0a8dba6778b4e43c0bb83d5c13/.agents/skills/blog-writing/SKILL.md#glossary-section) separately requires a dated glossary table for externally supported claims.

The mistake in #07 was treating inline citations and an internal evidence ledger as sufficient reader-facing references. The initial manuscript also began with an editorial status note instead of its finding. Those omissions were in the draft, even though the research files existed.

## Changes made in this pass

| Publication requirement | Current #07 state |
|---|---|
| Significance first, findings next | The lead now states the retention result, synthetic input, and bounded verdict; the editorial status note lives in the worklist |
| Explain what Promptfoo is and where it is going | Dedicated section retained: evaluation, red teaming, code scanning, August releases, OpenAI affiliation, and the stated Frontier plan |
| Show the mechanism and a working repair | Added the return object from the tested capture provider, with a direct link to the runnable implementation |
| Present observations with units and exclusions | Existing three-path retention table retained; full cache and custom-summary records now linked directly |
| Make attribution distinctions easy to scan | Added a four-row table for run trigger, request identity, answer citation, and source support |
| Publish material references with a reason | Added 32 deduplicated entries in **Sources & Evidence**, with dates and a short reason each source matters |
| Provide a dated glossary | Added 10 terms in the house table format |
| Preserve shaping prompts | Appended the latest publication-readiness question verbatim as prompt eight; the first seven entries remain unchanged |
| Expose the research without inventing metrics | Added a research-record paragraph linking the worklist and prompts; no token or hands-on-time total is claimed |

The manuscript uses pinned links for Promptfoo code and our recorded experiment artifacts. The worklist and prompts links intentionally follow `main` because they are navigation to continuing work, not frozen experimental evidence. No published post, shared component, experiment output, or measured result changed.

## What the existing experiment earns

The installed 0.122.2 run is real software execution using invented model-response bytes. It establishes the adapter omission, the retained transport-cache data, and the successful custom-provider summary export for that fixture. It is enough to publish a carefully scoped adapter review after the publication pass. It does not establish that the live provider returns this exact shape, that the capture provider handles failures, or that the blog receives AI citations.

The stronger review Goga selected should include a real-answer capture before making a workload adoption claim. The smallest useful next result is a bounded preflight: retain an actual request and raw answer, inspect its available source and citation fields, pass that same captured response through the evaluated path, and compare the exported records. Record model/route settings, time, missing fields, and billable usage with its source. A no-citation answer is a valid result; a fixture must not be substituted and described as a live answer.

Failure and retry records can first be exercised with controlled local responses. Test the trace or exporter that the adoption verdict actually relies on. The programmatic summary check does not verify CLI export, tracing, or database persistence.

The proposed larger study in [03-experiment-plan.md](03-experiment-plan.md) is separate. Its question set, repeated runs, citation-frequency measures, and possible Cloudflare comparisons are useful follow-up work. Completion of all 72 planned calls is **not** a blanket publication requirement for this narrow Radar review. A production analytics deployment and a positive citation result are not publication requirements either. Keep the original solve/Radar/engineering objective open until there is new operating evidence for the engineering continuation.

## Remaining publication work

| Work | Why it matters | State |
|---|---|---|
| Finish the bounded real-answer capture and the failure handling needed for it | Turns the tested interface into an observed example of the selected workload | Open; no live call or API charge in this pass |
| Put the approved scope into the established publication module | The current Markdown manuscript has no immersive hero, final publication metadata, or rendered source cards | Open |
| Verify the final render and discovery routes | Check one H1, readable tables on narrow screens, source links, Markdown representation, and the matching prompts page | Open; no build or visual pass claimed |
| Refresh time-sensitive claims at release | A later issue fix or release can change the adapter and telemetry verdict | Open for publication; issue #9968 was rechecked open on September 8 |
| Read the final article as one argument | Remove repeated findings and keep the last narrative section to one adoption decision | Open for the final publication version |

Use the existing components: `OssRadarHero`, `CompareTable`, and `Sources`. Keep a dated glossary as reference backmatter. Add another diagram or interactive widget only if it explains something that the code and tables do not. The present tables and runnable artifact already provide material beyond prose.

Metadata prepared for the publication pass:

| Field | Proposed value |
|---|---|
| Title | OSS Radar #07: Can Promptfoo Preserve the Evidence Behind an AI Answer? |
| SEO title | Promptfoo Review: Preserving AI Citation Evidence |
| Description | Promptfoo's OpenRouter summary omitted citation fields in our fixture. A custom provider retained them. A review of the design and its limits. |
| Slug | `oss-radar-07-promptfoo` |
| Section / layout | `oss-radar` / `immersive` |
| Tags | `oss-radar`, `promptfoo`, `ai-evaluation`, `analytics` |
| Publication date | Set on actual publication |
| Read time | Compute from rendered title and body through the final decision at 200 words per minute; exclude references |
| Prompts | Move `oss-radar-07.prompts.md` to match the final slug and verify the normal prompts route |

Research-footprint statistics are optional provenance. Do not copy numbers from #05/#06, infer session totals from timestamps, or delay a truthful narrow article to invent missing accounting. If trustworthy session logs become available, use the repository's existing accounting script and freeze the manifest; otherwise retain the honest research-record disclosure.

## Verification for this revision

The source appendix was checked against material body links, and the glossary references the same evidence. Dates on the external standards and studies were checked against their original pages. The current upstream issue state was read through GitHub. The code excerpt was compared to the committed probe, and the result-table values were checked against the saved JSON. Prompt capture, Markdown table widths, pinned artifact paths, and the set of changed repository files were checked before commit.

This is a manuscript and worklist revision. No new experiment, rendered-site review, production measurement, or publication is claimed.
