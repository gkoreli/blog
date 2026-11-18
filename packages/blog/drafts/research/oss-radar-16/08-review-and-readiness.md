# OSS Radar #16 — review and readiness

Reviewed November 18, 2026, Pacific. The [release candidate](article.md) is dated Monday, November 23. Use the planned filename `047-oss-radar-16-saved-skills-and-inbox-replies.md` for promotion when authorized. The source remains in the drafts directory. The release manifest is empty and GitHub reports workflow 408698342 as `disabled_manually`.

## Editorial and evidence check

This issue follows #1 and #14's source, project, interpretation, and distillation sequence. It uses three project-led discoveries and one return from #1. The lead states two tested outcomes. Each review gives the reader a use case, the relevant source mechanism, evidence from a versioned trial, and an adoption consideration. License and source attribution are checked against the pinned revisions. The [selection record](04-tuesday-discovery-and-memory.md#current-selection) explains the candidate mix and why the active four earned an entry.

| Reviewed claim | Basis and limit |
| --- | --- |
| Hermes separated saved material, prompt memory, and loaded skills | Real v0.23.2 store and skill tools. Two authored inputs and seven local-model calls support the observed procedure transfer. The fixture supplied the text explicitly |
| Plannotator retained a pending reply for the right session | Real v0.29.0 binary, browser send, two MCP identities, and one restart. Earlier v0.28.67 store/wake trial supplied a scripted T3 receipt. A real agent completing a turn remains unverified |
| NemoClaw distinguishes explicit policy refusal from ambiguous command outcomes | Default tagged source plus OpenShell 0.0.116 CLI help and eight scripted captures through the real client. Host reconciliation was read in source. The current Mac lacked a supported local container setup |
| GoDoxy can defer a notice, and delivery can retry | Historical source and contributor's backup-window PR. v0.34.0 monitor tested through actual HTTP probes, controlled time, and a real webhook dispatcher. Container behavior and delivery to an external service remain untested |

The prose was revised to identify Hermes's tool subprocesses and explicit model input, distinguish Plannotator's read mark from a turn, and separate a NemoClaw client response from confirmed enforcement. GoDoxy's March checkpoint supports the return without carrying forward claims about costs or adoption. The distillation identifies places to begin a trial and the extra work that affects adoption. The [dated fieldwork](07-wednesday-current-release-checks.md) links the project discussions, pinning details, methods, and results.

## Exact-source preview

- Source SHA-256 is `b495c1581b7b0bf63d5a419910cb86d6985390c84afa9548488cb22793db3c38`. This revision was copied into `posts/` only in an isolated snapshot of `16037a6ca5fc9f323f190e660a5401f79cfa35d9`.
- Node 24.14.1 and pnpm 9.15.4 validated all 37 Markdown posts and built 48 posts. The earlier preview needed the workspace time/search builds and the TypeScript CLI's local IPC permission. Both were available for the accepted build.
- Chrome 157.0.8103.79 rendered the exact source at 1365 and 390 CSS pixels and at 320 with JavaScript disabled. There was one H1, the five article headings and four project headings, and no horizontal overflow. The link to #1 resolved locally and the Radar index listed #16. Screenshots and a visual check covered the reading layout and the 1200 × 600 social card.
- The canonical, dated BlogPosting JSON-LD, Markdown body, CSL JSON, BibTeX, `posts.json`, RSS, sitemap, `llms.txt`, and `llms-full.txt` agreed on the intended entry. These are local build observations.

## Monday decision

At the pre-release check, compare the current project refs with the pins in the manuscript. Investigate a release change only if it affects the advice, then review and render any resulting edit. The candidate is ready at the evidence scope described above. A live T3 host or supported NemoClaw runtime could add end-to-end findings if available.

The target is Monday, November 23 at 08:00 Pacific. Release authorization is pending. If granted, follow the [weekly publication procedure](../../../../../docs/worklist/oss-radar-weekly/README.md#scheduling-and-continuity) and verify the served article after deployment.
