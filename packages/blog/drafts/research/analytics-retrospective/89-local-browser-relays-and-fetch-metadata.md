# One automated browser, three receiver labels

October 29, 2026 UTC. Continues [Research 88](88-unresolved-metadata-and-retained-inputs.md), which recovered 100 of 101 frozen Unresolved contexts without authenticating their original headers or operators. The previous goal turn made progress. This experiment uses an agent-operated browser; human trials remain deferred.

## The result

Fifteen local browser navigations, three per condition, reach a native workerd receiver. With an explicitly synthetic, unlisted ASN, the current rules produce **nine Browser, three Unresolved and three HTTP client labels**. With ASN explicitly absent, they produce **twelve Unresolved and three HTTP client labels**. The two assessments are reported separately; they are not thirty independent visits or Cloudflare detection results.

| Condition | Visits | Metadata at native receiver | Kind with synthetic ASN | Kind without ASN |
|---|---:|---|---|---|
| Direct browser | 3 | navigate/document; activation claim | Browser | Unresolved: network missing |
| Low-level HTTP relay, preserve | 3 | navigate/document; activation claim | Browser | Unresolved: network missing |
| Low-level HTTP relay, strip all four | 3 | All four absent | Unresolved: metadata absent | Unresolved: metadata absent |
| Low-level HTTP relay, strip user only | 3 | navigate/document; activation absent | Browser | Unresolved: network missing |
| Fetch relay, strip all four before forwarding | 3 | **mode cors added**; other three absent | HTTP client | HTTP client |

All twelve browser-at-relay records originally contain `navigate`, `document` and `?1`. Their UA values survive forwarding unchanged; the three direct visits use the same retained UA string. The final mode therefore cannot be interpreted as a statement about the whole upstream journey. The downstream HTTP client is Node for relay cases; the browser and agent operation are independently known from the controlled UI actions.

**Removing fields from a header object did not guarantee their absence on the receiving request.** The forwarding library supplied a field after that removal. Separately recording intent and receiver input exposed the difference.

## Why Fetch differed from low-level HTTP

