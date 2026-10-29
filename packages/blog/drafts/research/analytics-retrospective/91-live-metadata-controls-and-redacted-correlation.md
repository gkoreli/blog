# Live parsing is correct; a Browser match still leaves identity open

October 29, 2026 UTC. Continues [Research 90](90-fetch-metadata-parsing-and-evidence.md). The previous turn made progress: it delivered a parser repair and accepted activation/publication, while leaving actual production storage unmeasured. This experiment closes that selected live-storage check. Human trials remain deferred.

## Four requests, four stored outcomes

Four agent-controlled curl GETs to `/privacy` use the same browser UA claim, HTML/language headers, destination and site context. Only the planned mode or activation differs. Each is sent once with the existing referral-excluded hostname. A private marker restricts the tail. No JavaScript runs in curl; no owner credential, new exclusion rule or expanded diagnostic capture is used.

| Condition | Retained meaning | Stored kind | Activation fact |
|---|---|---|---|
| `navigate`, `?1` | Four valid fields | Browser | true claim |
| `NAVIGATE`, `?1` | Mode unrecognized; other fields valid | Unresolved | true claim |
| `navigate;x=@1;y=?0`, `?1` | Valid mode plus parsed parameters | Browser | true claim |
| `navigate`, `not-a-boolean` | Activation invalid; other fields valid | Unresolved | invalid |

All four arrive on a network not listed by our current infrastructure catalogue. **The two Browser matches were produced by curl.** The rule recognized supplied signals; it did not authenticate browser execution, a human or a device. The manually supplied `?1` also leaves the trigger unverified. This cohort has four known agent-controlled requests, zero human labels and zero implemented operator-attribution decisions. Four remain unresolved on that separate identity question; this is not the same denominator as the two stored Unresolved request labels.

All four native request contexts, acknowledged receipts and exact D1 references reconcile. Seven retained metadata fields per row—including ASN—match replay: **28 comparisons**. Sixteen closed field-state comparisons and four complete receipt projections agree. Collection `2026-10-29.6`, classifier `2026-10-29.3` and receipt/classification `2026-10-29.2` persist as intended. All signatures are absent. Optional request captures remain absent. No native managed-bot accuracy or historical population rate follows.

## The URL matcher failed before the parser did

The first GET returned 200 and its tail event contained a successful stored receipt. Our controller nevertheless stopped because it expected the logged URL to equal the original URL. Cloudflare had replaced the UUID query value with `REDACTED`. That failure and capture are preserved; the request was not repeated.

The [Tail Handler documentation](https://developers.cloudflare.com/workers/runtime-apis/handlers/tail/#tailrequest) describes heuristic URL-ID and header redaction, including false positives/negatives. The observed UUID fits its hex-ID rule. Wrangler 4.71's `jsonPrintLogs` parses and prints the received JSON without a separate URL transformation. Those facts support the documented mechanism; they do not identify an unpublished production implementation version. We did not bypass redaction or enable unredacted capture.

The adaptive matcher joins the response's Ray identifier to the tail request's identifier, checks the private marker and every planned header, and permits only the original URL or the documented replacement of this trial's UUID. The response suffix and tail's unsuffixed identifier are retained separately. **[Ray IDs are not guaranteed globally unique](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/)**, so the matcher also requires one-to-one correspondence and distinct IDs within these four captures. A Ray match alone is insufficient. Redacted query equality is never treated as unique request identity.

A new native fixture tests all four redacted URL/Ray representations and sixteen rejected linkage mutations before accepting the preserved first capture and sending the remaining three conditions. Expected metadata states and request budgets stay unchanged. The [matcher](metadata-live-control.mjs) rejects duplicate/missing Ray correspondences, altered markers, wrong URL shapes, changed headers, wrong Worker versions and inconsistent storage evidence. Its [native harness](check-metadata-live-control.mjs) keeps these controls synthetic and uses `cf: {}` plus an explicit synthetic ASN.

## Budget, acknowledgement and exclusion

Before the requests, an immutable private plan freezes four conditions, one attempt each and one production SELECT. Native workerd/D1 tests exercise exact references above JavaScript's safe-integer boundary and the maximum signed 64-bit ID; eight invalid ID inputs fail. Local report output has zero included views and four referral exclusions. The query uses the integer primary key.

After all captures, the concrete four returned storage references and the **943-byte** SELECT are native-tested and archived before execution. One Wrangler `--command` SELECT returns four rows for **eight reported reads and zero writes**. The 100-read review threshold is checked afterwards; it is not a server-enforced cap. Normal collection writes are additional work. No public report is filled and no broad census is run.

Exclusion is established from the four stored referrer hosts, the unchanged active policy and the native report control. There is no new production public-report calculation or claim that an existing cached report was refreshed. The exact chain covers these four controlled requests; it is not an independently retained Workers Logs export, original-wire reconstruction or whole-history audit.

## Operational corrections stayed visible

The first tail invocation rejects explicit `--sampling-rate 1` locally. Pinned Wrangler 4.71 checks the optional rate strictly between zero and one before creating a tail. The correction omits that filter; marker, method and version restrictions remain. No site request or SELECT precedes this correction. [Real-time log documentation](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/#limits) still permits sampling and dropped messages; omitting the filter does not guarantee a complete population capture.

Two subsequent scoped tail sessions capture one and three requests. Both stop. The second terminal snapshot briefly includes two zombie process entries; a later exact process-group check finds neither owned group present. Server-side tail-resource deletion is not independently inspected. The first URL-matcher failure and a local redaction-harness error remain in the private archive alongside the accepted run.

Fresh metadata and the downloaded build log link Worker `d65be377` to Ready build `122d6632` and source `7e20f0e`, at 100% allocation. Scoped Git comparison establishes unchanged runtime sources from `7681e26`; each actual tail event carries the full planned Worker ID. This is stronger request-version evidence than the earlier direct Markdown publication check.

The article replaces its existing uncertainty paragraph with the controlled-curl lesson and links this evidence. Its title and scope remain unchanged; [publication acceptance](metadata-collector-release.json) is recorded separately. [Native checks](metadata-collector-native.json), [live reconciliation](metadata-collector-production.json) and [source/plan commitments](metadata-collector-sources.json) retain the narrowed claims. Raw UA, source addresses, rays, markers, row references and captures stay outside Git. October 31 remains a review date, not automatic erasure.

## Next useful improvement

Expose the new parsing-state denominators with explicit historical unassessed records, and inspect the public Browser wording against what these controls can prove. Correct syntax is necessary for honest classification; it cannot supply engine or operator authentication. Human/device and native managed-verifier comparisons, R1 attribution and whole-history proof recovery remain open.

Private data commitment: 94 files, manifest `bce8d7c17de111bb10ed5a37431abb0f3f06a58d1fad72e2fe45ad94d3d14860`. No automatic erasure.

[Publication acceptance](metadata-collector-release.json) links source `364de9e`, Ready build `7a45c1ee`, its full log-linked Worker and fresh CLI 100% allocation. The separate ineligible Markdown GET matches all 16,248 built bytes; 1,437 words/31 prompts. Five total own-site GETs comprise four excluded collector controls and this publication asset. No new collector readback on the article-only version or fresh served HTML/layout is claimed. The dashboard’s unlinked source row/separate manually-labelled row is retained without inferring a manual agent deployment.

Publication-plan manifest `b8943ee9bde309d03e8b26766e5e598d099396ffc30b94b8c33974cdca73484e`; publication capture manifest `21e3747a61bd6b04ac4145fc9176e7831f7e334ff008fd0af1788092e0864fb3` (18 files).
