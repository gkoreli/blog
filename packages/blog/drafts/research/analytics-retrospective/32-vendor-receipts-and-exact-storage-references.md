# Vendor receipts and exact storage references — October 27, 2026 UTC

Three retained Exa request chains replay successfully and agree with their recorded scalar verification receipts. Four retained Ahrefs requests replay successfully; one has a complete eligible-observation attempt/storage chain from before verdict receipts existed. These improve the evidence for our verifier, but none identifies its exact historical D1 row. Collection `.9` closes that prospective correlation gap using the existing row reference in private success logs.

Human-operated trials remain deferred at the owner's request. No human, hardware, purpose-accuracy or complete-retention claim follows.

## What was inspected

The [complete-table census](31-retained-history-completeness-and-delta.md) identified seven detailed verified observations before its October 27 21:49 UTC cutoff: six Exa and one Ahrefs. A [native-tested cohort query](../../../scripts/check-vendor-correlation.mjs) recovered all seven, privately retaining exact paths/times and evidence JSON. Two Exa rows use collection `.6`, four `.8`; the Ahrefs row uses `.6`. All six Exa declarations are ExaSearchBot/AI search; AhrefsBot retains SEO crawler. This is a bounded current-detail cohort, not all historical vendor traffic.

[Production query receipt](vendor-correlation-production.json): one command-mode SELECT, 413 reads, zero writes/changes and `changed_db=false`, under the reviewed 5,000-read threshold. A preceding D1-info request failed authentication independently; the SELECT succeeded. No quota recovery or metadata refresh is inferred. Wrangler receives SQL as one argv value read from private preparation, never remote file/import mode. The threshold is an operator check after execution, not a service-enforced cap.

[Native controls](vendor-correlation-local.json) cover twelve synthetic rows, time/origin/status/evidence boundaries, empty/malformed results and D1 RETURNING behavior. Raw operational captures remain outside Git.

## Retained evidence, without inventing a join

A structured native query for verified scalar receipts showed five successes and exported five records with distinct operation/request/record references. Three precede the census cutoff; two follow it. The three earlier receipts are collection `.8`, ExaSearchBot, AI search, matching documented Exa origin, native Search Engine Crawler and unavailable native verification booleans. Their signatures cover the authority and leave the User-Agent, method, path, query, target URI and content digest uncovered.

A native query for those three existing request references showed twelve records. Download as JSON returned an empty array; native Copy as JSON returned twelve: three invocations, six attempt/storage logs and three spans. Both captures are preserved privately. The discrepancy is specific to this query/export attempt; it is not generalized to every export. IDs are unique in the copied set, with no missing-ID or truncation flags observed.

[Offline reconciliation](vendor-retained-reconciliation.json), using the [maintained helper](../../../scripts/reconcile-retained-vendors.mjs), links each invocation to exactly one attempt and success log through native request and existing operation references. All three replay at recorded times against later-captured Exa directory bytes. Their recorded receipt outcomes, declarations, covered-component flags and independent native facts agree with the replay/context. This is evidence about the local verifier and its retained success receipt, not an independent Cloudflare cryptographic verdict.

The census has four `.8` Exa rows before cutoff but this scoped receipt query has three. Time/path agreement does not assign the unmatched row or prove log loss, sampling, duplication or a missing write. Neither the invocation nor its success log/span supplies an inserted D1 row reference. The exact historical join remains unavailable.

### Ahrefs adds a useful counterexample

The native AhrefsBot text query showed and copied 33 records: nine invocations and 24 spans. Offline replay found four signed requests and five unsigned ones. A second native query for the four signed invocation references showed/copied ten records: four invocations, four spans and one attempt/storage pair. All four signatures verify against the later-captured Ahrefs keys, protect only the authority among the tracked components, and carry native Search Engine Optimization category context. Native verification booleans remain unavailable.

One eligible page request has a complete collection `.6` attempt/storage pair; it predates the verdict receipt. The other requests include assets/robots, which need not produce eligible page-observation logs. Missing page logs for those requests are not evidence of a collector failure. The D1 Ahrefs observation and this retained invocation are a matching cohort, not an exact row identity.

## What the authoritative documentation changes

Sources were checked October 27 UTC; their claims remain separate from our observations.

