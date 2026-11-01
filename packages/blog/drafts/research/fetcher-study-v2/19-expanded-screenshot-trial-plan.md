# More real service trials, with screenshot verification

November1, 2026 UTC, beginning16:35. The owner requests screenshots as verification, asks why Grok failed despite X-account access, and authorizes more real service research. Continues the completed [two-service validation](18-third-party-publication-acceptance.md). Its signed-out Grok gate remains a historical access outcome, not a fetch failure or a statement about the owner's account entitlement.

## Required outcomes

- Inspect Grok's actual X sign-in path and establish the cause/stage of its earlier failure. Use an existing session where available. New OAuth permissions, binding agreements and challenges retain their action-time confirmation requirements. Do not create an account, purchase a plan or expand permissions silently.
- Run additional actual external assistant fetch trials, prioritizing signed-in Grok and then available ChatGPT, Claude, Gemini and Perplexity interfaces. Aim for at least two additional complete assistant request chains from distinct products; keep the full objective open if access prevents completion. A failure or gate is evidence, not a substitute for a successful trial.
- Capture actual screenshots of submitted prompts, completed answers or gates, and matched native Cloudflare evidence. Preserve full private captures; publish only reviewed images containing this public trial material. A screenshot of an answer cannot by itself prove an origin fetch. Require the same unique-URL → visible result/content check → actual invocation/status → acknowledged insert → exact stored-row chain.
- Integrate useful confirmed findings and screenshot evidence into the maintained article/research record. Preserve prior dates, raw evidence and provenance; distinguish operator-driven controls, service fetches, passive observations, replays and software tests. Verify the rendered and served revision before completion.

## Frozen trial method

Use the original fetcher study with fresh per-interface query labels under the already checked prefix:

- `fetcher-live-20261101-grok-r3`
- `fetcher-live-20261101-chatgpt-r3`
- `fetcher-live-20261101-claude-r3`
- `fetcher-live-20261101-gemini-r3`
- `fetcher-live-20261101-perplexity-r3`

Prompt, substituting only LABEL:

```text
Open this exact URL: https://gkoreli.com/which-ai-fetchers-send-which-headers?probe=LABEL
Return the page's H1 and quote one sentence from its "Maintaining this reference" section. If you cannot access the page, say so; do not infer its contents from the URL or search snippets.
```

Do not directly open assigned blog URLs as browser controls. Record exact submission time, model/mode, signed-in state, answer, visible tool/source behavior, completion bounds and screenshots. One initial prompt per available interface; at most one separately labelled follow-up if a returned tool/result leaves a concrete ambiguity. Extra labels require a dated addendum before submission. Do not substitute an API result for the named signed-in UI trial.

Start a fresh bounded GET tail before the first submission. Freeze assigned labels privately, record start/stop bounds, stop at32MiB or30minutes and inspect full parsing. Re-establish account/database/query access; use the existing extractor and native D1 preflight before one bounded exact-reference readback. Max40references per statement; preserve metered reads/writes and stop after quota/authorization failure. No new broad traffic export, runtime change, diagnostic capture activation, security bypass or synthetic vendor headers are part of this work.

Private evidence destination: ignored `packages/blog/worklog/fetcher-expanded-20261101/`, restricted permissions. Keep login/OAuth state, unrelated chats and raw operations private. Public image captions must say what is visibly established and link the matching minimized chain receipt; no fabricated screenshot, recreated UI or image-generated evidence.
