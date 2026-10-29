# Correct the fetcher reference against its actual signature coverage

October 29, 2026 UTC. Continues [the editorial audit](94-reader-growth-and-editorial-decisions.md) and [article reach report](95-article-reach-report.md). Article 023's AI-fetcher reference had the strongest concentration-resistant signal among the inspected leaders. Improving that existing reference is a provisional editorial bet, not measured human demand.

## Finding and reproduction

The two September DuckAssistBot captures sign `@authority` and `signature-agent`, not the User-Agent, method, path or query. Earlier prose described a proven identity and implied that signatures settle the anonymous-fetcher problem. Those conclusions exceed the covered evidence.

The [reproduction script](../../../scripts/check-fetcher-reference-coverage.mjs) reads the existing public 37-row capture file and selects its two signed records. It accepts an explicitly saved directory and pinned reference checkout; it has no network fallback. One successful public directory GET supplies the current Ed25519 key. Its RFC 7638 thumbprint matches both saved key IDs. This does not reconstruct the September resolver state, wire representation or provider-managed verification.

The current local verifier runs in Node 24.14.1 and local Miniflare/workerd. The independent RFC implementation is Cloudflare `web-bot-auth` commit `e4d3167886d0e7508d55fc5c501f1e498a3d4f5c`, `packages/http-message-sig/src/core.ts`, with `structured-headers` 2.1.1. The script checks three pinned source hashes and the dependency version before bundling it. Its resolver uses the explicitly supplied public key and real WebCrypto Ed25519 verification; it does not stub successful cryptography. The signature bases also agree whenever the reference reaches cryptographic verification.

Each condition runs against both saved proofs. Node and workerd results match exactly; the independent implementation agrees on acceptance and distinguishes verification failure, expiry policy and resolver failure. These are controlled outcomes, not population error rates.

| Condition | Cases per runtime | Result |
|---|---:|---|
| Original | 2 | Verified |
| Changed User-Agent | 2 | Verified; base unchanged |
| Changed path and query | 2 | Verified; base unchanged |
| Changed method | 2 | Verified; base unchanged |
| All those unsigned changes together | 2 | Verified; base unchanged |
| Changed authority | 2 | Signature-invalid; base changed |
| Changed signed publisher header, same discovery origin/key | 2 | Signature-invalid; base changed |
| Changed signature bytes | 2 | Signature-invalid |
| Explicit clock 61 seconds after expiry | 2 | Expired under the configured 60-second skew |
| Injected cold-cache directory outage | 2 | Unavailable; not signature-invalid |

Totals: **20 contexts per implementation**, ten verified, six signature-invalid, two expired and two unavailable. The [closed receipt](fetcher-reference-coverage.json) retains derived coverage, outcomes, input/source hashes and the scope of the later directory capture. No raw private traffic or new signature bytes enter Git. Existing public study captures remain unchanged.

From the repository root, after compiling the analytics fixtures:

```sh
pnpm -C packages/analytics exec tsc -p tsconfig.test.json
node packages/blog/scripts/check-fetcher-reference-coverage.mjs \
  /absolute/path/to/saved-directory.json \
  /absolute/path/to/pinned-reference-checkout \
  /absolute/path/to/new-receipt.json
```

The reference checkout contains `reference/{core,errors,types}.ts` and `node_modules/structured-headers` as described above. A changed or unavailable future key is not a reason to silently fetch another key or claim original validity. The saved directory hash identifies the tested input; raw directory/response captures stay in the private evidence archive.

## Failed controls and what they changed

The first shell fetch failed DNS resolution within the sandbox; a separately authorized network fetch succeeded. Web retrieval of the directory and pinned raw source was unavailable; the experiment uses that successful directory capture and the already saved, hash-checked pinned source. Initial local workerd startup lacked loopback permission; the permitted local run succeeded.

The first 18-case experiment used a changed publisher origin that deliberately fell outside the fixed resolver. Its local result was therefore unavailable while the independent fixed-key check failed cryptographically. The final publisher mutation adds a trailing slash to the signed URI, retaining the same discovery origin/key, so both paths reach a signature-invalid result. The initial receipt is retained privately and superseded by the closed 20-case receipt.

The first added outage condition unexpectedly verified because the verifier's default cache was already warm. That is expected cache behavior, not evidence that an outage returns a fresh key. Each final condition uses a new explicit cache; the injected cold lookup now produces the intended unavailable outcome. No production cache policy changes follow from this harness correction.

