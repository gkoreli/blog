# Newsletter break checkpoint: documentation audit

September 9 UTC / September 8 PDT, 2026. The owner requested a break and preservation of meaningful work. This pass updates operating documents from the saved code and acceptance evidence. It performs no new production query, migration, key change, test send or article publication. [14-handoff.md](14-handoff.md) is the resume point.

## State preserved

- Runtime implementation `86dad93`: shared D1 confirmation admission, bounded same-operation provider retries, corrected lifecycle and form recovery. Its final 100-test suite, typechecks, build and local workerd D1 results remain dated receipts in [10-verification.md](10-verification.md).
- Live checkpoint `f6185f5`: fresh invalid-secret diagnosis and binding repair, one authorized confirmation received in Gmail Spam, GET preview, POST activation and final active state. [15-live-signup-acceptance.md](15-live-signup-acceptance.md) owns the method, versions and seven direct diagnostic reads.
- Initial platform/verifier decision, signup repair, lifecycle and atomic admission are complete: TASK-0127, TASK-0124, TASK-0129 and TASK-0137. A comparative verifier trial is not an unfinished prerequisite. Chosen limits remain revisable blog policy, not measured universal thresholds.
- Gmail placement (TASK-0145), provider signed-event connection (TASK-0142), broader logging/ingestion/alerts (TASK-0125/0126), historical impact/recovery (TASK-0123/0130), and the article (TASK-0128) remain open. The draft is outside `posts/`, with nine exact shaping prompts and no release metadata or frozen research footprint. Housekeeping and private test authorization do not expand the public prompt page.

## Corrections that affect the next action

| Document or instruction | Correction and reason |
|---|---|
| ADR-0010 migration procedure | Production already has 0005. Its command is labeled historical so a new session does not repeat an ALTER migration |
| ADR-0010 acceptance | Current one-recipient completion, Spam placement and missing signed-event connection replace the old recipient-needed summary |
| ADR-0011 form example | Static stage/status reporting replaces the obsolete example that copied arbitrary API error text into logs |
| ADR-0011 current state | The package and cleanup exist; form coverage is repaired. Transport acknowledgement, persistence, correlation, ingestion protection and alerts remain incomplete |
| ADR-0011 provider rationale | First-party ownership is a project preference, not evidence that another service must collect unsafe data or that our logger is complete |
| Investigation/options/design entry points | The chosen implementation and live receipt lead. Missing-secret fail-open behavior and the resend verifier exception are labeled September 7 history |
| Task summaries | Completed work no longer appears as the first instruction. Historical access failures remain dated; a new known test address is not a recovered subscriber |
| Validation instructions | The root has no `validate` script. `pnpm -C packages/blog validate` exits nonzero for invalid Markdown frontmatter; the build itself warns and skips those posts |

These are corrections to current instructions, not rewrites of old observations. Historical counts, raw shaping prompts and original probe outputs remain intact. New confirmation records are private operational state, not reconstructed failed addresses. A server stage, accepted provider request, mailbox arrival and activation continue to describe different outcomes.

## Local verification

`pnpm -C packages/blog validate` exited successfully for all 16 Markdown posts. The command does not cover TypeScript post exports. The 22 Markdown files in this audit had no broken relative file targets, unbalanced code fences, or newly added private test address or confirmation-token URL matching the check. `git diff --check` passed. These are documentation checks; the earlier runtime tests and production receipts retain their original dates and scope.

## Working copies and recovery

The newsletter verification checkout at `/Users/goga/.local/share/gkoreli/worktrees/subscription-bombing-20260909` was clean at `86dad937e8d57bbe66085fcf2687272203d93506`. All three delegated subscription agents had completed; their old local-only summaries are superseded by the parent's later integration and live receipts. No subscription agent or live Worker tail needs to keep running through the break.

At `2026-09-09T03:02:42.352599Z`, a private main-workspace recovery snapshot was saved under `/Users/goga/Documents/goga/private-evidence/bookkeeping/2026-09-09/newsletter-break/`. Its manifest records base `0f26e67b9d5d09934e6d42b01bfafb47e19eddc3`, a 93,071-byte tracked patch and five non-ignored untracked files, with verified SHA-256 hashes. It includes concurrent work for preservation only. Ignored credentials and session logs were excluded, and files can advance after capture.

If recovery is needed, inspect the manifest, create a fresh checkout at its recorded base, and check the patch with `git apply --check` before applying it. Restore only the necessary listed untracked copies, verify their hashes, and compare the result with current `main`. Do not reset the shared checkout or blindly apply an old snapshot over later commits. The operational test captures remain in the separate private `newsletter-reliability/2026-09-09/live-signup/` directory.

The next bounded action is to inspect the retained authorized Gmail message's authentication results and existing provider sender configuration. Recheck account access and the specific DNS evidence before choosing a change. Do not send another confirmation merely to resume, infer a Spam cause from the DNS lookup alone, or mistake task `in_progress` for a running agent.
