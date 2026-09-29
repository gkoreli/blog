# Publication checkpoint — September 29, 2026

Supersedes [the first-pass checkpoint](checkpoint-2026-09-28.md). The [reading guide](README.md) owns the investigation; the [TypeScript post](../../../packages/blog/posts/prompt-cache-context-edits.ts) is the canonical article source.

## Completed research and implementation

- Added the KV-cache walkthrough, actual harness context-management reproductions, and a second live experiment comparing replaced evidence with appended corrections and retained assistant answers. Read [07](research/07-context-management.md), [08](research/08-kv-cache-walkthrough.md), and [09](research/09-changing-retrieved-evidence.md).
- The 27-request and eight-request runs together cost an estimated **$0.20859**. This is inference spend only, within the authorized $5–10 allowance. No further paid call was needed for publication. All 35 synthetic responses passed their respective narrow answer checks; these are not general correctness or speed benchmarks.
- An independent review checked the second experiment against private receipts: exact replay of earlier assistant content, request hashes, token counters, model identity, answer checks, ordering, and Decimal cost arithmetic. The last case was already warm and is not a cold cost comparison. Mutable provider documentation was rechecked on September 29.
- Replaced the draft's Markdown-backed renderer with the established literal `staticHtml`, `PostMeta`, `preamble()`, and `article()` pattern. The post uses shared hero, stat row, table, separator, and source templates. The earlier Markdown draft remains explicitly historical.
- Expanded the dependency figure into token state, parent hashes, and available checkpoints. After owner feedback, unified all four figures around shared type, squared frames, spacing, blue reuse and rust recomputation. Replaced the fixed-width prefill SVG in the article with responsive HTML; the standalone SVG remains a research artifact.
- Preserved exact shaping prompts, including the styling feedback and explicit authorization for one X post without tags and one Hacker News submission. Social copy and publication records live separately in [the launch folder](../../../packages/blog/drafts/social/prompt-cache-context-edits/launch-brief.md).
- Archived both raw synthetic run directories under `/Users/goga/.codex/artifacts/prompt-cache-20260929/`, outside Git; archive hashes matched the originals. Public JSON contains sanitized results and hashes, not credentials or raw operational captures.

## Checks and publication state

- Final repository typecheck, scoped post TypeScript check, and Markdown validator passed. The latter validates 17 Markdown posts; the full build discovers 28 posts including TypeScript. Actual Pi/OMP fixture rerun exactly matched retained JSON. The paid probe dry-run passed without reading credentials.
- Isolated production build passed, including HTML output validation, discovering 28 posts. Build location: `/tmp/prompt-cache-publication-20260929`; the shared development `dist/` was not touched.
- HTML checks passed: one H1, unique IDs, valid fragment targets, seven native disclosures, and generated Markdown/citation/prompt/discovery files. Relative Markdown links and JSON parsed; configured private values were absent from 32 changed files. Whitespace check excludes one exact supplied prompt line with a preserved trailing space.
- Browser control recovered in a fresh Chrome window. Desktop article/flow/dependency views and all four figures at 390 CSS pixels in both themes were inspected. The phone comparisons used the actual production HTML/CSS in isolated iframes with no scripts. A native measurement disclosure opened with Tab/Enter and showed visible keyboard focus without JavaScript. Review caught inherited gold italic figure headings; the final CSS makes them consistent.
- Source delivery: article/research commit `909671b` and final figure styling commit `ede3259` were pushed to main. The isolated production build at `ede3259` was deployed successfully to the `gkoreli-com` Worker, version `9acb00f8-2bfd-4a41-8b19-509bfcc6209e`.
- Measured live acceptance at 2026-09-29 07:31:47 UTC: the [article](https://gkoreli.com/prompt-cache-context-edits), Markdown representation, CSL-JSON citation, prompt page, feed, sitemap, post index, and final stylesheet all passed eight HTTP checks. The article contained the revised prefill explanation and measured 33% cost comparison; the stylesheet contained the final figure-heading rule. Chrome also loaded the live article. The initial Python HTTP client received 403; normal curl requests and Chrome succeeded. This records those clients' observations, not universal availability.
- Published and opened the [X announcement](https://x.com/GogaKoreli/status/2104837268376576489): exact reviewed text, no tags, one post; the permalink displayed the article preview with its correct title. Published and opened the [Hacker News submission](https://news.ycombinator.com/item?id=49889529): original title and canonical URL, no generated comment. Both were verified in the signed-in Chrome UI on September 29.
- The [distribution evidence](../../../packages/blog/drafts/social/prompt-cache-context-edits/metrics.md) records these links separately from audience outcomes.

## Limits and next action

The samples do not establish speedups, equivalence of instruction updates and historical rewrites, long-term residency, or end-to-end agent quality. Additional providers, paid cross-provider experiments, retention/concurrency studies, and approximation quality tests remain proposed follow-ups, not missing measurements silently assumed complete.

The requested research, article, visual revisions, publication, and distribution are complete. No blocking check remains. Future feedback or experiments should start a new dated entry and preserve the limits above; no monitoring or additional spend is scheduled.
