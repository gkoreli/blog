# Authenticate bytes and bound request reading

November 5 Pacific / November 6 UTC. Part of [the expanded engineering iteration](32-four-hour-engineering-iteration.md).
This is an implemented local repair, with native runtime acceptance below;
source delivery and current production behavior remain separate.

## Defects and the repair

The old webhook decoded its body before constructing the Svix signature input.
`TextDecoder` removes an initial UTF-8 BOM by default. In controlled actual-handler
tests, prefixing that BOM without replacing the canonical body's signature was
accepted, while signing the actual BOM-prefixed bytes was rejected. The parsed
JSON meaning in this control was unchanged; this is a wire-authentication
contract defect, not a demonstration of arbitrary payload forgery or an observed
production attack.

[Svix's manual contract](https://docs.svix.com/receiving/verifying-payloads/how-manual)
requires the original body. The inspected
[Standard Webhooks implementation](https://github.com/standard-webhooks/standard-webhooks/blob/main/libraries/javascript/src/index.ts)
accepts byte views and constructs the HMAC from the encoded ID/timestamp prefix
plus those bytes. The new `webhook-authentication.ts` owns that transport contract,
timestamp freshness and key configuration. Application UTF-8/JSON decoding runs
only after successful authentication; it rejects malformed UTF-8 explicitly.
The existing Web Crypto HMAC and multiple-signature behavior remain, without a
new dependency.

The old body readers also awaited cancellation after overflow and had no elapsed
read deadline. A source whose `cancel()` never settled could hold rejection open;
an unfinished source could wait indefinitely. Missing webhook headers were
checked only after that wait. An empty decoded secret threw `DataError` instead
of returning a classified service response.

The shared newsletter transport reader now bounds actual bytes and reading time,
honors a supplied abort signal, and never awaits producer cancellation before
rejection. Content-Length is an early hint; actual bytes remain authoritative.
Limits stay 4 KiB for public confirmation input and 64 KiB for webhook input. The
default five-second read deadline is an application choice. Oversize returns 413;
timeout/cancellation 408; unreadable or malformed input 400. Missing/expired
authentication is rejected before waiting for webhook bytes. A malformed private
key becomes 503 without dumping its value or a native exception.

The body deadline is independent of incoming-disconnect propagation. At the
Worker's `2026-03-06` compatibility date, `enable_request_signal` is not selected;
the constructed AbortController controls below do not establish actual client
disconnect notification. [Workers Request](https://developers.cloudflare.com/workers/runtime-apis/request/)
and [duration limits](https://developers.cloudflare.com/workers/platform/limits/)
explain why neither signal support nor an assumed short platform timeout is a
substitute for the application's own read budget.

## Diagnostics and boundaries

One webhook observation carries a generated request UUID and a closed stage:
configuration, authentication, body, payload, ignored event, suppression applied
or suppression failed. Reasons are finite; successful suppression includes only
the documented event family and recipient count. The response exposes the
request UUID for correlation. Addresses, raw IDs/headers/body, signatures, secrets
and provider exception text are absent. A storage exception returns503 for
provider recovery and is not described as a confirmed write.

Authentication is an infrastructure boundary; suppression remains a business
operation. The body helper is within the newsletter context, shared by its HTTP
adapters rather than exposed as a new cross-repository framework.

## Reproductions and checks

Nine baseline Node actual-handler controls produced one pass and eight failures.
After the repair, eleven boundary controls and forty existing newsletter cases
pass together: **51/51**. The tests cover exact/altered signatures, both BOM
directions, authenticated invalid encoding, missing auth with an unfinished body,
non-settling cancellation, both public send routes, pre/mid-read cancellation,
read deadline and malformed configuration. The old broad timer fake was corrected
to advance only its provider's two-second rate wait, rather than accidentally
firing the new body deadline immediately.

[Native aggregate receipt](newsletter-request-boundary-checks.json): the paired
driver executes ten cases per version in actual local workerd/Web Crypto/D1,
using baseline `d63ea5b62cbd86ab427348f8df67cdd1c0227651`. It preserves the ordinary
signed bounce and its database change. The unsigned BOM changes 200 → 401; the
authentic BOM changes 401 → 200. Invalid signed UTF-8 becomes a payload 400 after raw
authentication. Missing auth, overflow, cancellation and a five-second incomplete
body terminate at their expected boundary without subscriber mutation. Malformed
configuration becomes 503. Outbound provider calls and production calls are zero.

The first native harness assumed the older invalid-UTF-8 condition would return
200; actual workerd returned401. That failed assertion was preserved, corrected
and the baseline measured directly. It is a harness correction, not a production
defect or a reason to change the repair. Raw bundles/results remain private under
the dated `/private/tmp/gkoreli-newsletter-request-boundaries-20261106-*` directories.
The public receipt contains only controlled cases, statuses, counters and hashes.

Newsletter package types pass. The native driver checks constructed streams and
real D1 effects, not incoming wire framing, browser populations or delivered mail.
No production request, schema mutation, credential change or email is needed for
these controls. Next: deliver this scoped repair, then extract explicit server
confirmation policy and integrate the independently owned browser/provider work.
