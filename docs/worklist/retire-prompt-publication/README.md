# Retire public prompt records

Accepted direction: November 11, 2026, America/Los_Angeles. Stop publishing author prompts across all article forms, including essays, and remove existing public prompt pages. [ADR-0003](../../adr/0003-prompt-transparency.md) records the current publication decision and the retired design.

## Completed implementation

- Removed prompt parsing, page generation, article teasers, previews, counts and discovery entries. Both Markdown and TypeScript articles follow this rule.
- Retired prompt routes return `410 Gone` with `noindex` before static assets or analytics. HTML, Markdown, trailing-slash and former index-file paths are covered.
- Kept existing research-footprint measurements on their articles and repaired their links without exposing author notes or recalculating frozen measurements.
- Scheduled publication rejects `prompts: true` and no longer promotes or stages prompt records. The accepted article schedule is otherwise unchanged.
- Archived 66 dedicated author-prompt records in ignored local storage after byte/hash verification, then removed them from the current public tree. Historical source links resolve to the withdrawal notice. No Git history rewrite or erasure of third-party copies is claimed. Research code, synthetic test prompts and article prose remain in scope for their original purposes.
- Updated active writing, build and repository instructions. Historical dated records remain; their prompt-source links now identify the withdrawal.

## Acceptance

Local acceptance passed November 11:

- `pnpm typecheck` across the workspace.
- `pnpm -C packages/blog validate`: all 34 Markdown posts valid.
- `pnpm -C packages/blog publication check`: the existing article schedule validates.
- 21 focused tests covering Worker retirement before static assets, representation negotiation, referrer paths, publication rejection, SSG and historical footprint accounting.
- Isolated `pnpm build`: 45 posts, HTML validation and client bundling passed. No shared development output was used. The isolated build had no copied private environment files.
- Generated HTML, Markdown and discovery inspection: no prompt routes, links, previews or teasers; all 45 index entries omit prompt metadata. Existing footprint sections remain accessible on articles.
- Private archive: all 66 records match their pre-removal SHA-256 hashes, remain ignored by Git, and are absent from the public tree. All 104 added relative Markdown links resolve. `AGENTS.md` remains 56 lines; its diff and the writing/build guidance diffs preserve authorship and evidence requirements while deliberately retiring prompt publication.

Source commit, deployment activation and live acceptance remain separate checkpoints.

Next bounded action: commit and push the checked scoped changes to main; verify the cited prompt URL, essay prompt URLs, and representative article/discovery surfaces in production. No claim of historical or third-party erasure is made.
