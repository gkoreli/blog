# Destinations and real questions — October 30

## Direct discussion

- Theo's original chart: https://x.com/theo/status/2115338547620401326. Independent same-Mac VM result and tested safety limits fit the actual claim.
- Aditya asks whether the worktree timing includes package installation: https://x.com/heyprojedi/status/2115488692739682750. The article explicitly separates checkout creation from timed installs in “Four repositories, one physical Mac.” The existing reply does not explain that distinction.
- Sam asks whether the filesystem is responsible, mentioning ZFS: https://x.com/SamHulick/status/2115348794325749966. The article's import-method explanation, separate same-filesystem XFS control and APFS-causality limit answer part of this. Do not claim a ZFS benchmark.

Coverage is a bounded relevant-order X sample, not all 177 replies. Public search also surfaced old Reddit worktree questions and pnpm performance/type-resolution issues. Do not revive unrelated or already-fixed issue threads merely for a link.

## Beyond X

Changelog News's current signed-in submission guidelines welcome authors' own work, reject generic tutorials/commercial pitches and ask why a submission is newsworthy. This measured investigation fits: same physical hardware, repeated trials, source/file evidence and a reproduced cache-write failure. Existing signed-in account and newsletter subscription are already established; no account or subscription change is needed. Submission receipt will not imply selection.

Cooperpress lists editor@cooperpress.com for editorial suggestions: https://cooperpress.com/contact/. One pitch could serve JavaScript/Node Weekly; do not send separate copies to the same editorial team. No pitch is represented as sent here.

HN's current guidelines prohibit generated text and automated posting: https://news.ycombinator.com/newsguidelines.html. No automated HN submission/comment is planned; the owner can submit the article directly. Relevant link discovery is not permission to bypass destination rules.

## Changelog exact submission

URL: https://gkoreli.com/why-worktree-setup-is-slow-on-macos

Title: A Linux VM on My Mac Beat macOS at Installing Dependencies

Explanation:

I investigated Theo's Mac/Linux worktree timings on one physical M5 Mac. A 4-vCPU, 4-GB Linux VM beat host macOS on warm-cache dependency installs in T3 Code, Next.js, Vite and SvelteKit; T3's medians were 2.10s versus 8.12s.

The investigation includes source traces, file audits, 90 additional install trials and real project checks. A reduced ncc case explains how a Linux build changed shared cache files and broke the next offline install. I tested fixes for file isolation and missing type dependencies, with failed checks and resource limits retained. Useful for developers repeatedly opening agent worktrees; scripts and results are linked.

## Article response to the questions

The existing methods paragraph already separates checkout creation from dependency installation. The filesystem paragraph now names the VM's ext4 storage and explicitly says the gap did not require ZFS, using the accepted protocol rather than a new benchmark. The APFS-only causal limit remains beside it. The exact October 30 request becomes the eighth shaping prompt; publication date and URL remain unchanged. This clarification is part of answering the real question, not an early-performance copy experiment.

Changelog submission was filled but automatic approval review rejected Submit, interpreting the authorization as naming X/HN rather than Changelog. A Changelog-specific approval question is pending. No alternate submission path or outreach was used to bypass it.
