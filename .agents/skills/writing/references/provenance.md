# Provenance, quotations and source notes

Use when attributing Goga’s words, protecting private author notes, preparing source notes or auditing authorship claims.

## Owner quotations

A quotation attributed to Goga in any artifact must reproduce a **complete prompt message exactly**. Check it against the transcript or preserved prompt file. Preserve spelling, punctuation and ellipses; do not trim, splice messages or add context inside the quotation.

If only a fragment or unchecked recollection exists, paraphrase without quotation marks and disclose that the exact message was not preserved. Identify passages by location or paraphrase when giving draft feedback. This applies to articles, prompts, ADRs, tasks, research notes, comments and commit messages. Never originate an attributed experience, feeling or opinion.

## Private author notes

Raw shaping prompts and personal working notes stay private for every article form, including collaborative engineering articles, essays and OSS Radar. Do not create or extend public prompt records, copy conversation messages into research artifacts, or generate prompt pages. A request to work on or publish an article does not authorize publishing its working notes. Publish a specified message or excerpt only when Goga explicitly asks for that material to be public.

Keep any necessary local record outside Git, including the ignored `packages/blog/worklog/` directory. Do not reproduce private material in an ADR, task, commit message or handoff. Record the resulting decision in ordinary prose. Preserve existing authorship disclosures and put usable evidence beside its claims.

[The prompt publication decision](../../../../docs/adr/0003-prompt-transparency.md) records the withdrawal of earlier prompt pages and dedicated public source records. Older Git revisions and third-party copies may retain those records; removal from the current branch is not historical erasure. Private session logs remain outside Git even when their hashes support a public research-footprint record.

## Public source notes

Place evidence near its claim, with conditions and relevant date/version. Prefer accessible original code, documents and measurements. Pin code/document links when discussing a repository snapshot. Keep public research notes focused on methods, conditions, results, failures and limits; raw operational data and private reader messages remain private.

For articles relying on external terminology or evidence, provide a concise glossary/reference table after a horizontal rule, or the equivalent material `Sources` presentation in a custom article. Use checked primary sources, dates and short descriptions of what they establish. Do not add an empty glossary or use an appendix to conceal missing support in the body.

Provenance is not a quality score. Agent count, token spend and elapsed time do not establish correctness. Use the dedicated footprint procedure only when usage accounting is requested or will be published; do not estimate missing usage or rewrite frozen historical totals.
