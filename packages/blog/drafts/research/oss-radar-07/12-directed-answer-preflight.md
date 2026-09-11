# One directed answer: frozen preflight

Protocol prepared September 9, 2026 UTC / September 8 PDT, before viewing a live answer. **Executed September 10 PDT / September 11 UTC through Codex and Claude Code subscription CLIs.** The question and rubric remained frozen. The collection route was amended before execution after Goga clarified that he has Perplexity Pro web access but no purchased API credits. See [the provider-choice correction](13-provider-choice-and-web-capture.md). This directed case is separate from the proposed 72-call organic-discovery cohort.

At the first September 10 publication decision, browser access failed before submission. That historical failure is preserved in [the release record](17-publication-decision.md). The later [CLI route amendment and execution](20-subscription-cli-experiment.md) produced two real answers and a [completed source review](21-real-answer-source-review.md). The web-capture instructions below describe the unused original route.

## Exact question

```text
Using https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript, explain what the blog can measure about readers and bots without JavaScript. State what the reported comparison with Cloudflare Web Analytics does and does not establish. Cite the source for each material measurement or limitation. If you cannot access the article or verify a claim, say so rather than inferring it.
```

The explicit URL makes this a directed access and evidence-retention test. A citation here must not be counted as organic discovery. Do not replace an inaccessible article, failed request, or no-citation answer with a more favorable question after seeing the outcome.

## Execution contract — preferred web capture

Use ordinary search in the existing Perplexity web membership. Preserve the exact submitted question, complete visible answer, citation markers and their links, UTC capture time, and any displayed model/mode label. Record the captured representation and its hash. Do not infer hidden model versions, retrieval steps, token usage, temperature, or per-answer cost. The API adapter's 700-token limit does not control a browser answer. Record the actual visible interface settings before submission.

Before the question, retain a private snapshot of the served article with URL, retrieval time, content hash, and access status. Do not pass the scoring notes into the question. Use the existing subscription allowance; this protocol does not require Computer, an API-credit purchase, or additional paid calls. Preserve a failed search or inaccessible answer rather than silently resampling it.

Save the web answer as a web capture, then import that saved record through Promptfoo's custom-provider interface. Return its answer text for evaluation and retain the captured citation relationships and capture origin as metadata. Verify the imported record through the persisted database and JSON/CLI exports. The import is an evaluation of an existing answer, not another model call. Local evaluation trace IDs describe this import; they do not describe the original Perplexity generation or its retrieval history.

Review the answer against the cited sources using the unchanged rubric below. A web capture and successful import can establish a real source-support example and retention of the imported evidence. They cannot establish preservation of Perplexity's original API fields. Keep the original synthetic OpenRouter adapter finding separate.

## Optional API collection

An existing API from any suitable provider can supply a stronger transport-level test later. OpenRouter and Perplexity are options, not required vendors. Check that route's current response contract, supported settings, and prices before using it; adapt and verify its capture code rather than assuming the OpenRouter-compatible parser applies. Preserve request/response text, status/request ID when exposed, missing-field states, usage, charge provenance, and the explicit Promptfoo IDs available on that route. A retrieved or supplied-source answer needs its provenance recorded; a generated URL does not establish source access.

If the existing compatible capture adapter is used, retain its 700-token limit, temperature zero where supported, concurrency one, no local cache, and one attempt. Reconcile provider-reported charge if a billing record is accessible; otherwise leave it unreconciled or unknown. The proposed $20 ceiling belongs to the larger study and does not require a purchase for this article.

Replay a saved API response only as a preservation check, never as a second live answer. Do not construct a purported API payload from a web transcript.

## Public evidence

Private capture stays outside Git until reviewed for credentials, account data, and third-party text. Public evidence should retain our exact question and necessary claim judgments while using limited excerpts and links for third-party sources. Document redactions and retain the private record's integrity hash. A web transcript, screenshot, provider response, source snapshot, and derived review are different artifacts; label each accurately.

## Source-support rubric

Split the answer into material factual claims. For each claim, save its linked citation relationship, the cited URL, source access state, and the specific evidence needed to judge it. Multiple citations create separate relationships; multiple URLs do not imply multiple independent sources.

| Judgment | Rule |
|---|---|
| Supported | The retained cited source supports the claim with the same unit, window, denominator, and material qualifications |
| Unsupported | The accessible cited source contradicts the claim or does not establish the asserted measurement/conclusion |
| Unverifiable | The source cannot be accessed, the citation cannot be mapped to this claim, or the retained evidence is insufficient to decide |

Separately record whether each material claim has an explicit citation. Missing provider fields remain absent/unknown; an empty exposed list is empty. Neither is an automatic support score. Do not infer model reliance on a source from agreement, and do not infer an origin fetch from a citation. Record any reviewer uncertainty instead of inventing consensus. Codex's initial review is identified as such; Goga can inspect the evidence and correct it.

Report counts with their units: completed live answers; live attempts; retained responses; material claims; explicit claim–citation relationships; supported, unsupported, and unverifiable relationships; inaccessible sources; and charge provenance. One directed answer cannot estimate a population citation rate or establish a general credibility effect.

## Decision rule

The preflight supports a narrow adoption claim if the needed evidence survives the explicitly identified capture and evaluation path and the source review can be reproduced from retained records with modest capture code. A no-citation answer or inaccessible source is still a valid observed result and must remain visible in the verdict. If the route omits necessary evidence or the integration requires rebuilding most of the useful runner, narrow the recommendation or choose a direct runner. Do not keep spending until a positive answer appears.
