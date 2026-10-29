# Nine unresolved requests, and a diagnostic that hid older evidence

October 29, 2026 UTC. Continues [Research 78](78-refreshed-retained-population.md). This iteration reuses its **exact 114-row new-ID slice**. No population scan, new observation, human trial or classifier change occurs.

## What the nine stored labels mean

| Stored Unresolved reason | Included observations | Retained browser-family claim |
| --- | ---: | --- |
| Fetch metadata absent | 5 | Four Chromium, one Firefox |
| Unrecognized browser claim | 4 | Unrecognized |
| **Total** | **9** | |

All nine lack a recorded fetch mode and activation claim, have incomplete retained navigation shape, and record absent signatures. Six have the current classifier stamp; three have another coherent recorded stamp. None has a request-context-conflict label. These facts explain the stored abstentions without proving the original wire headers, complete rule premises or who operated the request. Browser-family claims alone cannot recover the discarded UA versions that the classifier's capability heuristic used.

The dated [Fetch Metadata Working Draft](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) describes request mode, destination, origin relationship and activation. It omits `Sec-Fetch-User` when a navigation lacks activation; [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-User) documents that omission too. Missing activation therefore supplies no human-versus-bot verdict. The specification's [redirect rules](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/#redirects) also make context interpretation depend on the request chain. We do not reconstruct a chain from these minimized fields.

Its linked WPT folder returns 404 through the web reader in this review. No new browser conformance test is claimed. Earlier [agent-operated input trials](30-filter-pointer-targets-and-browser-trust.md) remain separate evidence that browser trust/activation is not human authentication. Detector error rates for these nine requests remain unmeasured.

## The same cohort has 23 named declarations

The method query reconciles **114 retained, 110 included and four referral-excluded rows**, with no owner exclusion. Twenty-three included records have a named declaration; 87 have none. No missing, multiple or unrecognized declaration record occurs after structural validation.

| Named declaration | Included | Currently configured method |
| --- | ---: | --- |
| ExaSearchBot | 7 | Signing-origin comparison |
| Meta-WebIndexer | 6 | None |
| PetalBot | 4 | None |
| Amazonbot | 3 | Published-IP source |
| Applebot | 1 | Published-IP source |
| Googlebot | 1 | Published-IP source |
| YandexBot | 1 | None |

**Twelve named observations have a current configured method; eleven do not.** This compares stored declarations with today's registry. It does not assert that a method existed at collection time or that every configured method ran. Only one Amazonbot and one Googlebot record have a stored listed-address outcome. The remaining records are not thereby proven impostors.

All seven verified outcomes declare ExaSearchBot and have matching stored signing-origin comparisons. None declares ExaUser. [Exa's documented crawler/user distinction](77-direct-signed-bots-and-registry-evidence.md) remains applicable to the declaration, while Research 78 records that all seven leave UA/method/resource unsigned. This query supplies no new cryptographic replay or authenticated human trigger. All selected stored names agree with their single-candidate projections or unselected state; that checks storage consistency, not original UA parsing.

## Currentness was being confused with record coherence

The earlier client-method helper requires its inner classifier stamp to equal today's constant. The earlier reason helper substitutes `profile-not-current` for older reasons. Those defaults deliberately limit interpretation, but would conceal useful stored facts in this mixed cohort: **58 included records carry an older coherent stamp**, including three of the nine Unresolved records.

The new [offline cohort helper](../../../scripts/check-retained-cohort-context.mjs) leaves those old helpers and receipts unchanged. It separately checks the envelope version, inner stamp type/length, and equality with the stored classifier column. Current, other-recorded, conflicting, unrecognized and missing states stay distinct. Candidate arrays still require closed names, correct cardinality and no duplicates. An arbitrary coherent stamp is **other-recorded**, never proof of reviewed historical code.

Historical reasons are literal closed stored labels. Retained request-context matching remains restricted to coherent current records; older context stays unassessed. Counts do not rewrite history or promote unknown records to valid identity. The module is a diagnostic script, absent from collection and public reporting.

Sixteen native fixtures cover coherent old records, unreviewed stamps, conflicts, missing stamps, duplicate candidates, retained context contradictions, exclusions, unknown strings and exact adjacent large IDs. The first run stops at a SQL-whitespace guard; a later fixture INSERT has an extra placeholder. Both are corrected locally before any production SELECT. The accepted 114-row scale uses **16,864 reads and zero query writes** across the two diagnostics. [Native results](cohort-context-native.json) preserve the tested scope.

## A CLI zero can hide unavailable source data

Fresh Wrangler metadata identifies the configured database with replication disabled, but reports **zero** for all four rolling usage counters. The preceding census's direct receipts report 421,426 reads. These are contrasting captures; the cause of the zero remains unestablished.

The installed Wrangler **4.71.0** implementation initializes those counters to zero and conditionally adds optional GraphQL groups. Missing expected data/groups can therefore survive as zero-valued JSON. A zero alone does not distinguish observed zero usage from missing source coverage.

The official [npm package metadata](https://registry.npmjs.org/wrangler/4.71.0) lacks `gitHead`. We instead verify the published archive's SHA-512 integrity and establish byte equality between its `wrangler-dist/cli.js` and the installed bundle. No downloaded code is executed. [Source commitments](cohort-context-sources.json) pin the package, integrity and bundle hash. They establish the fallback mechanism, not the raw GraphQL response or actual cause in this request.

The maintenance guidance now preserves this ambiguity. Investigation costs use returned statement meters; neither this zero nor a rolling database total establishes account-wide headroom.

## Cost, delivery and limits

An immutable twelve-file plan archive precedes all production SELECTs. Exact bounds are recovered from the hash-checked Research 78 data archive. Every query uses Wrangler `--command` with SQL passed as one subprocess argument, no remote import and no retry.

| Statement | Reads | Writes | Provider attempts |
| --- | ---: | ---: | ---: |
| Constant control | 0 | 0 | 1 |
| Context/reasons | 7,573 | 0 | 1 |
| Client methods | 9,242 | 0 | 1 |
| **Total** | **16,815** | **0** | **3** |

The 20,000-read review threshold is not server enforced. Current inclusion and expected counts reconcile with the earlier census, without a held snapshot or old-row immutability claim. [Closed production results](cohort-context-production.json) and [checks](cohort-context-checks.json) retain the methods and limits. Raw captures, exact bounds, failed attempts and source archives remain outside Git with restricted modes and an October 31 review date, not automatic erasure.

The 1,376-word retrospective and its 31 shaping prompts remain unchanged. This detail stays in linked research rather than expanding the article. Native-verifier agreement, the historical proof gap, R1 attribution, privacy decisions and human/device/JS-off/RUM accuracy remain open; human-operated trials remain deferred.

Next: reconcile already recovered proof cohorts with the seven signed ExaSearchBot outcomes in this slice before retrieving more inputs. Preserve their exact storage references and profile boundaries; a stored verification outcome cannot close its own replay gate.
