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

Source commit `0db4355e115d42b882c017ead790e8b123974574` was pushed directly to main. Its automatic Cloudflare build `55f5d4aa-3583-40d7-9692-aeb116d201bd` succeeded. Wrangler recorded version `830931de-f115-4f0d-b61f-1122f98d3929` at **100%**, created November 15 at 06:23:02 UTC and deployed at 06:23:03 UTC. The live page/client exposed that build and source commit. No competing manual deployment was made. The existing CLI credential lacked Workers CI log-read permission (403); GitHub's attached build check and the deployment/public build receipts supplied the activation evidence.

[Production acceptance](../../../packages/blog/drafts/research/modern-web-guidance/search-package-v02/production-check.json), recorded at 06:25–06:27 UTC, reads the actual manifest, index and vectors. Source articles, lexical indexes and semantic row positions equal the local build; vector bytes differ. Across 4,827 corresponding rows the minimum cosine is 0.995288 and mean 0.999280. This is a numerical diagnostic, not a quality metric or an isolated explanation of the difference. Replaying all 75 cases with the actual serving vectors preserved every aggregate article/joint count: old positives Words 43/35, Related 43/36; new positives Words 20/15, Related 20/17. All ten negatives returned articles. Only 81/150 complete per-mode rankings match the local Node run, so the result is not bitwise or ranking equivalence.

A raw GET for Moving Icons/Svelte returned complete source excerpts and the actual paragraph link without JavaScript, HTTP 200, `Cache-Control: no-store` and `X-Robots-Tag: noindex`. On the live browser interface, expanding ghx from three to eight excerpts focused the selected fourth paragraph; Enter opened its real highlighted target. Explicitly enabled Related search found the Moving Icons explanation and opened its source paragraph. Cmd+K, immediate Escape with a nonempty input, query retention and opener focus return were observed on the serving build. The screenshot remains outside Git and is hashed in the receipt.

The corrected manuscript rendered one H1, eight tables (including the repaired reference row), two code blocks and no document overflow in a 390px CSS-viewport fixture. Final tarball consumption again passed with pnpm 9.15.4 and four packages; the [receipt](../../../packages/blog/drafts/research/modern-web-guidance/search-package-v02/consumer-check.json) identifies its hash. Subsequent documentation/evidence-only delivery records this accepted implementation; it is not another functional acceptance or a claim of future production behavior.

Accepted work is complete. The article remains unpublished and the package has no npm release. Independent readers, physical mobile/low-memory behavior, calibrated no-answer decisions and third-party adoption remain separate proposals.
