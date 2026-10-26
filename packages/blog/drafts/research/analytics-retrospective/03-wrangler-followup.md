# Wrangler follow-up: the R1 cohort and lost agent roles

October 25, 2026 Pacific / October 26 UTC. This extends [the earlier audit](../edge-vs-rum/05-analytics-audit-2026-10-25.md) after the owner asked about deterministic attribution, stronger agent identity/purpose evidence, and using Wrangler to analyze our data. The earlier report remains a frozen capture; this document adds a narrower read.

## Method and budget

Used the repository's installed **Wrangler 4.71.0** with its ordinary existing CLI authentication. No credential file was extracted and no direct authenticated GraphQL request was made. Read `d1 info`, the top five `d1 insights` SQL shapes by reads over its rolling day, and deployment history, then executed six SELECTs through `d1 execute --remote --json --command`.

The [SQL templates](wrangler-followup.sql) bind the private R1 hostname. The hostname, raw query arguments and raw results remain in the private `analytics-evidence/2026-10-26-analytics-retrospective/` archive. Public [sanitized results](wrangler-followup.json) contain the evidence and capture commitments without the hostname, IPs, full UAs or daily IDs.

The audience window is **September 27 00:00 through October 26 01:03:18 UTC, end exclusive**, fixed at the original Browser report's calculation time. This is not a later rolling report or an exact cross-source transaction. The six remote reads ran at **01:18:08–01:18:13 UTC**; the `clock` result preserves the server time.

Before production, Node SQLite accepted the SELECT templates and an isolated Wrangler/Miniflare local D1 fixture checked the target, same-day context, owner exclusion and exact cutoff. Local D1 returned only duration metadata; the initial harness incorrectly required production metering fields. We corrected that validation against the saved successful local results, then checked the actual fixture rather than inventing local read counters. The first restricted local-runtime attempt could not open its local connection; the permitted isolated rerun succeeded.

| SELECT | Metered reads | Row writes |
|---|---:|---:|
| Server clock | 0 | 0 |
| R1 daily distribution | 40,716 | 0 |
| R1 recorded request shape | 40,719 | 0 |
| R1 daily-ID context | 58,278 | 0 |
| R1 hourly distribution | 40,716 | 0 |
| Stored signature/name/role outcomes | 32,638 | 0 |
| Total | **213,067** | **0** |

The follow-up stayed within its 300,000-read ceiling. Combined with the earlier direct-SQL audit, measured work is **630,169 reads**. Public report fills and other account activity are additional; this is neither an account-wide total nor the entire day's cost.

Wrangler's new `d1 info` capture returned zero for every rolling 24-hour query/read/write field, while the separately captured limited `d1 insights` profile contained nonzero reads and the SELECT receipts also recorded nonzero work. Preserve both responses. Do not turn that summary into zero traffic, zero cost, or proof of a quota reset. The profile is only five SQL shapes and neither source is a complete UTC-day account ledger.

## R1: a definite cohort, an unidentified actor

The query reproduces **397 Browser HTML events**, seven UTC dates and 28 destination paths. The 397 distinct daily IDs each have exactly one recorded event in this inspected public population: the context join finds **no additional events** for those IDs, including internal navigation or a different supplied referral. A changed address/User-Agent or UTC day changes the identity, so this is not proof that no person or automation continued elsewhere.

All 397 have `navigate`, `document`, an HTML-acceptance flag, an Accept-Language flag, `Sec-Fetch-User = ?1`, request-sourced ASN, and no stored signature outcome. Their other request-context claim differs:

| Stored `Sec-Fetch-Site` | Events reporting external R1 |
|---|---:|
| `cross-site` | 138 |
| `none` | 135 |
| `same-origin` | 124 |
| Total | 397 |

The [Fetch Metadata specification](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/#sec-fetch-site-header) defines these as context relationships, with `none` for user-agent-initiated cases without a responsible site. These combinations do not support treating all 397 events as ordinary cross-site clicks from R1. Header modification, synthetic clients and other context differences need investigation; the retained flags alone do not allocate those explanations or authenticate the actor. The 138 cross-site declarations do not authenticate referrals either.

October 24's 286 events span 01:06:15–22:57:13 UTC and 21 paths; the largest hourly bucket has 69 events. October 25's 92 span 00:00:02–19:53:07 and 19 paths. This is not one same-second burst. Distributed timing, countries or networks neither proves organic discovery nor identifies one operator.

We can deterministically select and count this supplied-host cohort. We cannot deterministically name a person, service, website operator, or purpose from these records. The anonymous referral header is not a credential. New authentication can improve future attribution for cooperative clients; it cannot supply missing historical proofs.

No R1 exclusion, display approval or row rewrite was made. The [referral worklist](../../../../../docs/folders/FLDR-0009.md) owns the eventual reporting decision, with rationale, false-exclusion tradeoff, versioned policy and retained evidence. We do not need to claim actor attribution merely to decide a defensible public reporting policy.

## Wrangler confirms that the stored Exa role is missing

All **1,003 Exa-signed events** in this selection have:

```text
signature_status = verified
signature_agent = https://crawler.exa.ai
traffic_class = bot
agent_name = NULL
reader_kind = signed-agent
reader_reason = https://crawler.exa.ai
```

The 42 Ahrefs-signed events likewise retain the signer with a generic bot class and null client name. These are stored verifier outcomes, not independently reverified historical messages.

The [maintainer/source review](02-standards-and-libraries.md#local-probe-current-named-ua-coverage-loses-these-roles) executed four exact vendor-UA inputs locally. ExaSearchBot, ExaUser, AhrefsBot and AhrefsSiteAudit all map to generic bot with a null name. The production aggregation does not reveal which of those UAs was present historically; the probe establishes how the current matcher handles the supplied cases.

[Exa's official pages](https://crawler.exa.ai/) distinguish search crawling from [ExaUser](https://crawler.exa.ai/exauser), which fetches on user/API request. Both document the same signing directory. A common signer therefore cannot recover the missing role. A future catalogue and independent role field can preserve that distinction prospectively, with unknown trigger retained. [TASK-0119](../../../../../docs/tasks/TASK-0119.md) owns the model repair.

## What the installed CLI did not reveal

The inspected `wrangler --help` offers `tail`, whose help describes a live log stream. It advertises no historical invocation-log query command. We did not start an unattended tail, generate page traffic, extract Wrangler credentials, or claim to have inspected retained October 24–25 invocation logs. Current product entitlements, retained log fields and a reliable historical request join remain unverified.

Cloudflare's documented native verification/category fields and retained logs are useful next evidence paths, as recorded in [the capability matrix](01-native-capabilities.md). Their existence in current documentation is separate from actual enabled fields and access for this zone. The next step is a bounded, supported access check; it is not permission to infer operator identity from country, ASN, a shared IP range or a timestamp match.
