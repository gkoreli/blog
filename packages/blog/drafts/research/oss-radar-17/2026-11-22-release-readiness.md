# November 22 release readiness for OSS Radar #17

## Project checks

GitHub's latest stable release and npm `latest` both resolved to Bun 1.4.5 at `a7733435cf40429e3b35c36072769df2052b80f1`. GitHub returned zero matching 1.5 tags. The article's codec and timing results still refer to the November 20 canary. The newer `25c4fca9e` canary includes the path refactor and reproduced the older canary's symlink behavior across all six trial reads on macOS ARM64. After rotation, the two `require.resolve()` calls still selected the old file while the direct read returned the new contents. [GitHub release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.5) · [npm release](https://www.npmjs.com/package/bun/v/1.4.5) · [Path trial](bun/README.md#november-22-path-refactor).

Hot Updater npm `latest` moved to 1.1.18. The published CLI and bare adapter reproduced the store build-number and shared spec results. The iOS build script again used the saved value in Debug and the recomputed value in Release after a spec edit. The checked inputs were synthetic. The flagd and pgroll release pins and cited discussions still support the article's advice. [Hot Updater follow-up](hot-updater/README.md#november-22-npm-release) · [flagd release](https://github.com/open-feature/flagd/releases/tag/flagd/v0.19.0) · [pgroll release](https://github.com/xataio/pgroll/releases/tag/v0.16.3).

## Queue and hosted workflow

The isolated `publication check` passed against GitHub main at `3e7ab56a000f0781d6dca823ed3d85591e311f02`. The manifest contains one entry dated November 23, 2026, at 08:00 America/Los_Angeles. The queued file has slug `oss-radar-17-what-still-works-after-an-upgrade` and SHA-256 `41627811aae914a9a3b2cdd147e0f195bfe2f29806feabf134c5407410f43927`, matching the draft and Friday's rendered acceptance. The only changes since that site build are research records and fixtures. [Manifest](../../../publication-schedule.json) · [Friday preview](results/preview-main-2026-11-20.json).

GitHub reported workflow `408698342` active at 09:07 Pacific on November 22. The Sunday site check returned 200 for issue #16 and 404 for the queued #17 route. [Hosted workflow](https://github.com/gkoreli/blog/actions/workflows/november-publication.yml) · [Issue #16](https://gkoreli.com/oss-radar-16-saved-skills-and-inbox-replies).

Monday's 08:00 Pacific trigger starts the hosted release. Verify the run, the promoted source hash, and the served article, archive, and feed. If the trigger misses, dispatch the same hosted workflow in publish mode after 08:00 Pacific once the queue is confirmed. Restore the workflow pause after the dated release succeeds or reaches a terminal failure.
