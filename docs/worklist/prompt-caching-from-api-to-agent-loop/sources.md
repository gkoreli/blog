# Initial source register

Started 2026-09-28. These are research entry points, not a completed claim audit. Recheck dates and versions when using them. Repository landing pages establish identity; they do not establish cache implementation behavior.

## Opened during worklist setup

| Source | Why it matters | Next step |
|---|---|---|
| [OpenAI prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching) | Official API contract and links to diagnostics | Extract current endpoint/model controls, matching rules, retention, and usage fields |
| [Anthropic prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) | Documents both request-level automatic caching and explicit content-block breakpoints | Compare opt-in semantics, ordering, thresholds, retention, billing, and hosting exceptions |
| [Gemini context caching](https://ai.google.dev/gemini-api/docs/caching) | Official context-caching entry point | Extract implicit/explicit behavior, cached-content lifecycle, usage, and storage billing |
| [Pi](https://github.com/earendil-works/pi) | The opened `badlogic/pi-mono` URL redirected here | Pin identity and revision before tracing providers and the coding-agent package |
| [Oh My Pi](https://github.com/can1357/oh-my-pi) | Repository documents the `omp` command and Pi ancestry | Audit this implementation separately from Pi and other forks |
| [OpenCode](https://github.com/anomalyco/opencode) | Canonical candidate for the requested harness | Pin revision and identify provider transforms and SDK versions |
| [Claude Code repository](https://github.com/anthropics/claude-code) | Public project entry point links official product docs | Inspect license and available source; document the boundary of any internals claim |

The Anthropic page is already a reason to avoid a simplistic “OpenAI automatic, Anthropic manual” comparison. Describe the exact activation and placement semantics at the time of research, then inspect what a harness actually sends. This is a documentation finding, not a measured result.

## Discovery queue

Locate and open official documentation before adding claims for DeepSeek, OpenRouter, Azure OpenAI, Bedrock, Vertex AI, and any additional inference provider selected in the worklist. Record the exact hosting route; support on one route does not establish support on another.

Locate and pin the public Codex CLI source, then examine official Codex/API documentation for the relevant request path. Resolve the canonical repositories and source/license coverage for Aider, Cline, Gemini CLI, Goose, and OpenHands before selecting additional comparisons.

For serving mechanics, select primary vLLM or SGLang documentation and pinned implementation code. Add the original attention or serving papers only where they support a specific explanation. Do not use an open implementation as evidence for undisclosed hosted-provider internals.

## Evidence record for the next pass

For each substantive finding, record the claim, source URL or commit permalink, access date, source version/date, model/endpoint/configuration, evidence class, relevant excerpt or symbol, and limits. Record contradictory documentation or observed behavior beside the claim. Leave unpublished or inaccessible behavior unknown.

Return to [the worklist](README.md).
