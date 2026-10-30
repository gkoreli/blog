# Protect the evidence store without calling a report a person

October 30 UTC, 2026. Checked implementation, paired native controls and one agent-operated browser; source activation and production behavior are separate gates.

The diagnostic endpoint accepted requests without a same-origin check. Its content-type substring test also accepted `text/plain; application/json`, `application/jsonp` and a comma-separated value. A valid diagnostic body under those constructed headers could reach D1. This is a reproduced application behavior, not evidence that a foreign site or attacker generated our retained reports.

The new admission sequence is deliberately explicit:

| Gate | Rejection | Work avoided |
|---|---|---|
| Exact Origin equals the HTTP request URL's serialized origin | 403 for missing, null, foreign, sibling or malformed origins | No limiter, body read, enrichment or D1 write |
| Content-type essence equals `application/json` | 415 for a misleading substring or another type | No limiter or body read |
| Existing oversized Content-Length hint | 413 | No limiter or body read |
| Separate native diagnostic limiter | 429 denied; 503 unavailable, throws or has an unrecognized result | No body read or D1 write |
| Existing measured 8,192-byte and payload checks | 413 or 400 | No diagnostic insertion |
| Existing one-row D1 confirmation | 204 confirmed; 503 unconfirmed | No false storage acknowledgment |

The MIME check permits case-insensitive essence and parameters such as charset; it is not a complete MIME grammar validator. Origin uses exact comparison, with no Referer, forwarded-header, suffix or Fetch Metadata override. It is a browser isolation rule, **not authentication**: a constructed non-browser request with a matching Origin still passes that gate. Script injection or a compromised same-origin producer is not solved here. Report fields remain client claims, and no accepted report becomes a human label.

## Platform and library cross-references

[OWASP's origin guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#using-standard-headers-to-verify-origin) separates source/target origins, exact matching and missing/null cases. Our endpoint chooses a stricter required-Origin policy without its optional Referer fallback. Legitimate clients with unavailable origin information can therefore lose diagnostics; one successful browser does not measure that population loss. We use the Worker request URL, not untrusted forwarded headers, as the target. Alternate proxy/ingress configurations need separate validation.

The [Hono CSRF source](https://github.com/honojs/hono/blob/main/src/middleware/csrf/index.ts), inspected on this date, compares against the request URL's origin but scopes its default rejection to unsafe methods with form-compatible media types; allowed Origin or Fetch Metadata can satisfy it. It is not a drop-in assertion that every JSON diagnostic request has been origin-checked. We borrow exact matching and inspect the condition, rather than equating middleware availability with coverage. No Hono dependency is introduced; the main-branch link remains mutable.

[W3C Fetch Metadata](https://www.w3.org/TR/fetch-metadata/) describes initiator/target context and redirect effects. That working draft is not a human-authentication specification. This change does not add its fields to diagnostic admission or replace the existing analytics parsing/classification profiles.

[Cloudflare's native rate-limit contract](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) is approximate and local to a Cloudflare location, including possible overshoot within a location. Awaiting checks does not make a global or strict counter. It also warns that IP keys can group unrelated users and identifies route keys as an option. We use a fixed `client-error:v1` key in a separate `CLIENT_ERROR_RATE_LIMITER` namespace. The initial policy is **60 reports per 60 seconds per location**, independently of signup's existing three-per-minute IP budget. No new IP, cookie, session or user key is collected for diagnostics.

That shared route budget can suppress unrelated legitimate reports during a burst, and a caller can consume it using invalid JSON. We charge before parsing intentionally; this protects parsing/storage work but provides no fairness or strict account-wide cost cap. The value is a starting policy, not a measured safe threshold. No exact Retry-After/reset is fabricated from a native result that supplies no reset time. Rejection responses stay empty/no-store and do not emit a new arbitrary diagnostic log payload or acknowledge storage. Existing invocation logging remains distinct from D1 storage cost.

## Measured controls

[Paired native receipt](client-error-admission-native.json): 19 conditions per version use actual handlers, local workerd, native D1 and native rate-limit bindings. The original admits 17 constructed reports; the new handler admits five. Five origin controls, three misleading MIME controls, three injected limiter conditions and one over-budget control account for the twelve changed outcomes. Invalid JSON and oversized hints remain rejected. Native body-pull/write counters confirm early rejection. Injected denial/missing/throw cases are labelled separately from the actual native budget control, which accepts three sequential reports and rejects the fourth under its test configuration of three/60 seconds. This does not measure managed-edge concurrency, geographic aggregation or real traffic prevalence.

[Browser receipt](client-error-admission-browser.json): before two frozen, single-click controls, an independent D1 read finds zero rows. The actual BeaconTransport returns browser-queued, FetchTransport returns server-acknowledged, and independent readback finds both expected records, matching Origin and two 204 responses. This is one agent-operated local browser using actual transport/redaction/handler code with the production-valued native limit. It is not the entire production entry bundle, a human trial, a browser-close test or a population compatibility rate. The [fixture](../../../scripts/client-error-admission-browser-fixture.mjs) retains those boundaries.

The owned controller exits 143 after its targeted stop signal; the endpoint is subsequently unreachable. Its final disposal marker is absent and no final cleanup completion is inferred. The independent readback was saved before stopping, and the completed tab is closed. No repeated click is used to repair a failed trial.

[Checks](client-error-admission-checks.json): 160 site tests, workspace types, 22 Markdown validations, isolated 33-post build and isolated Wrangler dry-run pass. Native acknowledgment, body-limit and correlation reproducers were adapted to explicit Origin and a generous local test limit; their original before/after assertions still pass. Their historical receipts are unchanged. The direct-control helper now supplies the required production headers but does not execute requests. Reusing it still requires a fresh frozen plan and guarded readback/cleanup where a valid report can be inserted.

Accepted D1 rows do not yet carry a server admission-policy stamp. Exact release/date evidence is the available boundary; fewer retained reports across this change must not be interpreted as fewer browser errors. Persisting server-side policy/outcome provenance remains open.

No production HTTP/SQL, signup, verification, email or new human label runs in these local checks. No schema, traffic classifier/verifier, public report, article prose or prompt changes. The full analytics goal remains active. Remaining work includes server-side field sanitization, per-page/duplicate budgets, bootstrap/resource failures, slow-body duration and actual production admission/delivery loss. Readership growth, search demand and agent purpose are separate unresolved measurements.

The private 117-file archive preserves plans, source snapshots, native outputs, browser evidence, checked builds and shutdown receipts under manifest SHA-256 `f06a31aaf855b8979c24a1676fa26d8152ed3253f1cfe2037288ea6e144865b9`. October 31 is a review date, not automatic deletion. All owned experiment/build command handles are terminal.
