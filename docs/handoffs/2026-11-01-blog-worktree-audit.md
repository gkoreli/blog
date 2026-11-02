# Blog worktree audit and cleanup

November 1, 2026, Pacific time. The owner requested cleanup of stale work already committed to `main`, with changes preserved for a critical review of when and why they were made, then authorized removal after further validation. This updates the checkout inventory in the [September checkpoint](2026-09-08-article-025-and-referrer-defense-checkpoint.md#working-copy-preservation-and-recovery); its historical evidence and archives remain valid.

**Final state:** only the primary checkout and the clean Bun workspace shared by two existing chats remain. Seven redundant checkouts, three missing-directory registrations, four local branches and the superseded stash have been removed across both passes. All removed changes and private configuration have verified recovery outside Git. The stash's thirty hunks are accounted for below; 49 relevant existing tests passed.

At initial inspection, local and freshly checked GitHub `main` both pointed to `634b41d`. The primary checkout was clean. The first pass removed three clean checkouts, three missing-directory registrations, and four redundant local branches. It left four dirty worktrees and the September 6 stash intact for review. Bun AOT was clean but still in use by running processes and two chats. The later pass below supersedes those retained-state observations.

## Changes examined in the first pass

Dates below use Pacific time, rather than the UTC dates embedded in checkout names. File modification times establish the observed local state, not authorship or an exact editing history. Delivery dates come from commits reachable from `main`.

| Checkout or stash | Observed dates | Work and assessment |
| --- | --- | --- |
| `article-025-practices-20260909` | Files modified September 8, 19:34; delivered 19:38 in `b4e14b5` | Six changes for article 025: explain referrer defenses through pinned prior art, tests and measured production evidence; retain exact prompts and research accounting. Five file versions occur exactly in `main` history. The remaining editorial note is an earlier version missing the later build/check receipt. This is a stale publication copy, with no unique article or code revision found. |
| `referrer-context-20260909` | Source modified September 8, 18:45–18:56; delivered 18:59 in `c338059` | Eighteen staged implementation/test files for migration 0009, internal/external/absent/unusable referrer context, movement between blog pages, and reporting/privacy changes. All eighteen versions occur exactly in `main` history. A nineteenth untracked file is private `.dev.vars`; its contents were not displayed or committed. This is a stale implementation copy with private configuration to preserve. |
| `oss-radar-07-release-20260910` | Remaining files modified September 10, 20:20–20:29; matching commits `7489180`, `e3607d2`, `9055d8a` at 20:24–20:31 | Five changes for publishing Promptfoo Radar 07 and attributing research/review sessions. Four existing file versions occur exactly in `main` history; deletion of the old draft is reflected in current `main`. The old prompt file also exists in history, though current OSS Radar guidance no longer uses one. This is a stale publication copy; its old prompt file should not be reintroduced. |
| `fetcher-reference-v2/blog` | Files modified October 31, 12:49–12:59; delivered 13:02 in `fe111fc` | Thirty changes for the fetcher follow-up, article 023 corrections, and the discovery-profile experiment. Twenty-six versions occur exactly in `main` history. One worklist is an earlier plan missing completion records. Three intermediate experiment JSON files are absent from tracked `main`, but each has a byte-identical copy in the existing private archive. This is an early publication snapshot, not an unmerged later rewrite. |
| `stash@{0}`, `0a9511c` | Created September 6, 16:48, on base `b9d47e2` | Eight-file, 160-insertion/29-deletion autostash for the initial referrer-abuse defense: normalized hosts, reviewed public names, Other/excluded counts, consistent aggregate filtering, tests, UI disclosure and the Wrangler command form. These capabilities and the four added test cases are present in current source. The first pass preserved it for hunk-level review; the later review and removal are recorded below. |

The two unmatched worktree notes were compared with their delivered versions: the differences are later completion/build records absent from the old copies. No new implementation was found in those notes. The first pass did not use matching intent and surviving test names alone as proof that every stash hunk was redundant; the later review closes that gap.

The fetcher extras are `discovery-profile-baseline-node.json`, `discovery-profile-baseline-node-checked.json`, and `discovery-profile-candidate-native.json`. They describe synthetic intermediate Node/native discovery-profile runs. Their exact copies are named `intermediate-…` in `packages/blog/worklog/fetcher-study-v2-20261031/`. That archive's manifest matches the [public commitment](../../packages/blog/drafts/research/fetcher-study-v2/private-archive.json). The accepted [experiment results](../../packages/blog/drafts/research/fetcher-study-v2/06-discovery-profile-results.md) and later [publication worklist](../../packages/blog/drafts/research/fetcher-study-v2/00-worklist.md) supersede the pending-run state in the old checkout. No experiment was rerun for this audit.

The older article and referrer-context releases are already recorded as accepted in [TASK-0144](../tasks/TASK-0144-ground-article-025-practices-in-tests-and-production.md) and the [referrer-context release receipt](../../packages/blog/drafts/research/article-024-hacker-news/07-transition-release-acceptance.md). Those historical results are not fresh production checks.

## First cleanup and recovery

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

## First-pass retained locations, superseded by final cleanup

The primary checkout remains `/Users/goga/Documents/goga/blog`. Retained linked checkouts are:

- `/Users/goga/.codex/worktrees/bun-aot-radar/blog`: clean at `25311bd`, November 1, 09:32; running processes still use it. The chats *Oss 8 Bun Aot* and *Linux vs Macos* point to it. Do not remove it while those processes are using it.
- `/Users/goga/.codex/worktrees/fetcher-reference-v2/blog`: preserved thirty-entry dirty state described above.
- `/Users/goga/.local/share/gkoreli/worktrees/article-025-practices-20260909`: preserved six-entry dirty state.
- `/Users/goga/.local/share/gkoreli/worktrees/oss-radar-07-release-20260910`: preserved five-entry dirty state.
- `/Users/goga/.local/share/gkoreli/worktrees/referrer-context-20260909`: preserved nineteen-entry dirty state, including private config.

The owner explicitly asked to preserve changes while understanding them, so the four dirty checkouts and stash were not reset, deleted, staged or reapplied. Their status, file bytes, and staged/unstaged patch hashes were checked before and after cleanup. No process was stopped; surviving checkouts had no dependency symlinks into the removed directories, and no open files were found in the removal candidates.

The first pass deferred further removal until owner authorization and hunk-level review. Both are resolved below. Existing private archives and current dependencies/build outputs are intentional retained material, outside redundant-checkout cleanup.

First-pass validation passed: Git ancestry/patch and exact-file comparisons; recovery bundle/config verification; unchanged retained-state checks; 31 relative documentation links and four heading fragments; code-fence and whitespace checks. A prune dry run found no stale registrations. Only local `main` remained as a named branch. No runtime source or article prose changed; no build, deployment or production request was needed.

## Further validation and final cleanup

The later review used `main` at `1ebf806`. All four dirty states still matched the first capture, including file bytes and staged/unstaged patches. Their checkout tips remained ancestors of `main`. The first-pass exact historical-file, older-note and intermediate-archive comparisons therefore still apply. A fresh process/open-file inventory found none using any candidate; no dependency symlink in the primary checkout pointed into them.

### Every stash hunk accounted for

The complete eight-file stash was compared with its original base, delivered source `fe9456e` (September 6, 17:23 Pacific), current `main`, and later refactors. This accounts for all thirty zero-context diff hunks, including the import/helper removal and existing-fixture changes. It does not claim that the whole stash is byte-identical to a commit.

| Stashed path | Hunks | Delivered or superseding behavior |
| --- | --- | --- |
| `packages/analytics/README.md` | 1 | The exact `--command=` repair is in `fe9456e` and current source. |
| `packages/analytics/src/contracts.ts` | 1 | Both new response fields shipped in `fe9456e`; the policy contract gained hashes, evaluator and source provenance. Current source retains them. |
| `packages/analytics/src/metadata.ts` | 3 | `fe9456e` imports/calls the shared parser and removes the old local helper. Later `c338059` extends it to `parseReferrer` with explicit context. The old stripped-`www` expectation was deliberately superseded by preserving raw hostname labels while normalizing for display/policy. |
| `packages/analytics/src/stats.ts` | 6 | The same inclusion/exclusion boundaries, excluded count, all-time boundary and public-name grouping shipped in `fe9456e`. Policy evaluation moved to `referral-sql.ts` with a supplied versioned policy and time bounds. Later shared assessment/consolidation in `316eb00` supersedes the old multi-query layout. Current tests check the resulting counts, filtering, names and history preservation. |
| `packages/analytics/test/contracts.test.mjs` | 10 | All four added tests and the existing-fixture corrections shipped. Later changes assert policy commitments, preserve `www` in stored parsing and check the consolidated query/client-form contract. The fixture adjustments remain in current source. |
| `packages/blog/drafts/research/readers-vs-bots/00-worklist-index.md` | 1 | The earlier pending-activation paragraph was expanded for Matomo/provenance and then linked to completed activation. Restoring it would lose the later status/evidence. |
| `packages/blog/src/client/stats.ts` | 6 | The entire stashed file is exactly the version delivered in `fe9456e`. The guard, disclosure, empty state and Other grouping remain. `316eb00` deliberately removed `cache: 'no-store'` when report caching shipped; that old option should not be restored. |
| `packages/blog/src/pages/stats.ts` | 2 | The heading shipped unchanged; the methodology text was expanded in `fe9456e` to name the actual Matomo/local policy and its governing ADR. Current disclosure retains those boundaries. |

No distinct unfinished feature or fix remains in this stash. It was removed from the live stash list after preserving and independently replaying both its saved index and working trees.

### Fresh local checks and tested recovery

Existing analytics contract and referral-policy suites were run from an isolated tracked-source export. TypeScript compilation succeeded using the installed compiler through pnpm. With the pinned Node **24.14.1**, all **49 tests passed**, including the four inherited stash tests and complete TypeScript/SQLite referral-policy parity. Shared build output was not used. These local tests support the source assessment, not present production acceptance.

An initial shell in the temporary export selected Node 20 and could not load `node:sqlite`; rerunning with the explicit pinned executable resolved that setup failure. The first isolated pnpm invocation attempted dependency verification against the registry and was interrupted; compilation then used the installed workspace compiler with emission confined to the temporary export. The failed Node log and successful pinned test log are preserved privately.

The original recovery bundle was hash-verified again. Before deletion, an independent clone of that bundle reconstructed all five candidate checkout states: exact HEAD, Git status, staged/unstaged patch hashes, and file bytes. This covered **60 changed/deleted/untracked entries**, with **59 existing file copies**, plus Bun's ignored `.backlog/.gitignore`. The stash's reconstructed index and working trees exactly matched its recorded Git trees. The clone was removed after verification.

Private final-pass archive: `/Users/goga/.local/share/gkoreli/workspace-checkpoints/worktree-cleanup-2026-11-01/final-pass`. It contains per-checkout base/status records, complete saved patches and file copies, private `.dev.vars`, stash patches, the test logs, recovery instructions, and cleanup results. `manifest.json` has SHA-256 `9c52e540f8b6416f62b3c6e39c81072410ce9d38ee5e5779e4085a1e82bf1c94`. The earlier archive manifest and bundle remain unchanged. No private configuration or raw log was committed.

### Final disposition

Removed after the checks above: the fetcher, article 025, Radar 07 and referrer-context checkouts listed in the first-pass inventory, and stash `0a9511c`. The earlier three clean-checkout removals, four local-branch removals and three missing-directory registrations stay complete. All retired checkout paths migrate to `/Users/goga/Documents/goga/blog` for future work; use the saved base/patch instructions only when recovering a historical state.

Only the primary checkout and `/Users/goga/.codex/worktrees/bun-aot-radar/blog` remain. Bun is clean and its tip is on `main`. Its earlier processes have stopped and the latest turns in *Oss 8 Bun Aot* and *Linux vs Macos* are completed, but both existing chats still use that directory as their shared workspace. It remains available for their continuation; neither chat was interrupted, moved or archived. There are no dirty worktrees or live stashes left. Further Bun removal should accompany migration/retirement of those chat workspaces, rather than leave their working directories missing.

The requested redundancy assessment and cleanup are complete. No runtime source or article prose changed, no old patch was merged, and no production request/deployment was needed. Commit/push of this maintenance record is separate from production activation.

## Follow-on request: migrate the two Bun chats

The owner subsequently requested moving *Oss 8 Bun Aot* and *Linux vs Macos* to the primary checkout and removing Bun if its work is committed. Fresh preflight confirms the Bun checkout is clean, its tip has zero commits outside `main`, and its ignored configuration still matches the verified recovery archive.

The app's supported `handoff_thread` operation refused both migrations because each chat has pending composer state: “Send or remove it before handing the thread off.” No chat was moved or message sent. Computer Use cannot access the Codex app, and no supported composer-editing tool is available. The owner was asked to preserve any draft text and clear both composers, including attachments. Bun remains intact until both chat working directories have been verified at the primary checkout. Next action: retry the two handoffs after the composer state is cleared, verify their destinations, then remove the already-preserved redundant checkout and update this record.
