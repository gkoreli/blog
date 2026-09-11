# OpenRouter claim audit

Checked September 11, 2026. Baseline: `e7c2f58`. This corrects the scope of a published claim; no experiment was rerun.

**We never called OpenRouter's service or obtained a model answer through it.** Promptfoo's installed connector ran against a local HTTP server returning a response written for the test. The later real answers came from Codex and Claude Code through their subscription logins, as recorded in [artifact 20](20-subscription-cli-experiment.md).

## Evidence checked

- [The script](repro/installed/probe-installed.ts) binds the server to `127.0.0.1`, returns `response.fixture.json`, and overrides the connector's `apiBaseUrl` with that server's address. `openrouter:perplexity/sonar` selects the adapter; it does not establish that a remote model ran. The API key is `synthetic-key`.
- [The result](repro/installed/recorded/result.json), recorded September 8 at `21:13:33.816Z`, says Promptfoo 0.122.2, three evaluations, two local HTTP requests, zero live model calls, and zero API spend.
- The [fresh](repro/installed/recorded/built-in-fresh.json) and [cached](repro/installed/recorded/built-in-cached.json) summaries contain `output`, `tokenUsage`, `cached`, and `finishReason`. They omit the supplied citation list and annotations. The [cache entry](repro/installed/recorded/transport-cache-entry.json) retains the parsed response; the [custom summary](repro/installed/recorded/custom-capture.json) retains raw text and the supplied fields.
- The current script and input hashes match the original result: script `1a0232c16adaa138ee91ad4df227135eea7c6c97c9eac7b9efa1e7d43e110600`; input `d7b4e3d467bd9b87d623daa52f8bd1938b50e3fd42888c1b8b1a58c9f71d4ba2`. The original inputs and outputs remain unchanged.

## Supported finding and unsupported inference

The saved test supports an omission in Promptfoo's handling of the fields we supplied. It does not establish that a live OpenRouter response would contain those fields, that real OpenRouter citations were lost, or anything about a remote model's citation quality. The invented answer, annotation, and usage values are test inputs.

The published opening at `db54ff8` called this a controlled test without stating locally that the response was made up. The later method section disclosed it, but the opening could be read as a live-service finding. The earlier footprint revision had made the boundary explicit; the real-answer rewrite weakened it again. This was a misleading editorial regression.

## Correction

The opening, method, table label, diagram, and source labels now identify the local made-up response and explicitly state that no OpenRouter call occurred. The article also says that real OpenRouter citation loss was not established. The manuscript and draft social evidence notes agree. The real Codex/Claude results remain separate.

The exact challenge and subsequent rewrite request are appended to the prompt record. The original footprint remains frozen and excludes this work. Future reviews must read the first claim and every standalone visual without relying on a later methods caveat.

Release checks and live acceptance will be recorded after deployment. The broader article is being rebuilt under the [new brief](27-ai-citations-rewrite-brief.md).
