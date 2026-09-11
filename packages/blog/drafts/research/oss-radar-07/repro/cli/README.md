# Promptfoo with real subscription-backed CLI answers

Executed September 10, 2026 PDT / September 11 UTC. **Two real agent runs, no fixture answers.** This uses Promptfoo 0.122.2's custom-provider interface to call the official Codex and Claude Code CLIs under their saved subscription sign-ins.

| Client | Exposed model | Wall time | Emitted CLI events | Outcome |
|---|---|---:|---:|---|
| Codex CLI 0.153.4 | `gpt-6-astra` | 20.8 seconds | 7 | Answer retained through summary, library JSON, restarted CLI database export |
| Claude Code 2.1.260 | `claude-opus-5`; result also reports Haiku WebFetch summarization usage | 83.1 seconds | 41 | Answer retained through the same three paths |

Times are invocation intervals, not a speed benchmark. Each invocation can contain multiple model turns and tool calls. Codex emitted one web-tool operation; Claude emitted five WebFetch calls. No wrapper retry or answer resampling occurred. The initial two setup failures happened before either CLI launched: an empty test object was rejected, then a literal prompt containing a URL was interpreted as a file path. The accepted runner uses test metadata and a prompt function returning the unchanged question.

## Run

Use the exact dependency lock in [../installed](../installed/README.md), including optional platform dependencies. Install/authenticate the official CLIs yourself through their supported sign-in flow. No credential is copied into this repository.

```bash
ln -s ../installed/node_modules node_modules
node run.ts /absolute/path/to/a/new/private-capture-directory
```

The experiment was executed with the existing installed runtime at `/private/tmp/oss-radar-07-runtime`, Node 24.14.1, macOS arm64. `node_modules` is a local ignored symlink, not a committed dependency. A version guard was added after the first recorded run to reject installations other than 0.122.2; it changes no prompt, client settings, or capture fields.

The [provider](cli-provider.ts) supplies the exact [question](prompt.txt) through stdin and saves stdout/stderr before extracting the final answer. Its [runner](run.ts) verifies equality of the entire ProviderResponse through both export paths. These successful persistence checks do **not** assert answer correctness. [Separate source review](../../21-real-answer-source-review.md).

The wrapper disables Promptfoo telemetry/update fetches and removes provider API-key/endpoint overrides from the child environment. Each official CLI uses its normal network connection and saved login. The fetch guard is not OS isolation. Codex runs read-only with live web search; Claude runs in safe mode with WebFetch/WebSearch only. Each has an empty working directory and a seven-minute process timeout. No explicit model override is applied.

## What is retained

- Complete final answers: [Codex](recorded/codex-answer.md), [Claude](recorded/claude-answer.md).
- Selected emitted web-tool records: [Codex](recorded/codex-web-tools.json), [Claude](recorded/claude-web-tools.json). Claude's tool results are summaries, not original page HTML.
- Capture metadata, hashes, and reported usage: [Codex](recorded/codex-capture.json), [Claude](recorded/claude-capture.json).
- [Preservation result](recorded/result.json), [reviewer source copies and selection commitments](recorded/manifest.json).

Full private captures: `~/.local/share/gkoreli/analytics-evidence/oss-radar-07-cli-20260911-run03/`. It includes stdout/stderr, launch arguments, final answers, HTML snapshots, database, and all three result representations. The public records omit system/context/account data and reasoning; the private hash commitments are author-auditable, not public reconstruction of the private bytes.

Claude reports `total_cost_usd: 0.2654145`, with per-model `costBasis: list`. That is reported list-price usage, **not an observed account charge**. Codex emits token usage without a billed amount. No API credits were purchased and no invoice reconciliation was performed. Neither unknown charge nor subscription authentication means zero compute cost.

## Existing native providers

This wrapper is an experiment in preserving the emitted CLI record. Promptfoo already has native integrations: its [pinned Codex SDK provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openai/codex-sdk.ts) can use saved login and retains a serialized turn; its [Claude Agent SDK provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/claude-agent-sdk.ts) supports subscription login with `apiKeyRequired: false`, and retains the final result plus selected metadata. Those native routes were inspected, not executed here. The Codex SDK package was absent from this runtime; the installed Claude SDK was 0.3.234 and can use a different bundled executable. No category-wide omission claim follows from our OpenRouter fixture or CLI wrapper.
