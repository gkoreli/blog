# User-Agent trust: source and local acceptance

November 10, 2026, America/Los_Angeles. Completes this source iteration of [worklist 136](136-user-agent-trust-and-hardening.md), following the owner's expansion beyond the narrower [research 135](135-user-agent-errors-beyond-this-blog.md). [ADR-0016.22](../../../../../docs/adr/0016.22-user-agent-claims-and-platform-ambiguity.md) records the accepted domain contract. The article remains an unpublished draft with no release date.

## What the wider audit changes

The [twelve-family map](137-user-agent-pain-point-map.md) distinguishes lexical errors, compatibility products, frozen versions, desktop presentation, contradictory claims, unverified names, browser automation, missing/WebView signals, Client Hints, purpose/policy, parser cost/privacy and versioned consumers. Each row identifies an incident or concrete example, source, consequence, scale boundary and code disposition. They overlap; twelve is this investigation's organization, not an exhaustive bug count or affected-user estimate.

Browser-wide defaults establish a wider relevant population than the phone-brand collision. Chromium's [reduction rollout](https://www.chromium.org/updates/ua-reduction/) records 100% of Android clients M110+ via Finch on May 11, 2023. This does not measure broken sites or current market share. Safari's frozen OS and desktop-looking tablets likewise define browser/version/mode scopes. Historical Matomo/isbot fixes, a Sentry report, the WebKit metrics discussion, the reported Rybbit regression, the version-100 investigation and UAParser's historical ReDoS fix retain their different evidence strength and limits.

The implementation repairs three reproduced normalization domains:

- Shared browser values preserve ordinary compatibility products but abstain from selecting Edge over Opera by priority when both are supplied.
- Shared platform values inspect all supported families/versions. Conflicting claims abstain; compatible Linux markers, equivalent numeric forms and absent minor versions retain their meaning. Reordered contradictions no longer change the selected OS.
- Mobile-hint parsing accepts HTTP SP/HTAB padding only. Native `Headers` preserves NBSP-padded `?1`, which JavaScript `trim()` previously promoted to a valid preference. Mixed-history reporting preserves earlier recorded preferences under their original profiles.

The new pure `assessUserAgent` export and local JSON inspection command expose supplied claims, missing/empty states, conflicts, form preferences and cautions. Authentication is always `not-performed`; no actual device/OS reconstruction follows. The service has no Worker/database/network dependency and returns no raw header, arbitrary unmatched names or contact URLs. The CLI rejects unsupported fields, invalid UTF-8, oversized input and non-regular files with a fixed error. It is private workspace source with a portable JavaScript bundle path, not a published npm package or independently adopted service.

`REQUEST_EVIDENCE_VERSION`, collection, client-form and incoming-request assessment profiles advance to `2026-11-10.1`; the pure assessment profile is `user-agent-claims/2026-11-10.1`. Earlier client-form profiles remain recognized. Classifier, catalogue, alias codec, verifier and record shapes stay unchanged. Optional diagnostics remain off by default. No migration, new raw field, high-entropy hint request, external detector dependency or production query is introduced.

## Final checks and their boundaries

