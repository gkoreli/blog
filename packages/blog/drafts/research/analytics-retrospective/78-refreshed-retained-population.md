# The refreshed census covers 33,189 retained observations

October 29, 2026 UTC. Continues [Research 77](77-direct-signed-bots-and-registry-evidence.md). The prior turn delivered the offline native comparison capability. This iteration refreshes the **entire retained `page_observations` population** and separately counts rows above Research 64's frozen ID boundary. It does not infer people, request-level managed-verifier agreement or fresh cryptographic validity from stored labels.

## One reconciled retained population

The main SELECT executes at **06:02:26–06:02:28 UTC**, with a maximum ID frozen by the preceding preflight. Its **33,189 rows** have canonical event timestamps from March 7, 01:10:23 through October 29, 05:57:57 UTC. All have recognized stored kinds and non-empty reasons. Zero observed composition gaps do not prove those classifications correct.

| Current inclusion | Observations |
| --- | ---: |
| Included | 33,020 |
| Owner-excluded | 59 |
| Referral-excluded | 110 |
| **Retained total** | **33,189** |

The included total spans **30,456 edge observations and 2,564 legacy beacons**. Collection methods and classifier eras differ. This is not a homogeneous readership-growth series. The separate original `page_views` archive is not counted again. [Closed production data](retained-population-production.json) retains each population partition and evidence distribution.

The **114 rows above the previous frozen ID boundary** contain 110 included, four referral-excluded and no owner-excluded observations. The other 33,075 rows remain separately grouped. Their count agrees with the old baseline plus its 712-row increment; matching counts do not prove old-row identity or immutability.

| New-ID included stored kind | Observations |
| --- | ---: |
| Other bot | 36 |
| Browser | 22 |
| Cloud browser | 20 |
| AI search | 14 |
| Unresolved | 9 |
| AI crawler | 7 |
| Search crawler | 2 |
| **Total** | **110** |

All 110 included new-ID observations are edge records. They span rollout eras: 63 carry verifier `.29.1` and 47 carry `.28.7`. An insertion boundary is not a current-version filter or an event-time cutoff. The table preserves those stamps rather than relabelling every new record with today's implementation.

## More current evidence, the same important unknowns

| Included stored signature basis | Observations |
| --- | ---: |
| Verification detail not recorded | 30,806 |
| Verified outcome without proof/coverage detail | 1,181 |
| No signature headers recorded | 944 |
| Detailed verified outcome, User-Agent unsigned | 86 |
| Local result not verified | 3 |
| **Total** | **33,020** |

All 86 detailed verified outcomes record authority-only request-target binding: no User-Agent, method or resource coverage. The new-ID included population contributes seven of these outcomes and 103 unsigned records. This census reuses stored projectors; it performs no new signature replay. [Research 75's 52 replayed inputs](75-frozen-signed-cohort-and-export-boundaries.md) remain a separately accepted cohort.

Across **all retained rows**, native booleans are unavailable in 1,107 records and unrecorded in 32,082. There is no available native assessment from which to compute agreement or a negative-verdict rate. Three multiple-declaration/category records remain in the raw population; none is included. None of the nine newly included Unresolved labels receives an independent truth label here.

The old proof-detail gap remains **1,181 included outcomes**, while the legacy signed-client Exa group remains **1,025**. This query groups signer names and overall name-presence states separately; it does not repeat Research 31's exact Exa-name intersection. Its older precise role-gap finding remains dated evidence. Filled reasons and coherent JSON do not establish original role, operator or human trigger.

## Test the full selection before paying for it

The [maintained helper](../../../scripts/check-retained-population.mjs) reuses Research 64's signature, native, network and referral projectors. Its guarded SQL adaptation removes the lower-ID floor, adds the previous-ID partition and retains source, reason presence, declaration agreement, legacy signer/name presence and owner/referral overlap. All projected dimensions use closed vocabularies. No raw IDs, names, referrers, signing origins or arbitrary reasons leave the census.

The old decoder accepts an explicit reviewed row/group limit while preserving its original defaults. It still accepts the archived 712-row result unchanged. Native D1 fixtures exercise 28 signature and 40 network cases, report parity, negative/zero IDs, exact adjacent integers above JavaScript's safe range, impossible timestamps, owner flags/client marks, exclusion overlap, duplicate/reordered groups and unknown values. A first key-order assertion fails locally, then passes after correction; no production SQL runs during that repair.

The **65,536-row scale fixture** contains 4,096 detailed records and 126,976 referral-label steps. Preflight plus census costs **1,100,684 native reads and zero query writes**. A sentinel rejects 65,537 rows. Reviewed production bounds are 65,536 rows, 4,096 detailed records, 131,072 label steps and 1,024 groups. The concrete SQL is 93,083 bytes, below the [documented 100,000-byte limit](https://developers.cloudflare.com/d1/platform/limits/). [Native acceptance](retained-population-native.json) records the conditions, not a universal cost guarantee.

## Execute three read-only statements once each

Fresh Wrangler metadata matches the configured DB resource and reports replication disabled. Its 2,417,450 rolling database reads do not establish UTC-day account headroom. [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) meters query work rather than returned rows. [Read-replication/session documentation](https://developers.cloudflare.com/d1/best-practices/read-replication/) does not turn separate CLI requests into a held snapshot.

An immutable eleven-file archive precedes every production SELECT. A separate five-file archive preserves the accepted preflight and concrete main SQL before the census runs. The main preflight finds 33,189 rows, 1,107 details and 8,079 label steps, within the native-tested bounds. Main counts and detail counts match that preflight.

| Wrangler `--command` statement | Reported reads | Writes | Provider attempts |
| --- | ---: | ---: | ---: |
| Constant access control | 0 | 0 | 1 |
| Bounded full-table preflight | 33,189 | 0 | 1 |
| Frozen-maximum census | 388,237 | 0 | 1 |
| **Total** | **421,426** | **0** | **3** |

Each reports no database-change flag. SQL is passed as one subprocess argument, without shell interpolation or a remote file import. The 1.5-million-read review threshold is not server enforced. No retry, own-site request or public-report fill is used for the data investigation.

The maximum ID excludes higher inserts; it cannot freeze old edits/deletions, recover failed writes or prove all historical HTTP deliveries were collected. The SELECT uses a row-count sentinel as well as a frozen maximum, with no subtraction of IDs to manufacture a population count. Matching separate counts remain consistency evidence.

## Article and remaining work

The retrospective replaces its old whole-table paragraph with this dated population, exclusions and method boundary. It stays **1,376 words with 31 unchanged shaping prompts**. Title, metadata, main claim and unresolved human measurements remain intact. [Checks and delivery](retained-population-checks.json) separate source publication from served acceptance.

This refresh closes the stale whole-population audit gap at the stated boundary. Whole-history cryptographic correctness, native managed-verifier agreement, R1 attribution, applicable privacy decisions and human/device/actual-JavaScript-off/RUM accuracy remain open. Human-operated trials remain deferred.

Next: explain the nine new-ID Unresolved labels and declaration/method coverage without another population scan. Publication acceptance uses ineligible requests and is recorded separately. Raw operational captures, exact bounds and SQL stay in restricted archives with October 31 review, not automatic erasure.
