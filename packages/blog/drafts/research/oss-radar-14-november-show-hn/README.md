# OSS Radar #14: November Show HN scan

Status: revised research and manuscript prepared November 11, 2026. **Unpublished.** Documentation, pinned source and public discussions reviewed across all twelve projects; six small local product checks completed. Waymark setup stopped before workflow execution. No comparative benchmark, live agent integration, public product deployment or publication is claimed.

- [Manuscript](../../oss-radar-14-november-show-hn.md)
- [Inventory method and daily query URLs](inventory-method.json)
- [Complete normalized indexed inventory](inventory.csv)
- [Selected twelve submissions](sample.csv)
- [Repository baselines and inspected files](baselines.json)
- [Claims and product map](claims.md)
- [Declared deeper-review protocol](02-deep-review-protocol.md)
- [Discussions, firsthand reports and design checks](03-discussions-and-design.md)
- [Local methods, versions, results and limits](04-local-trials.md)
- [Reproduction fixtures](repro/) and [normalized synthetic results](results/)

## Source and sample

Source: public Show HN submissions available in Algolia's Hacker News search index. Window: `2026-11-01T00:00:00Z` inclusive through `2026-11-11T00:00:00Z` exclusive. Retrieval: November 11. Each daily request used `tags=show_hn`, date bounds in `numericFilters` and `hitsPerPage=1000`. Daily returned lengths matched reported exhaustive counts; IDs were unique across partitions.

Daily counts, November 1–10: 110, 165, 187, 163, 180, 108, 112, 96, 136, 198; total **1,455**. The first whole-window request returned 1,000 of a reported 1,455, so it was replaced with complete daily partitions. Raw API responses are retained outside Git; the committed CSV is a normalized public evidence inventory.

Thirty-seven indexed submissions had at least 50 points when retrieved. The repeatable review sample is every one of those whose outbound URL starts with `https://github.com/`: **twelve**, with twelve distinct repositories. License metadata identified eleven; OmniDiff required the pinned LICENSE and Cargo.toml because GitHub returned `NOASSERTION`. Its stated code license is AGPL-3.0-only. A code license does not establish model-weight or external-service terms.

This is a declared sample, not an exhaustive review of open-source launches. The threshold favors attention, direct GitHub links favor developer tooling, later submissions have had less time to collect votes, and deleted/unindexed submissions may be absent. The other 25 higher-scoring submissions are outside this sample; no claim that they lack public code is made. Show HN appearance does not mean a project was first created during the window.

## Editorial argument

Six selected projects explicitly address coding-agent behavior or agent workflows: Modern Web Guidance, Stroq, tmux-restore, Waymark, STE80 Humanizer and Kairos. Evidence: their pinned READMEs and the files in the claim table. Other selected projects introduce distinct concerns and receive unequal space.

Hypothesis: tools that retain inspectability, continuity and control can become more valuable as producing output becomes cheaper. Rival explanation: the sample's audience, attention threshold and GitHub rule favor these projects. The scan proves neither adoption nor increased value. The hypothesis weakens if agent vendors reliably absorb these capabilities or operating the additional tools costs more attention than they save. Repeated workflow use, successful recovery and observed interception are needed to evaluate that question.

The revised title promises agent recovery, better diffs and partial self-hosting. tmux-restore/Waymark, OmniDiff and HolyArrs/Kairos supply the comparison. November date, sample limits and mixed evidence states appear in the introduction. Search terms and likely reader interest are editorial hypotheses; no query-demand measurement was performed.

## Remaining work

Author review of the revised manuscript and judgments is next. Recheck consequential live issues, package behavior and model terms before publication. No maintainer contact, market-growth measurement, publication, production acceptance or distribution is claimed. Waymark's retained recovery fixture is an attempted protocol, not a validated recipe or commitment to continue the unsuitable database setup.

Publication, if requested, needs final metadata/date review and isolated rendering under the current repository workflow. Raw author messages remain in the approved private archive and do not belong in this directory.

## Initial draft acceptance — November 11

Historical source-only first pass. The deeper-review records above and revised acceptance below supersede its no-execution boundary.

- First manuscript: approximately 2,015 whitespace-delimited body words, including tables and links; seven longer project entries and five shorter entries.
- Parsed the draft through the repository's actual `parsePost()` frontmatter schema and Markdown renderer; valid metadata and exactly one matching H1. This is a parse/render check, not viewport QA or a production build.
- `pnpm -C packages/blog validate`: all 34 published Markdown posts valid. The draft was checked separately because `drafts/` is outside published-post discovery.
- Checked all 32 pinned source links against the selected baseline for their repository and checked that referenced non-README source files were retrieved. Checked local research links.
- Recomputed the sample from the full inventory: 1,455 unique dated items, 37 at/above threshold, twelve direct GitHub submissions and twelve matching baseline repositories.
- Normalized `inventory.csv` SHA-256: `88a9bd7e0ff28925fe45fef4a4c154f4dbe4a7c39da37628e59cc713662cbb0d`.
- Source and product claims received a parent review against the inspected files and evidence-state limits. No independent reviewer or user acceptance is claimed. No product runtime trial or publication check was performed.

## Revised acceptance — November 11

- Revised manuscript: 2,863 whitespace-delimited body words as parsed by `parsePost()`; twelve project entries with unequal space. Six local product checks replace the original proposed-only execution boundary.
- Actual frontmatter parser and Markdown renderer: valid metadata, exactly one H1 matching the title, twelve project headings. This is an HTML parse/render check, not viewport QA or live publication.
- `pnpm -C packages/blog validate`: all 34 published Markdown posts valid. Draft parsed separately because drafts are outside published discovery.
- Verified all twelve checkout SHAs plus the additional implementation-repository SHA, 47 recorded source paths and 36 pinned manuscript links. Original sample/inventory unchanged; CSV SHA-256 still matches the initial acceptance.
- Reran the portable combined Modern Web Guidance / OmniDiff / STE80 fixture and checked reported values against the manuscript. A Stroq follow-up added the clean package-script control: benign npm test allowed, fetched/evaluated script asked for review. Seven normalized result files parse.
- Checked local research links and reviewed public content for private prompts, credentials and raw operational captures. No private source message is included.
- Discussion and source claims reviewed against the pinned implementations, attributed reports and issue/release distinctions. No independent reviewer, user acceptance, GPU result, Waymark recovery result or production outcome is claimed.
- Next bounded action: author review of this manuscript. Publishing would additionally require current issue/license rechecks, final date/metadata and isolated page rendering under the repository workflow.
