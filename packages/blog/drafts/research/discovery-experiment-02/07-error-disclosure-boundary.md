# Error filtering must not promise the absence of personal data

October 31, 2026 UTC. Continues [the report integrity repair](06-public-report-integrity.md), [TASK-0119](../../../../../docs/tasks/TASK-0119.md) and the unresolved [EU/US collection review](../analytics-retrospective/13-eu-us-collection-boundaries.md).

The privacy page claimed that browser error reports do not include email addresses, form contents, cookies, localStorage values, Turnstile tokens or full query-bearing URLs. That absolute claim exceeded the implementation. This is a disclosure defect; this audit does not establish sensitive contents in production records.

## What the code actually does

The [payload parser](../../../../client-observability/src/schema.ts) admits a closed set of bounded fields. The [sanitizer](../../../../client-observability/src/sanitization.ts) removes queries, fragments and user information from structured URL fields and recognized HTTP URLs in error messages and stacks. It redacts known confirmation/unsubscribe token paths. It explicitly does not detect arbitrary personal data or secrets. Bounded User-Agent and build text pass through.

The [built-in reporter](../../../../client-observability/src/client.ts) forwards browser errors and string rejections, which can contain arbitrary text, without deliberately reading form values, cookies, localStorage or Turnstile tokens into its payload. This is distinct from transport cookies. Accepted non-browser payloads are also untrusted: same-origin Origin admission is not sender authentication. The [server](../../../../client-observability/src/server.ts) logs admitted error text and paths before storage is acknowledged; the [database writer](../../../../client-observability/src/db.ts) reapplies the same parser. A failed write acknowledgment therefore does not establish the absence of a diagnostic copy.

## Six frozen synthetic controls

The plan and baseline source hashes were frozen before execution. Each case traversed the actual parser, browser redaction with supplied synthetic context, and the actual writer backed by local in-memory SQLite:

| Input condition | Observed result |
| --- | --- |
| Plain email address in message | Retained in message and storage. |
| Relative `/search?token=…` in message | Query retained in message and storage. |
| Query-bearing HTTP URL in bounded User-Agent | Retained in User-Agent and storage. This supplied fixture is not an observed ordinary browser header. |
| Absolute HTTP URL with user information, query and fragment in message | Those URL components removed. |
| Known confirmation-token path | Token redacted and query removed. |
| Extra dedicated email/form/cookie/storage/token properties | Dropped by the closed payload parser. |

All six controls pass under Node 24.14.1. They characterize selected boundaries, not population leakage rates, comprehensive filtering or current stored contents. No report was uploaded and no production data was read. We do not add a regression requirement that sensitive strings must remain retained.

## Correction and authoritative cross-references

The [privacy page](../../../src/pages/privacy.ts) now describes deliberate collection, structural URL filtering and its limits. It lists optional debugging fields and treats reports as private, potentially personal data. Database cleanup remains deletion eligibility after 30 days with possible scheduling failure; provider logs and backups have separate retention. Collection, admission, storage and retention code are unchanged.

The Irish [Data Protection Commission's transparency guidance](https://www.dataprotection.ie/en/organisations/know-your-obligations/transparency) calls for clear information about processing, purpose, legal basis, recipients, retention and rights. The US [FTC's privacy guidance](https://www.ftc.gov/business-guidance/privacy-security) tells businesses to describe their practices accurately and honor their promises; its [security guide](https://www.ftc.gov/business-guidance/resources/start-security-guide-business) supports deliberate collection, retention and fictitious development fixtures. Checked October 31. These sources support the disclosure review; they do not determine this site's legal applicability, lawful basis, transfers or compliance. The attempted European Commission obligations page was inaccessible through the web tool; the accessible regulator guidance supplies the transparency reference.

An independent source review approved the corrected scope. Six existing sanitizer tests, workspace types, 27 Markdown validations and an isolated 38-post build pass. Generated privacy HTML contains all four checked passages, removes the absolute promise, and retains one H1. [Receipt](error-disclosure-checks.json) records hashes and limits. No served-page or activation measurement is claimed. The retrospective already explains that arbitrary text filtering cannot guarantee the absence of personal information; its source and shaping prompts remain unchanged.

The full analytics goal stays active and incomplete. The six existing native/search/human/privacy/source-purpose/D1 inputs remain unresolved. A useful next local review is whether our own diagnostic call sites can express actionable failures with stable codes, before proposing a change to useful debugging evidence. That proposal must preserve the existing collection decisions and cannot stand in for new readership or growth measurements.
