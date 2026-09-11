# OSS Radar #07 research footprint

Recovered September 10, 2026 PDT / September 11 UTC, after the article's first release. This is a **measured portion of the research**, not a total for everything that produced the article. The original ChatGPT research has no recovered token-usage log. The long analytics conversation that handled publication also contains unrelated work and is excluded. The [frozen manifest](research-footprint.json) records the included sessions, exact usage boundaries, token breakdown, and private-log commitments.

The measured sessions cover the dedicated desktop investigation, experiments, source review, article preparation, canvas design, automatic action reviews, publication checks, sharing copy, and footprint tooling. Input includes repeated context and cached input. Token volume is provenance, not evidence of article quality, exclusive writing cost, API spend, energy use, or human hands-on time. The invented usage values in the Promptfoo fixtures are not used in this accounting.

## How the sessions were attributed

The [desktop takeover record](10-takeover-and-evidence-review.md) explicitly identifies root `01a08387-f5af-74e2-9141-095760c9aba3`. Its opening task matches the takeover request preserved as prompt nine. The canvas worker has an explicit `source.subagent.thread_spawn.parent_thread_id` relationship to that root. The existing extractor discovers its complete recursive descendant closure.

Three automatic review sessions use `source: {"subagent":{"other":"guardian"}}` and have no recorded parent. We checked the specific action submitted for review, not just copied conversation context or a nearby timestamp. These reviews concern this article's capture experiment, source audit, isolated build, and canvas checks. Their IDs must be passed as explicit roots; no parent is invented.

The three September 10 publication/accounting workers have explicit parent links to the longer analytics conversation. Their actual assigned work is specific to this article, so their subtrees are included as explicit additional roots while that mixed-purpose parent is excluded. The parser's overlap check prevents counting the same session through two selected roots.

| Included session | Contribution and ownership evidence |
|---|---|
| `01a08387-f5af-74e2-9141-095760c9aba3` | Dedicated desktop takeover, experiments, source review, article module, export repair, and browser review; named in artifact 10 and matched to the takeover prompt. |
| `01a083c1-cdd9-7763-a191-1e743a2d04d1` | `/root/radar07_canvas`; explicit child of the desktop root, implements the article's canvas and phone revision. |
| `01a0838b-3722-7810-b09d-a07cd1122387` | Guardian review inputs at lines 7, 19, 30, 52, 63, 74, 85, and 151 identify the Radar runtime installation, capture probe, source audit, and preview publication module. |
| `01a083a5-ef27-7bc3-9af2-b696fb1a6956` | Guardian review inputs at lines 22, 55, 66, 99, 121, and 132 identify the isolated Radar preview build and canvas/phone checks. |
| `01a083df-24cc-7183-b082-83fec3a7e580` | Guardian review inputs at lines 23, 45, 56, 67, 78, and 100 identify desktop/phone canvas, visibility, and reduced-motion checks; line 67 names this article's local route. |
| `01a08e67-2713-7880-93bd-4396b349414b` | `/root/radar07_source_refresh`; publication source audit, artifact 16, and this footprint's session-ownership investigation. |
| `01a08e6c-0e2d-7641-8fae-2d32df24c66e` | `/root/radar07_share_copy`; X/HN draft and first-publication live acceptance, artifact 18. |
| `01a08e79-1e3c-7b12-a4c4-77ffe2a99888` | `/root/footprint_guardian_support`; existing-extractor support and regression coverage for explicitly selected guardian reviews. This is shared tooling work prompted by the article's accounting request. |

The manifest determines the measured session count and totals. This table records why these sessions belong; it is not a manual token calculation.

## Exclusions and missing evidence

- **Original ChatGPT conversation:** `6aa059e9-e208-83e8-af86-f7ee8670659a` supplied the initial options, research, and installed fixture work. Its article artifacts and exact human prompts are preserved, but its token usage is not recovered. A conversation transcript or fixture's invented usage cannot replace provider accounting.
- **Mixed analytics/publication parent:** `01a0743e-3475-70d2-a6a4-58772d6c746a` contains article 024, HN/referrer and Matomo investigations, bookkeeping, and this publication/accounting turn. The existing extractor has no supported per-turn allocation. Its full usage would include unrelated work, so it is excluded rather than relabeled as the OSS article's cost. Earlier prefixes of that parent already appear in article 024's footprint.
- **Empty automatic review:** `01a083c1-ce30-70c3-af57-1de9d306b157` has neither reviewed actions nor cumulative usage. It is excluded and unmeasured, not counted as a zero-token session.
- **Unknown or unlinked work:** no additional original-research transcript was identified by exact article title/path or conversation ID in the local archived Codex, Claude Code, or OMP JSONL stores. This search does not establish that remote or deleted logs never existed. Reusing prior blog research does not import its entire session tree.
- **After the freeze:** later implementation, deployment, verification, or conversation falls outside each selected usage boundary. This includes the parent session's final integration and release work, which is already excluded for its mixed scope.

