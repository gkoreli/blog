# Referrer context and page transitions: release acceptance

September 9 UTC / September 8 PDT, 2026. The approved referrer change is deployed and verified. New observations distinguish external, internal, absent, and unusable referrers; recognized public internal paths support previous/next-page reports. Historical nulls remain unknown. [Design and sources](06-transitions-and-funnels.md) · [Measured receipt](transition-acceptance.json).

## What was released

Code commit `c338059` adds migration `0009_referrer_context.sql`, request capture, report fields, dashboard sections, and the privacy disclosure. The report cache version is `2026-09-09.1`. When an article is selected, the report reads incoming and outgoing transitions while preserving that article's existing headline denominator. Owner, time, traffic, and referral-policy filters apply to the destination request. Repeats count again; same-page referrals remain separate.

Only published article/prompt routes and explicit public site routes can enter `internal_referrer_path`. The Worker loads the existing static `posts.json` through its asset binding, caches the route set, and strips queries and fragments. If loading fails, it still records the internal category and recognizes fixed public routes; unknown article paths remain null. This favors retaining an observation over guessing a source path.

Two older dashboard claims were also corrected: a signature does not establish a human trigger, and the Old browsers category is grouped under Automation without proving automation. The classifications themselves were preserved.

## Deployment and local checks

- Migration completed at **01:57:42 UTC**, before the code push. Wrangler listed only migration 0009 as pending and reported it applied successfully.
- Live `/stats` HTML at **02:01:59 UTC** contained the new sections and corrected signature wording. At the later API capture, deployment `6214b171-fd5d-44a8-8abc-8d1f8e56c3fd` served version `e8c69b0d-3174-4e8f-a3f9-5788f2868686` at 100%, created at 02:07:43 UTC. Concurrent main-branch releases occurred, so this version is not asserted to contain only our commit.
- An isolated candidate based on `c235029` passed **53 analytics tests**, **36 blog tests**, analytics/blog/Worker typechecks, and a **25-post production build**. The isolation excluded concurrent newsletter changes in the shared Worker and privacy files.
- Local D1 returned the same **12 report sections** as the expected fixture. Applying migration 0009 to a pre-change fixture preserved its old row with both new fields null. The probe's owner-marking and verification SQL also passed local D1 before production.
- Chrome desktop rendered the selected article's unchanged two-view fixture, both referrer categories, and previous/next-page rows correctly. This was an agent-operated UI check, not a human-readership or responsive-layout experiment.

The local Wrangler 4.71 runtime warned that it used compatibility date March 1 rather than the configured March 6. Successful live capture and reporting are separate acceptance evidence for production.

## Controlled production requests

The [committed probe](probe-referrer-context.py) issued one deliberately excluded bootstrap request and eight scripted HTML requests between **02:08:16 and 02:08:23 UTC**. All nine received HTTP 200 and were stored. The bootstrap used a unique hostname under an already excluded referral suffix; its daily client ID was then added to `owner_clients` inside D1 without exporting the identifier. All nine observations were excluded from public reporting. No email, signup, or subscriber record was created.

| Scripted case | Observed stored result |
|---|---|
| External HN-shaped URL with a query and fragment | `external`, hostname only |
| Article 024 → article 025, with a query and fragment | `internal`, canonical article 024 source path |
| `/engineering` → article 024 | `internal`, `/engineering` |
| Synthetic internal confirmation path | `internal`, null source path |
| No header | `absent`, null host/path |
| Malformed header | `unusable`, null host/path |
| Article referring to itself | Internal self-referral, separate from movement |
| Repeated article 024 → article 025 request | Same pair counted twice |

This tests supplied HTTP headers, capture, path minimization, and exclusion. It does not test which headers a particular browser sends on a real click, prove that anyone read a page, or reconstruct the earlier HN journeys.

The first harness incorrectly expected `curl/` to classify as `http-client`. The existing generic UA rule classifies it as `other-bot`. All stored referrer results and owner exclusions were correct. The harness expectation was corrected from that source evidence, and the saved receipt passed all assertions without repeating live requests. The earlier prototype migration fixture also used an invalid daily-ID string; correcting it to the required 32 hexadecimal characters made the local migration fixture pass. Neither failure required a production classification change.

To reproduce this dated probe, first confirm that the deployed referral policy still excludes the bootstrap suffix, run its SQL against local D1, then use its explicit `--execute`, account, database, and private capture-directory arguments. The default invocation prints the plan and makes no requests. It uses the existing Wrangler OAuth credential without printing it. A failed bootstrap stops subsequent requests.

## Report and cache evidence

The bounded article report used **58,204 D1 rows read**, zero writes, and returned 12 sections. Its SQL duration was 72.04 ms. The separate schema/bookkeeping inspection used eight reads; the probe's owner mark and verification used **45 reads and two metered writes**. These figures do not include individually metered migration/index work, edge observation inserts, or the separate cold public API fill. They are not an account-wide total, nor a like-for-like cost comparison with the earlier, smaller dataset.

Two identical public API requests returned **MISS → HIT**, byte-identical bodies, the same calculation time (**02:10:21.080 UTC**), and an expiry of 03:10:21 GMT. The observed cache was in SEA; this does not establish a global cache or read budget.

That later article report contains **1,619 Browser observations**, split into 966 external and 653 historical unknowns, with no included internal transitions yet in that selection. It spans September 3–9 UTC, with September 9 partial. It is later than the frozen 1,616-observation referrer investigation and does not replace that baseline. The controls prove that new capture works; organic transition counts need time to accumulate.

## Evidence and next boundary

The public receipt contains sanitized counts, synthetic cases, code/deployment references, and SHA-256 commitments to private capture files. The originals remain under `~/.local/share/gkoreli/analytics-evidence/2026-09-09-article-024-hn/transition-acceptance/`; the method and probe are committed here. No private daily client IDs, credentials, or unreviewed real referrer names are published.

This implementation is accepted. Real-browser collection calibration remains in TASK-0120. Multi-step conversion analysis requires a separate sequence and outcome model. The owner's new [Matomo and agent-subscription investigation](../agent-readership/00-worklist-index.md) evaluates that direction without reopening article 024's frozen body or footprint.
