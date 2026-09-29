# Research Footprint Accounting

Read only when measuring, freezing, publishing, or auditing a research footprint. The scripts own extraction; this reference owns the accounting contract.

### Research Footprint Accounting

Research-heavy collaborative posts may publish a `researchFootprint` beside their raw prompts. This is provenance, not a quality badge. The compact article header may show the measured token total; the transparency page must show human prompts, sessions, committed artifacts, wall-clock window, token breakdown, methodology, limitations, and the public research directory.

Use `packages/blog/scripts/research-footprint.ts` for Codex cumulative logs and for Claude Code transcripts (`--claude-transcript <~/.claude/projects/<project>/<sessionId>.jsonl>`; the script includes that session's `subagents/agent-*.jsonl` logs itself, counts one usage per API `message.id` because Claude Code repeats a message's usage on every content-block record, and reads reasoning from `output_tokens_details.thinking_tokens`). Use `packages/blog/scripts/omp-research-footprint.ts` for OMP per-response logs. Shared types, schemas and helpers live in `packages/blog/scripts/research-footprint.models.ts`. Never hand-count sessions or mix cumulative and per-response usage models, and do not write a new footprint script for a log format the existing ones already read.

Deterministic rule:

1. Identify the root Codex thread ID for the article session and any explicitly attributed additional sources.
2. Scan the configured Codex session-log root and parse every `session_meta` record.
3. Starting with the root thread, compute the **recursive descendant closure** through `source.subagent.thread_spawn.parent_thread_id`. Include children, grandchildren, and deeper descendants. Do not stop at direct fan-out.
4. For each included session, read every valid `event_msg` whose payload type is `token_count` and use only cumulative `info.total_token_usage` objects. Partition the records into monotonic epochs whenever `total_tokens` decreases, which can happen after compaction or a counter reset. Select the final cumulative object from each epoch. Never sum `last_token_usage` records or every cumulative record.
5. Verify every selected epoch: `total_tokens = input_tokens + output_tokens`; `cached_input_tokens <= input_tokens`; `reasoning_output_tokens <= output_tokens`. Record each reset and epoch boundary; a no-reset session has one epoch and remains equivalent to selecting its final cumulative record.
6. Sum the selected epoch-end cumulative fields within each session, then sum each session once across the included tree. Cached input is a subset of input, and reasoning output is a subset of output; neither is added again to total. Derive non-cached input as `input - cached input`.
7. Count prompts with the same `---` delimiter rule as `parsePrompts()`. Report both Markdown files present in the declared research directory and files present in `HEAD`. Copy the committed count into public frontmatter only when both counts match; otherwise the provenance set is not yet releasable.
8. Define `startedAt` from the root session metadata (the earliest included start for multiple sources), `measuredAt` as the latest selected usage event, and wall-clock minutes as the ceiling of that interval. Wall-clock time is not human hands-on time.
9. Freeze immediately before the release commit. The script emits every included session ID, parent ID, agent path, selected epoch-end lines and values, reset count, and SHA-256 commitments to the log prefixes through those records. Save that manifest in the research artifact before copying totals into frontmatter.
10. If work ran outside the root thread tree—for example an independent `codex exec` process or an automatic guardian session whose metadata has no parent-thread link—include it only through an explicit additional `--root-thread` supported by the existing extractor, with task or launch evidence connecting it to the article. The extractor rejects overlapping root closures. Disclose every such inclusion or known exclusion; never infer ownership from timestamp or working directory. Reusing a published source does not automatically import its sessions.
11. When contributing sessions also appear in another article's footprint, keep the earlier manifest frozen and disclose the shared session IDs and usage boundaries. Whole-session measurements may include shared engineering, publication, and bookkeeping. Describe that scope; do not present the total or a difference between snapshots as an exclusive writing cost. Do not add article totals without deduplicating their overlapping prefixes.

OMP session rule:

1. Pass the exact root `.jsonl` log. Include that root plus every child `.jsonl` in its same-named agent directory; do not infer siblings from timestamp or working directory. A separate root session is excluded.
2. Parse each assistant message with an OMP `usage` object exactly once. OMP input excludes cached/cache-write tokens, so normalize public input as `input + cacheRead + cacheWrite`; cached input remains a subset of public input.
3. Verify each response: `totalTokens = input + cacheRead + cacheWrite + output`; `reasoningTokens <= output`. Sum response usage within each session, then sum each included session once.
4. Read `startedAt`, session ID, and cwd from the first `session` record. Use the latest included assistant usage timestamp as `measuredAt`.
5. Count prompts with the normal `---` delimiter. Count artifacts from an explicit manifest of repository-relative paths, and require every listed path to exist in `HEAD` before copying the count to frontmatter.
6. Freeze immediately before the release commit. Record each root/child session ID, parent ID, agent name, response count, last usage line/time, normalized totals, and SHA-256 commitment to the private log prefix.

Example:

```bash
pnpm -C packages/blog exec tsx scripts/research-footprint.ts \
  --root-thread <root-thread-id> \
  --research-dir drafts/research/<article> \
  --prompts-file prompts/<slug>.prompts.md
```

```bash
pnpm -C packages/blog exec tsx scripts/omp-research-footprint.ts \
  --root-log <root-session.jsonl> \
  --research-dir drafts/research/<article> \
  --prompts-file prompts/<slug>.prompts.md \
  --artifacts-file drafts/research/<article>/artifacts.txt \
  --output drafts/research/<article>/research-footprint.json
```

Trust boundary: session logs contain private conversation and system context and are not committed. The public manifest and prefix hashes make the accounting reproducible by the author and commit to the exact private log prefixes used, but readers cannot independently reconstruct the token totals without those logs. Say this plainly; “auditable by the author with integrity commitments” is accurate, while “publicly verifiable” is not.
