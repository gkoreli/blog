# Provenance, quotations and source notes

Use when attributing Goga’s words, preserving collaborative prompts, preparing source notes or auditing authorship claims.

## Owner quotations

A quotation attributed to Goga in any artifact must reproduce a **complete prompt message exactly**. Check it against the transcript or preserved prompt file. Preserve spelling, punctuation and ellipses; do not trim, splice messages or add context inside the quotation.

If only a fragment or unchecked recollection exists, paraphrase without quotation marks and disclose that the exact message was not preserved. Identify passages by location or paraphrase when giving draft feedback. This applies to articles, prompts, ADRs, tasks, research notes, comments and commit messages. Never originate an attributed experience, feeling or opinion.

## Collaborative prompt record

For AI-assisted collaborative articles, retain complete human messages that materially shaped the article, research, claims, metadata, provenance or publication decision, in chronological order. A message changing shared editorial policy and the article belongs in both the relevant policy history and the article’s provenance accounting. Exclude unrelated later repository housekeeping and private third-party transcript material; describe omissions rather than calling a selected record complete.

Save the released prompt record at `packages/blog/prompts/{slug}.prompts.md`, matching the article slug. Use a line containing `---` between complete messages, no frontmatter and no edited message formatting. Drafts may keep their paired record under `drafts/prompts/` until moved with the article. The pipeline exposes `/{slug}/prompts` with the “Thoughts by human, co-written by AI” label and article link/teaser.

Exposed essays and OSS Radar have **no prompt file** under their respective authorship models. This is not proof of authorship to readers. Private session logs stay outside Git even when their hashes support a public provenance record.

## Public source notes

Place evidence near its claim, with conditions and relevant date/version. Prefer accessible original code, documents and measurements. Pin code/document links when discussing a repository snapshot. Keep public research notes focused on methods, conditions, results, failures and limits; raw operational data and private reader messages remain private.

For articles relying on external terminology or evidence, provide a concise glossary/reference table after a horizontal rule, or the equivalent material `Sources` presentation in a custom article. Use checked primary sources, dates and short descriptions of what they establish. Do not add an empty glossary or use an appendix to conceal missing support in the body.

Provenance is not a quality score. Agent count, token spend and elapsed time do not establish correctness. Use the dedicated footprint procedure only when usage accounting is requested or will be published; do not estimate missing usage or rewrite frozen historical totals.
