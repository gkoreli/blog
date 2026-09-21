# Publication preparation — 2026-09-21

The author approved the current article and explicitly requested publication preparation and merging PR #16. The complete approval appears as the last block of the public prompt file.

## Release

- Title: **Productive Procrastination: When Meaningful Work Costs You Sleep**.
- Article: `packages/blog/posts/027-productive-procrastination.md`.
- Publication date: `2026-09-21`; section: `essays`.
- Filename-derived route: `/productive-procrastination`.
- Public source prompts: `packages/blog/prompts/productive-procrastination.prompts.md`, generating `/productive-procrastination/prompts` under the existing pipeline.
- The old `packages/blog/drafts/excitement-is-not-an-emergency.md` was removed after promotion. Earlier revision notes refer to historical draft locations and commit snapshots.

The approved argument, title, five-step rule, research qualifications, and unresolved ending are retained. Release edits set the actual date, refine the description to avoid implying that notes can never restore motivation, remove the draft-only comment, and add a short visible provenance note. No experiments, outcomes, neurochemical claims, or research-footprint totals are invented.

## Prompt provenance

The public file contains six selected complete human messages in chronological order: the initial maturity reflection; the request to write the essay and retain the five-step rule; the Earned-Trust Writing direction; the first walk dictation; the second walk dictation; and approval to publish and merge. The original dated prompt artifacts remain intact in the repository.

This is not a complete conversation archive. The mixed-speaker transcript is omitted for privacy, and the article states that omission. Assistant responses are not represented as human prompts. Historical claims inside the raw prompts remain raw; the published article distinguishes those original hypotheses from supported findings.

## Checks completed before merge

- Read the current PR metadata and its changed-file list. The existing changes are the essay, source/revision records, and previously requested editorial guidance. No application code is modified.
- Read the complete approved draft at `ba6e527174d8387c627fc1f09f87b8e4e6d7842d` in two ranges and read back the promoted release metadata.
- Inspected `packages/blog/src/lib/frontmatter.ts` to confirm the section enum, filename-derived slug, and matching prompt-file convention.
- Ran lightweight Python assertions on the read-back frontmatter: required string values, ISO publication date, section, five lowercase tags, filename-derived slug, matching prompt filename, and absence of provisional or invented footprint metadata. These passed. This is a metadata check, not the repository's validator or a site build.
- Opened both internal predecessor links and the five cited sources through web retrieval. Berridge/Kringelbach and Gilbert were accessible as full text; the relevant Masicampo/Baumeister and Van Dongen abstracts and the Lu/Akinola/Mason institutional journal abstract were checked. Their stated findings and dates support the limited summaries used in the article.
- Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC4425246/ ; https://journals.sagepub.com/doi/10.1080/17470218.2014.972963 ; https://pubmed.ncbi.nlm.nih.gov/21688924/ ; https://pubmed.ncbi.nlm.nih.gov/12683469/ ; https://business.columbia.edu/faculty/research/switching-creativity-task-switching-can-increase-creativity-reducing-cognitive .

## Build and delivery boundary

`git ls-remote https://github.com/gkoreli/blog.git HEAD` failed because the working container could not resolve `github.com`. The available local Node is v22.16.0, while the repository records a Node 24 requirement. No full checkout, dependency install, site build, or automated repository test suite was run. Successful connector writes and metadata assertions must not be described as a passing build.

At release commit `fed8545225de81b71aa3bb4c21ed9c938ad0cde4`, GitHub returned zero check runs. The existing Cloudflare bot comment referred to the older `55e4c4b6` commit and is not evidence of this release's deployment.

Merging and live-site acceptance are separate steps. The delivery response and PR conversation should record the actual merge result and whatever deployment or served-page evidence is available afterward. Do not infer a live article merely from a successful merge. No newsletter email, social post, reminder, or background monitoring is authorized or scheduled by this release.