## Accounting and reproduction

The existing [extractor](../../../scripts/research-footprint.ts) and [shared models](../../../scripts/research-footprint.models.ts) perform the calculation. The targeted metadata repair accepts the observed guardian shape without creating a parent relationship. Only explicitly selected guardian roots enter this footprint; unselected guardian sessions remain excluded. A selected session without valid usage still fails extraction.

For Codex, use cumulative `info.total_token_usage` values. A decrease in `total_tokens` begins a new monotonic epoch. Select the last cumulative record in each epoch and validate `total = input + output`, `cached input <= input`, and `reasoning <= output`. Sum epoch ends within each session and count each included session once. Cached input is part of input, and reasoning is part of output; neither is added twice. The manifest commits to every selected private-log prefix with SHA-256 and records its usage line and time.

`startedAt` is the earliest included root metadata time. `measuredAt` is the latest included usage time; `frozenAt` records manifest generation separately. Elapsed minutes include the gap between September 8 preparation and September 10 publication work. They are not hours spent actively writing. The fifteen-prompt record includes the owner's complete publication and footprint requests and the OpenRouter wording question. The artifact count covers Markdown files in this research directory, including this note and the reproduction READMEs. It excludes JSON receipts, code, the separate manuscript, and social copy. Commit the artifact and prompt set before freezing, and require local and `HEAD` artifact counts to match.

From the repository root, with the author's private Codex logs:

```bash
pnpm -C packages/blog exec tsx scripts/research-footprint.ts \
  --root-thread 01a08387-f5af-74e2-9141-095760c9aba3 \
  --root-thread 01a0838b-3722-7810-b09d-a07cd1122387 \
  --root-thread 01a083a5-ef27-7bc3-9af2-b696fb1a6956 \
  --root-thread 01a083df-24cc-7183-b082-83fec3a7e580 \
  --root-thread 01a08e67-2713-7880-93bd-4396b349414b \
  --root-thread 01a08e6c-0e2d-7641-8fae-2d32df24c66e \
  --root-thread 01a08e79-1e3c-7b12-a4c4-77ffe2a99888 \
  --research-dir drafts/research/oss-radar-07 \
  --prompts-file prompts/oss-radar-07-promptfoo.prompts.md
```

Growing logs produce a later snapshot. To reproduce the freeze, copy the manifest's included logs privately, truncate each after its selected usage line, verify its prefix hash, and pass that directory with `--sessions-root`. Use the article's committed artifact/prompt set at the footprint release. Preserve metadata and parent relationships; do not add descendants created later. `frozenAt` will differ on reproduction, while selected usage and totals should match.

The private logs contain conversation and system context and are not committed. These totals are **auditable by the author with integrity commitments**. Readers cannot independently reconstruct them without those logs; they can inspect the public work, attribution rules, selected boundaries, and exclusions.

## Release verification

The freeze records **43,272,331 tokens across 8 sessions**, with **15 public human prompts** and **23 committed Markdown artifacts**. It contains 43,096,350 input tokens (40,628,992 cached) and 175,981 output tokens, including 59,745 reasoning tokens. Non-cached input is 2,467,358. No included session had a cumulative-counter reset.

Usage runs from `2026-09-09T00:18:40.705Z` to `2026-09-11T03:26:22.382Z`: 3,068 elapsed minutes. The manifest was frozen at `2026-09-11T03:28:18.675Z`. The attribution note and fifteen-prompt set were committed in `e3607d2` before extraction; guardian support and its regression were committed in `7489180`. All eight private session prefixes and epoch boundaries matched their hashes and recorded usage; arithmetic and identical local/HEAD Markdown path sets passed. No included session ID appears in another existing article footprint manifest. This does not make the measured work an exclusive writing cost.

The original article release is separately documented in [artifact 18](18-publication-verification.md). The footprint revision also clarifies that the OpenRouter connector test used local servers and made-up responses; no OpenRouter service or model was called. Final rendered and live acceptance will be appended after this revision is deployed.
