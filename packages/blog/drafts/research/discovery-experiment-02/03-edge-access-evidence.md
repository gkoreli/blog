# Trace the rejected release control without repeating it

October 31, 2026 UTC. Continues [the single served check](answer-fidelity-release.json) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). The prior turn was progress: the heading repair was activated, while the failed served-body acceptance remained explicit.

## Frozen read-only investigation

Verify the original twelve-file release manifest, then inspect its saved denial body and headers. Look for a provider error code and evidence of the rejecting feature. Consult authoritative documentation for that code, security-event coverage/sampling and request processing order. Browser-signature heuristics and HTTP Message Signatures are separate mechanisms.

Use the existing authorized Cloudflare dashboard session for a focused native Security Events lookup of Ray `a53146f84f27ec08` around `2026-10-31T08:26:51Z`, and inspect the current relevant security setting if needed. Record exact filter/window, returned evidence, unavailable/missing states and the distinction between current configuration and the historical decision. Do not collect unrelated reader records, change a setting, query D1, retry the denied page, impersonate another client, expand permissions or bypass the blocking. An absent sampled event is not proof of absent edge/Worker activity.

Stop once the rejecting feature/stage is supported or the available native evidence establishes a concrete coverage limit. Preserve uncertainty rather than searching broad unrelated windows. Code changes need a separate demonstrated gap and acceptance; this plan does not authorize weaker protection.

## Results

The original response and all twelve prior archive files verify. Its saved HTML carries **Cloudflare Error 1010**, narrowing the earlier generic status finding. In the existing native Security Events view, the exact-Ray filter returns one matching event at **2026-10-31 08:26:51 UTC**, with **Block — Browser integrity check**. Expanded request details and the displayed event-export payload agree:

| Retained provider field | Observed value |
| --- | --- |
| `source`, `ruleId` | `bic`, `bic` |
| `action` | `block` |
| User-Agent | `Python-urllib/3.14` |
| Method / host / path | GET / gkoreli.com / the fetcher-reference path |
| Protocol / query | HTTP/1.1 / empty |
| `sampleInterval`, `matchIndex` | 1, 0 |

Ray, time, host, path, method and empty query corroborate the match to the saved release control. The provider event timestamp's one-second interval contains the recorded post-read observation time. [The later clock audit](05-retained-control-evidence.md) corrects the original receipt-time wording: the Python script sampled that clock after reading and processing the body, not at network arrival. The same User-Agent also matches the known Python urllib execution. This is a controlled request attribution, not authentication of arbitrary future requests claiming that token. Empty description/ruleset fields and `zoneVersion: 0` are retained without inventing their semantics.

The [closed record](edge-access-evidence.json) supersedes the earlier unknown rejecting-feature status: **BIC is now supported by native provider evidence**. The exact decisive signal, effective historical configuration and per-request Worker/storage trace remain unmeasured. No current setting needed inspection after the provider identified the feature; no setting was changed.

## What the authoritative contracts explain

Cloudflare's [1010 documentation](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/) identifies browser-signature rejection. [BIC's contract](https://developers.cloudflare.com/waf/tools/browser-integrity-check/) describes checks on HTTP headers and unusual or missing User-Agent values. Those facts are consistent with this native `bic` event; we did not vary headers to isolate its deciding condition. A “browser signature” in this message is a client-characteristics assessment. It is not an RFC9421 proof failure, verified publisher identity or evidence of malicious intent.

[Security Events](https://developers.cloudflare.com/waf/analytics/security-events/) contains security events rather than a request census. One request may trigger multiple events, and sampled logs may omit individual events. The returned `sampleInterval: 1` stays a fact about this record, not a promise that every request/event was captured. [Ray IDs](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/) are useful joins but not guaranteed unique, which is why this match retains request/time context.

Cloudflare documents [Workers after WAF and Access](https://developers.cloudflare.com/learning-paths/mtls/mtls-workers/), while [BIC operates independently of the Ruleset Engine](https://developers.cloudflare.com/waf/feature-interoperability/). This supports an upstream security explanation without assigning BIC a guessed named ruleset phase or pretending to have traced this Worker invocation. The 1010 page also describes a separate managed-zone no-log case for Pages/workers.dev; our tracked configuration declares a **Worker Custom Domain**, so that special exception cannot simply be imported into this diagnosis. Here we actually found an own-zone event.

## What this changes in analytics interpretation

An attempted access, an edge security event, an article delivery and a classifier decision are different observations. The release test was a known automated maintenance attempt with a benign task, and it received a security denial. It is not a new human label, an organic audience request, a measured population false positive or a new registered calibration trial.

The existing calibration evaluator correctly keeps incomplete measurements outside classifier abstentions and the confusion matrix. The fetcher ledger requires its own marked plan and Worker capture. Neither should be loosened or supplied a fabricated collector event to make this rejected ordinary-page check look complete. We inspected those implementations; no classification defect is demonstrated by this block.

The useful improvement is to make access-stage evidence available alongside delivered-request evidence, preserving separate denominators and unobserved states. Adding a field only after a request reaches the collector cannot recover earlier denied attempts. Native security totals also cannot be added to page views or treated as unique request totals. We are making these boundaries more explicit; no broad blocked-reach estimate follows from this single control.

## Capture, checks and decision

The initial native window was Last 24 hours; the final exact-Ray selection returned one event. Absolute API bounds were not exported. The event projection retains seventeen fields; seven, including clientIP and arbitrary metadata, were omitted before retention. It is a minimized projection, not an unaltered full JSON export. A download-listener attempt timed out and reset the controller; no event file was found, and the same filtered view was rebound. Reading its already displayed data-URI payload supplied the projection without another own-site request. The read-only DOM scope did not expose a percent-decoder, so decoding occurred in the controller after reading the ordinary export-link attribute. No browser internals, alternate service or hidden application state was used.

A first Apply left the filter dialog open; inspecting the visible fields and blurring Value allowed the exact filter to commit. The owned tab was closed and no export tab remained. User tabs, security configuration and credentials stayed unchanged. We did not query Worker logs or D1, alter a rule, repeat the served request or take a challenge action. The original served-destination check remains unaccepted, and the original answer-trial grade remains unchanged.

All fifteen new private archive files verify under manifest SHA-256 `4f59017cc32972db217c319881bcf490364fad777be69cc4b214f8d66c81bfa5`. The [receipt](edge-access-evidence.json) preserves the provider projection, contextual join, source references and unchanged-code hashes. Scoped record/link/invariant checks pass; no new runtime tests or builds are required for this evidence-only update. The earlier 169 site tests and local navigation checks retain their dated scope.

**Decision:** retain protection and stop probing this rejection. Next, design a bounded offline access-evidence ledger using this actual control: keep attempts, security events, responses, collector observations and classification outcomes separate; require contextual Ray joins, preserve multiple matching events and conflicts, and leave unavailable downstream stages unknown. Do not merge it into the existing calibration matrix or infer people from it. The full goal stays active/incomplete, with human/native-verifier/search/privacy inputs unchanged.
