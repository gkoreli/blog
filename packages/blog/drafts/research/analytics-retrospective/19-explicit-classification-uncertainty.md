# Exact client declarations and explicit uncertainty

October 27, 2026 UTC. Continues [TASK-0119](../../../../../docs/tasks/TASK-0119.md), the [assumption audit](17-detection-assumptions-and-experiments.md) and [signature evidence release](18-webbotauth-verification.md). The preceding goal turn made concrete progress: signature evidence, native availability, protocol cache hardening, retained-message verification and bounded production acceptance shipped. This iteration addresses the remaining name/conflict/network shortcuts; vendor-source verification and independent accuracy calibration remain separate work.

## What changes and why

The previous named matcher selected the first substring match. `NotChatGPT-Userish/1.0` therefore became ChatGPT-User, and `GPTBot/1.0 ChatGPT-User/1.0` lost the conflicting declaration. Missing network evidence and a hosting-list nonmatch also shared a Browser outcome displayed as a normal network.

New collection/classifier profile **2026-10-27.2** retains every recognized canonical name and matched product alias, browser-family claim, declared category agreement, missing/listed/not-listed network evidence, navigation shape, activation-marker form and a bounded external-referrer/same-origin inconsistency flag. Migration 0013 adds nullable, valid JSON `classification_evidence` with a 2,048-byte budget. No raw UA, unrecognized free-text product, IP, arbitrary URL or signature bytes enter it. No existing observation is reclassified or backfilled. Linked-row retention/privacy questions remain open; the optional diagnostic profile stays off.

| Input evidence | Prospective interpretation |
|---|---|
| Exact single documented product / reviewed alias | Preserve that declaration and its mapped category; no vendor identity authentication. |
| Multiple names, one common category | Retain all names and the common declared category, select no single identity. This includes compatible tools such as Cypress plus HeadlessChrome. |
| Multiple categories | Unresolved; a valid signature does not resolve which unsigned declaration to trust. |
| Recognized browser claim + navigation shape + available unlisted network | Browser, explicitly a rule match. A hosting-list nonmatch is not a residential-network or human verdict. |
| Missing network, unrecognized browser claim, absent/unrecognized Fetch Metadata or contradictory referrer context | Unresolved where those missing/conflicting facts prevent the browser interpretation. |
| Listed infrastructure / archiver / known named client | Preserve its separate descriptive rule and closed network state, not a claim about the operator or human trigger. |

The coarse `traffic_class` column retains its legacy three-value contract. `reader_kind`, its reason, the new evidence and version are the interpretation boundary. Classification uncertainty is no longer forced into the browser/automation partitions. A new public **Unresolved** filter makes five disjoint view groups. Historical kinds keep their groups, including earlier legacy-browser rows under the now-labelled **Automation & legacy rules** filter. Historical navigation reasons now say unlisted **or unavailable**, avoiding the unsupported normal-network claim without rewriting rows.

Local signature failures remain in their own evidence rather than being appended to new role reasons. Historical composite reasons remain untouched. A known declared category survives verification independently; unknown-role signed clients keep the disclosed signed-client fallback. Explicit declaration conflicts survive successful verification.

## Primary sources and borrowed ideas

Checked October 27, 2026; specifications, vendor statements, implementation and site observations are different evidence.