## Article changes and sources

Article 023 keeps its URL, title, September publication date, original wire example and capture files. The October correction narrows network matches to attribution evidence, explains covered versus unsigned components, removes universal Grok-undetectability and human-count claims, and acknowledges that monthly vendor repeats were not completed. September vendor behavior is not relabelled as current. The original research footprint stays frozen, with a visible disclosure that it excludes this correction and the later analytics investigation. The material continuation prompt is appended without editing the prior prompt record. Article 030 remains unchanged.

- [RFC 9421 §7.2.1–2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1): uncovered components can change without invalidating a signature; sufficient coverage and freshness/replay policy are separate requirements.
- [Web Bot Auth draft 01](https://datatracker.ietf.org/doc/draft-ietf-webbotauth-httpsig-protocol-01/): authority-only reuse and legacy string-form migration are explicit protocol concerns. This is a draft, not a claim that the September captures implement every current requirement.
- [Pinned RFC implementation](https://github.com/cloudflare/web-bot-auth/blob/e4d3167886d0e7508d55fc5c501f1e498a3d4f5c/packages/http-message-sig/src/core.ts): `verifySignature` snapshots the message, constructs the selected base, applies policy, resolves a verifier and calls its actual verification method. The reproduction supplies Ed25519 verification and an explicit historical clock.
- [Official OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) describes ChatGPT-User's role and published ranges. [Egress guidance](https://developers.openai.com/api/docs/guides/ip-addresses) distinguishes network membership from a user/workspace and authentication. These current documents support the evidence boundary; they do not refresh the September vendor experiment.

## Acceptance and remaining work

The [local publication checks](fetcher-reference-checks.json) pass: twenty replay conditions per implementation, workspace types, all 22 Markdown posts valid, and an isolated 33-post build. Generated HTML has one H1, the dated correction and explicit unavailable outcome, with the current build-log link; the misleading Grok heading is absent. Evidence links and receipt hashes reconcile. No fresh browser-layout check is claimed. The initial build attempt was blocked by the tsx CLI IPC socket; the permitted isolated build succeeds. Source delivery and served acceptance remain separate. Source activation and served-content acceptance are separate from local evidence. Collector, classifier, verifier, schema, referral policy and optional-capture settings are unchanged. There are no own-site experimental requests, production D1 statements, human labels or fresh vendor trials in this experiment. The one public directory fetch is external research traffic.

The original goal remains open: native managed-verifier agreement, real-population errors/unresolved rates, human/device trials, historical proof completeness and reader intent are not established. Human trials remain deferred. Next, accept the corrected publication, then use authenticated Search Console evidence if available and plan fresh vendor-labelled trials separately from human trials. Do not derive search demand or a human growth rate from this replay.

Private evidence is preserved outside Git under a 26-file manifest, SHA-256 `50315ad290f613ffc5637b50910d397ec8f782a7368203716c5e7a58eaf23df4`. It includes the saved directory, intermediate receipt, final receipt, checked source snapshot and failed-build log. October 31 remains a review date, not automatic deletion.

## Served correction accepted

[Publication receipt](fetcher-reference-release.json): GitHub's Cloudflare Workers build check joins source `3fa5893` to successful build `d3da90bc` and full Worker `f24ce144-fe76-4d29-8a55-3b38e0f2f7a0`; a fresh Wrangler deployment listing allocates that exact version at 100%. The dashboard remained rate-limited after one backed-off retry, so its page is not the source proof. The full provider check supplies the source/build/version chain.

One planned direct Markdown GET returns HTTP 200 and matches all **48,479 built bytes**, including the dated correction. This has null analytics representation in the reviewed Worker source; no ingestion readback or per-request version trace was collected. No new report calculation, diagnostic D1 SELECT, collector/native-managed acceptance or production browser-layout claim follows. The local checks and current source remain distinct from the observed served-byte match. Article 030 remains unchanged.

The separate private release archive has 45 files under manifest SHA-256 `eb621bf54c66ddb9e89a1e86fd9e6754daf5d7739054518d60f313e769003440`, including the frozen one-request plan, provider check, allocation metadata, exact response and pinned reference sources. No owned preview server or tail remains active.

[Research 97](97-fresh-automated-fetches-and-measurement-gaps.md) corrects the prompt-provenance step: automatically replayed goal text is not a new human message. The original prompt history is preserved and the actual shaping messages replace that replay block; the frozen footprint and article's main prose remain unchanged.
