# Three concrete next actions for the Bun AOT article

Checked October 27, 2026 Pacific. These are proposals, not sent messages or scheduled work. They follow the completed [traction investigation](traction-2026-10-27.md); that investigation is not reopened.

## 1. Answer karn's actual RAM question

Destination: https://x.com/gyankarn/status/2115022381358166098

Fresh browser inspection confirms that karn asks why memory is already lower before DFG/FTL code becomes hot. No later answer appeared in the displayed reply portion; this is a bounded view, not a complete reply-corpus audit.

The offer is a measured contribution to his question: the separate AOT default/64-bit-reference control, with the article's methods. This is not a claim to explain Peter's exact memory reduction.

Ready-to-review reply, 227 X-weighted characters including its URL:

```text
One measured piece is compressed references: switching AOT to 64-bit references raised peak physical memory from 951 MB to 1,303 MB in my compiler test. That isn't the whole explanation; methods + repro: https://gkoreli.com/oss-radar-08-bun-aot
```

Observable outcome: karn or another participant discusses the mechanism, asks for a missing control, or runs the reproduction. Do not substitute likes for this outcome or promise wider distribution from a reply.

## 2. Give Colin a runnable Zod case

Destination: https://x.com/colinhacks/status/2114380217515216985

Fresh browser inspection confirms that Colin proposes a portable environment flag for disabling eval; the thread discusses build-time constants and library behavior. His proposal does not ask for an article review. The relevant contribution is a small default/jitless comparison that a library/compiler maintainer can inspect or request as a fixture.

Ready-to-review reply, 231 X-weighted characters including its URL:

```text
I have a small Zod 4.3.6 case: 2m valid parses took 278 ms with AOT, 204 ms with jitless AOT, and 58.6 ms with JIT (whole-process timings; Bun 06888611, macOS arm64). Would this help as a regression fixture? https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot/repro
```

The linked folder contains `zod-default.ts`, `zod-jitless.ts`, `measure-validators.py`, pinned dependencies and recorded results. The numbers are whole-process medians over five measured runs after warm-up, on a shared macOS arm64 laptop with the pinned Bun preview. They do not isolate parse time or establish that one mechanism accounts for the full regression.

Observable outcome: the maintainer reproduces the case, asks for an altered fixture, or identifies a limitation in the test. No public bug/performance claim should imply a current stable-release result.

## 3. Ask HN to clarify the visibility failure

Destination: `hn@ycombinator.com`, using the owner's own email and wording. Do not send through this document or automate another HN submission.

Subject suggestion: `Could you clarify the status of gogakoreli's submissions?`

Facts for a short note:

- Account: `gogakoreli`.
- Eight most recent stories were marked dead at the investigation snapshot.
- Article example: https://news.ycombinator.com/item?id=50262191
- GitHub-project example: https://news.ycombinator.com/item?id=49889335
- The latest article submission used browser automation; this needs to be acknowledged honestly.
- Exact question: is there an account restriction, and what needs changing to participate within the rules?

The [HN guidelines](https://news.ycombinator.com/newsguidelines.html) direct site questions to that address, prohibit automated posting/generated submission text and discourage primarily promotional use. Ask for clarification, not special placement or votes. No moderator contact has been sent.

Observable outcome: a moderator clarifies the restriction or appropriate participation path. Until then, an edited headline or repost does not constitute a verified fix for public visibility.

## Work deliberately excluded

[Bun issue 47044](https://github.com/oven-sh/bun/issues/47044) is open, but its comments already link a focused [reproduction PR, 47045](https://github.com/oven-sh/bun/pull/47045). Another generic bug write-up would duplicate existing work. No claim is made that these new X replies or a moderator request will produce adoption; they give specific people evidence relevant to an existing question, with an observable result.

Article copy, benchmark measurements and the frozen research footprint are unchanged. These drafts need an explicit publication request before any new external write.
