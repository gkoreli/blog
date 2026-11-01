# Trace a fresh assistant fetch through the real Worker

November 1, 2026 UTC. Source inspection for the owner's requested live-browser revision. **This document records a method, not executed trials or new findings.** The parent investigator owns browser actions, remote commands and accepted observations. No production request, query or capture setting was changed while preparing this note.

## The existing chain is enough for a useful live trial

Give each assistant a different exact URL, for example the existing canonical article followed by `?probe=fetcher-live-20261101-<service>-<round>`. Record the actual prompt, send time, UI product/model/account state, displayed answer and tool failure separately. Do not open that exact URL in the operator's browser: doing so would destroy sole-recipient attribution. Ask for content from the page rather than accepting a claimed HTTP status as evidence of a fetch.

The existing source connects four distinct observations:

1. Provider invocation URL contains the unique query label, if that URL survives the capture surface.
2. Within that invocation, `analytics.observation_attempt` assigns an operation UUID.
3. `analytics.observation_stored` reuses that UUID only after D1 acknowledges the one-row insert. It includes a closed receipt and `storage.observationId` as a decimal **string**.
4. A single primary-key D1 read checks that exact stored reference against the receipt.

Source: [`index.ts`](../../../../analytics/src/index.ts), `observePageResponse` and `persistObservation`; [`db.ts`](../../../../analytics/src/db.ts), `INSERT_OBSERVATION` and `recordPageObservation`; [`observation-storage.ts`](../../../../analytics/src/observation-storage.ts). The Worker invokes this flow after serving the chosen representation in [`worker/index.ts`](../../../src/worker/index.ts), lines 268–274 in the inspected checkout.

The query label is deliberately **not** an observation column: [`metadata.ts`](../../../../analytics/src/metadata.ts) stores `url.pathname`, not the query. Thus a `WHERE path=...` scan cannot identify which assistant received a labelled URL. Prefer the invocation → operation → returned row-reference chain. Keep row references private and preserve the ID string; JavaScript numeric conversion can lose integer precision.

## Tail filtering has an important limitation

Installed Wrangler is 4.71.0. Its `src/tail/index.ts` command exposes header, method, status, client IP, Worker version, sampling and console-message filters. `--search` is explicitly a match in **console.log messages**, not request URLs. A query label is absent from the current observation messages, so `--search=<probe>` is the wrong filter. `--header` only helps if the actual assistant supplies the selected header; do not invent a header that the browser UI cannot request or silently impersonate a different client.

A short GET-only tail captures real invocations without requiring new runtime logging:

```sh
pnpm exec wrangler tail gkoreli-com --format json --method GET > /private/tmp/fetcher-live-20261101/tail.json
```

Start it before any prompt; confirm that the process is connected before sending. Retain process/session identity and stop that owned process after the bounded window. The raw stream can include unrelated traffic and private request data: keep it private with restrictive permissions, extract only the experiment's matched chains and publish a minimized projection. `--search analytics.observation_stored` is a narrower alternative for receipt-only work, but it cannot recover 404/ineligible invocations or establish an exact query match on its own. It is not a substitute for the whole requested experiment.

Do not pass `--sampling-rate 1`: Wrangler 4.71's parser rejects values at either endpoint; omitting that option avoids adding a further sampling filter. Existing configured head sampling is not proof that every event will be delivered or retained. Native retained-log queries can recover labelled invocation URLs if live delivery is missing; retain scope and ambiguity instead of calling an absent tail record “no request.”

The [September probe ledger](../ai-fetcher-headers/02-probe-captures.md) used the same labelled-URL approach. Its results are historical. The [latest-proof recovery](../analytics-retrospective/72-latest-signed-proofs-and-log-identifiers.md) shows why a retained `$metadata.id` alone is unsafe for deduplication: use distinct request references and exact invocation/context matches, retaining collisions.

## Read back exact rows with minimal work

Follow the [operational D1 contract](../../../../../.agents/skills/blog-maintenance/references/operations-and-handoffs.md). A successful `whoami` or `d1 info` is metadata access, not query access. After an authorization failure, inspect metadata, native-test a constant query locally, then perform one conditional remote constant control before reading observation rows. Do not retry a failing data scan blindly.

Prepare SQL in a private file, native-test the actual statement locally, then pass its entire contents as one subprocess argument through Wrangler `--command`. Remote `--file` invokes D1 import and is inappropriate for a diagnostic SELECT.

```sql
SELECT CAST(id AS TEXT) AS observation_id,
       path, observed_at, collection_version, classifier_version,
       representation, is_owner, reader_kind, reader_reason,
       agent_name, signature_status, signature_agent,
       signature_evidence, classification_evidence, vendor_ip_evidence
FROM page_observations
WHERE id IN ('<exact returned decimal reference>');
```

