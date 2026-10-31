# What survived the backlink checklist trials

October 31, 2026 UTC. This investigation replaces the earlier private summary with executed trials and usable contributions. It is a research record, not a published article or a growth result. [Scope and acceptance](00-worklist.md).

The useful lesson is to find a source with a specific missing contribution, supply the evidence and usable change, and record what happens. A long list of backlink tactics does not establish which ones cause discovery. For this publication, the trials yielded a tested benchmark contribution, a correction for a stale reproduction, an offline reference inspector and two justified decisions to make no change.

| Tactic | Executed work | Decision |
| --- | --- | --- |
| Qualify source opportunities | Retrieved five previously identified source URLs; inspected four successful HTML responses and their surrounding text | Keep Web Pulse for correction; keep the benchmark repository for a missing workload. Arcjet already explains the limitation; drop a redundant pitch. EdgeComet returned 403; leave unassessed. |
| Give a useful contribution first | Added a static/generated validator pair and independent count test; ran the upstream Node harness and four Bun variants | A reviewable code contribution exists. Submit only as a workload/compatibility contribution, with its negative control. |
| Correct decaying facts | Compared a current Web Pulse reproduction with the October 29 source correction and primary replay evidence | Three exact replacements and a cover message are ready. Existing attribution needs no new-link request. |
| Keep reference destinations stable | Rendered all 27 current Markdown articles and audited local evidence destinations | No confirmed repair: one same-site fragment resolves; 64 links point to 48 existing owned `main` evidence paths. Keep the URL; do not invent maintenance work. |
| Count actual references | Built and tested an offline HTML inspector; applied it to four captured responses | Three pages link directly; Vuink contains a wrapper whose redirect was not checked. Repeated anchors are not separate sources. |
| Mine actual AI-answer sources | Froze three prompts; submitted the first in Perplexity Search | A sign-up gate prevented an answer. Other prompts unsubmitted. No AI-citation measurement or source ranking follows. |

## What the discussion and implementation changed

