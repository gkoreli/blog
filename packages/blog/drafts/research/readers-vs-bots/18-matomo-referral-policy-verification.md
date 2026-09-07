# Matomo referral policy: source review, implementation, and verification

Engineering follow-up on September 6 PDT / September 7 UTC, extending [artifact 17](17-referral-abuse-defense-verification.md). Decisions: [ADR-0016.5](../../../../../docs/adr/0016.5-referral-abuse-defense.md), [ADR-0016.6](../../../../../docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md). Work: [TASK-0121](../../../../../docs/tasks/TASK-0121.md). This checkpoint precedes deployment; actual activation is recorded separately in [artifact 19](19-referral-policy-activation.md).

## Findings that changed the implementation

The pinned [Matomo list](https://github.com/matomo-org/referrer-spam-list/blob/e65db652cade6882aa9a76bbb65c9bb17e079f4b/spammers.txt) has 2,348 canonical hosts. It does not contain the domain in the reported 35-view cluster. The local evidence-backed exclusion therefore remains necessary. The retained private review output contains 23 distinct hostnames across traffic kinds; assessment under the new policy finds one local exclusion and no upstream matches. Absence from the community list is not an inclusion endorsement.

Matomo's [core matcher](https://github.com/matomo-org/matomo/blob/79c953a035723b8a7ee80b87074daf82976e954e/core/Tracker/Visit/ReferrerSpamFilter.php#L28-L45) scans the whole referrer string. Its [updater](https://github.com/matomo-org/matomo/blob/79c953a035723b8a7ee80b87074daf82976e954e/plugins/CoreAdminHome/Tasks.php#L344-L368) follows the current default-branch list. The implemented policy imports a reviewed revision and uses hostname label boundaries. URL paths, query strings, lookalike names, and parent domains of a listed subdomain do not match merely because they contain a listed string.

The source includes an uppercase hostname, 47 ACE/punycode entries, and specific subdomains. The importer handles canonicalization, rejects malformed or duplicate hosts, and archives the exact source bytes and upstream license declarations. Local exceptions can include or exclude exact hosts or subtrees. Source membership, reporting action, public visibility, and client identity remain separate concepts.

## Policy and evidence commitments

| Item | Value |
|---|---|
| Policy | `2026-09-06.2` |
| Policy definition SHA-256 | `25d4655bd67b0a63e9fc1f59586c6d85f924671024874198a678e8b82a00d7c4` |
| Evaluator | `host-suffix-v1` |
| Source revision | `e65db652cade6882aa9a76bbb65c9bb17e079f4b` |
| Source capture | `2026-09-06T23:57:19.785Z` |
| Raw list SHA-256 | `83d2f174807c72987e73611fd7b36776bab02ee85fccc7b705d3be1bfa2a80b5` |
| Rule count | 2,348 upstream + 1 local |
| Production query-manifest SHA-256 | `37f0dae7d96f8f8ae5dc1719dc34d495380b5495528f4bc70fbf537dd328e7b3` |
| Private archive manifest SHA-256 | `3e2918f7efff61904a15ca30e4d35c52f13c6c221e41d3b051b49762e1f5a4c6` |

The source archive is under `packages/analytics/data/referrer-sources/matomo/`; the definition and commitment are in `packages/analytics/policies/`. Generated source is checked against these at build time, without a network fetch. Assessment and report-capture commands also verify the commitment. Changed definitions require a new version; report snapshots retain received bytes instead of regenerating old numbers from today's data.

The private verification artifacts have been copied from scratch into `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-09-07-referral-policy/`, with a 0700 directory, 0600 files, and a file-hash manifest. They contain aggregate D1 results, the exact parameterized queries, candidate/live responses, the private review and assessments, and the reproduction script. No credential or daily client ID was exported. This author-accessible archive is outside Git; the public summary and hashes do not make private results independently reproducible by readers.

## Fixed-window production check

At `2026-09-07T00:09:36.702Z`, all nine generated candidate statements had succeeded against production D1 with zero rows written. The report clock was explicitly fixed to `2026-09-06T23:59:59Z` to select August 8 through September 6 inclusive, the same calendar window as artifact 17. `updatedAt` in this candidate response is that supplied report clock, not its production-read timestamp.

| Measure | Count |
|---|---:|
| Before referral exclusions | 972 |
| Included Browser observations | 937 |
| Excluded observations | 35 |
| Named referrer views | 60 |
| Other reported referrer views | 7 |
| No-referrer views | 870 |

937 + 35 = 972, and 60 + 7 + 870 = 937. Paths, time series, devices, and reader-kind totals reconcile to included views. No unapproved name survives in the public candidate JSON. The source-only addition causes no further exclusion in this inspected population; the local rule accounts for the 35. These are exclusion-policy effects, not a human-count accuracy measurement.

The no-exclusion total is a sensitivity query with empty rules, not an activated policy or a saved public report. Verification used separate SELECT calls through Wrangler, with the same closed date window and owner/traffic predicates. It is not a transactional comparison. The contemporaneous live API had no `referralPolicy` field; the candidate was not active during this capture.

## Query cost and scale

The JSON rule payload is 61,161 bytes, the predicate SQL 1,266 bytes, and the adapter uses three bindings. This is below the [D1 statement/string/parameter limits](https://developers.cloudflare.com/d1/platform/limits/). Production EXPLAIN shows materialized hosts/rules and an automatic covering index on suffix candidates. The nine statements reported 9.60–15.88 ms each, 111.17 ms summed execution, and 182,388 summed rows read. The no-exclusion totals query used 7.77 ms and 8,423 rows read; the corresponding candidate totals query used 14.95 ms and 19,826 rows read. This measures added work in one sample, not full Worker latency or a capacity guarantee.

The reproducible local benchmark uses the real `queryStats` builder, production schema, all nine projections, synthetic hosts, and an expected 5% exclusion rate. [Raw results and plans](18-referral-policy-benchmark.json):

| Observations / distinct hosts | Three full-report runs (ms) |
|---|---|
| 10,000 / 100 | 52.51, 49.60, 49.70 |
| 100,000 / 1,000 | 469.35, 490.33, 491.43 |
| 100,000 / 100,000 | 2060.32, 2009.34, 2046.27 |

Command: `node packages/analytics/scripts/referral-benchmark.mjs` after `pnpm -C packages/analytics test`. Node v24.14.1, in-memory SQLite. No timing assertion is added to CI. Host materialization repeats per projection and considers the entire time window even for narrower selections. Monitor actual report latency and D1 read usage before deciding whether an indexed stored policy or materialized report is justified.

## Independent review and acceptance

Two bounded read-only reviews ran alongside parent implementation. The upstream review used GPT-5.6 Terra at medium reasoning; the domain and final implementation review used GPT-5.6 Sol at medium reasoning. Initial detached CLI launches produced no report or exit status and were not treated as successful reviews; native agent reviews supplied the findings. This artifact is the parent's durable acceptance record, not a claim of independent production verification by those reviewers.

- The upstream reviewer inspected pinned list/core/updater source, format, count, checksum, license declarations, and D1 limits. Accepted: pin source bytes; preserve license metadata; use host boundaries; retain the local rule. Its suggested table/batched import was unnecessary after the single-JSON-parameter adapter was verified.
- The domain reviewer inspected `referral-policy.ts`, `referral-sql.ts`, `referrals.ts`, `stats.ts`, importer models/CLI, and evaluator tests. Accepted: separate evidence and decisions; reversible local exceptions; shared predicates; source and policy commitments; exact report snapshots; append-only activation records; no D1 migration at current scale.
- We chose local priority, then host specificity, then exact scope. This permits an explicit local include to correct an upstream false positive and a narrower local exclusion to override that include. The compiler rejects duplicate same-host/scope decisions. A blanket exclude-before-include precedence would prevent some intended exceptions.
- The final reviewer found no release-blocking correctness defect. It identified missing automated commitment/report-capture checks and a missing build gate; both are implemented. It also identified the broader host-materialization cost, which is measured above and retained as a scaling limit.
- Parent review added an ASCII-only normalization boundary: SQLite's `lower()` and JavaScript's general Unicode folding differ on malformed historical strings. A Kelvin-sign fixture now checks evaluator agreement; new HTTP(S) hosts already receive URL/IDNA parsing.

Validation covers every upstream host and 9,409 retained-host fixtures, local overrides, malformed/history variants, every public projection/filter, owner exclusions, all-excluded selections, and a 1,000-name rotation fixture. It also checks changed source bytes, duplicate/conflicting definitions, missing/wrong commitments, mismatched report policies, unapproved public names, and invalid D1 evidence shapes. The release validation records the final test/build results. Interactive/visual browser verification remains unperformed because the session exposes no browser.

The engineering repair preserves the existing retained referral evidence. It does not retain a full original referrer URL, make the whole observation table immutable, identify a sender from a claimed hostname, or prove that an included request is human.

## Final pre-release checks

All 46 analytics tests and 19 blog tests passed, including the three Worker integration tests. Workspace typechecks and a separate strict typecheck of the policy CLI passed. The production build verified the archived source/definition/generated module and built all 24 posts. Documentation links and staged whitespace checks passed for project-authored files. The exact upstream README retains two original trailing spaces; the source archive is excluded from whitespace lint so its verified bytes remain intact. No database migration is required. These results validate the implementation checkpoint; live activation is a separate record.
