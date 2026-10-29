# Thirty-second Bun AOT demo

New owner request: produce a shareable demo, not another publication. Status: **rendered and verified**, not posted. The original no-media launch scope is historical; this is a separately requested artifact. No new X post is authorized here.

| Time | State | Evidence |
| --- | --- | --- |
| 0–11.5 s | Test 1: tiny-server executable, three bars | 121.5 MB JIT, 51.8 MB AOT, 30.3 MB AOT+trim. Disk size, not RAM. |
| 11.5–12 s | Crossfade | Both tests carry explicit workload labels. |
| 12–23.5 s | Test 2: TypeScript compiler checking Effect | 2,625 MB → 934 MB median peak physical footprint; 64% less, five runs per build. |
| 23.5–24 s | Crossfade | Transition to a useful conclusion. |
| 24–29 s | Both results, separately labeled; counterexamples | Warmed server only 6% faster; one Zod test slower; article has code and limits. |
| 29–30 s | Return to first frame | Continuous loop without a flash. |

The timeline illustrates accepted data; it is not a filmed benchmark execution. The Markdown article has no existing animated preamble to capture. Reuse the established binary-chart palette/layout and read numbers directly from the frozen accepted summary. The new Polkadot numbers and current Zod retest are not mixed into this historical preview demo.

Render with the bundled Python/Pillow runtime, then use the skill's encoder with both input and video fps set to 30, `--no-gif`. Inspect decoded MP4 frames at 1200 px and 390 px and the loop seam; source frames alone are insufficient. Silent video, all information on screen, H.264 / yuv420p / faststart, 1200×1200. No GIF is needed for this 30-second deliverable.

Delivered file: [demo-30s.mp4](demo-30s.mp4), **30.0 seconds / 900 frames / 1,120,579 bytes**. [Encoding and visual acceptance](demo-acceptance.json) records decoded-frame checks at full and phone width, the loop seam and file hash. [Poster](demo-poster.png). Browser composer and live playback checks are unperformed because publication was not requested.

Draft post, not published:

```text
My server executable shrank from 121.5 MB to 30.3 MB. In a separate test, the TypeScript compiler used 64% less peak memory. Same source in each comparison; preview results and the catches: https://gkoreli.com/oss-radar-08-bun-aot
```

Description: Two separately labeled Bun AOT tests. A tiny server's executable shrank from 121.5 MB to 51.8 MB, then 30.3 MB with trimming. The TypeScript compiler checking Effect used 2,625 MB versus 934 MB peak physical memory. Historical October 27 macOS arm64 preview; the warmed server's speed gain was only 6% and a Zod test was slower.
