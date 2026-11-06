# TypeScript articles

Use only for custom `packages/blog/posts/*.ts` articles. Inspect current exports and nearby posts; component APIs and renderer behavior come from the actual repository. Source/build procedures stay in blog-maintenance.

Use a shared component only when it communicates better than prose. Existing OSS layouts may offer `CompareTable`, `FlowDiagram`, `Callout`, `Prognosis` and `Sources`; inspect their definitions before using them. A table suits an exact comparison, a flow suits real order or ownership, and a release-test component belongs only when that test changes the decision.

Keep one rendered H1. Do not use blank items, filler cells, `&nbsp;` or `<br>` as layout repairs. Derive reusable layout from item count and use a supported data-driven factory for repeated siblings. A component should not sit beside prose that repeats its content.

Do not render the research claim/theory ledger as the article. A small reader-facing visual can convey its result. Label shipped, in-progress, enabled and speculative steps so presentation cannot turn a future into a finished feature.

For `Sources`, explain why each material source matters even if the type makes that field optional. Keep baseline SHA, check date and complete issue/PR state in working notes. Put live state beside the body claim when it changes the result. Every material body source must appear in the source presentation, and every source card must support an actual claim.

Set truthful metadata using the shared headline/date contract. Use previews and evidence fit, not fixed character limits. If the custom article exposes a manual `readTime`, count the rendered title and body through the final decision, exclude `Sources & Evidence`, divide by 200 and round up. Respect any explicit reader time limit by narrowing the article rather than hiding decisive proof.

Validate types and the isolated production build through blog-maintenance, then inspect the actual rendered outputs for:

- one H1, nonempty cells and matching row/header counts;
- readable layouts without repeated callout clutter or duplicated prose;
- pinned code/document links, source rationales and accurate live states;
- the intended title, body, metadata, Markdown representation and read time.
