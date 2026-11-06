# November daily publication

**Current November 6 Pacific checkpoint:** The deeper code/article iteration has
passed its local and native acceptance, and the revised Turnstile article is
re-registered for **November 6 at 08:00 America/Los_Angeles**. The [new release
receipt](2026-11-06-turnstile-engineering-checks.json) supersedes the earlier
seven-prompt rehearsal without rewriting it. The [engineering worklist](../../../packages/blog/drafts/research/newsletter-reliability/32-four-hour-engineering-iteration.md)
keeps the fixed 06:07:25–10:07:25 UTC window and separate source/production receipts.
The revised hosted queue check passes on the actual checked-out source. A
separate non-publishing job-token push reaches a native Cloudflare build and
100% activation, with matching served source/build identity. The [delivery
receipt](2026-11-06-turnstile-delivery-checks.json) retains those dated results
and private-capture hashes. Actual cron wakeup and article publication remain
future evidence; November 7–30 still need approved queue entries.

Started November 5, 2026, Pacific time. Owner wants a new article each day this
month, published at 08:00; the November 5 article is already published and its
later publication time is accepted. The environment's America/Los_Angeles
timezone is the stated assumption. This task covers prepared-article scheduling;
the optional writing-reminder preference was asked separately and is unanswered.

## Implementation choice

25 release dates remain: November 6–30. A hosted GitHub Actions schedule starts
at 08:00 Pacific and promotes only the finished article explicitly listed for
that date. No automatic drafting or publication of arbitrary existing drafts.
An empty day fails visibly. The clock guard prevents early, December or later-year
publication, and missed dates are not caught up automatically.

The owner was told that 08:00 is the release trigger; checks, deployment and
GitHub scheduling delays mean public availability follows later. Exact timed
visibility would require a separate server-side release design.

## Artifacts

- [Queue procedure](../../../packages/blog/scheduled/README.md)
- [Dated release manifest](../../../packages/blog/publication-schedule.json)
- [Workflow](../../../.github/workflows/november-publication.yml)
- [Selection and promotion](../../../packages/blog/src/lib/publication-schedule.ts)
- [CLI and live acceptance](../../../packages/blog/src/pipeline/publish-scheduled.ts)
- [Focused regression checks](../../../packages/blog/test/publication-schedule.test.ts)

## Delivery and acceptance

Local checks passed November 5: workspace typecheck, validation of all 31 Markdown
posts, eight new scheduling tests plus the existing cross-timezone date test,
and an isolated production build of all 42 posts. The focused checks cover the
Pacific 08:00 boundary, campaign/year limits, missing days, duplicate entries,
path restrictions, prompt preservation, slug collisions, repeat runs and
TypeScript metadata rollback. Nine relative documentation links resolve and code
fences balance. The active development output was not touched; no private local
environment files were copied into the isolated build.

