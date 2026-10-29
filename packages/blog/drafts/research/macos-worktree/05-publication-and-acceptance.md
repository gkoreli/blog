# Publication and acceptance — October 28 local / October 29 UTC

Published: [Why Setting Up a Worktree Can Be Slow on a Mac](https://gkoreli.com/why-worktree-setup-is-slow-on-macos). **927 rendered words, about 4.64 minutes** at 200 words/minute. [Six exact shaping prompts](https://gkoreli.com/why-worktree-setup-is-slow-on-macos/prompts) accompany the engineering article. No social post or maintainer outreach was made.

## Source and checks

Source commit: `3101211ff4cc90a1d89793ef46e98dcd74d15a37`, pushed directly to `main` after integrating concurrent analytics commits. The remote GitHub ledger at that exact revision was read back: eighteen series, ninety accepted installs, one retained failed measured attempt. All twenty-two [frozen source/evidence hashes](evidence-manifest-v4.json) survived rebase unchanged. Historical v2/v3 receipts still describe their original revisions.

Independent checks recalculate the eighteen medians/ranges and ninety unique ordinals, confirm frozen input inventories and tool versions, and inspect the retained failure, metadata repairs and cache-isolation controls. JSON/Python syntax, exact prompt mirror, local links/fences and all three patches' application checks pass. All twenty-two Markdown posts validate. The isolated Node 24.14.1 / pnpm 9.15.4 production build generated thirty-three posts; it used `TZ=UTC` and rendered October 28. No shared development output was overwritten.

## Deployment and actual served behavior

The source commit's Cloudflare Workers build `8e31da12-cc9c-4fa1-a939-50bd18f53099` completed successfully. Separately observed deployment `62afc9a1-d62a-4c2d-bcfc-f06bded72e10` activated version `f5f95fe1-95c0-4778-bc17-696c48d8c34e` at 100% on `2026-10-29T04:57:17.810236Z`. Worker version annotations do not expose a Git commit; this receipt distinguishes the commit-linked build, deployment metadata and served-content evidence.

At `2026-10-29T04:57:27Z`, the real public article, prompts, Markdown twin, negotiated Markdown, post index, RSS feed and sitemap each returned HTTP 200. Checks confirm one H1, the canonical article URL, October 28 calendar date, all eight table values, ninety-trial wording, explicit Next Linux limitation, and six prompts including the expanded research request. Both Markdown forms return `text/markdown` with identical bytes. The index contains the post once with the correct date; feed and sitemap contain its route, and the sitemap contains the prompt route. Browser review also confirms the live title, text and prompt link. Selected status/representation hashes are in the [machine-readable receipt](05-publication-and-acceptance.json); raw bodies and headers remain outside Git.

## Research boundary and cleanup

The article compares this host Mac with its smaller native-storage Linux guest, not a pure kernel/APFS decomposition or reproduction of Theo's original raw chart. The additional ninety installs remain separate from the earlier thirty T3 trials. The ncc cache-write failure is reproduced and reduced; clone-or-copy protects that cache. Version-preserving declaration metadata repairs pass selected T3/Vite checks on both systems; SvelteKit core checks pass unchanged. Next's complete Linux build remains unaccepted, and the prior T3 browser comparison retains the same one scrolling failure out of 472. Private writable cache views demonstrate the tested file isolation and lockfile invalidation, not a general Mac performance gain or a production cache manager.

The private guest archive contains 260 files; its size and SHA-256 are recorded in the JSON receipt without exposing raw logs. Both Mac shadow mounts and the Linux overlay/read-only mounts were detached. The owned preview server and research VM were stopped; the disposable build checkout was removed. Source caches, experiment image files and private evidence remain available for review. Other sessions' services and checkouts were preserved.

This expanded research and publication request is complete. Remaining limits are explicit research boundaries; no further benchmark fan-out or unrelated repair is needed for the published claims.
