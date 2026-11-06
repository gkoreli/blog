# ADR-0021: Tools home and transparent technical access assessment

## Status

Accepted implementation direction, November 6, 2026. Amends the score presentation in [ADR-0020](0020-evidence-led-ai-site-check.md). Research, source inspection, implementation, activation and measured use remain separate in the [product exploration and worklist](../../packages/blog/drafts/research/ai-site-audit/02-tools-product-exploration.md).

## Context and evidence

The owner requests a discoverable `/tools` home, a more useful page-check report with a total score, and creative free capabilities grounded in research first. The homepage's `markdown: not-negotiated` result also needs a clear explanation. The earlier checker deliberately exposed evidence without a summary score; a user now has to interpret a large report before learning what matters or what to fix.

The [research record](../../packages/blog/drafts/research/ai-site-audit/02-tools-product-exploration.md) inspects seven primary comparators: Exepal, Lighthouse, webhint, Unlighthouse, Firecrawl, Cloudflare AI Crawl Control and SSL Labs. Exepal's public page demonstrates a simple primary question and transparent weights, but some optional-file weights do not follow from the documented search requirements. Lighthouse separates scored inputs from diagnostics, versions its model and propagates unknown weighted inputs; webhint distinguishes severity from information. Unlighthouse supplies export/history/budget workflows; Firecrawl distinguishes service success from target response and representations. Cloudflare provides summary-to-component drilldowns and requested-versus-served format views. SSL Labs documents components, exceptions and an assessment's limits. These are inspected source/docs/public presentation, not reproduced product accuracy or hidden implementation.