Source delivered directly to `main` in
[`9382248`](https://github.com/gkoreli/blog/commit/9382248d34cfd6c2b58599b21195540dec6b1a77).
The unrelated, untracked Ahrefs captures were left untouched.

Activation observed November 5: GitHub registered workflow `408698342` as active.
The manually dispatched, non-publishing
[hosted check](https://github.com/gkoreli/blog/actions/runs/42118994554) succeeded
on that exact commit. Checkout, runtime pin extraction, Node setup, pnpm setup,
frozen-lockfile installation and the empty-queue check all passed. Promotion,
validation, commit/push and live acceptance steps were skipped as intended.
No scheduled article was published, and this manual run does not prove the
future cron wakeup or the GitHub-token-to-Cloudflare article deployment path.

Setup and hosted activation are complete. The owner's later article selection
and its release preparation follow below. GitHub notification preferences were
not changed. The first actual cron-triggered publication remains separate from
the earlier empty-queue check and the later isolated release rehearsal.

## November 5 Pacific: Turnstile selected for November 6

Goga selected **Cloudflare Turnstile: What Kept Breaking My Signup Form** as the
next article and asked this chat to coordinate a substantive improvement through
its original builder. The exact instruction is the seventh message in the
[selected prompt record](../../../packages/blog/drafts/research/newsletter-reliability/turnstile-pain-points.prompts.md).
The original builder's existing thread, **Investigate client_errors subscription…**,
completed the revision in `7f02173`. It led with the fake-versus-real API failure,
added a diagnostic map, clarified callback/retry boundaries, compressed tangents
and preserved the unknown causes and measurement limits. Its
[revision record](../../../packages/blog/drafts/research/newsletter-reliability/31-turnstile-diagnostic-method-revision.md)
and [draft](../../../packages/blog/drafts/research/newsletter-reliability/turnstile-pain-points.md)
remain discoverable in the existing research worklist.

The coordinator independently reviewed the full prose and requested two narrow
corrections: remove unsupported attribution of the old secret's installation,
and distinguish observed results from verifier policies in the diagnostic map.
Both corrections were applied before release preparation.

The reviewed body and seven exact selected prompts are frozen in the November 6
queue, registered in the [manifest](../../../packages/blog/publication-schedule.json).
The H1 and slug are retained; the search title and description adopt the builder's
revised diagnostic positioning. No unmeasured research footprint is added. The
earlier private-authorization omission remains disclosed in the research record;
agent instructions are not presented as human prompts.

[Release-rehearsal receipt](2026-11-06-turnstile-checks.json): an isolated copy
blocks promotion at 07:59:59 and selects this article at 08:00 Pacific. All 32
Markdown posts validate and the production pipeline builds 43 posts. Output
checks pass for one H1, two tables, canonical/date, final search title/description,
the full Markdown body, seven-prompt page, post index, RSS, sitemap and llms index.
The checked body/prompt hashes match the builder's final revision. The tsx CLI
could not create its local IPC pipe; equivalent `node --import tsx` entrypoints
ran the same referral-policy check and production build successfully. No shared
development output or private environment file was used.

Prepared source is outside `posts/` and `prompts/`. It is intended for the
**November 6, 2026, 08:00 America/Los_Angeles** release attempt (16:00 UTC).
Queue source was committed and pushed in
[`d4e5544`](https://github.com/gkoreli/blog/commit/d4e5544d9ceec0737e92cb24bcdf0e1e8c70528c).
The populated queue then passed a
[hosted non-publishing check](https://github.com/gkoreli/blog/actions/runs/42171716487)
on that exact source. Checkout, pinned setup, installation and queue validation
passed; promotion, commit/push and live publication steps were skipped as intended.
The configured queue is active, with no remaining preparation blocker.

Actual timed promotion, Cloudflare deployment and live publication remain
unverified until the November 6 run. Next bounded action: inspect the release's
commit/push and live-check result; do not infer acceptance from this rehearsal,
manual hosted check or the article's scheduled date.

## November 6: deeper engineering revision and final queue

The owner reopened the earlier editorial result and asked for four further hours
improving implementation and prose together. The original builder owned browser
attempt/resource ownership and native browser checks; independent reviewers
covered provider knowledge/contracts and durable campaign/suppression behavior.
The coordinator integrated confirmation policy/application/HTTP/D1 boundaries,
bounded request reading, original-byte webhook authentication and the article.
Research 32–39 retain methods, measured failures, selected native checks and limits.

The revised article now leads with a reproduced callback race that could cancel
an in-flight signup. It distinguishes widget recovery, signup POST handling,
Siteverify identity and email retry knowledge; native API/runtime capabilities;
transactional admission; deliberate no-send acceptance; and the dated full Inbox
cycle. A later production check joins page-bootstrap and receiving-Worker
versions separately. It does not claim a conversion improvement or infer that
48 widget reports are lost subscribers.

The final body and **eight complete selected human prompts** match their queued
copies. The private authorization omission is visible in the article. Title,
public slug and November 6 date remain stable; the description leads with the
controlled cancellation finding. The queued file now uses prefix **043**, since
another author-owned article already occupies 042. Neither its prose nor its
release is changed by this preparation.

The current integration passes 405 blog and 433 analytics tests plus workspace
types. The isolated release rehearsal validates 33 Markdown posts and builds 44
posts. It blocks at 07:59:59 Pacific, promotes only this article/prompts at 08:00,
and refuses duplicate promotion. It verifies full Markdown, canonical/date,
search/share metadata, eight exact rendered prompts, index, RSS, sitemap, llms
and citation files. Desktop and 375-pixel browser checks pass. They caught a
clipped long prompt path; `overflow-wrap:anywhere` repairs its display without
editing any prompt bytes. All eight narrow prompt blocks now have equal client
and scroll widths. The generated social card is legible and unclipped.

Only a frozen-lockfile dependency installation and public source/asset copies
were used in the separate rehearsal checkout; no private environment file or
active development `dist/` was copied or overwritten. One offline installation
first lacked a cached package; the frozen prefer-offline retry completed with
286 reused packages and zero downloads. These are preparation checks, not a
future-cron or live-article result. The original successful seven-prompt hosted
check remains historical.

### Revised hosted check and delivery control — November 6 UTC

The [revised hosted check](https://github.com/gkoreli/blog/actions/runs/42190430355)
passes queue validation. Its job log independently confirms actual checkout
`17efb44bee6fd7df0332a4b968932affc6e20047`, with one approved entry and Node
24.14.1. Promotion, publication validation, commit/push and live checks are
skipped in this mode. Source 17efb44b separately reaches native build
`687573a1-40bf-4e19-93f0-a00acb9e8d42` and Worker
`8e596821-aecc-44de-9a7f-0888d09df7e0` at 100%; fresh served client/CSS bytes
equal their source/build reconstruction. Nine read-only pre-release requests at
09:00:45 UTC find no article route, prompt route or index/feed/citation entry.
This is a dated absence check, not a future publication result.

A separate [manual delivery control](https://github.com/gkoreli/blog/actions/runs/42195993273)
uses the existing contents-write job token and the publication job's pinned
checkout path to push only a non-publishing JSON control. The pushed source
`740bf1ec6b2e25f31aca85774375cdeb17021807` reaches native Cloudflare build
`a58681fa-85a1-4cb1-804c-e0ed19788c93`, Worker
`b5a050a8-e0fa-4159-bdec-3bc82da863dc` at 100%, and matching served page/client
source/build identity at 09:38:48 UTC. The native log retains an initial
09:33:58 initialization failure and a later successful build/deploy ending
09:36:15; its retry initiator and failure cause are unestablished. No manual
retry, signup, email or recipient query occurs. This establishes the observed
job-token-to-external-host path for the control, while actual article promotion
and the scheduled wakeup remain future checks. The temporary manual workflow
and JSON control are removed in the receipt's cleanup commit.

Selected private captures are preserved in a Git-ignored, permission-restricted
archive with verified hashes. A separate delivery supplement preserves the new
control without changing the original archive manifest. Raw operational records
remain outside Git. The [delivery receipt](2026-11-06-turnstile-delivery-checks.json)
records those boundaries and counts; it is not a complete session transcript or
a research-cost footprint.
