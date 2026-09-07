# Referral-abuse defense: implementation and verification

September 6, 2026 UTC. [ADR-0016.5](../../../../../docs/adr/0016.5-referral-abuse-defense.md), [worklist](../../../../../docs/folders/FLDR-0009.md), and [TASK-0121](../../../../../docs/tasks/TASK-0121.md). This is the initial local-only candidate checkpoint. [Artifact 18](18-matomo-referral-policy-verification.md) extends it with the Matomo source and archived policy; production activation was outstanding during both candidate captures. Keep this artifact's original counts and method intact.

## Production observations and candidate policy

The live 30-day Browsers API snapshot at `2026-09-06T23:25:33.715Z` returned 962 views, 641 daily client IDs, and 860 unattributed views. The reported domain under investigation ranked first at 35 views. This confirms the owner's reported count in that window; it does not establish 35 readers or authenticate the referring site.

The new query builder was then executed against production D1 with the same date window (August 8 through September 6 UTC). All nine query results reported success and zero rows written. The captured result was:

| Measure | Candidate policy result |
|---|---:|
| Included Browser observations | 929 |
| Excluded observations | 35 |
| Included daily client IDs | 637 |
| Included observations without a referrer | 862 |
| Included observations with a publicly named referrer | 60 |
| Included observations with an unreviewed referrer name | 7 |

Referrer counts reconcile: 862 + 60 + 7 = 929. Included plus excluded observations are 964. The earlier live API had 962: two additional unattributed observations arrived between captures. These are separate reads, not a cross-source transaction. The date window includes the current partial UTC day; the result is a release-impact check, not a complete-day calibration study.

The named sources retained are X's redirect host, Google, Hacker News, ChatGPT, GitHub, DuckDuckGo, Kagi, and old Reddit. No unreviewed hostname is present in the candidate public JSON. Every count-bearing panel reconciles to 929. This decrease is the effect of an explicit reporting policy; it does not prove improved human-count accuracy.

The private review command in the analytics README was exercised separately: two successful SELECT results, 68 daily host/kind groups and 61 host/path/kind groups, zero rows written. It retains unreviewed names privately for further decisions.

## Implementation checks

- All 41 analytics tests passed, including real SQLite coverage for exact/subdomain exclusions, case and trailing dots, lookalikes, credential-bearing URLs, Android app referrals, all four groups plus All, scoped agents/kinds/paths, owners, historical dates, all-excluded windows, and unchanged raw rows.
- A 1,000-host rotation fixture produces a generic count without exposing those names through JSON. Unfamiliar referrals remain included unless separately excluded; reviewed, other, and absent counts reconcile.
- Three affected Worker integration tests, blog TypeScript checks, and the production build passed. No dependency or migration was added.
- The built stats HTML contains the reported-referrer wording and policy explanation. The client renders the exclusion count in both ordinary and all-excluded states; stale API responses without a policy fail closed. A browser could not be opened because the session exposes no browser, so interactive/visual verification is not claimed.
- The all-time date boundary includes excluded non-owner observations, while metrics omit them. This prevents an exclusion count referring to dates before the displayed period.

## Private evidence and release boundary

Scratch evidence is in `/tmp/blog-referral-policy-check-20260906/`: the bound query manifest, exact SQL, `query-results.json`, candidate `response.json`, and private `review-results.json`. It is temporary author-accessible evidence, not a durable public export. The older `results.json` is a Wrangler file-import execution summary, not row results: it reports nine queries and zero rows written. The query was repeated through `--command` to retrieve the actual aggregate rows. The README uses `--command=` so SQL comments cannot be parsed as CLI options.

Production Worker code and public assets have not been deployed by this task. A concurrent article 024 revision was committed during the work as `eebe342`; that commit also includes some shared documentation additions, while the referral runtime changes remain uncommitted. Release the selected changes deliberately and record the activated Worker version/time; do not claim this policy is already protecting the live dashboard. Saved artifacts 12 and 15 retain their original populations. The baseline extractor remains pre-referral-policy and its documentation now states the difference.

The policy can prevent arbitrary referrer-name promotion and exclude reviewed abuse from reports. It cannot authenticate approved referrers, stop clients changing their headers, or prove that the remaining requests are human.
