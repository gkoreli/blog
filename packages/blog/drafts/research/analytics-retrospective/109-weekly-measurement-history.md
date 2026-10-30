# Put measurement history beside the traffic trend

October 30, 2026 UTC. Implements [Research 108's measured visibility gap](108-decision-evidence-and-measurement-history-audit.md). The prior turn was progress. Local implementation and acceptance follow; source delivery, deployment and live report/cache/cost acceptance remain separate.

## What changed

The readership report now includes joint counts by **collection stamp, classifier stamp, observation source and representation**, with four completed-week counts, an independent total and an unknown-time count. Current article paths and the non-article remainder partition the same selected Browser events. Existing totals, source selection, exclusions and rankings stay unchanged.

A native Measurement history disclosure sits beneath the weekly comparison. Choose the whole site, article subset or an individual article without another API request. Grouping the four dimensions together preserves changes that separate marginal counts could hide. Missing stamps stay unrecorded. Only a bounded canonical date/revision grammar is displayed; arbitrary text becomes unrecognized. Recognizing a stamp's syntax is not reviewing its implementation.

The scope matters: **these are events already selected as stored Browser signals**. Their history cannot reveal requests that an older rule classified elsewhere or failed to store. Equal stamps do not prove comparable audiences, stable delivery conditions, human identity or unchanged behavior. No row is reclassified or backfilled, and no new reader data is collected.

## The paired experiment now exposes the difference

The [maintained native diagnostic](../../../scripts/check-readership-profile-ambiguity.mjs) pins both the prior report and its contract at `1af6696`. Sixteen constructed events carry two syntactically valid classifier stamps. Mixing both stamps every week versus switching halfway still produces identical prior reports. The new history distinguishes those distributions while **all pre-existing report fields match**.

The original Research 108 fixture used the noncanonical names `fixture-A/B`; that dated evidence remains unchanged. The new fixture uses canonical date/revision strings to test the displayable branch. Arbitrary unsupported names intentionally fold into unrecognized, so this repair does not promise to distinguish their raw values.

[Native results](readership-history-native.json) also check thirteen independently labelled record cases: article/non-article scopes, missing stamps, invalid calendar dates, revision bounds, edge/beacon sources, HTML/Markdown/missing representation, unknown times and exclusions. Sixteen contract negatives and eight native-row mutations reject missing/duplicate/mis-scoped groups, malformed payloads and contradictory counts. An initial oracle comparison mistakenly depends on JSON property order; canonical key comparison fixes the harness. A separate negative initially changes an already-null classifier to null; targeting a nonnull record makes it a real mutation. Both failures remain private.

## Reconciliation and cost

The single query reuses the selected relation and adds grouped history. Each group has a separate COUNT total and four weekly SUMs. Server and browser validate closed fields, unique keys, allowed stamp/source/representation states and exact per-article/non-article totals. BigInt intermediate sums prevent overflow from making contradictory safe-integer marginals look consistent. History also reconciles the existing count of missing classifier stamps. Structural consistency does not authenticate underlying requests.

| Same 512-row native relation | Prior reads | New reads |
|---|---:|---:|
| Missing classifier stamps | 12,428 | 13,459 |
| Two repeated classifier stamps | 12,428 | 13,460 |
| Distinct classifier stamps | 12,428 | 13,970 |

These constructed fixtures have unrecorded collection stamps; their costs are not production predictions. The [matched 32,768-row / 256-article fixture](readership-history-scale.json) rises **540,506→607,898 reads (+12.5%)**. Report statements write zero; seeding is separate work. Common output matches the pinned baseline. The older helper's compatibility projection explicitly strips the additive history/version fields, while the new diagnostic retains every old field, including article concentration. No production saving or global read cap is claimed.

SQL remains one statement, 7,300 bytes and six bindings. The added JSON object uses twelve arguments and its array four; the stamp GLOB is 42 bytes. These fit [D1's documented limits](https://developers.cloudflare.com/d1/platform/limits/). [SQLite's JSON contract](https://www.sqlite.org/json1.html) supports typed nested arrays; its [date functions](https://www.sqlite.org/lang_datefunc.html) provide formatting/modifiers rather than a dedicated date type. Canonical spelling/calendar acceptance is our explicit rule, checked in both engines. [Cross-references](readership-history-sources.json) connect those contracts and the earlier Matomo context idea to code and controls.

## Browser, build and remaining acceptance

[Browser checks](readership-history-browser.json) match every rendered cell across site, article-subset, article-A, article-B and zero-event scopes: 8/6/5/1/0 rows. Scope changes make no additional API request. Keyboard collapse and pointer reopen pass. The final 1,280px view has 728px client/scroll width; at 390px, document width stays 390 and the focusable 354px region scrolls its 720px table by keyboard. A 44rem minimum initially overflows because the root font is 18px; 40rem plus narrower cell spacing fixes desktop containment. Initial selector, cross-realm comparison and probe-authoring mistakes are preserved separately from product behavior.

Missing history, contradictory counts and HTTP 503 each hide the report; retry restores the accepted fixture. The final compiled JavaScript matches the bundle used for every scope comparison. These are automated local checks on synthetic report data, not production layout, physical-device or human trials.

[Checks](readership-history-checks.json): 319 analytics tests, 166 site tests, workspace types, 22 Markdown validations, isolated 33-post build and Worker dry-run pass. An initial build stops at sandbox-denied tsx IPC; the permitted isolated build passes. An attempted preview before build success exits without listening. All owned previews are terminal, the last port is unreachable, temporary tab closed and viewport reset. Private environment files are not copied; workspace dependency links are shared and public build configuration is synthetic.

Report/cache version advances to `2026-10-30.2`. Full stats, collector, classifier, verifier, schema, exclusion policy, article and prompts remain unchanged. This slice makes no production request or SELECT, adds no human label and activates no raw capture. The private archive receipt in the checks preserves programs, failures, source/build snapshots and synthetic screenshots; October 31 is review, not automatic deletion.

Next: accept this exact source/build/Worker allocation, canonical public report, ordinary cache behavior, assets and returned calculation meter under a frozen bounded plan. Do not force cache fills or recensus raw traffic to publish the feature. Human trials remain deferred; search, native-provider, purpose/authenticity and privacy/retention gaps remain open. The broader goal stays active.