[Google's AI Search guidance](https://developers.google.com/search/docs/appearance/ai-features) says new AI text files or special markup are not requirements for AI Overviews/AI Mode. No source establishes that our proposed score predicts citation or adoption. Preserve those limits while making an explicit, useful technical rubric.

## Decision

### Four actual jobs on `/tools`

Provide a tools home with four working tasks, each described through its outcome, input and applicable limits:

1. **Page Check:** inspect a public HTTPS page through the existing bounded audit and daily allowance; show the technical access total, evidence coverage, most useful next actions and full component evidence.
2. **Robots Playground:** edit/paste robots text, choose a path and product token, and inspect the selected group/rule and decision. Runs locally without network calls or daily admission, under the parser's existing limits.
3. **Report Compare:** import two versioned reports locally, inspect meaningful field/check changes and export a comparison. No server upload, external requests or daily admission. State when target or method differences make scores incomparable.
4. **Request Inspector:** expose the existing assessment of the incoming request and its independent declaration, request-shape, network and verification dimensions. It retains the existing shared ten/day allowance; being linked from `/tools` does not make it unlimited.

Include usable examples so local tools can be understood before supplying data. Keep navigation, input help and explanatory content available without JavaScript. Interactive playground/comparison behavior is native progressive enhancement; describe that boundary truthfully. Do not add nonworking cards for proposed future services.

### A fixed 100-point technical access ledger

Name the summary **Technical access score**. It is a versioned heuristic of tested delivery, source content and observable indexing basics for the assessed page. It is not an AI-readiness probability, ranking forecast, model-specific extractability benchmark, certificate of access or citation calibration.

Keep a fixed total of 100 possible points. Each scored rule has a stable identifier, weight, category, result, evidence and rationale. The declared weights and category totals live in the pure scoring policy and are publicly inspectable. Give observations one contribution each; adding aliases or optional resources cannot silently change the denominator.

Partition points into:

- **Earned:** a scored condition was observed to pass.
- **Lost:** a scored condition was observed to fail under the declared technical objective.
- **Unknown:** required evidence was missing, failed, truncated, unavailable or outside a local assessment limit.

The three totals must reconcile to 100. Show the confirmed points, assessed coverage and the possible range from earned points through earned-plus-unknown points. Never renormalize unknown weight away into a green 100. With all inputs known, the range collapses to one total. When a critical component is unavailable, say that directly beside the number. The coverage figure is an assessed-weight percentage, not statistical confidence.

Delivery failures observed at HTTP level and checker-side network failures need different rule states. HTTP failure is a received response; a network timeout does not establish that every client is blocked. Unavailable HTML cannot acquire title/content failures merely because the parser did not run. Noisy timing measurements are evidence, not an uncalibrated speed penalty.

Intentional training restrictions are outside the scored objective. Optional Markdown negotiation, `llms.txt`, structured-data absence and MCP/OpenAPI endpoints do not cost points. Observed malformed JSON-LD or a broken advertised representation may still be useful diagnostics, with its exact scope. A deliberate `noindex` can be an observed indexing restriction under an indexability rule; explain the objective rather than instructing every operator to remove an intentional policy.

Do not award an entire catalogue of robots tokens independent points: adding more tokens from one provider would change its influence for a taxonomy reason. Keep detailed per-token policy and synthetic-probe results visible without treating them as authenticated provider access. Any later score expansion requires a new rubric version and a rationale.

### Report presentation

Lead with the total/range, assessed coverage, method version, exact page and time. Follow with the most consequential fixes or next controls and category breakdowns. Every scored condition must be inspectable beneath the summary; informational checks remain separate. Keep response status, media type, original/final URL and failed-resource evidence available without presenting the full raw JSON as the primary interface.

Explain representation results through request and response: `Accept: text/markdown` returning HTML means Markdown was not negotiated in that request. It is an optional capability, not a broken page. A homepage and an article can intentionally support different representations. Generated previews, server-delivered Markdown and advertised alternate links must not be conflated.

Borrow Lighthouse's transparent weights and diagnostic separation, webhint's severity distinctions and SSL Labs' component/exception explanations. Do not copy their domain-specific thresholds or claim their calibration for this rubric. Report comparisons must show changed failures/unknowns even when the total is unchanged.

### Domain boundaries and privacy

Keep the assessment rubric and report comparison pure within `packages/site-audit`; reuse its bounded robots parser in the local playground. The blog owns routing, page/component presentation, downloads and optional local file import. Existing analytics remains the owner of incoming request evidence. Preserve the external-fetch adapter and quota boundaries from ADR-0020; these additions do not authorize private-network access, arbitrary crawling, real-provider calls or a browser-rendering claim.

Treat imported files and pasted text as untrusted data: bound bytes, validate schema/version, render through text/escaped templates and avoid active remote markup or executable snippets. Keep comparison files local. An example report is synthetic or a dated observed capture with its provenance, never a new live result. A diff establishes a change between supplied reports; it does not by itself establish the cause of a live outcome.

## Alternatives and consequences

Retaining an evidence-only page would preserve detail but fail the user's requested summary and toolkit navigation. Copying a competing AI-readiness score would add unsupported optional-file penalties. Normalizing across whichever checks succeeded would reward missing evidence. A fixed ledger with explicit unknown points makes both the total and its gaps inspectable.

The local playground and comparison tool create value without added query cost, tracking or daily quota use. They require bounded parsing, schema/version handling, useful examples and accessible controls. A local tool is not automatically useful merely because it runs; acceptance must exercise the intended edit/compare task.

An overall number simplifies a complex report and can be overread. Keep its narrow technical objective beside it and publish the rule ledger. The score weights are engineering judgment until suitable outcome data supports a stronger claim. Serving a toolkit does not establish independent use, organic discovery or broad product adoption.

## Acceptance and next action

Require rule tests covering earned/lost/unknown reconciliation, full/partial coverage, all-unknown behavior, network versus HTTP failure and optional-feature/training-policy invariance. Require meaningful report differences, method/target mismatch handling, safe bounded file import and robots group/rule/path controls. Check agreement across API, server-rendered HTML and enhanced UI.

Inspect `/tools` links, four actual tasks, examples, downloads, mobile layout, keyboard flow, visible status/error updates and readable no-JavaScript content. Verify homepage versus article representation behavior separately. Run appropriate type/content/build checks in the isolated checkout, then record scoped Git delivery, actual deployment and fresh served acceptance in the worklist. This ADR accepts the design; it claims none of those later outcomes.
