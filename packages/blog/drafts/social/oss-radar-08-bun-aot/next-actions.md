# Three concrete next actions for the Bun AOT article

Initially checked October 27, 2026 Pacific. Goga revised and explicitly authorized the two replies and email on October 28. All three actions are now complete; receipts are below. They follow the completed [traction investigation](traction-2026-10-27.md); that investigation is not reopened. No monitoring is scheduled.

## 1. Answer karn's actual RAM question

Destination: https://x.com/gyankarn/status/2115022381358166098

Fresh browser inspection confirms that karn asks why memory is already lower before DFG/FTL code becomes hot. No later answer appeared in the displayed reply portion; this is a bounded view, not a complete reply-corpus audit.

The offer is a measured contribution to his question: the separate AOT default/64-bit-reference control, with the article's methods. This is not a claim to explain Peter's exact memory reduction.

Published copy, 186 X-weighted characters including its URL:

```text
Bun can use less space for the connections between objects. Turning that off pushed my compiler’s peak RAM from 951 MB to 1.3 GB, so that explains one part of it: https://gkoreli.com/oss-radar-08-bun-aot
```

Publication: https://x.com/GogaKoreli/status/2115486760872665345 — October 28 at 9:52 AM Pacific. Reopened the permanent page and verified the exact text, article card and thread ancestry back to karn's question. This signed-in publication check does not establish third-party reach. A useful later outcome would be discussion of the mechanism or an independent reproduction; none is claimed here.

## 2. Give Colin a runnable Zod case

Destination: https://x.com/colinhacks/status/2114380217515216985

Fresh browser inspection confirms that Colin proposes a portable environment flag for disabling eval; the thread discusses build-time constants and library behavior. His proposal does not ask for an article review. The relevant contribution is a small default/jitless comparison that a library/compiler maintainer can inspect or request as a fixture.

Published copy, 211 X-weighted characters including its URL:

```text
I tested a small Zod program that makes 2 million checks: 278 ms with Bun’s new compiler vs 59 ms with the usual build. Turning off Zod’s code generation helped, but it still took 204 ms: https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot/repro
```

The linked folder contains `zod-default.ts`, `zod-jitless.ts`, `measure-validators.py`, pinned dependencies and recorded results. The numbers are whole-process medians over five measured runs after warm-up, on a shared macOS arm64 laptop with the pinned Bun preview. They do not isolate parse time or establish that one mechanism accounts for the full regression.

Publication: https://x.com/GogaKoreli/status/2115486762508415228 — October 28 at 9:52 AM Pacific. Reopened the permanent page and verified the exact text, reproduction link and thread ancestry back to Colin's post. This is not evidence that Colin read or acted on it. A useful later outcome would be a reproduced or improved fixture; no response is claimed here.

## 3. Ask HN to clarify the visibility failure

Destination: `hn@ycombinator.com`. Goga explicitly authorized sending the last reviewed wording on October 28. The email was sent through the connected Gmail account; no new HN website submission was made.

Sent subject: `Are my submissions being blocked?`

Facts for a short note:

- Account: `gogakoreli`.
- Eight most recent stories were marked dead at the investigation snapshot.
- Article example: https://news.ycombinator.com/item?id=50262191
- GitHub-project example: https://news.ycombinator.com/item?id=49889335
- The latest article submission used browser automation; this needs to be acknowledged honestly.
- Exact question: is there an account restriction, and what needs changing to participate within the rules?

The [HN guidelines](https://news.ycombinator.com/newsguidelines.html) direct site questions to that address, prohibit automated posting/generated submission text and discourage primarily promotional use. The approved email asks for clarification, not special placement or votes. Gmail returned a `SENT` label; a separate metadata read confirmed the recipient, subject and October 28 16:50:17 UTC send time. That proves sending, not delivery or a moderator response. The exact sent email and message identifiers remain in the private receipt outside Git.

A moderator response clarifying the restriction or participation path would be a useful later outcome. No such response has been checked or claimed here. Until then, an edited headline or repost does not constitute a verified fix for public visibility.

## Work deliberately excluded

At the initial check, [Bun issue 47044](https://github.com/oven-sh/bun/issues/47044) was open and its comments already linked a focused [reproduction PR, 47045](https://github.com/oven-sh/bun/pull/47045). Another generic bug write-up would duplicate that work. No claim is made that these X replies or the moderator request will produce adoption; they give specific people evidence relevant to an existing question, with an observable result.

Article copy, benchmark measurements and the frozen research footprint are unchanged. Both X replies and the email were verified by October 28 at 9:55 AM Pacific. Private screenshots, DOM captures and the email receipt are archived outside Git under the author's social-evidence directory. All three requested actions are complete. No new external write or follow-up is authorized by this receipt.
