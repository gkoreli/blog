# Final review and publication acceptance

Review date: 2026-10-27. The [worklist](00-worklist-index.md), [reader-question map](02-reader-questions.md), [claim audit](03-claim-audit.md) and [reproduction package](repro/README.md) own the detailed evidence.

## Editorial and evidence review

The article recommends measuring Bun AOT before an efficiency-driven Rust rewrite. It preserves counterevidence: 64% compiler peak-memory reduction differs from 9% in the small server; warm throughput improves only about 6%; default Zod validation loses speed; a CommonJS fixture crashes the pinned compiler. It does not claim TypeScript/Rust equivalence or a stable released feature. The preview limitation appears in the opening and the availability section.

The question map comes from bounded, ranked X-thread samples read in the signed-in browser. It is not an exhaustive or representative survey. The video counts remain attributed reports in historical notes, rather than local correctness certification. The public article answers the questions most relevant to the adoption decision within the five-minute limit.

Numbers were checked against accepted JSON observations. Decimal MB, peak physical footprint, RSS, binary size and warmed throughput retain distinct labels. The shared-laptop server runs cover request volume and seconds, not a multi-day production soak. No local OpenClaw or Rust comparison was performed.

No prompt transcript or prompt file is published. Historical research direction is paraphrased. Private conversation logs, raw media, crash traces and executable binaries remain outside Git.

## Render and code checks

- `pnpm typecheck`: passed across packages.
- `pnpm -C packages/blog validate`: passed, 21 Markdown posts valid.
- `pnpm -C packages/blog build`: passed in the isolated managed worktree, without writing to the primary checkout's development output.
- `git diff --check`: passed.
- Desktop 1280 px and mobile 390 × 844 px browser review: readable opening, tables fit, document width equals viewport, one H1, no prompt link.
- Rendered body is roughly 850 words, under five minutes at 200 words/minute; article content is also present in server HTML without JavaScript.
- Canonical route is `https://gkoreli.com/oss-radar-08-bun-aot`; rendered date is October 27. The YAML date is explicitly quoted to preserve local date handling.
- The related Bun 1.4 article gains one contextual forward link after its original opening paragraph.
- Public reproduction Python files pass syntax checks. `prepare.py` assembles the observed setup steps; its complete fresh-download workflow has not been independently rerun. Accepted measurement/manual runners were executed locally; the known compiler failure is retained.

## Frozen research accounting

[The manifest](research-footprint.json) uses the existing repository extractor on this root's complete metadata-linked closure. An unrelated oversized log prevented a full-root scan, so byte-identical copies of the included logs supplied a filtered temporary root. Prefix commitments retain the selected bytes. One session and six committed Markdown artifacts are included. No descendant sessions were found. No prompts are published; the zero prompt-file count records omission, not the count of human requests. The measurement window includes research, experiments, writing and publication preparation; later deployment checks fall outside its frozen prefix. Cached input is a subset of input, and reasoning output is a subset of output. These totals describe usage and elapsed time, not quality or human effort.

## Delivery status

Code delivery: article and reproduction evidence commit `e252204`, followed by frozen provenance commit `0e0d3047c8247dd4f9cad223a27eae317c17ed7e`, were pushed directly to `main`. No prompt file or unrelated source change was staged. The primary checkout was fast-forwarded without disturbing the concurrent analytics work.

Build: [Workers Build 227145cb](https://dash.cloudflare.com/7e0dc86ef69b4572a63162a52cddd269/workers/services/view/gkoreli-com/production/builds/227145cb-540d-4b88-bb12-e6f7c3e21b14) for `0e0d304` completed successfully at **2026-10-27 15:40:17 UTC**. Earlier requests returned 404 while the build was queued; they were not counted as acceptance.

Activation: a fresh Wrangler observation showed deployment `30353746-c0e9-473c-9829-254fff5c889a`, created at **15:40:10.788001 UTC**, with version `4e33fde3-0c0c-4cb6-b1b1-013e6f50d41c` serving 100%. Deployment metadata and commit-specific build completion are recorded separately.

Live acceptance by **15:41:11 UTC**: [the public article](https://gkoreli.com/oss-radar-08-bun-aot) returned HTTP 200. Both its server HTML and a fresh browser render contained the finished text. Browser inspection confirmed the exact title, October 27 date, canonical URL, one H1, 843 body words, the compiler/server/Zod results, document width matching the viewport and zero prompt links. The `/oss-radar-08-bun-aot/prompts` route returned 404 in a separate live check. Desktop/mobile rendering had already passed locally on this same article source.

A newer concurrent analytics commit was integrated before this receipt. Its changes were not part of the article experiment or its frozen research footprint. This receipt changes research status only; it does not change the accepted article or rerun those experiments.

Remaining limits: preview compiler, one macOS arm64 developer laptop, microbenchmarks and seconds of server observation. No local Rust, OpenClaw migration, multi-day soak, broad npm-compatibility or server-capacity claim. No required publication work remains; proposed future experiments stay separate from these accepted results.
