# Completion audit — November 1, 2026

The owner's request was to explore the new Bun AOT report through further evidence-based research and experiments, and assess a possible follow-up. A new site publication was tentative rather than a required release. The actual evidence supports finishing the research with a concrete reviewable draft.

| Requirement | Authoritative acceptance |
| --- | --- |
| Inspect the supplied post and new results | [Dated source notes](01-source-notes.md): original post, chart accessible description, three author follow-ups and bounded reply/code searches; attribution remains distinct from replication |
| Establish current applicable implementation | Exact official asset digest matches the archive; executable reports `3f3a9ff87` despite a differing mutable release title; matching pinned Bun docs and Fastify/serializer versions checked |
| Execute new experiments with correctness checks | [Express](05-express-results.md), [Fastify](06-fastify-results.md), [serializer controls](07-serializer-results.md), [cold/startup](08-cold-startup-results.md); 66 warm + 180 cold windows, 27,977,442 checked responses, 180 extra startup processes |
| Test behavior as well as speed | Plain JSON differs on extra fields/coercion; standalone matches normal/extra/coercion/required-field outcomes under both source and native execution |
| Keep method and limits inspectable | Exact sources/locks/generated module, binary/data/source hashes, balanced positions, every accepted observation and spread, defined physical-footprint/CPU/request clocks, separate policy batches and guarded phase receipts |
| Preserve failed/confounded attempts | Overlapped captures remain private and excluded; complete Express phase before later guard interruption accepted by explicit timestamp-boundary audit; no slow cell selectively removed |
| Reach a follow-up decision | [Editorial brief](03-article-brief.md) recommends a focused engineering field note; [draft](09-follow-up-draft.md) explains the result, tested method, counterevidence and limits |
| Preserve publication integrity | Exact [owner prompt](owner-prompt.md); no invented feeling, quote, production deployment or adoption; this scope edits research only, preserving concurrent predecessor updates and its frozen accounting; no new site post/outreach |
| Verify scoped artifacts | Four private-capture auditors ran; `verify-evidence.py` verifies five manifests, recomputes all public summaries and counters, checks mode positions/startup rows, generated-source commitments and semantic results; three guard checks passed |
| Deliver to main | Research/draft pushed through `15865c5`; [seven selected remote artifact identities](delivery-receipt.json) match local Git blobs; no production-activation claim follows from Git delivery |

The request is not an independent replication of Jarred's exact unknown setup. It does not require certifying every schema, another OS, electricity/cloud costs or production capacity. Those remain explicitly separate proposals. The prepared all-in-one runners are reproduction alternatives; the accepted evidence comes from the separately guarded checkpoints listed above.

No required experiment or writing deliverable remains after scoped delivery. Final source syntax, local links/fences, manifests, numeric/text audit and Git diff checks accompany that delivery. A future site release would require its normal metadata/prompt/series/rendering/build checks and truthful activation acceptance at that time.

Diff-check exception: the full staged diff reports trailing blanks only in the unmodified `standalone/serializer.cjs` emitted by fast-json-stringify. Its exact bytes are needed to match the compiled source/hash. Authored paths pass `git diff --check` with that single generated file excluded; no syntax, contract or evidence-integrity gate excludes it.
