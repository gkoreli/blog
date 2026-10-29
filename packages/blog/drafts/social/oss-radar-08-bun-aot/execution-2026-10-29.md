# Three approved actions executed — October 29, 2026

Goga explicitly said “Go ahead do it” after the three destinations were named: the Polkadot issue, Assaf Arkin / Weekend Reading, and the 30-second X video. Times below are Pacific (PDT).

| Action | Verified result | Limit |
| --- | --- | --- |
| Polkadot maintainer comment | Posted as `gkoreli` at **8:01:46 AM**: [comment](https://github.com/paritytech/polkadot-cli/issues/218#issuecomment-6500261059). Fresh checks found zero comments before posting. `gh issue comment` returned this URL; a separate API read matched the author and exact [saved body](../../research/polkadot-bun-aot/02-maintainer-draft.md). The signed-out issue page independently displayed it. | No maintainer response, rerun or changed decision is established. |
| Weekend Reading pitch | Sent to `assaf@labnotes.org` at **8:00:05 AM**, subject **Bun AOT: smaller binaries, with a few catches**. A fresh Sent search found no previous matching email. A separate Gmail read confirmed recipient, subject, body, date and `SENT`. The address was rechecked on [Assaf's own page](https://labnotes.org/about/). | Sending does not prove delivery, reading, reply or editorial selection. |
| X video | Posted as `@GogaKoreli` at **8:05:57 AM**: [permanent status](https://x.com/GogaKoreli/status/2115822454497309070). Reopened the status and checked exact text, 30-second native video, 1200×1200 playback and advancing play time (16.7792 → 27.7362 seconds, ready state 4). The article link resolved to the canonical article with HTTP 200. X's unauthenticated embedding service independently returned the author, status and exact text. | Public text and owner-view playback are verified. No qualified reader, click or adoption result is claimed. |

## Exact sent email

Hey Assaf, I tested Bun's preview compiler: my server executable went from 121.5 MB to 30.3 MB without rewriting the TypeScript, but the warmed server only gained 6% and a Zod test got slower.

The code, RAM measurements and limits are here, if it fits Tech Stuff: https://gkoreli.com/oss-radar-08-bun-aot

Goga

## Exact published X copy

Two sentences, 195 weighted characters; the URL counts as 23 characters.

```text
My server executable shrank from 121.5 MB to 30.3 MB. In a separate test, the TypeScript compiler used 64% less peak memory without source changes—code and preview limits: https://gkoreli.com/oss-radar-08-bun-aot
```

Media: [accepted historical demo](demo-30s.mp4), unchanged from [its encoding acceptance](demo-acceptance.json). The composer showed `demo-30s.mp4: Ready` and the correct copy before one publication click. The silent clip labels the original October 27 preview, separates disk size from peak physical memory, and includes the slower-workload counterexamples. This is distribution of accepted historical results, not a new benchmark.

## Execution and evidence limits

The GitHub connector could read the issue but its write returned 403. The installed `gh` CLI worked as `gkoreli` with normal network/keychain access; its earlier restricted authentication check was misleading. The failed connector attempt created no comment. The CLI and signed-out page verified the one successful comment.

Private screenshots, public embedding capture and outgoing email identifiers remain outside Git in `/tmp/bun-aot-distribution-20261029/`. The [evidence manifest](execution-evidence-2026-10-29.json) records selected capture hashes. Raw email headers and private account details are excluded.

All three authorized actions are complete. The independent-run invitation, benchmark-suite outreach, counterexample post and two-CLI invitation remain unsent proposals. No additional HN submission, paid placement or follow-up automation was created. Check actual replies or reruns before claiming adoption; no future check has been scheduled.
