# Search v0.2 delivery

November 14–15, 2026. [Accepted iteration](v0.2.md), [research and limits](../../../packages/blog/drafts/research/modern-web-guidance/search-package-v02/report.md), [package changes](../../../packages/search/CHANGELOG.md).

## Source and local acceptance

Implementation is ready for scoped delivery: `@gkoreli/search` 0.2.0, optional E5 peers, immutable source aggregates, managed encoder lifetime, shared HTTP session, explicit ranking policy and passage expansion UI. Index format 2 / manifest format 1 are retained. Publication source-note omissions extend to two additional articles. The MWG manuscript remains an unpublished standalone article with no publication manifest change.

- Thirty package tests and 460 blog tests passed. Workspace typechecks and 35-post Markdown validation passed; the isolated full site built 46 posts.
- The integrated corpus has 3,946 passages and 4,827 vector rows. All source anchors resolve exactly once. Node and the actual browser worker replayed all 75 known/confirmation cases; aggregate counts agree, with 134/150 exact per-mode rankings. These are acceptance checks, not new reader judgments.
- Clean pnpm 9.15.4 tarball consumption executed word search with four installed packages and no ML runtime. This is still a private workspace package, with no npm release.
- Manual UI checks covered passage expansion and focus, actual target navigation, Cmd+K, immediate Escape/focus return with a nonempty query, and a measured 390px embedded layout. Physical mobile/low-memory and complete keyboard coverage remain unmeasured; the prior IAB Tab-navigation limitation is retained.
- An initial local fixture MIME error and its repair, the summary grouping correction, and the initial sandbox build failure are retained in the research record. Temporary diagnostic code was restored before the passing replay.
- New writing directions were captured in the approved private archive, its destination was verified private immediately before push, and remote acceptance was confirmed.

## Activation and current production

Pending source commit, automatic Cloudflare activation and dated serving-build acceptance. Historical v0.1 deployment and local checks do not establish current v0.2 production behavior. The remaining bounded work is to push the checked source, identify its serving build, read the actual manifest/data, verify the no-JavaScript route and exercise article/paragraph navigation on the live interface. Do not start a competing manual deployment while the automatic build is running.
