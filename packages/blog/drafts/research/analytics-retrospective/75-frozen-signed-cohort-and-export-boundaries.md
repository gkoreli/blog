# The older 52 signed outcomes now have replayable inputs

October 29, 2026 UTC. Continues [Research 74](74-native-trace-redaction-and-covered-urls.md). The previous turn delivered a native tracing experiment and covered-URL diagnostics. This iteration closes the specific older-cohort gap: **all 52 included verified outcomes in Research 64's frozen ID span now have recovered invocation chains, recorded-time cryptographic replay and matching exact D1 projections**.

These are historical recoveries, not new visits or 52 newly observed readers. Human trials remain deferred.

## Recover a fixed cohort, then test the joins

[Research 64](64-retained-delta-and-unresolved-reasons.md) selected 712 rows by an exact ID boundary. Its observed-time range supplies a bounded retained-log search: **October 28, 05:41:35 through October 29, 01:30:47 UTC**, end exclusive in offline acceptance.

The settled native query for verifier `.28.7` and verified outcome returns **52 stored receipts**. Export cap 100 returns all 52, with distinct request references and observation IDs. All IDs lie within the earlier frozen SQL boundary. Fifty-one declare ExaSearchBot; one declares AhrefsBot.

Querying those exact request references returns **208 records**, exported under cap 500: one invocation, attempt, stored receipt and span for each request. All 52 complete chains pass the scoped join checks. All 52 independently downloaded receipt objects are identical to their chain copies. These 208 log IDs are distinct; the separate seven collision groups in Research 72 remain preserved, not generalized away.

The [input analyser](analyze-frozen-signed-cohort.mjs) binds the frozen census SQL digest, range membership, exact receipt copies, recorded clocks, source versions and directory captures before generating replay inputs. It rejects an observation ID outside the old boundary. A [separate acceptance adapter](accept-frozen-signed-cohort.mjs) rejects a wrong exact D1 reference. Neither negative case emits accepted output.

## Replay the recorded profile and current implementation

Fresh direct captures from the reviewed [Exa](https://crawler.exa.ai/.well-known/http-message-signatures-directory) and [Ahrefs](https://ahrefs.com/.well-known/http-message-signatures-directory) directories each return HTTP 200 and two keys. No incoming reader telemetry is forwarded. A later directory is not a reconstruction of the original resolver snapshot.

The historical repository snapshot `2923754` carries verifier profile **`.28.7`** and collector `.28.10`; all 51 analytics source files in that snapshot are rechecked. We compare its verifier with current **`.29.1`** in both Node and native local workerd. This is a recorded-profile source replay, not an attestation of every historical deployed Worker byte.

| Context, per profile and runtime | Verified | Signature-invalid |
|---|---:|---:|
| 52 retained originals | 52 | 0 |
| Change the signed authority | 0 | 52 |
| Change unsigned User-Agent and path | 52 | 0 |

Node and workerd agree on **156 contexts per profile**. The current exhaustive candidate audit finds exactly one eligible valid proof per original, with none unresolved or unassessed. The pinned independent RFC implementation agrees on all **156 selected contexts** after rechecking eighteen source files and five dependency versions. Its 104 successes include 52 deliberate unsigned-context variants; those are not extra observed requests.

[Replay summary](frozen-signed-replay.json), [independent comparison](frozen-signed-reference.json) and the [native harness](../../../scripts/check-frozen-signed-cohort.mjs) preserve the methods and commitments. The bounded reuse audit finds 52 distinct proofs and scoped nonces, with no repeats within this supplied cohort. No replay enforcement or unique-action claim follows.

## Compare storage without filtering away contradictions

The [52-reference SELECT](frozen-signed-storage.sql) selects exact primary keys, retaining owner flags, missing evidence and contradictory statuses. It does not filter for verified outcomes. A local native D1 fixture verifies all 52 text references, including adjacent integers above JavaScript's safe range, an owner row, missing evidence and a conflicting status. The query plan uses the primary key.

An immutable eight-file plan archive precedes production execution. The exact allocated Worker's DB binding matches configuration; this establishes resource identity, not query authorization. A constant control succeeds before the one data SELECT runs through Wrangler's `--command` path, with SQL passed as one subprocess argument.

| Production SELECT | Reported reads | Reported writes |
|---|---:|---:|
| Constant access control | 0 | 0 |
| Exact 52-ID readback | 104 | 0 |
| Total | **104** | **0** |

Each reports one attempt and no database-change flag. The 208-read review threshold is post-execution, not a server-enforced cap. Dashboard/export costs are unreturned and additional.

All **52 complete receipt/storage projections match**, including signature coverage and selection facts. Recorded-profile and current replay coverage agree with storage. Current UA parsing agrees with stored declarations. All 52 optional request-evidence payloads are absent, all owner flags are zero, and native verification booleans remain unavailable. [Production acceptance](frozen-signed-production.json) closes this cohort's input/replay/storage gap; the earlier outcome-only limitation is superseded for these 52 records only.

## What retained URLs still cannot establish

Reusing Research 72's 409-record export, the [URL analyser](analyze-retained-url-surface.mjs) finds 408 GETs and one POST. All 409 retained URLs survive Fetch reconstruction unchanged and agree with both message copies. Fourteen contain queries; no decoded query-name duplicates or URL marker shapes appear. Every invocation lacks separate `path` and `search` objects. Those fields are unavailable, not contradictory empty values. [Closed results](retained-url-surface.json) retain the selection limits.

In the 52 recovered chains, invocation objects carry headers and URLs, custom attempt/receipt metadata carries URLs and paths without headers, and spans carry no request object. A custom receipt is not a complete signing input. Agreement among correlated message copies cannot establish original-wire fidelity; none of these 52 signatures covers the resource.

The current [Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) describes invocation enrichment, sampling and truncation, but supplies no wire-completeness guarantee for this export. [TailRequest documentation](https://developers.cloudflare.com/workers/runtime-apis/handlers/tail/#tailrequest) explicitly describes redaction on its own surface. Research 74's native reproduction therefore remains a demonstrated mechanism, not proof that the historical dashboard export used the same path.

## Publication and next work

The native-trace article source `6b81be6` is independently [accepted in production](native-trace-release.json): source-linked Ready build `56cd2379`, Worker `e3076d6a`, CLI allocation 100%, and exact served/build Markdown equality. One direct `.md` GET is collection-ineligible. A stale clipboard copy is discarded as build evidence; a fresh native download supplies the full successful log. No retry, manual deployment or capture-setting change occurs.

The article now corrects its outdated statement about the 52 outcomes: **1,362 words and 31 unchanged prompts**. Twenty-four targeted tests, two negative analysis gates, workspace types, validation and the isolated 33-post build pass. This correction is a separate publication from the accepted 1,359-word source. Checks, private archives and any subsequent activation are recorded in [the iteration receipt](frozen-signed-checks.json).

Identity, declared role and human trigger remain separate. Older historical outcome-only records outside this frozen cohort, managed-verifier comparison, R1 attribution, privacy decisions and human/device accuracy remain open. Observations after the last whole-population delta have selected-chain acceptance, not a refreshed census. Next: review native signed-agent versus known-bot semantics and account exposure before a genuine-vendor managed-verifier comparison. Successful replay supplies no readership count.

The restricted data archive contains 124 captured files plus its manifest, with 0700 directories/0600 files. Manifest SHA-256: `529fd9f870dd49065fd63f9eb39dfa6727f4260ed1f49ee9133c8108568e4556`. The immutable eight-file pre-execution plan and prior archives remain separate and unchanged. October 31 is a review date, not automatic erasure.