The [original post](https://x.com/borjafat/status/2116164330014007296) promotes Distribb. Its [linked longer article](https://x.com/borjafat/status/2115050945746739607) also emphasizes concrete reader questions, existing-page improvements, inspectable original work and repeated source observations. Those are useful practices, but the post supplies no controlled attribution study for its tactic tiers. Even the exchange tier changes between the short and long versions; treat the tiers as the author's judgments.

I read 59 distinct loaded reply/follow-up statuses in X's Relevant view: 56 with text and three GIF-only. This is a partial sample, not the complete discussion. Parent relationships were not recoverable reliably. Raw normalized capture and the extraction manifest are retained privately; [public protocol and coverage](method-and-coverage.json) preserve the boundaries. The following links identify the decision-bearing observations:

- A reader [asks whether the tool handles outreach and prospect matching](https://x.com/thenowhereway/status/2116404085125685392); the author [says it handles everything](https://x.com/borjafat/status/2116484094951338026). Source inspection reveals narrower, distinct mechanisms.
- The author [reports close to $70k](https://x.com/borjafat/status/2116206800961667124). The visible reply does not define a measurement window or isolate revenue caused by links. His [attribution explanation](https://x.com/borjafat/status/2116188920497209698) relies on this being his only effort; that is not a counterfactual test.
- A reader [asks how editors, networks and tools are found](https://x.com/beingsupm/status/2116407500484550772). No answer appeared in this sample. Repeated bot commands and endorsements do not fill that implementation gap.
- A reader [raises the stable research URL problem](https://x.com/AndriusLen/status/2116297044662866197). That prompted the actual destination audit above.
- A [large citation count claimed without backlinks](https://x.com/rknkrishna/status/2116511107003433323) is an unverified counter-anecdote, not proof that links have no value.

I inspected the public skill at `01bbede516a8963bff5731bbda412f0e2a364188`, including [link-building](https://github.com/Bomx/distribb-skill/blob/01bbede516a8963bff5731bbda412f0e2a364188/commands/link-building.md), its [playbooks](https://github.com/Bomx/distribb-skill/blob/01bbede516a8963bff5731bbda412f0e2a364188/references/link-building-playbooks.md), [outreach](https://github.com/Bomx/distribb-skill/blob/01bbede516a8963bff5731bbda412f0e2a364188/commands/link-outreach.md), [AI visibility](https://github.com/Bomx/distribb-skill/blob/01bbede516a8963bff5731bbda412f0e2a364188/commands/ai-visibility.md) and [CLI](https://github.com/Bomx/distribb-skill/blob/01bbede516a8963bff5731bbda412f0e2a364188/distribb_cli.py). The general campaign workflow produces a researched draft plus an asset. Managed outreach is a distinct paid workflow; the CLI lists its prepared prospects and replies to them, rather than exposing an arbitrary cold-email sender. I did not install the skill, call paid APIs or audit its private backend.

The code also exposes an evidence trap: a WebSearch/WebFetch source pool and an actual AI-answer citation are different observations, even where a workflow groups AI and SERP citations together. Our proposed answer-source trial stopped at its availability gate, so the benchmark prospect below is source-qualified research, not a newly observed Perplexity citation.

## The code contribution survived a negative control

The inspected [js-compiled tree](https://github.com/jlucaso1/js-compiled/tree/418fda419afcb6dad58e1bc85f3ccbb7911c99ed) had 22 fixtures and no generated-validator pair. A reader deciding whether AOT can replace a service rewrite needs this kind of compatibility workload; another arithmetic loop would add little.

The [ready contribution](contributions/js-compiled-contribution.md) contains two dependency-free fixtures, an independent count test, a patch and a portable measurement script. Each fixture performs ten million checks over identical valid/invalid rows with a changing input. Both accept the same runtime threshold. All four compiled variants matched independent expected counts for thresholds 0, 18, 29 and 61: 4,000,000; 2,550,000; 1,275,000; and 0.

First I tried a literal generated function body with a constant threshold. It did **not** reproduce a slowdown. I retained it, then froze a separate runtime-configured condition in both fixtures before measuring that condition. The literal files remain in `contributions/controls/`; the new files assemble the runtime threshold into the generated source.

Original medians, milliseconds for the whole fresh process, five samples after one discarded process warmup per variant:

| Condition | Static JIT | Static AOT | Generated JIT | Generated AOT |
| --- | ---: | ---: | ---: | ---: |
| Literal control | 23.969 | 17.664 | 23.666 | 17.817 |
| Runtime threshold | 25.405 | 20.057 | 25.586 | 254.244 |

On this preview, runtime-generated AOT took **9.94 times as long as generated JIT**; static AOT was about 1.27 times faster than static JIT. The actionable distinction is whether a representative dependency constructs executable source from runtime configuration. A literal `new Function` toy does not establish that risk. This result motivates measuring the real dependency and request path before choosing AOT or a rewrite; it does not establish a specific validation library's behavior or isolate the compiler mechanism by itself.

Runtime: existing Bun AOT preview `1.4.4-canary.1+06888611e`, binary SHA-256 `6f3f644be027638c560bad1e728cfb0bf3cb7b2c40dca2acbdf03c757090c834`; macOS 27.0.1 arm64, Apple M5, 24 GB. Builds use `--compile --production --format=esm`, with `--aot` as the mode difference. Variant order rotates; startup is included, ambient OS load is uncontrolled. This is neither warmed server throughput nor a latest-release Bun claim. [Individual samples, source hashes and correctness receipts](validator-results.json).

Verification of the portable script rebuilt and remeasured both conditions. Runtime-generated AOT/JIT medians were 245.010/24.383 ms (10.05 times as long); the literal control was 17.413/22.618 ms (no slowdown). All 48 process outputs and all 16 additional runtime-input controls matched their oracles. These are subsequent local executions under the same method, not independent-machine replication. The patch also applied to an empty check repository and its tests passed from the proposed upstream paths.

The actual upstream harness separately passed both Node v24.14.1 rows with `status: ok`, matching output and medians 49.008/51.289 ms. Its method differs; do not compare those values against the Bun table. Initial strict-typing fixture errors were fixed before the four-mode comparison. An initial sandbox run could not read BSD clock information and recorded failed rows; only the subsequent permitted local run counts as the harness result. Other compiler runners remain untested.

## The correction is more useful than a link request

Fresh retrieval at 15:46 UTC found Web Pulse still reproducing three overbroad statements from the earlier fetcher article. The [ready correction sheet](contributions/web-pulse-correction.md) supplies exact replacements: identify the covered signature fields, distinguish sixteen requests from sixteen people, and separate trial attribution from authentication. It links the already completed primary replay; that replay was **not rerun** or newly discovered here. Vuink's excerpt also retains the older identity wording; its ingestion/contact mechanism remains unqualified, so it is a secondary accuracy prospect rather than a ready submission.

Arcjet's retrieved explanation already distinguishes the signature coverage in this study from SeatGeek's coverage. An unsolicited correction repeating that distinction has no demonstrated value. Drop it. Daily Artifact gives attributed distribution through a read-full-article link; that alone does not prove independent use of the technical evidence.

## What the reference inspector established

The [tool and usage](../../../scripts/inspect-reference-links.md) inspect saved bytes without executing HTML or following redirects. Six parsing controls cover qualifiers, nested anchor text, duplicate anchors, query preservation, wrappers, spoofed targets, hidden template/script content, relative URLs and unsafe URL schemes. [Acquisition provenance and exact parsed results](reference-results.json) allow later captures to be compared without committing third-party HTML.

The separate [stable-reference receipt](stable-reference-results.json) records every assessed fragment and owned evidence-path link, the source-state boundary, methods and exclusions. It establishes current local path existence, not current GitHub or production availability.

| Final source | Direct target anchors | Qualification and interpretation |
| --- | ---: | --- |
| [Arcjet](https://arcjet.com/learn/web-bot-auth) | 1 | `noopener noreferrer`; surrounding paragraph uses the technical distinction. Already earned before this investigation. |
| [Web Pulse](https://wpnews.pro/news/which-ai-fetchers-send-which-headers-measured-on-a-live-site) | 5 | Four `nofollow`, one unqualified source anchor; one reproduced page, not five independent sources. |
| [Daily Artifact](https://dailyartifact.ai/story/which-ai-fetchers-send-which-headers-measured-on-a-live-site-f12q?list=recent) | 1 | Unqualified read-full-article anchor. The old AI Today URL redirected here. |
| [Vuink](https://vuink.com/post/txberyv-d-dpbz/which-ai-fetchers-send-which-headers) | 0 | One embedded-target redirect wrapper; destination unverified. |

An unqualified anchor does not prove ranking credit; `nofollow` does not negate reader or agent value. These are retrieval-time observations of source HTML, not measurements of traffic, influence, editorial independence or later production behavior. EdgeComet's 403 was retained without a bypass.

## Keep, discard, and next action

Keep the two inspectable contributions and the reference ledger. Discard tier letters as evidence, arbitrary backlink-volume targets, duplicated anchors as distinct wins, unsupported revenue attribution, and SERP results masquerading as AI citations. Defer exchange, paid outreach and broad vendor adoption: these trials give no causal result for them.

The next bounded external action is to submit the benchmark patch for workload review and send the prepared Web Pulse correction. Neither was authorized or sent in this session. Record publisher response, merged/edited artifact and any resulting attribution separately. Traffic or AI-answer change would require a later, explicitly bounded measurement; no acquisition or discovery lift is claimed here.
