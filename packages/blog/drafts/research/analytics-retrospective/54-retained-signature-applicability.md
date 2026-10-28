# Did the stricter signature checks change retained counts?

October 27 Pacific / October 28 UTC. Continues [the summary-consistency repair](53-consistent-signature-summary-denominators.md). Human trials remain deferred.

**No compared claim changed in the retained detailed population.** Research 53 proved a query weakness with malformed synthetic records; this census does not find those counterexamples occurring in the fields it checks. That distinction matters: a useful safeguard is not evidence that production traffic was previously inflated.

## Count the missing evidence too

The [census receipt](signature-applicability-production.json) inventories **32,363 retained rows** at or below a private maximum ID returned by the preflight. It assesses every non-null signature-evidence record in that bounded population, including excluded records.

| Raw retained evidence state | Rows |
|---|---:|
| Detailed verification record | 281 |
| Verified flag without a detailed record | 1,181 |
| Unverified flag without a detailed record | 109 |
| Neither detail nor stored signature status | 30,792 |

The census inventories stored observations, not all delivered requests; best-effort write failures remain outside it. These categories describe storage. Missing status cannot become an unsigned verdict, a failed verification or a person. Detailed records also include explicit absence/failure results; 281 is not a verified-signature count.

The fixed event-time cutoff is **October 28 05:22 UTC exclusive**. The inventory contains 32,362 rows before it and one after it, with no unrecognized timestamp formats. Its earlier date bands contain 32,272 before research 31's cutoff, 87 from that cutoff to research 52's cutoff, and three more before this cutoff. These agree with earlier raw counts where comparable, but do not prove identical rows or original insertion history. The preflight and census counts agree within the private ID bound.

## What the detailed population supports

All **281 detailed records** are assessed: 212 included, 45 owner-excluded and 24 referral-excluded under the current policy. One included record is after the fixed cutoff. The canonical included cohort before it therefore contains **211** detailed records: **184 absent** and **27 verified** local outcomes. None is unrecognized by the implemented local-result checks; no stored coverage or native-boolean record in the detailed population fails its tested consistency/type conditions.

The twelve compared predicates cover local verified outcomes; coverage availability; User-Agent, method, resource and authority-only binding; native availability/positive flags; documented-origin matching/applicability; and candidate-selection availability. Their old/new claim bits match for every detailed record, including exclusions. This is a twelve-predicate applicability result, not a universal schema or detector-accuracy audit.

All **27 included detailed verified results describe host-only request binding**. None records User-Agent, method or resource coverage. Twelve use verifier `.27.6`, two `.28.1`, three `.28.2` and ten `.28.6`; all precede current `.28.7` and the current collection profile. The five included current-profile records before the cutoff record no signature headers. Stored results are not current cryptographic replays, unique actions or authenticated purposes. The [earlier nonce-type admission gap](51-signed-parameter-types-and-freshness.md) can produce internally coherent metadata. This census cannot count historical malformed-nonce admissions because routine rows omit nonce types and complete signed inputs. [Three previously retained chains](49-current-verifier-vendor-evidence.md) remain a separate, much narrower replay result.

Native verification booleans are **unavailable in all 281 detailed records**. That means neither false nor that Cloudflare did or did not run its verifier. The [native-signal boundaries](25-native-category-and-entitlement.md) still apply. Source identities, human triggers and readership cannot be recovered from a missing field.

## Make the method reproducible and bounded

The [helper](../../../scripts/check-signature-applicability.mjs) performs a cheap raw inventory and assesses JSON only in the detailed subset. It reuses the production referral evaluator, owner precedence and current closed projectors. Twelve old predicates are independently checked against the pinned `8b35baa` full native report; current predicates match the current full report on the same 28 controls.

[Native acceptance](signature-applicability-native.json) exercises owner/referral overlap, date boundaries, impossible dates, missing history, empty results, malformed/duplicate aggregates and private/fabricated values. Textual ID bounds preserve adjacent integers above JavaScript's exact range. The concrete SQL path matches the parameterized path, and injection-shaped bounds are rejected. Closed claim masks are reconciled with their independently projected states.

The reviewed preflight limits are 40,000 rows, 4,096 detailed records and 16,384 referrer-label steps. Native ordinary/deep-referrer scale fixtures use 277,646 and 285,326 combined reads. The **400,000-read review threshold is post-execution, not a database-enforced cap**. Actual preflight values—32,363 rows, 281 detailed and 84 label steps—pass before the main query runs.

Exactly two production SELECTs use Wrangler `--command`, with SQL supplied as one argv value from private preparation. The preflight costs **32,363 reads**; the census **110,119**. Total **142,482 reads / zero writes**, with one provider-reported attempt each. No cold public report or eligible page visit is generated for this data investigation. Earlier public fills and ordinary collection remain additional work.

[Fresh primary documentation](signature-applicability-sources.json) distinguishes database read visibility from a historical snapshot, and query work from returned observations. A private maximum ID bounds later inserts; it does not freeze older rows against updates/deletes. Inventory and assessment share one census statement, while preflight and census have no shared held transaction. Equal counts do not authenticate exact membership. The database's earlier 1,773,146-read rolling 24-hour metric is neither UTC-day/account-wide headroom nor attribution to this task.

## What changes next

The report repair remains useful, with its known 30% native-fixture read increase, but this census supplies no measured production overcount from the tested weakness. The main article now links the raw/detail denominator while retaining its short form. No runtime, classifier, verifier, schema, capture setting or historical row changes here.

[Checks](signature-applicability-checks.json) accept fresh fixture compilation, the native controls/scales, saved-result revalidation, post validation and the isolated 32-post build. The article remains 1,199 body whitespace words with its thirty-one shaping prompts unchanged. Stats JavaScript and CSS match the prior accepted release. Unchanged runtime suites retain research 53 acceptance; no fresh runtime-suite pass is claimed for this diagnostic/content-only slice. Source delivery, activation and served article equality remain separate publication gates. Private raw responses, SQL, ID bounds and operational captures stay outside Git in `2026-10-28-signature-applicability-pre-release`: 27 files, restrictive 0700/0600 modes and a hash manifest. October 31 is a review date, not automatic erasure. Human/device accuracy, R1 attribution, native cryptographic agreement and privacy/retention decisions remain open under [the goal audit](45-goal-and-method-coverage-audit.md).

Next bounded engineering action: expose measured report-calculation cost separately from cache reuse. Previous live fills do not expose their D1 meter; that is a concrete visibility gap. Reuse this census rather than repeating a broad query to support the same claims. Human trials remain deferred and the full goal stays active.


[Publication acceptance](signature-applicability-release.json) closes source `1d2acc7`, exact downloaded-build-log Worker `7a96e021`, and the source-linked Ready/100% deployment row. The served Markdown matches the isolated 1,199-word article. One collection-ineligible GET adds no diagnostic SELECT or stats fill; direct investigation cost remains 142,482 reads / zero writes. No new tail, preview server or viewport override was started. Optional bindings were not re-inspected in this diagnostic/content-only release. Raw publication/build captures are preserved in the second private archive with its hash manifest.

This closes the census and publication slice. It does not close the broader goal or turn stored-profile consistency into current cryptographic acceptance. Next remains report-calculation cost visibility, with cache reuse kept separate. Human trials remain deferred.
