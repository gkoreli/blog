# Provenance, quotations and source notes

Use when attributing Goga’s words, protecting private author notes, preparing source notes or auditing authorship claims.

## Owner quotations

Publish Goga's conversation wording only when he explicitly authorizes publication of that specified message or excerpt. For an authorized quotation, reproduce the **complete prompt message exactly** unless Goga explicitly selected an excerpt. Check against the private transcript or preserved source. Preserve spelling, punctuation and ellipses; do not splice messages or add context inside the quotation. Verifying a quotation does not authorize publishing it.

If only a fragment or unchecked recollection exists, paraphrase without quotation marks and disclose that the exact message was not preserved. Identify passages by location or paraphrase when giving draft feedback. This applies to articles, prompts, ADRs, tasks, research notes, comments and commit messages. Never originate an attributed experience, feeling or opinion.

## Private author notes

Raw shaping prompts and personal working notes stay private for every article form, including collaborative engineering articles, essays and OSS Radar. Do not create or extend public prompt records, copy conversation messages into research artifacts, or generate prompt pages. A request to work on or publish an article does not authorize publishing its working notes. Publish a specified message or excerpt only when Goga explicitly asks for that material to be public.

Save Goga's complete writing prompts in the approved private writing archive as work progresses: ideas, brief directions, dictation, questions, answers, corrections, metadata and publication choices. This includes essays and OSS Radar. Preserve wording and formatting; do not replace the source with an agent summary. Exclude machine-supplied context, credentials, unrelated operational housekeeping and third-party transcripts. Disclose meaningful omissions rather than calling a selected record complete.

The private archive's `STRUCTURE.md` owns its folder and capture procedure. Keep article-specific messages under the stable article ID; use a shared topic for editorial policy, multi-article work or an unassigned subject. Dated raw logs have source IDs, exact byte boundaries and hashes in adjacent JSON. Link shared prompts to related articles rather than duplicating them or inventing associations. Preserve original archive files and retired draft dispositions.

Commit and push scoped captures to the approved private archive before handing writing work back. Verify the destination is private immediately before upload and confirm remote acceptance. Ignored `packages/blog/worklog/` storage is a local fallback, not a completed GitHub backup; retain the capture and report pending sync if access is unavailable. Do not wait until publication to preserve source messages.

Keep raw source messages outside this public repository's Git history. This applies across all work: do not reproduce private messages in an ADR, task, research artifact, commit message, issue, PR or handoff. Record the resulting decision in ordinary prose. Preserve existing authorship disclosures and put usable evidence beside its claims.

The repository's ignore rules and installed Git hooks reject dedicated author-prompt files and archives, including files added and deleted between outgoing commits. They check paths, not the meaning of arbitrary prose. Review staged content and public messages for private wording even when a filename is ordinary; a successful guard check does not authorize disclosure.

[The prompt publication decision](../../../../docs/adr/0003-prompt-transparency.md) records the withdrawal of earlier prompt pages and dedicated public source records. Older Git revisions and third-party copies may retain those records; removal from the current branch is not historical erasure. Private session logs remain outside Git even when their hashes support a public research-footprint record.

## Public source notes

Place evidence near its claim, with conditions and relevant date/version. Prefer accessible original code, documents and measurements. Pin code/document links when discussing a repository snapshot. Keep public research notes focused on methods, conditions, results, failures and limits; raw operational data and private reader messages remain private.

For articles relying on external terminology or evidence, provide a concise glossary/reference table after a horizontal rule, or the equivalent material `Sources` presentation in a custom article. Use checked primary sources, dates and short descriptions of what they establish. Do not add an empty glossary or use an appendix to conceal missing support in the body.

Provenance is not a quality score. Agent count, token spend and elapsed time do not establish correctness. Use the dedicated footprint procedure only when usage accounting is requested or will be published; do not estimate missing usage or rewrite frozen historical totals.