The pinned local Node is **24.14.1**, reporting bundled Undici **7.24.4**. Its [documentation](https://github.com/nodejs/node/blob/d89bb1b482fa09245c4f2cbb3b5b6a70bea6deaf/doc/api/globals.md#fetch) identifies Undici as the Fetch implementation and documents `process.versions.undici`. A local constructed Request defaults to `cors` without sending a request.

In [Undici's HTTP-network path](https://github.com/nodejs/undici/blob/4991f3e1fbb93c8243fe072a69b08c47fd5d0e24/lib/web/fetch/index.js), `appendFetchMetadata` runs before transmission. Its [utility implementation](https://github.com/nodejs/undici/blob/4991f3e1fbb93c8243fe072a69b08c47fd5d0e24/lib/web/fetch/util.js#L211) writes request mode into `sec-fetch-mode`. The source bundled into the running Node binary contains the same operation at lines 5483–5486; its complete source hash is preserved privately. These source facts and three actual downstream receipts support the local mechanism. Other Fetch Metadata operations in this function are TODOs; this is not a claim of complete specification conformance.

This does not identify Node or Undici in the historical traffic. An observed `cors` value is not a library fingerprint. Other producers can send it, and downstream fields alone cannot reconstruct an upstream browser or human trigger.

Node is the controlled forwarding client here. Production Worker Fetch runs in workerd; this experiment does not establish identical forwarding behavior there.

## How the experiment separates its evidence

The [harness](../../../scripts/serve-local-fetch-metadata.mjs) binds two owned loopback listeners. A real agent-operated in-app browser navigates to the native Worker directly or to the Node relay, which forwards only to that fixed Worker. Low-level forwarding uses `node:http.request`; Fetch forwarding uses Node's built-in `fetch`. Fifteen predeclared IDs, three predeclared condition orders and one attempt per trial are frozen before browser visits. No UA override, production request, D1 binding or public observation is used.

The native Worker records a small selected header set, runs current metadata extraction/classification and sends a receipt through a local service binding. `cf: {}` suppresses Miniflare's provider fallback. ASN-absent assessment explicitly uses an empty CF object; the second assessment explicitly injects **64512 as a synthetic fixture**, unlisted by the current catalogue. Neither is actual network provenance or managed-bot verification.

Every UI action has an attempt record and a captured result. The [analyzer](analyze-local-metadata-relay.mjs) joins fifteen exact UI/native pairs and twelve browser-at-relay/outgoing/native triples by the predeclared trial identity. It checks that the intended deletions happened, that low-level HTTP preserved the remaining selected values, and that Fetch added the recorded `cors` mode. Thirty Node replays match the fifteen native receipts under both network contexts. Ten negative controls reject missing receipts/UI, duplicate identities, wrong conditions, changed outgoing UA/native mode, wrong ASN projections, a human-mislabelled operator, changed UI classification and removal of the Fetch-added mode.

There are **71 private trial/action/DOM records, 73,040 bytes**, below the frozen 80-record/1 MiB review thresholds. These are post-capture checks, not server-enforced byte caps. Frontend/native per-ID guards enforce one accepted capture. Raw UA and local correlation IDs remain private; only closed aggregates are published.

The receiver is HTTP on `127.0.0.1`. The [Secure Contexts draft](https://www.w3.org/TR/2023/CRD-secure-contexts-20231110/#is-origin-trustworthy) treats loopback origins as potentially trustworthy; this does not mean the transport was encrypted. The browser actually emitted the metadata. Direct navigation uses same-origin site context; cross-port relay navigation uses same-site context. Relay conditions share their frontend/source context, so the preserving relay controls the strip experiments. We do not call direct and relayed transports identical.

## Labels, abstentions and limits

These are **fifteen known agent-operated visits**, with zero human-operated labels. Browser means the current header/network rule matched. HTTP client describes the downstream request shape. Unresolved is an abstention on that classification. A separate operator-attribution question receives **fifteen abstentions**, because this system does not decide the operator from these inputs. Human error and human-abstention rates remain unmeasured. This cohort stays separate from the earlier twelve production controls and the 100 retained historical contexts.

The [Fetch Metadata Working Draft](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) specifies context signals and conditional activation emission. Removing only `Sec-Fetch-User` does not invalidate our navigation-shape rule, and these three controls confirm that behavior. All original `?1` claims here came from agent-operated link clicks; they are not human attestations.

The result demonstrates a mechanism under controlled conditions. It does not explain the 100 historical captures, prove that a particular intermediary stripped their headers, authenticate actual browser engines, measure physical-device differences or establish a population accuracy rate.

## The harness had a shutdown limitation

All fifteen accepted native/UI captures were saved before shutdown. The original signal stop exits **130** before the asynchronous terminal receipt is written; both owned ports are then verified closed. A startup-only non-TTY check has closed stdin and exits **143** on SIGTERM, also without a terminal receipt; both ports are verified closed. No other session's server is stopped.

The harness now accepts an explicit `stop` line on stdin. A separate TTY run, with zero browser trials and the **same native Worker bundle hash**, runs its four startup comparisons, writes a complete terminal receipt and exits zero. The delivered wrapper differs from the executed study wrapper only in shutdown support and explicit budget wording; both source hashes are recorded. This is an accepted shutdown control, not a retrospective claim that the original run stopped gracefully. The responsible signal-hook cause is unestablished.

Across three harness starts, four native startup comparisons pass each time: twelve total, separate from the thirty receipt replays and fifteen browser trials. Preferred reproducible shutdown keeps stdin open and sends `stop` followed by a newline. Raw captures survive abrupt stop because each stage writes independently with exclusive file creation.

## What changes next

The existing article's uncertainty paragraph now links these findings alongside retained-context recovery, with the synthetic-network limit beside the result. Its title, scope and 31-prompt record remain intact. Collector, classifier, verifier, report semantics and optional production captures are unchanged. [Publication acceptance](local-metadata-relay-release.json) separately links the exact source build and log-linked Worker to fresh CLI 100% allocation. One planned ineligible direct Markdown GET matches all 15,905 bytes of the isolated build; no fresh served HTML/layout or per-request version trace is claimed.

The next bounded investigation is **Fetch Metadata value normalization**: compare the current trim/lowercase behavior with versioned Fetch Metadata and Structured Fields semantics, then native-test case variants, duplicates and invalid values before considering a classification change. Research 88's uppercase normalization control measured current behavior; it did not establish standards conformance. Historical normalization-related inflation remains unmeasured.

Evidence: [experiment and negative controls](local-metadata-relay-experiment.json), [source captures and cross-references](local-metadata-relay-sources.json). [Checks](local-metadata-relay-checks.json) accept the executing harness, thirty Node receipt replays, ten negative controls, both JS syntax checks, 22 Markdown posts and the isolated 33-post build. Production source is unchanged; prior package/type checks remain dated. [Publication acceptance](local-metadata-relay-release.json) is recorded separately. Private plans, captures and installed-library source stay outside Git in mode-0700 directories with mode-0600 files. October 31 remains a review date, not automatic erasure. The full analytics objective is open; human-operated trials remain deferred.


Private commitments: plan manifest `0af1129bce4be6a869bcb8030db40a75daeb8142a8f72d6088578bd89c5e2f24`; data manifest `7f13f5c3fc352f8c9554b48a0cf8632e68646a767d61bb041543faac9cc02052` (109 files). No automatic erasure.


Live-plan manifest `34cfa2fd8a89926d9d9b74167f3bc80202f27673d8e3505770a8a44de8e3a2ee`; live acceptance manifest `457e81465245b422dacbfa6801b2f054238141ca4a9e070d5d2fde48ff486587` (21 files). Provider build Node 24.22.1 differs from the local experiment's 24.14.1; neither is confused with production Worker Fetch in workerd.


[Research 90](90-fetch-metadata-parsing-and-evidence.md) completes the proposed parsing audit and repairs demonstrated normalization/extension gaps. The fifteen visits remain agent-operated; no new human attribution follows.
