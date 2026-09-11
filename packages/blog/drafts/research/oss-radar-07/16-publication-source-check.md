# Publication source check

**checkedUTC: `2026-09-11T03:02:54Z`** — September 10, 2026 PDT. Read-only source refresh of the [publication candidate](https://github.com/gkoreli/blog/blob/db010a56ff12b0f73a9386f872a639b00a04da11/packages/blog/drafts/oss-radar-07-promptfoo.ts) at blog commit `db010a56ff12b0f73a9386f872a639b00a04da11`. Continues the [candidate review](11-publication-candidate-review.md); no completed fixture was rerun.

**Result:** the recorded 0.122.2 findings remain supportable, but 0.123.0 has shipped since the experiments. Keep the tested baseline and add a short release note. The new adapter changes billing handling without adding citation capture. The telemetry report and its three linked proposed fixes remain open.

## Release and issue state

| Source | State or support at this check | Publication consequence |
|---|---|---|
| [Runner 0.123.0](https://github.com/promptfoo/promptfoo/releases/tag/0.123.0) | GitHub's latest release; published `2026-09-10T02:34:32Z`, not draft or prerelease. Commit `3ec974043eb9941af5b605f6f21f71f24bf46c3c`. | Add a dated note; do not imply 0.122.2 is current. |
| [Runner 0.122.2](https://github.com/promptfoo/promptfoo/releases/tag/0.122.2) | August 28 release still resolves to the recorded implementation baseline, `89052308bce06f53645b1f189ada5ac9d1897347`. | Preserve the experiment version and original source pins. |
| [Runner 0.122.1](https://github.com/promptfoo/promptfoo/releases/tag/0.122.1) | August 26 notes include test roots, target spans, telemetry integrations, and expanded usage accounting. | The article's August chronology remains supported. |
| [Scanner action 0.2.0](https://github.com/promptfoo/promptfoo/releases/tag/code-scan-action-0.2.0) | August 28 notes cover supply-chain and dependency hardening on the separate action track. | Keep the distinction from the runner release and the scanner's earlier introduction. |
| [Telemetry issue #9968](https://github.com/promptfoo/promptfoo/issues/9968) | Open; `closed_at: null`. Reports the disabled-event beacon, originally against 0.121.17. | Refresh the checked date beside the body claim and source card. The article's own 0.122.2 experiment supplies its reproduced evidence. |
| [PR #9976](https://github.com/promptfoo/promptfoo/pull/9976), [PR #10047](https://github.com/promptfoo/promptfoo/pull/10047), [PR #10569](https://github.com/promptfoo/promptfoo/pull/10569) | Each is open, `merged: false`, `merged_at: null`; all three link to #9968. | Proposed fixes do not establish a shipped repair. These need not become extra article claims. |

GitHub release pages were read through the web tool. Current release, issue, and PR fields were also read through the authenticated GitHub API. An initial unauthenticated API request hit its rate limit; the authenticated reads succeeded. PRs for the earlier, unselected shortlist are outside this publication's claims and were not re-audited.

## Does the newer release change the finding?

The 0.123.0 SHA is a narrowly scoped freshness comparison, not a replacement implementation baseline. The [new OpenRouter adapter](https://github.com/promptfoo/promptfoo/blob/3ec974043eb9941af5b605f6f21f71f24bf46c3c/src/providers/openrouter.ts) changes cost calculation and adds `metadata.openrouter` billing fields. Its return path still does not expose `raw`, the top-level citation list, or answer annotations. This is code inspection, not execution of 0.123.0; it does not prove all new-release behavior.

Direct byte comparisons against the tested SHA found these three files unchanged: [telemetry](https://github.com/promptfoo/promptfoo/blob/3ec974043eb9941af5b605f6f21f71f24bf46c3c/src/telemetry.ts), [provider response contract](https://github.com/promptfoo/promptfoo/blob/3ec974043eb9941af5b605f6f21f71f24bf46c3c/src/contracts/providers.ts), and [evaluator tracing](https://github.com/promptfoo/promptfoo/blob/3ec974043eb9941af5b605f6f21f71f24bf46c3c/src/tracing/evaluatorTracing.ts). The telemetry disabled-event path remains present. Changes elsewhere in the new release were not exhaustively audited, and persistence/export results remain observations of 0.122.2.

| File | SHA-256 at tested 0.122.2 | SHA-256 at 0.123.0 |
|---|---|---|
| `src/providers/openrouter.ts` | `7b309ba9800741910029e3734a542c0320828e51421ea8a0ad15298cac01c667` | `73b0ca1ccb5bfe544d25bf824ffa19874fc9f36ac094c4219611010e2fb07ee5` |
| `src/telemetry.ts` | `2598714fb67e457a62a1f8a7fe255785ef3e76f20e183a6463214e05cbfce3cd` | Same |
| `src/contracts/providers.ts` | `324bacb30591e11a28cb5f1705b3a8d36b083798d63b3cd3bc58f7eaf0bf107f` | Same |
| `src/tracing/evaluatorTracing.ts` | `8d7581f5716ab17affadaf116c5fcc89ae1a9543ee40f78bdc5edd42705622c7` | Same |

## Other material source checks

| Source | Support retained |
|---|---|
| [Promptfoo About](https://www.promptfoo.dev/about/) | Current public affiliation is part of OpenAI; the stated purpose concerns secure, reliable AI applications. |
| [Founders' March 9 announcement](https://www.promptfoo.dev/blog/promptfoo-joining-openai/) | Supports their application-security purpose and continued open-source, cross-provider commitment. It supplies no acquisition closing date. |
| [OpenAI's March 9 announcement](https://openai.com/index/openai-to-acquire-promptfoo/) | Describes planned Frontier integration, development workflows, and oversight. It does not establish completed integration. |
| [Scanner engineering introduction](https://www.promptfoo.dev/blog/building-a-security-scanner-for-llm-apps/) | Dated December 16, 2025; supports the earlier code-scanning introduction. |
| [Bing AI Performance announcement](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | Dated February 10, 2026; describes citation activity for supported surfaces and selected integrations, with aggregate coverage limits. |
| [Bot-signature draft 00, §4.6](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00#section-4.6) | September 1, 2026 active Internet-Draft; human authentication, authorization, and delegation remain outside its scope. |
| [Use-case draft 02, Appendix A.4](https://datatracker.ietf.org/doc/html/draft-nottingham-webbotauth-use-cases-02#appendix-A.4) | April 1, 2026 active individual Internet-Draft; questions the human/bot binary. It is not an agreed standard. |

The earlier audit owns the unchanged pinned experiment artifacts, W3C model, and citation-evaluation papers. This refresh does not claim a new reproduction or a full new literature review.

## Source cards and required edits

The starting candidate contains **37 unique source cards**, all with matching narrative links. All material external body links have cards. The only additional body URL is the worklist; the backmatter also links the prompts record. Those are research navigation, not missing evidence cards. No unused card, missing material body/source pairing, or unsupported stronger claim was found within this refresh's scope. Preserve the synthetic-response, cache-retention, local-trace, and unmeasured-billing qualifications.

After the August release paragraph in **What Promptfoo is building**, add: “Promptfoo 0.123.0 shipped on September 10. The experiments here remain pinned to 0.122.2; we have not rerun them on the newer release.” Link `0.123.0` to its release page. Suggested matching card:

- **claim:** “Promptfoo 0.123.0 shipped after the tested release”
- **why:** “Separates the current release from the version used for these experiments.”
- **ref:** “Promptfoo 0.123.0 · Sep 10, 2026”
- **url:** `https://github.com/promptfoo/promptfoo/releases/tag/0.123.0`

If the body also mentions the billing change, pair it with the 0.123.0 OpenRouter source above and a distinct card; do not silently redirect the existing 0.122.2 implementation citation. Refresh #9968 and the About page's checked dates to September 10 PDT, while preserving the original experiment dates. The parent publication pass owns the final version note, release date, live-preflight limitation, rendering checks, and publication decision.
