# Complete traversal is not complete verification

October 27 Pacific / October 28, 2026 UTC. Continues [selection visibility 39](39-signature-selection-and-unassessed-proofs.md), [exact links 38](38-signed-observations-and-exact-row-links.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). Human trials remain deferred.

## What changed in our understanding

The collector deliberately stops at its first valid proof. A separate audit now examines eligible proofs without losing a known positive when another proof fails or cannot be assessed. Finishing the loop is insufficient: unavailable keys, unsupported algorithms, runtime errors and unpaired signature context keep the result partial.

During this follow-up, two current-profile production observations also became available. Both carry verified Exa-origin proofs and now have exact native-request/receipt/D1 links, including the candidate-selection counts. This closes the `.2` signed-persistence gate that research 39 left open. It does not establish a fresh vendor-operated action, human trigger, native cryptographic agreement or readership.

## Learn from another implementation without adopting its policy blindly

The independent [Python library documents per-signature results and application-tag selection](https://pyauth.github.io/http-message-signatures/#multiple-signatures). We execute its [primary source at `1de433d`](https://github.com/pyauth/http-message-signatures/blob/1de433d9a49fd608475c6054ab14a1652c088844/http_message_signatures/signatures.py), separately from the previously tested Cloudflare reference. Its tagged-set verification raises on a failed proof rather than returning the partial list accumulated earlier. Explicit tagged-label calls can still verify another proof. It also requires matching label sets before verification. These are policy/interface distinctions, not evidence that either implementation's result authenticates an operator.

[RFC 9421 §3.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-3.2) makes selection application-specific. Its [multiple-signature considerations](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.6) discuss additional valid/invalid signatures and expected signers. Cryptographic success alone is not application authorization. We borrow per-proof accounting and retain our own explicit trust, discovery and completeness boundaries.

The [maintained cross-language probe](probe-complete-audit.mjs) uses the existing independent Ed25519 fixture and [Python runner](probe-pyauth-audit.py). Both perform actual signature math. No incoming reader values or requests reach a remote verifier. The [comparison](complete-audit-reference.json) runs eight cases and 24 Python calls:

| Fixture | Bounded local audit | Python tagged-set call |
|---|---|---|
| Two valid proofs, either input order | Two verified proofs and two publisher origins | Two results |
| One invalid proof and one valid proof, either order | One verified plus one profile-negative result; assessment complete | Raises; an explicit call still verifies the valid proof |
| One eligible proof plus an unrelated tagged protocol | One eligible verified proof | One selected result |
| Unpaired input or signature | Retains the paired positive; context stays partial | Raises on label-set mismatch |

A raised reference call is recorded with a null result count, not zero valid proofs. A complete audit may include a negative verdict; it is not a message-acceptance decision. Publisher origins are not people, independent operators, keys or actions.

[The source/dependency manifest](complete-audit-sources.json) pins eighteen source/metadata files and the executed wheel hashes. Git source runs through a disposable Python environment with cryptography 50.0.2 and http-sf 1.5.0; no named-release equivalence or production dependency is implied. The unauthenticated GitHub API returned a rate-limit 403, so Git supplied the immutable revision instead. We do not execute the external repository's guidance or adopt its resolver/trust rules.

## A dedicated bounded capability

[`webbotauth-audit.ts`](../../../../analytics/src/webbotauth-audit.ts), exported at `@gkoreli/analytics/webbotauth-audit`, is separate from the page collector. It snapshots URL, method, headers and verification clock, uses a private per-run cache, and requires an explicit resolver transport. It supplies no implicit network fetcher.

The recorded policy defaults to eight candidates, a two-second cooperative deadline, 32,768 code units across the three signature fields and the site's one-day age/lifetime policy. Options have closed numeric bounds. Counts distinguish parsed members, unpaired context, matched/tagged candidates, attempts, profile negatives, unsupported/unavailable/indeterminate verdicts and unassessed candidates. Every tagged candidate remains in the denominator. Invalid options or unparseable context preserve unknown totals; known absence is separate.

The selected-label helper verifies against the full snapshotted message. It does not drop other signature fields to isolate a proof, which could change covered context. Audit output contains no labels, publisher strings, key IDs, signature bytes, URL values or arbitrary errors. Its origin count is explicitly a lower bound. Body/digest comparison, unsupported RFC features and expected-operator authorization remain outside this verifier's capability.

One global timer requests transport cancellation. A cooperative native fixture observes that abort; a noncooperative transport cannot be forced to stop. Late completion cannot upgrade the returned result. These are candidate/I/O controls, not a hard CPU-time or complete DNS/egress guarantee.

The collector still uses first-valid selection. [The isolated collector comparison](complete-audit-bundle.json) validates the exact Git baseline and then changed sources at the same path/configuration: all **254,119 emitted runtime bytes are identical**. This compares the collector entry, not source maps or remote deployed Worker bytes. No collector/classifier/verifier/report version, schema, lockfile, trust rule or optional capture is changed by this new diagnostic capability.

## Native and historical acceptance

Eight new regression tests bring analytics to **210 passing tests**. They cover all-candidate accounting, positive-plus-negative results, caps, unavailable/unsupported/runtime outcomes, deadline preservation of an earlier positive, late completion, mutable caller context/clock, preflight unknowns and privacy canaries. [Source checks](complete-audit-source-checks.json) record the remaining checks and isolated build.

[The native helper](../../../scripts/check-signature-audit.mjs) runs actual local workerd/WebCrypto with intercepted fixture directories. [Eleven audits](complete-audit-native.json) yield six complete and five partial results: two unpaired contexts, a candidate cap, an unavailable directory and a deadline. There is no collector, D1 statement or production/network discovery in that fixture.

[Two older exact-linked `.10` records](complete-audit-history.json) each audit one eligible proof at their recorded times using the previously captured Exa directory. Their stored verifier remains `.6`. The maintained [retained-audit helper](audit-retained-signatures.mjs) derives cohort versions from the supplied evidence; it does not carry the old cohort's labels into later runs. Initial wrapper/provenance assumptions were corrected before publication. Later-key replay is not reconstruction of the directory at receipt time or a new production write.

## Current-profile signed persistence is now observed

[The production acceptance](current-signed-acceptance.json) records a refreshed native one-hour query for verified `.2` receipts. Two visible records copy as two; their exact provider request references select eight visible/copied chain records: two invocations, four custom logs and two spans. Fresh clipboard markers distinguish acknowledged copies from stale contents. This establishes the selected scope, not provider retention or population completeness.

[The primary-key SELECT](current-signed-storage.sql) uses the two returned decimal text references. It has no status, version, time or path filter that could hide a contradictory row. [Native acceptance](current-signed-query-native.json) preserves unsafe-integer neighbors and deliberately conflicting fixture fields. Its measured cost is four reads, rather than the initially assumed two. Production command-mode Wrangler also returns two rows for **four metered reads / zero diagnostic writes**, below the reviewed 100-read post-execution threshold. The threshold is not an enforced database cap; no broad scan or retry occurs.

[The exact analysis](current-signed-exact-analysis.json) matches both known receipt projections, separate native copies and recorded-time replays. Both invocation records identify Worker `7a172b39`, mapped by the prior release to source `edebbcf`. Both rows store collection/verifier `.2`, declared AI-search roles, matching Exa publisher/method states and selection counts **1 matched / 1 tagged / 1 attempted / 0 unassessed**. Both proofs bind the request authority and the selected Signature-Agent value; neither binds User-Agent, method, path, query, full target URI or a body digest header. There is one captured URL, two distinct signatures/request/operation references, one HTML representation and one Markdown representation. These are not two people or established unique actions.

At 01:15:40 UTC, a fresh public Exa directory capture returns HTTP 200, the expected media type and two keys. This request sends no incoming reader telemetry. [The scoped all-proof audit](complete-audit-current.json) uses that later capture at each retained invocation time; both assessments complete with one eligible verified proof and one publisher-origin lower bound. Original `.2` persistence and offline replay remain separate facts. Both native categories match stored Search Engine Crawler; native verified-bot/signed-agent booleans remain unavailable, so native cryptographic agreement is unmeasured.

## Publication and remaining work

The concise retrospective points its existing two-observation claim to this stronger evidence. Its prose remains **1,257 words / 31 shaping prompts**. [Publication acceptance](complete-audit-release.json) separates source delivery and served content from the production capture above. No human trial, rule, permission, raw diagnostic activation or live tail is introduced.

Remaining questions concern actual operator/purpose, unsigned role/path claims, replay uniqueness, expected-signer authorization, broader conformance, native cryptographic agreement and privacy/retention decisions. A scoped complete proof assessment cannot answer those questions. The dedicated protocol article remains proposed; the full goal stays active. Next bounded work should use the current evidence, not repeat a broad census or replace unavailable human labels with automated visits.


## Publication acceptance

[The release receipt](complete-audit-release.json) accepts source `aec71d3` at native Ready/100% and the copy-only article qualification `17d7760`, separately Ready/100%. The served Markdown equals the checked isolated build; the rendered article links this evidence and says that some earlier rows still lack links. This avoids implying that all older signed observations remain unlinked. The article stays at 1,257 words/31 prompts. Seven active bindings include no optional owner grant, diagnostic capture or calibration activation.

Private sources, exact current captures, native fixtures and publication checks are preserved in `~/.local/share/gkoreli/analytics-evidence/2026-10-28-bounded-signature-audit/`, with mode 0700/0600 and a hash manifest. Five older inputs remain hash-linked to their previous archive. Disposable environments, external Git data and third-party guidance are excluded. October 31 is a review target, not automatic/provider-wide erasure. All owned native runtimes have exited; no tail or preview was started.

Next bounded experiment: compare clock and input admission across the default verifier and explicit-candidate/audit entry points, retaining any mismatches as evidence before changing policy. Human trials remain deferred; current `.2` signed persistence must not be silently reopened as unmeasured.
