# interp-engine research footprint

This manifest measures the research sessions behind OSS Radar #06. It joins eight independent Codex roots with the
Claude Code session that launched and coordinated them. The headline total covers 14 sessions: eight Codex roots, one
Claude root, and five Claude subagent transcripts.

## Freeze

| Field | Value |
|---|---:|
| Started | `2026-09-02T03:42:21.704Z` |
| Measured | `2026-09-02T06:05:20.659Z` |
| Wall clock | 143 minutes |
| Sessions | 14 |
| Human prompts | 0 |
| Committed Markdown research artifacts | 11 |
| Input tokens | 135,031,648 |
| Cached input tokens | 130,725,478 |
| Cache-creation input tokens | 1,103,065 |
| Output tokens | 550,714 |
| Reasoning output tokens | 109,660 |
| Total tokens | 135,582,362 |

Cached input is part of input. Reasoning output is part of output. Neither is added again to the total. Wall clock runs
from the earliest included session timestamp to the script's freeze time; it is not a measure of human hands-on time.

## Per-root accounting

| Source | Root | Sessions | Epochs | Resets | Total tokens |
|---|---|---:|---:|---:|---:|
| Codex · audit | `01a06058-2dbb-70b2-b8db-d6a6d1c638ce` | 1 | 1 | 0 | 11,188,878 |
| Codex · theory | `01a06058-2dc6-7521-b057-624fd6fdaeb3` | 1 | 1 | 0 | 13,019,342 |
| Codex · adoption | `01a06058-2e13-7732-b7ed-dd20d70eecec` | 1 | 1 | 0 | 6,835,141 |
| Codex · reproduction | `01a06058-2e30-75d1-acc1-187da5ed6254` | 1 | 1 | 0 | 7,363,241 |
| Codex · hero | `01a0605b-e126-7943-abdd-a9c76aff9368` | 1 | 1 | 0 | 11,711,451 |
| Codex · hero revision | `01a06075-0893-7020-95bc-92ffc4cc735a` | 1 | 1 | 0 | 1,347,092 |
| Codex · fact-check | `01a06080-e3fa-7d73-a025-794372ca37d5` | 1 | 1 | 0 | 7,089,038 |
| Codex · split revision | `01a06089-fe32-7c33-a073-376797e808c5` | 1 | 1 | 0 | 4,027,291 |
| Claude · root plus Agent workers | `7fed1700-9c71-4dfb-9eb3-c8a61c669103` | 6 | 0 | 0 | 73,000,888 |

The script walked the recursive descendant closure for every Codex root. None of these eight roots had a linked
descendant, so each closure contains one session. Every Codex session stayed monotonic and contributed one cumulative
epoch end.

## Claude transcript accounting

The Claude project directory contains the root transcript and five child logs under its same-named `subagents/`
directory. The script includes all six. It does not infer sibling roots from timestamps or working directories.

Claude Code logs one API message across several JSONL records as its content blocks arrive. The script groups those
records by `message.id`, verifies stable input fields and non-decreasing output, then counts the final usage object once.
Across the six logs it counted 275 unique assistant messages and ignored 624 earlier duplicate or partial records.

For each message:

- `inputTokens = input_tokens + cache_read_input_tokens + cache_creation_input_tokens`
- `cachedInputTokens = cache_read_input_tokens`
- `cacheWriteInputTokens = cache_creation_input_tokens`
- `outputTokens = output_tokens`
- `totalTokens = inputTokens + outputTokens`
- `reasoningOutputTokens = 0`

Claude transcripts do not expose reasoning tokens as a separate usage field. The zero records that limitation; it does
not claim that the model used no hidden reasoning. The five task notifications also reported `subagent_tokens` totals.
Those notification values are not added because the child transcripts exist and provide the per-message accounting;
adding both would count the same work twice.

## Artifacts and prompts

The research directory contains 11 committed Markdown files after this note. The manifest counts only those top-level
Markdown artifacts. The committed `repro/` directory contains ten more files that stay outside the headline artifact
count: three JSON results, four Python scripts, and three text logs.

OSS Radar issues publish research evidence rather than a raw-prompt page. The command therefore uses `/dev/null` as an
empty prompt input, and the normal `---` delimiter rule returns `promptCount: 0`.

## Exclusions

The footprint worker that produced this measurement is the independent Codex root
`01a060a4-2f48-76f1-9fbd-86590f85d06d`. It is excluded because it measures and packages the earlier research; it did
not produce issue #06's research or article. Every other Codex root outside the eight explicit `--root-thread` values is
also excluded. The script does not guess ownership from a shared date, cwd, or launch window.

The included Claude root is a coarser boundary. Its measured prefix contains the issue-selection, research,
coordination, editing, and worker-launch messages recorded in that one Claude session. The separately launched Codex
work is limited to the eight named roots, so the excluded footprint worker's Codex usage is not in the headline total.

## Exact command

Run from the repository root:

```bash
pnpm -C packages/blog exec tsx scripts/research-footprint.ts \
  --sessions-root /Users/goga/.codex/sessions/2026/09/01 \
  --root-thread 01a06058-2dbb-70b2-b8db-d6a6d1c638ce \
  --root-thread 01a06058-2dc6-7521-b057-624fd6fdaeb3 \
  --root-thread 01a06058-2e13-7732-b7ed-dd20d70eecec \
  --root-thread 01a06058-2e30-75d1-acc1-187da5ed6254 \
  --root-thread 01a0605b-e126-7943-abdd-a9c76aff9368 \
  --root-thread 01a06075-0893-7020-95bc-92ffc4cc735a \
  --root-thread 01a06080-e3fa-7d73-a025-794372ca37d5 \
  --root-thread 01a06089-fe32-7c33-a073-376797e808c5 \
  --claude-transcript /Users/goga/.claude/projects/-Users-goga-Documents-goga-blog/7fed1700-9c71-4dfb-9eb3-c8a61c669103.jsonl \
  --research-dir drafts/research/interp-engine \
  --prompts-file /dev/null \
  > packages/blog/drafts/research/interp-engine/research-footprint.json
```

## Trust boundary

The Codex and Claude logs remain private and uncommitted. The public manifest records the selected session IDs, usage
records, epoch ends, normalized totals, and SHA-256 commitments to the private log prefixes used. The script hashes raw
bytes through each recorded JSONL line, including logs with multibyte text. The author can audit the totals against
those private logs. Readers can inspect the accounting method and integrity commitments, but they cannot reconstruct
the totals without the logs.
