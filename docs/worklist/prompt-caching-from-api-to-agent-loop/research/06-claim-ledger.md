# Claims, counterexamples, and remaining questions

Recorded 2026-09-28 America/Los_Angeles. The linked reports provide primary URLs and pinned implementation symbols. Documentation, inspected implementation, local execution, and provider measurements establish different things.

| Claim | Evidence class and artifact | Limit / counterexample |
|---|---|---|
| Earlier edits generally invalidate deeper suffix K/V in a conventional causal transformer. | Mechanism explained from original attention paper; [numerical reproduction](../lab/kv-results.json); [inference audit](01-inference-and-cache-repair.md). | First-layer token-local K/V can stay equal. Architecture-specific dependencies differ. Logit change is not a hallucination measurement. |
| An append can reuse the preceding valid computation. | Locally reproduced in the numerical lab; API reuse observed for an appended system update. | Provider matching, stored boundaries, residency, routing, and expiry can still prevent a hit. |
| Switching branches does not necessarily destroy the old entry. | Source-inspected trees/hash chains; [original branch revisited in all three live repetitions](05-live-anthropic-experiment.md). | No indefinite retention or cross-route guarantee. |
| A mathematically unchanged prefix may exceed the provider's reusable boundary. | [Live middle edit](05-live-anthropic-experiment.md): 5,371 reads and 2,499 writes; documented DeepSeek persistence behavior. | Anthropic result is specific to chosen markers. DeepSeek example was documented, not live-tested. |
| Prospective authoritative instruction updates are supported on selected routes. | [Official provider contracts](02-provider-contracts.md), [OpenAI contract](04-openai-sdk-codex.md); Anthropic acceptance and two-field behavior observed. | Does not establish equivalence to retroactively replacing the old policy. An appended correction is not erasure. |
| Inline tool addition can preserve the prefix. | Anthropic beta contract plus three observed 7,870-token reads. | Initial non-deferred tool was present. No tool was called; removal, executor safety, and schema-version correctness were not live-tested. |
| Pi's provider capability changes whether a system update appends or rewrites. | [Actual pinned transcript functions executed](../lab/pi-transcript-results.json), [source audit](03-harness-audit.md). | Local transformation only. Replay equality of current system text does not establish model equivalence. |
| Several harnesses already implement cache-aware controls. | [Pi/OMP/OpenCode/Gemini CLI audit](03-harness-audit.md), [Codex audit](04-openai-sdk-codex.md), official Claude Code documentation. | Unequal evidence access; no comparative agent benchmark or installed-release guarantee. |
| SDK options can have less coverage than the underlying API. | [Published Vercel packages executed with mocked fetch](../lab/sdk-results.json), official OpenAI SDK types inspected. | Explicit cache mode/TTL and Anthropic control messages survived. The missing invented option concerns diagnostics, not a promised caching feature. |
| Read/write/input normalization is provider-specific. | [Official counters](02-provider-contracts.md); independently recalculated Anthropic receipts. | Anthropic disjoint buckets cannot be applied to Gemini/OpenAI inclusive totals. Invoice reconciliation was not performed. |
| The live run cost approximately $0.18. | 27 retained observations and checked rates; independent Decimal recalculation gives $0.1777092. | Estimated inference spend only. This is not the cost or token footprint of the whole research session. |
| This sample does not establish a latency improvement. | Appended-system median first visible text 1.761 s versus early-edit 1.432 s. | Three ordered requests per case; transport, queueing, output, and thinking confound causal latency attribution. |
| Modular reuse and selective repair are active research directions. | [Original Prompt Cache, CacheBlend, PIE papers and pinned implementations](01-inference-and-cache-repair.md). | Attention approximation or empirical quality preservation is weaker than exact arbitrary-edit equivalence. No trained-model repair experiment ran here. |

## Claims rejected or narrowed during review

- **“Every value after the edit changes.”** Too strong: the toy showed unchanged first-layer K/V at unchanged positions while deeper state changed.
- **“Editing the start erases the whole cache.”** An edited request missed; the original request still hit when revisited. Miss and eviction are different events.
- **“Cached requests are faster.”** The measured append case was cheaper but had a higher median first-text time. Keep input savings and latency separate.
- **“SDKs are defective.”** The executed adapters forwarded several current features correctly. A schema coverage gap for diagnostics does not establish general defective behavior.
- **“Appended instructions are equivalent to rewriting history.”** The two-field task passed; general equivalence and redaction were not tested or established.
- **“Inline tools work end to end.”** Only acceptance and reuse were measured, because tool execution was prohibited by the fixture prompt.
- **“Cache repair preserves correctness.”** Research-specific quality measures do not establish the same conditional computation after an arbitrary edit.
- **“All providers or installed harness versions do this.”** Contracts are model/endpoint/route dependent; source audits are pinned snapshots, not release or production attestations.

## Additional findings from the September 29 pass

| Claim | Evidence | Limit |
|---|---|---|
| More cached tokens can accompany a higher full-request cost. | [Eight live evidence-update requests](09-changing-retrieved-evidence.md): append $0.0022142 versus replace/drop $0.0016640. | Two repetitions; stable boundary before a short source. Different retained histories, no general winner. |
| Removing original text does not remove a supplied summary or earlier assistant statement. | [Actual Pi/OMP functions](../lab/context-results.json). | Client transformations only; summary supplied, not generated by the fixture. |
| Prompt-cache hits still require computation for new input and output. | [Llama/attention/block-manager walkthrough](08-kv-cache-walkthrough.md). | Dense conventional attention example; alternative architectures differ. |
| Local message mutation must invalidate cached token estimates/conversions too. | OMP `applyShakeRegions` and registered invalidator executed. | The fixture does not run persistence/artifact storage or a provider. |

The second experiment was independently checked against all eight private receipts, including request hashes, exact assistant replay, returned fields, and decimal accounting. Total live inference spend is $0.20859. The published article is now authored directly in the TypeScript post; the Markdown draft is historical.

## Remaining investigations (proposed; first two now partially tested)

1. **Conflicting evidence:** append a corrected retrieved document versus rebuild without its obsolete version. Score citations and answers that require rejecting the old content. Track derived summaries too.
2. **Tool lifecycle:** call a tool, append a schema replacement/removal, then test selection, argument validity, and executor authorization. Keep cache economics separate from task success.
3. **Real loop:** repeat those operations in a bounded multi-turn task through the actual target harness and adapter, retaining sanitized wire diffs and raw usage buckets.
4. **Fallback ergonomics:** make append/rewrite/unsupported outcomes explicit to harness callers. Specify tests before implementing a cross-provider abstraction.
5. **Retention and routing:** randomize order and control idle time/route before testing expiry or latency. The first run deliberately answers neither.

The first two address the user's equally important instruction/tool and retrieved-context needs. They require a new bounded experiment design; they are not claimed as completed work.

Return to [the worklist](../README.md).
