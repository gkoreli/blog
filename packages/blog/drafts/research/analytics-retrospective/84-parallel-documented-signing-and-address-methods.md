# Two Parallel clients, three separate method facts

October 29, 2026 UTC. Continues [Research 83](83-additional-publishers-and-parallel-declarations.md). The previous goal turn made progress: it deployed exact ShapBot/Shap-User declarations and accepted two excluded stored controls. Human trials remain deferred. This iteration configures the documented signing and address methods while preserving older assessments and unsigned-field uncertainty.

## Follow the per-client documentation

[Parallel's primary bot page](https://parallel.ai/parallel-web-systems-bots), effective October 24, documents separate clients, directories and roles:

| Declaration | Documented role | Signing-key directory | Address method |
| --- | --- | --- | --- |
| ShapBot | Maintain Parallel's search index | [shapbot.parallel.ai](https://shapbot.parallel.ai/.well-known/http-message-signatures-directory) | [ShapBot-only published feed](https://docs.parallel.ai/resources/shapbot.json) |
| Shap-User | Retrieve content on users' behalf | [shap-user.parallel.ai](https://shap-user.parallel.ai/.well-known/http-message-signatures-directory) | None configured; no sibling-feed inheritance |

The two fixed HTTPS directory captures return HTTP 200, the expected media type and two Ed25519 keys each. Node imports all four entries; their public-key thumbprints are distinct across this snapshot. Import compatibility does not authenticate a request or prove current private-key control. The web reader could not open the JSON endpoints; direct captures succeed with checked public DNS, TLS hostname pinning, no redirects, 1 MiB limits and no forwarded reader headers.

The ShapBot feed returns ten `/32` entries under the existing JSON-prefix format, so no new parser or dependency is needed. Its opaque publisher version is `2026-07-14T00:00:00.000000`; that value is not proof of October freshness. The capture is HTTPS, no-redirect, bounded to 262,144 bytes and contains no reader inputs. [Source captures](parallel-signing-sources.json) and [key-import checks](parallel-signing-key-readiness.json) preserve these separate conditions.

## A valid signature can accompany the wrong client declaration

The [retained-input replay](parallel-signing-retained.json) recovers three already archived ShapBot-declaring contexts through the committed private archive manifest. At recorded times, using today's captured directory, all three verify and match the newly documented signing origin and reviewed publisher.

For each retained representation:

- Changing authority fails verification.
- Changing only User-Agent to Shap-User leaves verification successful, but the new per-client comparison becomes **different-origin/different-publisher**.
- Changing only the path leaves verification successful and the origin comparison matching.

Node and local workerd agree on all **twelve contexts**. Pinned [pyauth/http-message-signatures](https://github.com/pyauth/http-message-signatures/tree/1de433d9a49fd608475c6054ab14a1652c088844) independently agrees: nine successful originals/controls, three authority-change failures. Eighteen reference source files are rechecked. Its five-second clock skew differs from the local sixty-second allowance; no observed result diverges at that boundary. Both use recorded clocks and a one-day age bound; these proofs advertise 300-second validity windows.

These signatures protect authority, not UA or resource. **A documented signing origin is an additional comparison; it cannot turn an unsigned UA into authenticated intent.** These three contexts gain a fresh method interpretation, not an authenticated D1 join or a rewrite of historical rows. Later keys do not reconstruct original discovery or wire completeness. No genuine Shap-User request, managed-provider verdict, human trigger or readership is established. The [independent receipt](parallel-signing-reference.json) retains the comparison without raw inputs.

## Preserve disagreement and historical scope

The implementation adds two exact signing-origin mappings and two reviewed publisher entries. A ShapBot proof cannot match the Shap-User declaration merely because both belong to Parallel. Mixed declarations retain **conflicting-origins/conflicting-publishers** even when one selected proof matches one declaration. Other unmapped declarations remain counted; injected results stay test-injected. No new public signer display approval is added.

ShapBot's IP source is appended after existing sources, preserving prior fanout order and the four-source request budget. A listed address, a nonmatch, unavailable evidence and an unconfigured method remain different. Shap-User does not inherit ShapBot's list. Requests never supply an endpoint URL; fixed fetches forward neither reader UA nor connecting address.

The registry now recognizes 51 declarations, with **twenty** having at least one configured per-declaration method and **31** having none. There are sixteen IP sources covering seventeen declarations, four documented signing origins covering five declarations, and five reviewed directories covering seven declarations. These catalogue counts are not observed traffic or accuracy rates.

Collection advances to `2026-10-29.5`, documented signing/directory profiles to `2026-10-29.1`, IP profile to `2026-10-29.2`, report/cache to `2026-10-29.4`. Classifier `2026-10-29.2`, local verifier `2026-10-29.1`, coverage schema and public signer approvals remain unchanged. Report decoders accept the new profiles while preserving the source/date/count limits of older ones. A new address source inserted into an older profile is rejected; old Parallel assessments stay not-configured. Receipt comparison accepts the new collection and exact publisher profile/date pair.

## Native and source acceptance

The [native fixture](parallel-signing-native.json) runs fourteen actual collector/local-D1 controls: absent signatures, matching and cross-client publishers, a lookalike hostname, declaration conflicts, partial mapping, covered UA, tampered authority, owner and referral exclusion. Generated keys are intercepted at fixed fixture endpoints; these are not real vendor requests. Six additional address controls cover listed, nonlisted, HTTP failure, malformed feed, Worker relay and unmapped Shap-User conditions.

Two explicitly constructed old-profile records remain not-configured. The report includes fourteen of sixteen stored rows, recognizes all fourteen signing assessments, recognizes the twelve new address assessments and leaves the two legacy missing address records unrecorded. Both named filters reconcile. The fixture report costs **8,229 local reads/zero query writes**; it is not a production cost estimate. Stored receipts match the signature/publisher/network projections after acknowledgement.

[Checks](parallel-signing-checks.json): **292 analytics tests, 117 site tests**, workspace types, syntax, Markdown validation and an isolated 33-post build pass. Initial fixture failures are preserved: its header guard incorrectly assumed a `Headers` object, and its owner fixture used the intentionally ineligible `/owner` route. Those harness corrections change no verifier policy. The full-catalogue 4 KiB network-evidence budget and four-source cap remain tested.

The article remains **1,375 words/31 prompts**; its existing unsigned-field lesson covers this result. The isolated build uses a public placeholder solely to enable the production Turnstile markup condition, copying no credentials; its full article HTML now matches the prior served file. Provider/local runtime equality is not asserted.

This research slice makes no production observation or SELECT and activates no optional capture. Raw contexts, keys, generated signatures and logs remain outside Git. October 31 is a review date, not automatic erasure. Source delivery, activation and selected live acceptance are separate gates. Next: accept the exact source, then native-test a bounded new-ID delta since the frozen retained census to assess current method provenance and unresolved cases. Human trials remain deferred.
