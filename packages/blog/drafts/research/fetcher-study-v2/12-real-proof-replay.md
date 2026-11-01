# A real signed request, its stored receipt and three successful replays

November 1, 2026 UTC. This is a fresh recovery of an actual production request from October 31, followed by offline replay of its untouched retained representation. It contains **no generated signature and no changed-request counterfactual**. The [minimized receipt](real-proof-replay.json) records the accepted result and source commitments.

## The real observation

At **October 31, 23:44:24.964 UTC**, a request declaring `ExaSearchBot` reached the original AI-fetcher article. Its native invocation reports GET and HTTP 200. The production collector recorded a locally verified signer at `https://crawler.exa.ai`, collector `2026-10-30.1`, classifier `2026-10-31.1`, verifier `2026-10-31.3` and kind `ai-search`.

The exact native request-reference lookup returned three records: one invocation with retained request headers, one observation attempt and one acknowledged stored receipt. All three share the request reference and execution Worker; the attempt and stored message share one operation reference. The stored message's returned decimal row reference selects exactly one record in the separately captured D1 day slice. Its pathname, recorded observation second, collector, declaration, stored kind and signature outcome agree. Reconstructing the **full acknowledged receipt** from that stored row with the current source function yields exact deep equality, including signature, network and provider facts. Raw identifiers, headers, URL, signatures and row contents remain private.

This establishes a concrete request → acknowledgement → stored-row chain. It does not identify a human conversation or attribute this unlabelled request to the controlled browser trials. The declared User-Agent is still a declaration.

## What the signature actually proves

The retained `Signature-Input` lists exactly `@authority` and `signature-agent`. The proof's validity window is **300 seconds**. Its resource path, request method, query and User-Agent are unsigned.

The parent investigator captured Exa's actual public key-directory response once at **November 1, 00:37:12 UTC**: HTTP 200, the signature-directory media type, and one key. The directory was captured later than the request. We do not reconstruct the original resolver response or claim that its contents were unchanged throughout the interval. Its response-signature headers are retained, but verifying that separate response proof is outside this incoming-request replay.

Using that exact later response at the exact reviewed directory URL, the **untouched retained request verifies in all three executions**:

| Execution | Result |
| --- | --- |
| Current verifier source in Node 24.14.1, profile `2026-10-31.3` | Verified |
| The same bundled source in native local workerd | Verified; full result and resolver-call list match Node |
| Independent pinned `pyauth/http-message-signatures` RFC implementation | One verified result; no error |

Each verification uses the recorded attempt time, not present-time freshness. The independent wrapper replaces only its validation clock and resolves the captured key by RFC thumbprint. All eighteen pinned source files and five recorded dependency versions are rechecked before execution. It is a generic RFC comparison, not a second Web Bot Auth discovery or publisher-registration implementation. All replay lookups use supplied captured bytes; replay network calls are zero.

The stored coverage flags agree with the new replay: host covered; method, path, query and User-Agent uncovered. This is a fresh real example of why a successful signature cannot authenticate every surrounding request claim.

## Two classifications describe different facts

The native provider category is **Search Engine Crawler**; the local stored kind is **ai-search**. These are not interchangeable labels. The provider's request-level `verifiedBot` and `signedAgent` booleans are unavailable in this capture, so the local cryptographic success cannot be presented as managed-verifier agreement. Neither category establishes an actual person, purpose or citation.

## Reproduction and boundaries

[`replay-real-proof.mjs`](replay-real-proof.mjs) consumes the three-record native download, the saved day rows and the separately captured directory body/headers. It bundles actual current TypeScript directly; it imports no `.test-dist` output. It checks exact chain joins and the full stored receipt before replay, refuses alternate resolver URLs or redirect behavior, checks source hashes again after execution, and writes a public derivative without private references or request material. Its private input/output directories are exclusive creations.

Run from the original repository root with the existing pinned Python source/environment and new output paths:

```sh
node packages/blog/drafts/research/fetcher-study-v2/replay-real-proof.mjs \
  PRIVATE_CHAIN_JSON PRIVATE_DAY_ROWS_JSON DIRECTORY_BODY DIRECTORY_HEADERS \
  NEW_PRIVATE_OUTPUT_DIRECTORY NEW_PUBLIC_RECEIPT_JSON \
  EXISTING_PYTHON_EXECUTABLE EXISTING_PINNED_PYAUTH_SOURCE
```

Native local workerd needs loopback access. `--node-only` is explicitly partial and cannot establish the three-execution result. The final accepted private run is `real-replay-03`; an earlier Node/reference-only run and the initial three-execution receipt are preserved separately. No new production page request, remote database statement, runtime change, capture activation or external package installation was performed by this replay lane. Native UI recovery and the one directory fetch are the parent investigation's separately recorded actions.

This is **one real request**. It supports the stated chain and signed-field finding; it supplies no vendor-wide signing percentage, historical directory reconstruction, complete traffic census, authenticated User-Agent, fresh assistant attribution or human readership count.
