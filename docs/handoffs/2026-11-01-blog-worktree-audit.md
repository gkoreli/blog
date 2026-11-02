# Blog worktree audit and partial cleanup

November 1, 2026, Pacific time. The owner requested cleanup of stale work already committed to `main`, with changes preserved for a critical review of when and why they were made. This updates the checkout inventory in the [September checkpoint](2026-09-08-article-025-and-referrer-defense-checkpoint.md#working-copy-preservation-and-recovery); its historical evidence and archives remain valid.

At inspection, local and freshly checked GitHub `main` both pointed to `634b41d`. The primary checkout was clean. Cleanup removed three clean checkouts, three missing-directory registrations, and four redundant local branches. Four dirty worktrees and the September 6 stash remain intact. A fifth retained worktree, Bun AOT, was clean but still in use by running processes and two chats.

## What the retained changes were for

Dates below use Pacific time, rather than the UTC dates embedded in checkout names. File modification times establish the observed local state, not authorship or an exact editing history. Delivery dates come from commits reachable from `main`.

| Checkout or stash | Observed dates | Work and assessment |
| --- | --- | --- |
| `article-025-practices-20260909` | Files modified September 8, 19:34; delivered 19:38 in `b4e14b5` | Six changes for article 025: explain referrer defenses through pinned prior art, tests and measured production evidence; retain exact prompts and research accounting. Five file versions occur exactly in `main` history. The remaining editorial note is an earlier version missing the later build/check receipt. This is a stale publication copy, with no unique article or code revision found. |
| `referrer-context-20260909` | Source modified September 8, 18:45–18:56; delivered 18:59 in `c338059` | Eighteen staged implementation/test files for migration 0009, internal/external/absent/unusable referrer context, movement between blog pages, and reporting/privacy changes. All eighteen versions occur exactly in `main` history. A nineteenth untracked file is private `.dev.vars`; its contents were not displayed or committed. This is a stale implementation copy with private configuration to preserve. |
| `oss-radar-07-release-20260910` | Remaining files modified September 10, 20:20–20:29; matching commits `7489180`, `e3607d2`, `9055d8a` at 20:24–20:31 | Five changes for publishing Promptfoo Radar 07 and attributing research/review sessions. Four existing file versions occur exactly in `main` history; deletion of the old draft is reflected in current `main`. The old prompt file also exists in history, though current OSS Radar guidance no longer uses one. This is a stale publication copy; its old prompt file should not be reintroduced. |
| `fetcher-reference-v2/blog` | Files modified October 31, 12:49–12:59; delivered 13:02 in `fe111fc` | Thirty changes for the fetcher follow-up, article 023 corrections, and the discovery-profile experiment. Twenty-six versions occur exactly in `main` history. One worklist is an earlier plan missing completion records. Three intermediate experiment JSON files are absent from tracked `main`, but each has a byte-identical copy in the existing private archive. This is an early publication snapshot, not an unmerged later rewrite. |
| `stash@{0}`, `0a9511c` | Created September 6, 16:48, on base `b9d47e2` | Eight-file, 160-insertion/29-deletion autostash for the initial referrer-abuse defense: normalized hosts, reviewed public names, Other/excluded counts, consistent aggregate filtering, tests, UI disclosure and the Wrangler command form. These capabilities and the four added test cases are present in current source; the full old patch was not established as a patch-equivalent commit. Preserve it for provenance and avoid applying it wholesale over the evolved implementation. |

The two unmatched worktree notes were compared with their delivered versions: the differences are later completion/build records absent from the old copies. No new implementation was found in those notes. The stash needs a different evidence boundary: matching intent and surviving tests establish that the feature shipped, but do not prove every old hunk redundant.

The fetcher extras are `discovery-profile-baseline-node.json`, `discovery-profile-baseline-node-checked.json`, and `discovery-profile-candidate-native.json`. They describe synthetic intermediate Node/native discovery-profile runs. Their exact copies are named `intermediate-…` in `packages/blog/worklog/fetcher-study-v2-20261031/`. That archive's manifest matches the [public commitment](../../packages/blog/drafts/research/fetcher-study-v2/private-archive.json). The accepted [experiment results](../../packages/blog/drafts/research/fetcher-study-v2/06-discovery-profile-results.md) and later [publication worklist](../../packages/blog/drafts/research/fetcher-study-v2/00-worklist.md) supersede the pending-run state in the old checkout. No experiment was rerun for this audit.

The older article and referrer-context releases are already recorded as accepted in [TASK-0144](../tasks/TASK-0144-ground-article-025-practices-in-tests-and-production.md) and the [referrer-context release receipt](../../packages/blog/drafts/research/article-024-hacker-news/07-transition-release-acceptance.md). Those historical results are not fresh production checks.

## Cleanup and recovery

| Removed checkout | Last commit and reason |
| --- | --- |
| `/Users/goga/.codex/.chatgpt-projects/g-p-6a5054094534819184192d302fa7224f/blog-pr` | Clean at `835817b`, August 20: Bring Your Own AI Agent publication. Its commit and the five earlier topic-branch commits have patch-equivalent versions on `main`. |
| `/Users/goga/Documents/goga/blog-analytics-calibration` | Clean at `789de70`, September 6: reconciled bot-detection article footprint. Its tip is an ancestor of `main`; the old ahead-of-topic-remote indicator did not mean work was missing from `main`. |
| `/Users/goga/.local/share/gkoreli/worktrees/subscription-bombing-20260909` | Clean at `86dad93`, September 8: confirmation-send limits and subscription retries. Its tip is an ancestor of `main`. Its ignored `.env` was copied and hash-verified in private storage before removal. |

Removed missing-directory registrations: `/private/tmp/blog-024-release`, `/private/tmp/blog-radar07-preview`, and `/private/tmp/prompt-cache-publication-20260929`. All three recorded tips are ancestors of `main`; their previously saved evidence is untouched.

Removed local branches: `agent/bring-your-own-agent-blog`, `article/018-my-evals-say-it-works`, `codex/analytics-calibration`, and `publish/bring-your-own-agent`. Each was either already an ancestor of `main` or had only patch-equivalent commits. A fresh fetch also pruned three remote-tracking references for branches already deleted on GitHub. No GitHub branch was deleted by this cleanup.

Private recovery directory: `/Users/goga/.local/share/gkoreli/workspace-checkpoints/worktree-cleanup-2026-11-01`. It contains:

- A standalone, verified `repository.bundle` of all pre-cleanup refs, including the deleted local branches and retained stash.
- The removed newsletter checkout's private `.env`, with restricted permissions and verified bytes.
- `manifest.json`, recording bases, branch/stash IDs, retained dirty-file hashes and modification times, staged/unstaged patch hashes, and omitted generated-file inventories.
- `cleanup-result.json` and recovery instructions in `README.txt`.

The private manifest's SHA-256 is `6b4d646c9d71574d84015f95eff8c9aaef4ab67d3ebcc454604e10c5199f3d4c`. The recovery bundle is 22,435,406 bytes. Dependency installations and generated build/test/compiler outputs from the removed checkouts were discarded; they are reconstructible. Private config contents, operational captures and session logs were not added to Git.

## Remaining checkout locations and next decision

The primary checkout remains `/Users/goga/Documents/goga/blog`. Retained linked checkouts are:

- `/Users/goga/.codex/worktrees/bun-aot-radar/blog`: clean at `25311bd`, November 1, 09:32; running processes still use it. The chats *Oss 8 Bun Aot* and *Linux vs Macos* point to it. Do not remove it while those processes are using it.
- `/Users/goga/.codex/worktrees/fetcher-reference-v2/blog`: preserved thirty-entry dirty state described above.
- `/Users/goga/.local/share/gkoreli/worktrees/article-025-practices-20260909`: preserved six-entry dirty state.
- `/Users/goga/.local/share/gkoreli/worktrees/oss-radar-07-release-20260910`: preserved five-entry dirty state.
- `/Users/goga/.local/share/gkoreli/worktrees/referrer-context-20260909`: preserved nineteen-entry dirty state, including private config.

The owner explicitly asked to preserve changes while understanding them, so the four dirty checkouts and stash were not reset, deleted, staged or reapplied. Their status, file bytes, and staged/unstaged patch hashes were checked before and after cleanup. No process was stopped; surviving checkouts had no dependency symlinks into the removed directories, and no open files were found in the removal candidates.

Next bounded decision: review the assessments with the owner. The four dirty checkouts are candidates for later consolidation/removal after preserving private configuration; they do not currently identify an unfinished code feature to merge. Keep the stash until its provenance or remaining hunk-level value is settled. Bun cleanup depends on its users finishing. Existing private archives and current dependencies/build outputs are intentional retained material, outside the redundant-checkout cleanup.

Validation passed: Git ancestry/patch and exact-file comparisons; recovery bundle/config verification; unchanged retained-state checks; 31 relative documentation links and four heading fragments; code-fence and whitespace checks. A final prune dry run found no stale registrations. Only local `main` remains as a named branch. No runtime source or article prose changed; no build, deployment or production request was needed. Committing this record is separate from production activation.
