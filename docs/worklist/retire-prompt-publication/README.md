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

## Delivery and current production acceptance

- Source: `c74d35cc2697e7e236ddc337c1eb4b358fe91c08`, committed and pushed directly to main with the repository's personal identity.
- Activation: Cloudflare deployment `04b017d7-6c89-40fa-950b-f5964c592ce1` was created at 15:04:42 UTC on November 11, with version `bad7661e-7c50-4dbc-b434-f2bb16fcddeb` at 100%. Native deployment/version captures are private; the version metadata did not expose a Git revision, so this is separate from the source attribution and served-content comparisons.
- Live acceptance: [the sanitized receipt](production-acceptance.json), completed at 07:05:24 America/Los_Angeles / 15:05:24 UTC, verifies all 29 dedicated source slugs plus three alternate URL forms return `410 Gone`, the generic withdrawal text and `noindex`. This includes `/please-stop-misreading-user-agent/prompts` and essay prompt URLs. Some source slugs had no published article; the route checks do not imply all 29 were previously live pages.
- `/posts.json`, `/sitemap.xml`, `/llms.txt` and `/llms-full.txt` match the isolated build byte for byte. Four live articles remain available without prompt links or teasers, with research-footprint presence matching their checked source.
- Unrelated untracked Ahrefs captures remain untouched.

The requested retirement is complete. No further publication action is required. Earlier Git revisions, preview deployments, third-party copies, and quotations embedded in historical research records may still retain material. This work withdraws the dedicated author-prompt records and public prompt pages; it is not a historical erasure or a repository-wide redaction audit.

## Forward privacy — November 11

The owner selected privacy going forward across all work. Historical cleanup remains undecided; no history rewrite or visibility change is part of this follow-up.

- Added a global Codex default keeping raw source messages and personal working notes private. It routes preservation to approved private storage and requires explicit authorization for publishing specified wording. The active instruction chain includes this default. The global file contains the maintained policy, not copied conversation text.
- Updated the repository entry point and provenance rules to cover public research artifacts, tasks, commits, issues and PRs as well as article prose. Exact-quotation rules apply only after authorization to publish the specified material.
- Added ignore rules for dedicated author-prompt records, retired prompt directories and Git history bundles.
- Added commit and push guards, installed through `pnpm prepare` / the `pnpm install` lifecycle. Push checks inspect every outgoing commit, so adding and then deleting a private record does not make it releasable. Previously public history remains outside this prospective check. The existing synthetic CLI experiment input is retained only when its original bytes match the pinned hash in each checked revision.
- Added eight disposable-repository integration tests: ordinary ignore behavior, forced staging, intermediate commits, new branches, retained history, unavailable revisions, the pinned synthetic fixture, and preserving existing hooks / isolated source snapshots. All eight pass. Tracked-path inspection, all 34 Markdown metadata checks, the schedule check and the scoped whitespace check pass. No site-rendering or Worker change requires a production rebuild for this follow-up.

The filename checks do not classify private prose in arbitrary files or public messages. Git hooks can be bypassed, new/other clones need hook installation, and custom hook setups need integration. Content review and the privacy instruction remain necessary. These checks do not promise erasure of historical copies or universal prevention of disclosure.

The active checkout now uses `.githooks` through its local Git configuration; the installer reported success and the configured path was read back. All changed Markdown links resolve, instruction diffs preserve author and evidence boundaries, and `AGENTS.md` remains 56 lines. Source delivery is recorded by the accompanying scoped Git commit on main, separately from the earlier Worker deployment and live takedown receipt. Raw source notes remain in private storage; unrelated Ahrefs captures remain untouched.

Next bounded action: preserve this boundary during future work and install the guards in additional checkouts when used. Historical cleanup remains undecided and is not an active task.