| Primary source | Relevant capability | Boundary in our system |
|---|---|---|
| [ExaSearchBot](https://crawler.exa.ai/) and [ExaUser](https://crawler.exa.ai/exauser) | Published roles, signature claim and key directory | ExaUser can be triggered by an application. A verified signature cannot authenticate an uncovered UA role or establish a human trigger. |
| [Ahrefs crawler documentation](https://ahrefs.com/robot) | AhrefsBot supports marketing intelligence/Yep; SiteAudit supports audits. Published IP feeds and reverse DNS support verification. | The inspected page does not supply a per-client Web Bot Auth guarantee. Our documented-method registry correctly stays unconfigured for that signature claim. |
| [Ahrefs directory](https://ahrefs.com/.well-known/http-message-signatures-directory) and [Exa directory](https://crawler.exa.ai/.well-known/http-message-signatures-directory) | Both direct HTTPS GETs return 200, correct MIME and two Ed25519 key shapes. [Closed capture](vendor-directory-publication.json). | Published keys and successful request replay are observed evidence. Response signature-header presence is not response-signature verification or historical key-distribution proof. |
| [Cloudflare verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) | Verification can use signing or IP-based methods; current taxonomy distinguishes behaviors and direct/intermediary operators. | Catalog categories and operator models do not become per-request native booleans or proof of an end-user's intent. |
| [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) | Ed25519, directory/Signature-Agent profile, expiry and nonce-validation limits | Native profile/version/entitlement and our local profile stay distinct. No nonce database or complete replay-prevention claim. |
| [Ahrefs Worker integration](https://docs.ahrefs.com/en/bot-analytics/docs/cloudflare-worker) and [Logpush integration](https://docs.ahrefs.com/en/bot-analytics/docs/cloudflare-logpush) | Request/response facts and optional signature headers are established diagnostic inputs; field availability depends on method/plan. | No integration installed, tokens created or reader telemetry sent to Ahrefs. Published code does not establish how its backend counts pageviews. |
| [D1 return objects](https://developers.cloudflare.com/d1/worker-api/return-object/) and [prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/) | run returns result rows when applicable, with acknowledgement and metering | Native workerd/D1 controls must accept our exact INSERT/RETURNING usage. |
| [SQLite RETURNING](https://www.sqlite.org/lang_returning.html) and [rowid semantics](https://www.sqlite.org/c3ref/last_insert_rowid.html) | Return the automatically chosen signed-64-bit rowid from the modifying statement | Cast to text before the JS boundary. RETURNING alone is not a universal transaction/commit guarantee. |

The practical next vendor improvement is a separately labelled published-directory observation, without upgrading it into a documented per-client guarantee. Explicit purpose uncertainty remains necessary even for authenticated operators.

## Implementation: identify the stored event privately

`observation-storage.ts` admits exactly one canonical positive signed-64-bit decimal string returned by `INSERT … RETURNING CAST(id AS TEXT)`. `db.ts` still requires success and exactly one changed row. The success log adds a separate scalar `storage` object: version, returned/unavailable status and the existing row reference. Receipt `.2` remains the snapshot taken before binding, emitted after acknowledgement. No new persistent identifier, schema migration, visitor cookie, public field or historical rewrite is added.

Missing/malformed/multiple returned references preserve the acknowledged base event and mark linkage unavailable. Negative/missing/multi-row acknowledgements still produce no success receipt, even if a row exists. No write retry is added. Optional diagnostics use the exact returned text for their foreign key; failure preserves the base event. The optional capture profile remains off.

[Native acceptance](storage-reference-local.json) exercises twenty actual collector/workerd/D1 controls: seventeen rows, fifteen successful receipts, eleven exact returned references and four explicit unavailable references. Two unacknowledged writes leave rows without success receipts. The large-ID control returns `9007199254740995` exactly and links its optional diagnostic; numeric metadata rounds that value. A separate capability probe preserves the before/after numeric mismatch. Missing/numeric/duplicate results never invent a reference. Ineligible, failure, signed/unsigned, conflicting-declaration, supplied-provider and diagnostic-failure controls retain their earlier boundaries.

Native cost comparison: the unsigned insert uses five reads/six writes with RETURNING versus four reads/six writes with the clause removed in the fixture wrapper. This adds one measured local read for exact linkage; production insertion cost is not inferred. The exact-reference acceptance SELECT uses one read/zero writes and an INTEGER PRIMARY KEY lookup. The planned single production SELECT has a 100-read review threshold. An absent-reference control returns zero rows. No full-table scan or additional per-event lookup is needed.

[ADR-0016.11](../../../../../docs/adr/0016.11-signature-verification-evidence.md) deliberately supersedes research 27's no-row-reference choice prospectively. These are linked private operational records, potentially personal, not anonymous data. The privacy page discloses the link; provider retention/sampling and restricted investigation-copy lifecycles remain separate. Lawful basis, base-row retention, rights and backups remain unsettled. Expanded raw diagnostics are not activated.

## Delivery and next bounded work

[Source checks](storage-reference-source-checks.json) pass: 177 analytics tests, 106 site tests, workspace types, frontmatter, syntax, local links and the isolated 32-post build. Delivery, activation and actual production readback are separate gates. The concise retrospective remains 1,250 body words with 31 shaping prompts; it links these new findings without expanding its protocol appendix into the article. No automatic goal wrapper is added to its prompts.

Next acceptance: observe collection `.9` activation, make one referral-excluded unsigned control, preserve its actual success log privately, read exactly its returned row reference through the native-accepted query and compare closed facts. This does not validate an organic signed `.9` join or native-verifier agreement. After that, retain a future organic signed chain and test the exact join, keep directory-publication evidence separate from vendor promises, and research replay/DNS/egress and retention boundaries. Historical sampling/loss proportions and human/device error rates remain unmeasured. Human trials stay deferred.