This template must be instantiated only after validating the returned ID with `isObservationId`; placeholders are not SQL parameters here. Fix the finite ID set before the one remote read, preserve its SQL hash and inspect `EXPLAIN QUERY PLAN` in the local preflight. Use `subprocess.run([...,'--command='+sql,'--json'],...)` or Node's argument-array equivalent. Do not interpolate SQL through a shell. Record reads/writes, attempt count and database-change flags from every response. If a receipt has no returned row reference, that join remains unavailable; do not replace it with a broad time-window scan without a separate bounded plan.

## What can be reported without enabling raw capture

[`observation-receipt.ts`](../../../../analytics/src/observation-receipt.ts) already emits the following closed projections after acknowledged storage:

- Declared names/count/status and their category agreement.
- Assessed network methods, match and unavailable states.
- Local signature status, outcome, known reasons, verifier profile and reviewed signer display.
- Whether authority, target URI, method, path, query, User-Agent and digest were covered, plus replay-policy and candidate-selection facts when available.
- Provider `verifiedBot`, `signedAgent` and category states, preserving `unavailable` separately from `false`.
- Reviewed directory-publication assessment.

[`signature-evidence.ts`](../../../../analytics/src/signature-evidence.ts), `verificationEvidence`, reads native booleans only from actual `request.cf.botManagement`; it does not infer them from UA, a local positive proof or a dashboard category. Successful local verification is not a Cloudflare managed-verifier verdict. Signature coverage states what the proof binds; an unsigned UA or path remains unsigned even when the proof verifies.

Optional `ANALYTICS_DIAGNOSTICS=private-v1` is off by default, adds only bounded UA/Accept/transport inputs on indexed public pages and still respects DNT/GPC. It does **not** provide a full signed packet. Do not enable it merely to obtain these trials. The separate `/api/analytics-native-capture/*` endpoint is an expiring owner-gated experiment, not a generic assistant-fetch probe; changing its guards/bindings would be a different experiment.

## Interpretation and contamination controls

- Eligibility requires GET, successful response and a supported HTML or negotiated-Markdown representation. Direct `.md`, API/stats/owner routes, HEAD, prefetch and unsuccessful responses do not create ordinary page observations. A 404 can still have a real invocation; it has no ordinary stored receipt under this source.
- Successful canonical experimental GETs can create public-counted observations. A query label does not mark owner exclusion. Keep their exact references/counts in the research ledger and do not present those deliberate requests as organic growth. Do not modify unrelated exclusions to make a trial fit.
- One assigned URL can create multiple requests. Count assigned prompts, attempted tool actions, observed invocations, acknowledged inserts and exact readbacks separately.
- An assistant's answer, a visible citation, an invocation, response delivery and reading/use are different observations. A correct answer alone does not prove a fresh fetch. A failed or missing capture alone does not prove the client made no request.
- Real provider access failures, sign-in/terms gates, challenge pages, delayed fetches and missing native booleans are results or limits to preserve. Do not bypass protections or collect new credentials to improve the success count.

The owner has requested fresh browser trials; these source checks make that next action concrete. They establish no current service behavior, current vendor behavior or completed article acceptance by themselves.

## Reusable offline extractor and local readback preflight

[`extract-live-fetches.mjs`](extract-live-fetches.mjs) now snapshots a supplied Wrangler stream and an explicit frozen label-to-service JSON map. It parses concatenated formatted JSON objects, preserves malformed completed frames, noise and an unparsed suffix privately, and reports their counts/byte length/hash. It selects only the exact site origin and a single assigned `probe` value with the frozen prefix. Unknown assigned-prefix labels fail rather than acquiring an inferred service name.

The script writes matched raw invocations, exact string row references and prepared SQL **only into a new private output directory**. Its separately reviewable `public-projection.json` contains response status, time, Worker version, recognized UA product/version tokens, checked Accept/Fetch Metadata, retained signed-component names and selected closed receipt facts. It omits raw URL/query, addresses, arbitrary headers, cookies, credentials, signatures, nonces, operation IDs and observation IDs. A retained signing-header presence/coverage projection does not establish a complete original packet or independently reverify it.

Only a stored receipt with one matching attempt and one stored message for the operation contributes a validated primary-key reference. Duplicate messages remain visible and cannot become an accepted unique chain. SQL preparation rejects numeric, nonpositive, overflowing or malformed identifiers. The actual SELECT and EXPLAIN run through isolated native workerd/D1 using the checked fresh schema and local seeded records. This is a syntax/selection/index preflight, not a production result.

Run from the original repository root, using a **new** output directory each time:

```sh
node --import ./packages/blog/node_modules/tsx/dist/loader.mjs \
  packages/blog/drafts/research/fetcher-study-v2/extract-live-fetches.mjs \
  /private/tmp/fetcher-live-20261101/tail.json-stream \
  /private/tmp/fetcher-live-20261101/labels.json \
  /private/tmp/fetcher-live-20261101/extract-NEW
```

`--no-preflight` permits offline extraction when loopback execution is unavailable; it must not be represented as a passed local D1 check. The [extractor controls and initial preflight](08a-live-extractor-checks.md) retain the initial failures and accepted scope. Rerun extraction after the actual assistant trials before freezing any remote readback; this note's first observed match is the operator control alone.