| Check | Accepted result | What it establishes |
| --- | --- | --- |
| Analytics suite | 442 tests passed; no failures/skips | Specified library contracts, including preserved positives and mixed-profile reporting |
| Site suite | 432 tests passed; no failures/skips | Existing site consumers under the updated source |
| Workspace types | All seven checked workspace projects pass | Pinned local TypeScript contracts, including Worker types |
| Supplied header native comparison | 35/35 exact Node/workerd matches and 35 D1 readbacks | Local runtime/header/serialization agreement, not genuine browser or hardware identity |
| Existing minimal/composed collector integration | Baseline 22 requests / 6 stored; detection phase 26 requests / 8 exact stored receipt matches | Actual local collection/report/owner exclusion with fixture D1 and explicit synthetic edge context; zero optional diagnostic rows |
| Current-request API integration | 55 local HTTP requests; actual API/OpenAPI responses agree, 74 aliases round-trip; 12 malformed schema controls rejected | Updated incoming-request profile, real local workerd/D1/quota/no-JS consumer behavior; no external verifier |
| Extraction tool | All 16 selected controls pass | The explicit extraction contract, not universal bot-detector accuracy |
| Inspection command | Valid input exits 0; unknown field, malformed UTF-8 and oversize controls exit 2 without raw echo | Bounded CLI admission and closed report output |
| Portable assessment | Neutral ESM imported outside the repository with transport disabled; zero network requests | No Worker, database or browser globals needed for this use |
| Metamorphic controls | 39 comparisons pass | Selected claim-order permutations and URI append invariants |
| Fresh schema / referral policy | Both existing consistency checks pass | No unintended generated baseline/policy drift |
| Article pipeline | 34 Markdown posts validate; isolated full build renders 45 posts including the temporary draft preview | Frontmatter, source rendering and generated representations without touching shared `dist/` |
| Reader presentation | Actual IAB at CSS widths 1280 and 390; page widths match; all four tables/code scroll internally on mobile; prompt link opens all 13 prompts | Local desktop/narrow-width rendering and provenance navigation; no publication or physical-device claim |

Native/collector/API checks make zero external or production requests and create no human labels. The collector fixture uses a Request adapter for canonical Fetch Metadata because Node transport rewrites a field; it does not prove wire fidelity. The native header comparison separately exercises `Headers` with the supplied values. The API test supplies a missing-edge-address network fixture and does not authenticate a vendor.

The observation bundle grows from 242,181 to 243,348 bytes against source `e03efbd7157c6b9d32ef8dfc5b8924ec9b3c7f3a`; gzip grows from 70,964 to 71,332 bytes (**+368 bytes**). The pure neutral ESM is 15,567 bytes / 4,524 gzip. These are local byte measurements, not CPU, billing, latency or accuracy improvements. The isolated checkout began at `57fd4a28`; the intervening `e03efbd7` commit records the unrelated stats recovery without changing runtime source. Concurrent stats work and unrelated Ahrefs files are preserved.

## Review and preservation

The manuscript now leads with frozen-version/device/identity consequences, explains the twelve families and their scale limits, connects the historical lexical repair to the new diagnostics/hint repairs, and offers a usable local tool. All thirteen complete shaping prompts remain in order. Only the administrative draft note is removed from the isolated preview copy; it remains in the real draft. Generated title/description, initial HTML, Markdown, prompt page and citations are checked together. The preview date is a working draft value, not an assigned publication date.

Private source captures, the initial wrong diagnostics, native NBSP counterexample, failures, successful logs and exact accepted source/render snapshots are retained in Git-ignored `packages/blog/worklog/user-agent-trust-2026-11-10/`. [The machine receipt](138-user-agent-hardening-acceptance.json) records source hashes and the verified private-manifest commitment. Raw captures and session logs are not committed.

Failed attempts remain evidence: one socket-restricted native invocation, a collector checkout missing its pre-existing workspace link, the active collection-version assertion caught by the final suite, and the incorrectly expanded upstream commit prefix. The actual maintainer commit and final native/check results replace those failed assumptions; none is hidden as a success. An article link audit initially encountered this not-yet-created acceptance file and is rerun after creating it.

Source delivery, deployment activation and measured production behavior are distinct. This receipt accepts the source/local checks. The November 6 six-request live acceptance remains historical and is not rerun here. New production incidence, worldwide affected-site rates, genuine-device accuracy, a complete grammar/cost audit and independent adoption are not established.

## Next bounded action

Owner editorial review and publication preparation remain for the active draft, with no scheduled slot. A proposed next product experiment is one separate operator evaluating the pure assessment/local tool on their own stack, recording install friction and a small set of disagreements under an explicit contract. No operator has been contacted or trial accepted by this receipt. Hidden OS/hardware recovery and human identification are information limits, not promised features. Other retired article directions remain closed.