| Source | Applied learning / limit |
|---|---|
| [RFC 9110 §10.1.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-10.1.5), June 2022 | Product names have token boundaries and optional versions. Our detector uses lexical/comment-compatible boundaries, not a full RFC UA parser or identity verifier. |
| [Official OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) | Current GPTBot, OAI-SearchBot and ChatGPT-User examples pass as exact declarations, including compatibility comments. Search/training/user-triggered descriptions do not prove a particular request's downstream use. OAI-AdsBot is a newly documented catalogue follow-up, not silently treated as a training bot. |
| [Google common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | Explicit Googlebot-Image/Video request aliases preserve their family; Googlebot-News has no separate request UA, so no invented alias. |
| [Slack Robots](https://api.slack.com/robots) | Distinguish link expansion, image proxying and the general robot. New Slackbot is other-bot; specific link/proxy declarations remain preview/service fetches. Retained historical Slackbot preview rows remain filterable through explicit compatibility validation. |
| [Exa](https://crawler.exa.ai/) and [Ahrefs](https://ahrefs.com/robot) | Their published examples, including Ahrefs' mobile audit UA, retain the earlier accepted names and role distinctions. Exact declaration matching still does not authenticate them. |
| [W3C Fetch Metadata WD, September 21, 2026](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) | Headers describe context and emission conditions. Remove the claim that engine-version thresholds prove emission on every request. Unknown modes and absent metadata abstain rather than prove automation. |
| [isbot source, pinned 3f9c982](https://github.com/omrilotan/isbot/blob/3f9c982acd95b1be033fa3c14b2a7ece565ba10a/src/index.ts) | `findBotMatches` / `findBotPatterns` retain all matches. Borrow the all-match principle; our named detector uses its own reviewed product catalogue and does not import isbot's broad patterns or claim they authenticate identities. |

The whole existing catalogue receives boundary-positive/negative tests, not a fresh vendor-role certification. Meta's current crawler page returned 429 in this check; its earlier reviewed aliases remain explicitly inherited. Unknown future variants may abstain. The legacy FacebookBot key denotes the existing facebookexternalhit/Facebot family mapping, not a literal match of every similarly named product. No new dependency or bulk third-party regex dataset is introduced.

## Retained spike replay

The [new aggregate replay](r1-classification-v2-replay.json) reuses the exact private native export committed by hash in [research 15](15-native-input-recovery.md). All 381 valid records remain accounted for; no duplicate IDs, missing IDs or truncation flags appear in this export. Source hashes pin the new rules and extractor. The old [381-Browser result](r1-native-replay.json) is preserved.

- 118 records report an external referrer with same-origin Fetch Metadata and now replay as Unresolved; 263 still match Browser.
- Among the 375 HTTP 200 records, 117 replay as Unresolved and 258 as Browser. The other six records are redirects; a successful native invocation is not itself an eligible page event.
- All 381 network values are list nonmatches, not residential-network confirmations. None declares a recognized named client.

This is an offline rule comparison. It changes no stored history, identifies no operator, establishes no maliciousness and supplies no human/bot error rate. Header rewriting or unusual clients can contribute inconsistencies. Retention/sampling, representation eligibility and the original D1/log population difference remain unresolved. Raw messages and the R1 name stay outside Git under the existing October 31 investigation-copy review.

## Checks and next bounded work

The analytics suite adds adversarial boundaries across the full catalogue; explicit compatible and conflicting multi-name cases; signed-conflict preservation; missing/invalid/unlisted/listed networks; unknown browser/context states; privacy canaries and worst-case JSON size; migration/history preservation; five-way report partition/exclusions; and legacy Slack filter compatibility. A [native local acceptance helper](check-classification-local.mjs) exercises actual collector/persistence/reporting, including real ephemeral Ed25519 signatures with locally injected public-directory responses. The compiled collector/verifier runs in Node 24.14.1, with D1 executing in workerd; this does not accept production Worker crypto interoperability. Synthetic signer examples do not authenticate Exa or any vendor.

Production migration, code push, activation, served UI/API/article and prospective writes require separate acceptance. No current claim of completed rollout follows from source or local tests.

Remaining full-goal requirements: distinguish invalid/unsupported/unavailable verification outcomes in public reporting; verify vendor claims using documented IP/DNS or signature methods with method/source provenance; accept organic post-release signed coverage persistence; broaden independently labelled browser/automation/device/network trials and report error/abstention with explicit denominators. Current device_type's default desktop remains a separate interpretation gap to repair; no physical device authentication is claimed. Raw-input retention and native/private availability still constrain historical replay. Do not mark the overall analytics-understanding goal complete from these classifier fixtures.

The earlier twelve-case probe is frozen to its recorded classifier/source; run that checkout to reproduce its original assertions. This audit, current regression tests, cohort analyzer and native helper own the new behavior. No historical expected result has been silently overwritten.

[Source checks](classification-source-checks.json) pass: 107 analytics tests, 106 site tests, workspace types, 183 changed-document relative links and an isolated 31-post build. Article 1,248 words, one H1, 30 prompts. The complete 47-name/50-product evidence set fits the JSON budget, including longest derived states. [Native D1](classification-local.json) accepts twelve actual collector trials, three real ephemeral-key signature verifications, migration/history preservation, five-way partitions and the exact prepared report. [Pre-release acceptance](classification-pre-release.json) records migration 0013 applied and the Unresolved report SELECT at 32,150 reads/zero writes, within its 50,000 ceiling. Source activation and prospective production collection remain to accept.

## Production classification acceptance — October 27 UTC

[Release receipt](classification-release.json) records source `4aa74d4`, its exact native build and 100% activation at 15:42:37 UTC. A prior 400 from the Unresolved API occurred while another publication's older build was active; it was not treated as a classifier failure or retried as an expensive report. The accepted live API, article bytes and three prospective controls establish the new behavior separately from Git delivery. Concurrent publication commits are preserved.

Three unsigned /privacy controls under the matching exclusion policy stored the lookalike/no-name outcome, incompatible-category Unresolved outcome with both names, and compatible headless category with both names and no selected identity. The [exact production SELECT](classification-control-production.sql), validated with [labelled local fixtures](classification-control-local.json), read six rows and wrote zero. Actual evidence sizes were 327–415 bytes; optional structured capture remained absent in all three. These are synthetic controls, not organic vendor/human evidence.

A fresh seven-day Unresolved /privacy report shows zero public views and two referral exclusions, matching the two private Unresolved controls. A global Unresolved report also passes identical-byte HIT reuse. The browser renders the two exclusions without console errors. However, empty-result rendering hid scope chips and calculation time. The small UI repair is implemented with fresh types, site tests and integrated build; its own activation/browser acceptance remains pending.

The final isolated build now includes all 32 posts from the combined checkout, including the concurrent Bun AOT publication. The original 31-post overlay check was narrower; the current [source receipt](classification-source-checks.json) records both. The analytics article remains 1,248 words and 30 prompt-source messages. Acknowledged direct acceptance SELECT work is **32,156 reads, zero writes**; report fills, migration bookkeeping, three observation writes and unrelated account work are additional.

## Final UI acceptance

The [same release receipt](classification-release.json) now separately accepts UI source `ff0d663`, native build `d139783f`, and 100% activation at 15:56:32 UTC. The empty Unresolved /privacy view shows its page scope, calculation time, zero included views and two exclusions. Clearing the page scope and browser Back both work; old calculation metadata is hidden during loading. Fresh types, 106 site tests and the full 32-post build pass. The live index contains 32 posts and the analytics article retains 30 prompts. No new observation controls or direct SELECTs were needed for this UI acceptance. The archived pre-fix screenshot and final screenshot distinguish the discovered issue from the accepted behavior.

Completed this iteration: exact/all-match declarations, compatible versus conflicting category handling, missing/list/nonmatch network facts, prospective evidence, Unresolved reporting, preserved history, same-input R1 replay, twelve local collector trials, three production controls, public exclusion, cache/article acceptance and empty-report disclosures. Next bounded work remains documented vendor-source verification and independent invalid/unavailable outcomes, followed by labelled human/device/network error and abstention experiments. The overall goal remains active; these rule fixtures do not establish population accuracy.
