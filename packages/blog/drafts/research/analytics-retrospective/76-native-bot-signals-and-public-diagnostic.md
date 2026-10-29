# A known bot is not a signature verdict

October 29, 2026 UTC. Continues [Research 75](75-frozen-signed-cohort-and-export-boundaries.md). Human trials remain deferred. This iteration reviews seven current primary pages, observes the zone plan and sends nine synthetic controls to Cloudflare's documented public diagnostic. **No registered positive or request-level managed-verifier comparison is established.**

## Three native surfaces answer different questions

| Surface | Documented meaning | Consequence for our measurements |
| --- | --- | --- |
| [`cf.client.bot`](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.client.bot/) | Known good bot/crawler; equivalent to `cf.bot_management.verified_bot` | Keep independent of local signature verification. |
| [`signed_agent`](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.bot_management.signed_agent/) | Known agent using Web Bot Auth, classified as an intermediary; requires Enterprise Bot Management | Record provider field availability and identity eligibility before interpreting true or false. |
| [BotBase](https://developers.cloudflare.com/bots/botbase/) | Enterprise Bot Management inventory and traffic visibility | Its successful-request metric means edge 2xx/3xx, not a configured allow decision or readership. |

[Bot Management variables](https://developers.cloudflare.com/bots/reference/bot-management-variables/) describes multiple known-bot methods, including reverse DNS, network lists and additional internal evidence. A known-bot result supplies no specific signature coverage. The [Workers Request API](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) makes `botManagement` conditional on using that product.

At **05:44 UTC**, the authenticated zone overview shows **Free plan**, alongside a separate Workers Paid Plan subscription. The published Enterprise requirement is not met by that observed zone plan. This observation does not reconstruct the cause of every historical unavailable field, prove every account entitlement or replace a fresh inbound-request measurement. No subscription or rule changes occur.

The [July 2026 taxonomy](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/#classification) adds potentially multiple behaviors and Direct/Intermediary metadata. These describe the tracked service; they do not independently authenticate the operator or trigger of a particular request. The new behaviors are not individual WAF fields. Our [native category module](../../../../analytics/src/native-bot-evidence.ts) intentionally handles the legacy request category, preserving unavailable and unrecognized values. Copying BotBase's behavior names into that enum would mix distinct contracts. [Research 71](71-forwarded-operator-and-purpose-claims.md) separately tests why an operator/use header needs authenticated coverage and provenance.

## An unknown key hides the distinction we wanted to measure

Cloudflare's [Web Bot Auth guide](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/#signature-agent-header) documents the older structured-string agent header, excluding bare URI and dictionary forms. Its diagnostic endpoint documents 200 for a known verified key, 401 for an unknown key or failed verification, and 400 for other failures.

The [one-shot probe](probe-managed-webbotauth.mjs) writes a plan before sending anything. It generates a fresh nonextractable Ed25519 private key in memory, uses `diagnostic.invalid`, omits credentials and limits execution to nine GETs with five-second timeouts and no retries. Only the public key and synthetic proofs enter the private input capture. No existing reader/vendor traffic or private key is forwarded. This identity has no provider enrollment and its directory is deliberately not reachable.

| Synthetic condition | Local Web Bot Auth | Independent RFC verifier | Public HTTP |
| --- | --- | --- | ---: |
| Unsigned | Absent | Reject | 400 |
| Structured string, valid | Verify | Verify | 401 |
| Corrupted signature | Reject | Reject | 401 |
| Expired signature | Reject | Reject | 401 |
| Bare URI, valid | Verify | Verify | 401 |
| Dictionary member, valid | Verify | Verify | 401 |
| Agent header uncovered | Reject | Verify | 400 |
| HTTP agent origin | Reject | Verify | 401 |
| Missing key ID | Reject | Reject | 400 |

**All six 401 responses have identical body bytes**, including valid, corrupt, expired and documented unsupported forms. A 401 therefore does not establish that the provider admitted a wire form, checked freshness or verified the signature. The observed 400 responses establish their HTTP outcome, without proving an internal parser stage. We do not infer provider implementation order or undocumented format support.

The [closed result](managed-bot-diagnostic.json) keeps HTTP status and response digests separate from an unavailable native boolean. Registered positive controls: **zero**. Eligible request-level managed comparisons: **zero**. Cryptographic agreement/error rates remain **null**.

## Verify locally without changing the experiment

The [offline harness](../../../scripts/check-managed-webbotauth.mjs) reuses the same nine inputs and recorded clocks. Node and native local workerd agree on every local outcome, including the original probe. The [pinned independent implementation](https://github.com/pyauth/http-message-signatures/tree/1de433d9a49fd608475c6054ab14a1652c088844) rechecks eighteen source files and verifies five inputs. Its generic RFC policy requires authority coverage, the tag and timing; our Web Bot Auth policy additionally requires a covered agent header and an HTTPS origin. Those two deliberate differences are policy boundaries, not unexplained cryptographic disagreements. Directory resolution is mocked locally; neither implementation proves reachability or provider enrollment.

The first workerd run is denied by the sandbox's loopback restriction. The authorized local retry passes and makes no public requests. [Checks and commitments](managed-bot-checks.json) preserve both attempts, source hashes and restricted archive commitments. [Primary-source captures](managed-bot-sources.json) preserve all seven URLs and content digests. Raw headers, synthetic proof inputs, response bodies and account captures remain outside Git with 0700 directories/0600 files. October 31 is a review date, not automatic erasure.

## Next comparison needs an eligible identity and an actual field

The [revised comparison proposal](native-verifier-comparison-plan.json) keeps the on-site experiment unexecuted. It now separates provider registration, the identity's Direct/Intermediary classification, native field exposure, local cryptographic validity and exact proof/storage joins. An arbitrary registered signer need not satisfy the documented intermediary field contract. Generic known-bot booleans, categories and public diagnostic statuses cannot substitute for this evidence.

Next bounded work: inspect the public registry entries and current primary signing promises for Exa and Ahrefs, preserving per-client versus service-level claims and the native-field eligibility question. No enrollment, plan upgrade or persistent credential is implied. The broader analytics goal remains open: this iteration supplies no human labels, RUM receipt, R1 attribution, whole-population refresh or privacy decision. Collector policy, historical rows and the concise 1,362-word article remain unchanged.
