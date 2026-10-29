# A signed purpose claim still needs a trust model

October 29, 2026 UTC. Continues [replay policy research](70-replay-policies-atomicity-and-cost.md). The previous iteration delivered tested counterexamples: progress. Human trials remain deferred.

We now have a dedicated [operator/use diagnostic](../../../../analytics/src/forwarded-purpose.ts), exported as `@gkoreli/analytics/forwarded-purpose`. It distinguishes a declared operator/use, a verified signature covering that field, and the trust questions neither establishes. It is offline; the collector, reports and access policy do not call it. No production observation or database query is added.

## What the native documentation actually promises

[Cloudflare's Web Bot Auth documentation](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/#transitive-trust-and-the-forwarded-header) describes experimental operator propagation using `Forwarded: for="openai";use="reference"`. It discusses trusted intermediaries, but that example alone supplies no trustworthy per-request header provenance to this Worker. We do not equate arrival through Cloudflare, a provider bot boolean, or a parseable brand name with authenticated propagation.

[RFC 7239 §8.1](https://www.rfc-editor.org/rfc/rfc7239.html#section-8.1) warns that even the client can modify this header, and earlier chain members do not automatically become trusted. Its syntax does not standardize Cloudflare's operator-name semantics. Our parser therefore assesses bounded token/quoted-string structure, not node-address validity or a selected trusted hop.

The [managed robots documentation](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/#content-use-signal) defines the experimental use values `immediate`, `reference` and `full`. A site's permission directive and a requester's declared commitment are separate evidence. Neither proves subsequent behavior. We add no invented standalone request header or conversion from a use claim into a human-directed retrieval, citation or permitted-use verdict.

Current [Workers Request documentation](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) lists `signedAgent` in `botManagement`. Our installed Workers types omit it. That mismatch is recorded with the local source digest; absence from an SDK is not proof of absent platform capability. The reviewed Request and [Bot Management variable docs](https://developers.cloudflare.com/bots/reference/bot-management-variables/) do not establish an adopted trusted operator/use adapter for this deployment. This bounded review is not a claim that no provider-internal mechanism exists.

## Learn from source without inheriting its assumptions

We captured and inspected seven files from [lpinca/forwarded-parse](https://github.com/lpinca/forwarded-parse/tree/2d397f0f28b713f272c83b9c91611fc55dd858ad), commit `2d397f0f28b713f272c83b9c91611fc55dd858ad`, version 2.1.2. Its source handles quoted delimiters, escapes and case-insensitive parameter names. It parses syntax; it grants no proxy trust. No dependency is installed and none of its implementation is copied into the collector.

The source assigns parameter values into an object. Repeated names replace earlier values. Our independent implementation uses a Map and rejects duplicates, distinguishing equal repetition from conflicting values. The pinned parser also loses `__proto__` as an own parameter in the tested case; ours counts it as ordinary extension data. These are specific behavior comparisons, not a general vulnerability assessment of the library.

The [offline comparer](compare-forwarded-reference.mjs) checks all seven file digests before loading the pinned code. Twenty-six non-null inputs yield five deliberate admission differences: three duplicate cases and two resource-limit cases. Both treat empty input as unparsed; ours preserves an explicit empty state rather than throwing. Accepted cases agree on closed operator/use projections and element counts. We inspected upstream tests but did not execute their development runner or claim complete RFC conformance. [Source commitments](forwarded-parser-sources.json) preserve the exact implementation reviewed.

## Keep declaration, binding and behavior separate

The module returns closed facts, without raw node addresses, extension values, signature bases, origins or labels. It recognizes only the documented `openai` operator example and three reviewed use values. Other values remain unrecognized. It preserves separate chain elements and selects no operator from a chain.

Limits are 4,096 Forwarded code units, eight elements, sixteen parameters per element, 32,768 signature-header units, eight candidates and a two-second deadline by default. Options and the clock source are recorded. Empty-list elements outside this supported subset are policy-rejected, not presented as a complete RFC syntax judgment. No implicit resolver is supplied.

For parsed fields, each exact candidate is cryptographically verified against an immutable request before inspecting its actual canonical signature base. The current verifier supports plain whole request fields. A valid proof covering another header whose value contains the word `forwarded` does not acquire Forwarded coverage. Invalid, unavailable, policy-rejected, unsupported and indeterminate outcomes stay separate; candidate limits and unpaired context remain partial.

| Evidence | Diagnostic result | What remains unestablished |
|---|---|---|
| Header alone, including fake provider booleans | Claim without authenticated binding | Header provenance, delegation and actual use |
| Valid publisher proof leaving Forwarded unsigned | Verified publisher; field not covered | Who supplied the declaration |
| Verified proof covering the complete field | Verified signer assertion | Whether that signer may speak for the named operator, actual use and human trigger |
| Changed signed use value | Invalid signature | No authenticated replacement assertion |
| Conflicting duplicate parameters | Malformed/conflicting field; no claim selected | Cryptographic outcome is not inferred from syntax |

Even a verified signer asserting another actor is not that other actor's proof. The module deliberately offers no switch that promotes an arbitrary header to trusted Cloudflare provenance.

## Execute counterexamples against real retained proofs

[Native workerd acceptance](forwarded-purpose-native.json) covers 27 direct syntax cases and 30 request-audit cases. Cases include signed/unsigned mutation, a header-name decoy, two eligible proofs, candidate limits, unpaired members, unavailable keys, deadline abort, request mutation after invocation, invalid options and admission bounds.

The four previously accepted Exa request-header objects contain no Forwarded field. Their diagnostic state is absent; no missing value becomes a negative purpose verdict. This is absence in the retained representation, not independent proof of wire-complete header retention. Eight offline counterfactuals add `for="openai"` with either `reference` or `full`. All eight Exa proofs still verify, while **zero injected fields receive authenticated coverage**. These are deliberately changed inputs, not observed Exa assertions or fresh vendor requests. No native edge-propagation claim follows.

The pinned Python RFC implementation independently processes fourteen selected messages: thirteen verify, including one two-proof message, and changing a signed Forwarded value produces the expected invalid-signature exception. Eighteen source files and five dependency versions are rechecked. Its input is bound to the same captured native fixtures. This compares cryptography, not our parser's trust decisions, every native case or Cloudflare managed verification.

## Delivery and remaining acceptance

All 275 analytics tests, workspace types, script syntax and Markdown validation pass. A controlled esbuild bundle of the actual Worker entry has 151 inputs; this module is absent from its dependency graph. That is not a production build, deployed-byte comparison or live health check. Collection, classifier, verifier, receipt, report/cache and schema versions remain unchanged.

The article remains 1,358 words/31 prompts, with this follow-up reachable through its existing evidence trail. Raw proofs and captures stay outside Git. The [checks and limits](forwarded-purpose-checks.json) distinguish source capability, native local acceptance and unmeasured production behavior.

Next: use a bounded native retained-log selection to investigate whether genuine Forwarded fields are present and queryable, retaining exact window, source and collector provenance before considering a database read. Do not promote a surviving client-supplied header into trusted attribution. Newest-collector signed acceptance, request-level managed verification, human/device experiments, R1 attribution and privacy/retention decisions remain open under the [goal audit](current-goal-audit.json).

The private archive preserves 41 captured files plus its manifest, with 0700 directories/0600 files. Manifest SHA-256: `177affb97f13b54e53295c96829c226297be50283147c6ddb221942a53aa91d9`. Prior archives remain unchanged. October 31 is a review date, not automatic deletion or provider-wide erasure.
