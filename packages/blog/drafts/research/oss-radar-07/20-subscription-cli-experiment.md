# Real answers through subscription-backed CLIs

Protocol amendment recorded September 10, 2026 PDT / September 11 UTC, before submitting either question. This continues the [frozen directed preflight](12-directed-answer-preflight.md); the question and source-support rubric are unchanged.

The earlier browser failure did not exhaust the available routes. Goga explicitly requested using his ChatGPT or Claude Code subscription for real experiments. Local checks found Codex CLI 0.153.4 signed in with ChatGPT and Claude Code 2.1.260 signed in with a Claude subscription. No API-key environment variables were present. The wrapper also removes provider API-key and endpoint overrides from the child environment.

## Frozen execution conditions

- One fresh official CLI invocation per client, sequentially, using the exact question in [prompt.txt](repro/cli/prompt.txt). No wrapper retries or favorable resampling. Internal model turns, fetches, and CLI retries are separate from these two invocations.
- Promptfoo 0.122.2, the previously installed lock, Node 24.14.1, macOS arm64. No runner version upgrade.
- Codex: `codex exec`, saved ChatGPT sign-in, read-only sandbox, ignored user config, live web search enabled, approval policy never, a new empty working directory. No explicit model override; retain the exposed actual model.
- Claude: `claude -p`, saved subscription sign-in, safe mode, only WebFetch and WebSearch available and allowed, no custom MCP servers, a new empty working directory. No explicit model override; retain the exposed actual model.
- Seven-minute process timeout per invocation. No API purchase, paid fallback, or separate model grader.
- Save a private HTML source snapshot before either submission; do not supply it or the rubric to the clients. Save stdout JSONL, stderr, exact prompt, final answer, invocation settings, timestamps, and hashes. These are CLI records, not original service HTTP responses.
- Invoke each CLI from a Promptfoo custom provider. Retain stdout in `raw`, final answer in `output`, and capture facts in `metadata`. Check exact response equality through the summary, library JSON export, and a separately started CLI export from the database.
- Review actual claims and their citations afterward using the frozen supported/unsupported/unverifiable rules. A Promptfoo run with no grading assertion is a capture result, not an accuracy score.

## Why the subscriptions are usable

[OpenAI documents ChatGPT subscription sign-in for local Codex](https://developers.openai.com/codex/auth/) and [saved authentication in non-interactive execution](https://developers.openai.com/codex/noninteractive/). [Anthropic's June 15 update](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) says the proposed Agent SDK billing change was paused and `claude -p` continues to draw on subscription limits. These official pages were checked September 11 UTC. Authentication is performed by each official CLI; no subscription credential is extracted or sent to a third-party endpoint.

The CLIs' exposed usage and cost fields are not invoices. Record them as reported; do not call the experiment free or infer an account charge. A subscription-backed coding-agent answer also does not measure the ChatGPT or Claude consumer web product.

## Results

Both runs completed on the first CLI invocation. Codex ran from 04:06:13.772 to 04:06:34.581 UTC; Claude from 04:06:35.189 to 04:07:58.293 UTC. Both returned answers and passed exact response equality through the summary, library exporter, and restarted CLI database export. [Method and records](repro/cli/README.md).

The [source review](21-real-answer-source-review.md) finds three material errors in Claude's answer, including changing the 277 reclassified population into 277 cloud-classified requests. The saved tool record also exposes an intermediate time-window error that the final answer corrected. These are actual answer and extraction observations, not simulated API responses. Codex's eight reviewed claim groups retained the source's units and limits.

Two wrapper setup failures preceded generation; neither launched a model client. The accepted run made one invocation per CLI, without a wrapper retry or resampling. The public artifact records the setup repair as well as the actual result.

## Editorial correction and accounting

Goga also requested removing internal planning language and consolidating the duplicate reference/glossary material. The OSS Radar skill was reread with its project-deep-dive and TypeScript references. The article's conclusion should judge the product for the reader; open experiments belong in the worklist. Source definitions and source rationales belong in one reference section.

The earlier [fixture-only publication decision](17-publication-decision.md) is historical. It did not satisfy the requested real-answer experiment. Browser access was unavailable, but supported subscription-backed CLI routes existed. This experiment closes that specific gap without claiming that the larger citation-frequency study or production analytics integration is complete.

The [earlier research footprint](19-research-footprint.md) remains frozen. These new runs, follow-up reviews, and two additional human prompts are outside its measured cutoff. The prompt page now contains seventeen messages; the original footprint snapshot covered fifteen.
