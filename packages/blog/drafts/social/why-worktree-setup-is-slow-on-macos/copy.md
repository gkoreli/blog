# Exact X copy

Status: original post and three replies published and independently verified through X public oEmbed. Exact final copy below; only whitespace was normalized during composer correction.

## Original X post

Weighted count: 229 (ASCII text, URL counts as 23).

I gave Linux 4 GB of my Mac's 24 GB RAM: T3 Code dependencies installed in 2.10s vs 8.12s on macOS. Tested four repos, traced the extra file work, and checked fixes for speed, type errors and cache writes. https://gkoreli.com/why-worktree-setup-is-slow-on-macos

## Reply to Theo

Weighted count: 234 (ASCII text, URL counts as 23).

I tested this on the same M5 Mac: 2.10s in a 4 GB Linux VM vs 8.12s on macOS for T3 dependencies, with warm caches. Tested four repos and found fixes, type errors, and a build that changed cached package files: https://gkoreli.com/why-worktree-setup-is-slow-on-macos

## Reply to the worktree/install question

Prepared for https://x.com/heyprojedi/status/2115488692739682750, after reading the question and existing reply.

Yes, the chart times pnpm install in a new worktree. Bare git worktree creation is separate; I measured only the install step, with warm caches, across T3, Next.js, Vite and SvelteKit: https://gkoreli.com/why-worktree-setup-is-slow-on-macos

## Reply to the filesystem question

Prepared for https://x.com/SamHulick/status/2115348794325749966, after reading Theo's existing ZFS answer. Adds the independent ext4 result and the separate XFS cache-placement control; does not claim a ZFS benchmark or an APFS-only decomposition.

ZFS wasn't required in my tests: an ext4 Linux VM on the same Mac beat macOS in all four repos. Moving the cache onto the checkout's filesystem cut a separate XFS test from 7.6s to 1.4s; this doesn't isolate APFS alone. https://gkoreli.com/why-worktree-setup-is-slow-on-macos
