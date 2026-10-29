# Prepared promotion copy

October 28, 2026. Initially all drafts below were unsent. **Items 1–4 have now been executed after Goga's explicit approval**; see [the separate receipts](execution-2026-10-28.md). Items 5–7 remain unsent and unpublished. Article measurements remain tied to the October 27 macOS arm64 preview, `06888611e`.

## 1. Cooperpress editorial email

Recipient: `editor@cooperpress.com`, verified on its [contact page](https://cooperpress.com/contact/). One email for consideration in either JavaScript Weekly or Node Weekly.

Subject: `Bun AOT: independent speed, RAM and executable-size tests`

Hey Peter, you covered Bun AOT in JS Weekly #807. I tested the preview: the TypeScript compiler ran 3.3× faster with 64% less peak memory, and my server executable went from 121.5 MB to 30.3 MB with AOT + --trim.

The warmed server only gained 6%, and the Zod test was slower. Code, conditions and results: https://gkoreli.com/oss-radar-08-bun-aot

Might fit JavaScript Weekly or Node Weekly.

Goga

## 2. Changelog News

Destination: https://changelog.com/news/submit

URL: `https://gkoreli.com/oss-radar-08-bun-aot`

Title: `Bun AOT: independent tests of speed, RAM and executable size`

What's interesting about it:

I tested Bun's AOT preview against its usual build, using the same TypeScript source. The compiler finished 3.3× faster with 64% less peak physical memory. My server executable went from 121.5 MB to 30.3 MB with AOT and --trim.

The useful part is where the headline stops holding: the tiny warmed server was only 6% faster, and a Zod test was slower. The article explains some of the RAM saving and links all the code, pinned versions and results. Measurements are from one macOS arm64 laptop, not a production comparison or a Rust benchmark.

## 3. r/bun post

Destination: https://www.reddit.com/r/bun/submit

Title: `I tested Bun AOT: much less RAM for the compiler, a smaller gain for a warmed server`

Body:

I wanted to check the “2–3× faster, half the RAM” reports, so I built the same TypeScript source with and without Bun's new AOT compiler.

My results on macOS arm64:

| Test | Usual build | AOT |
| --- | ---: | ---: |
| TypeScript 6.0.3 checking Effect | 5.02 s | 1.54 s |
| That compiler's peak physical memory | 2,625 MB | 934 MB |
| Tiny API after warm-up | 186k requests/s | 197k requests/s |
| That API's peak RSS | 51.6 MB | 46.9 MB |
| Server executable | 121.5 MB | 51.8 MB; 30.3 MB with --trim |

So the big gain held for the compiler, but my warmed server was only about 6% faster and used 9% less RAM. The server test is tiny: 20,000 warm-up requests, then 2 million measured requests per process, five alternating pairs. It isn't a production or multi-day test.

A small Zod program also went the other way: 2 million successful checks took 278 ms with AOT versus 59 ms with the usual build. Those are whole-process times, including startup.

Everything uses the same pinned preview, `06888611e`, from October 27. Physical memory, RSS and executable size are different measurements; the table labels each. I haven't rerun this on the newly merged compiler.

Code and reproduction instructions: https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot/repro

My write-up, including the RAM mechanisms and compatibility limits: https://gkoreli.com/oss-radar-08-bun-aot

If you've tried this on an actual app, what changed after warm-up?

Before publishing: inspect current account/community rules and duplicate discussions. Disclose authorship as above; answer substantive questions rather than dropping a link and leaving.

## 4. One image post on X

Attach [binary-size.png](binary-size.png). This is a proposed format experiment; not a claim that images get an algorithmic boost. Two sentences plus the canonical URL, **180 X-weighted characters**, within the owner's 280-character limit. Composer/live checks have not occurred.

```text
My server executable went from 121.5 MB to 30.3 MB with Bun AOT + --trim, without rewriting the TypeScript. That’s disk size; RAM needs its own measurement. https://gkoreli.com/oss-radar-08-bun-aot
```

Alt text:

```text
Same TypeScript server built three ways: usual Bun executable, 121.5 MB; Bun AOT, 51.8 MB; Bun AOT with --trim, 30.3 MB. Bars start at zero. These are file sizes, not RAM. Tested on the October 27 macOS arm64 preview, commit 06888611e.
```

## 5. Warmed-server answer

Parent: https://x.com/gyankarn/status/2114947516164960491

Two sentences plus link, **201 X-weighted characters**. Fresh thread check required before publishing; this is a different question from the completed RAM reply.

```text
I checked this with a tiny API: after 20,000 warm-up requests, Bun AOT was about 6% faster and used 9% less peak RAM. Useful, but the 2–3× gain didn’t carry over to this server: https://gkoreli.com/oss-radar-08-bun-aot
```

## 6. One method-focused collaboration email

Recipient: `k.vorrapong@gmail.com`, published on [the author's own about page](https://blog.icerust.dev/about/).

Subject: `Your Bun benchmark and the new AOT compiler`

Hey ICE, your post about benchmark order changing the result caught my attention.

I tested Bun's new machine-code compiler. My tiny API gained about 6% after warm-up, much less than the 2–3× people are talking about. I used five alternating pairs on a shared Mac, so I'd like to see how well that holds up.

If you try it with your framework tests, I'd love to compare results. My code and conditions are here: https://gkoreli.com/oss-radar-08-bun-aot

Goga

No claim that his existing `elysia-aot` results test Bun AOT. No request for a share or obligation to run the tests.

## 7. Existing subscriber dispatch

Audience: existing confirmed opt-in subscribers only; list and previous-send status have not been inspected. Do not add a recipient address or send until the normal dispatch checks are complete.

Subject: `I tried Bun AOT before rewriting TypeScript`

Bun's new compiler made my TypeScript compiler test 3.3× faster with 64% less peak memory. My server executable shrank from 121.5 MB to 30.3 MB with AOT and --trim.

But the warmed server only gained 6%, and a Zod test got slower. I tested the RAM saving, the smaller executable and the cases that broke: https://gkoreli.com/oss-radar-08-bun-aot

If you try it on your app, I'd like to hear what changes.

Goga
