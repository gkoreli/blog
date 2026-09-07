# Article 024 research footprint: scope and accounting

Reconciled September 6, 2026 PDT / September 7 UTC. The exact frozen totals and session boundaries are in [research-footprint.json](research-footprint.json). The [article's transparency page](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript/prompts#research-footprint) presents the totals beside the human prompts.

This measures the complete contributing sessions through the recorded usage boundaries. They contain original research, implementation, evidence collection, corrections, publication, and footprint accounting. They also contain shared analytics work: agent representations and citations, the next counter-calibration study, and referral-policy engineering. There is no defensible per-token allocation between those activities. The total is therefore a footprint of these contributing sessions, not an exclusive writing cost for article 024. It must not be added to other article footprints without checking their session IDs and boundaries for overlap.

## Included sources and ownership evidence

The existing extractor accepts multiple explicit Codex roots and Claude transcripts. These sources were identified by their actual tasks and preserved launch records, not by matching a directory or nearby timestamp. Recursive descendants belong to their source and are counted once.

| Root source | Session ID | Evidence for inclusion |
|---|---|---|
| Original Claude Code session | `02de2c8a-ff5d-41f1-8ec2-7a78e21985e7` | Its opening human message matches the original daily-client complaint preserved in the prompts. It creates the readers-versus-bots research, article, classification implementation, and related agent-access work. Includes its own subagent logs. |
| Browser-evidence Codex worker | `01a0648f-0eef-7dc1-8fcc-4f3e830f049b` | The original Claude transcript launches this named worker. Its runner log records this session ID on line 10, and its exact saved task prompt matches the Codex transcript on line 9. |
| Agent-native-reading Codex worker | `01a06543-7324-7450-8dfb-3b80054d91aa` | The same preserved launch, runner ID, and exact task-prompt match connect this independent worker to the original session. |
| Agent-identity Codex worker | `01a06542-4c54-73e3-bc09-5607ee581a99` | The same preserved launch, runner ID, and exact task-prompt match connect this independent worker to the original session. |
| Article revision and publication | `01a0743e-3475-70d2-a6a4-58772d6c746a` | Opens with the author's request to investigate published article 024. Contains the later production inspection, article corrections, local repair trials, publication checks, footprint reconciliation, and title decision. |
| Parallel analytics investigation | `01a0744b-0295-76b0-8660-ed4695a74dc1` | Begins with the request to ground the next analytics iteration in evidence. Produces the extractor, claims ledger, prior-art plan, and subsequent referral work in this research directory. Its linked descendants include the Matomo-source and referral-design reviews. |

The three original Codex workers have `source: exec` and no parent-thread link to Claude. They are explicitly listed as roots; relying only on a Codex descendant closure would omit them. The full manifest records every included session, its source, parent, agent path, selected usage lines, and SHA-256 prefix commitment.

## Exclusions and interpretation limits

- Article 023's separate Claude session, `c4b4024b-bce0-4186-9977-c402bd7308c1`, has its own published footprint. Article 024 cites that fetcher study, but citing another article does not import its computation into this total. The older analytics and `llms.txt` studies are likewise separate work.
- No OMP root was attributed to this article. The original session is a Claude Code transcript, so the OMP per-response parser is not used here.
- Two attempted detached referral reviewers, named `upstream` and `domain`, left empty runner logs and no reports in the parallel investigation. Searching for their exact task text did not locate attributable worker sessions in the configured September 5–6 Codex logs. Their contribution cannot be measured from that evidence and is excluded; it is not asserted to be zero. The later reviews with parent-linked session metadata are included.
- Unknown, deleted, remote, or unlinked sessions cannot be inferred into the total. Usage after each selected record is outside this frozen release, including subsequent deployment checks and continued work in these roots.
- Session input includes repeated context, system instructions, tool results, and cached reads. Cached input is part of input, and reasoning is part of output. The total is neither unique text produced nor evidence of article quality, cost, electricity use, or environmental impact.

## Accounting method

[`research-footprint.ts`](../../../scripts/research-footprint.ts) and its [shared models](../../../scripts/research-footprint.models.ts) perform the accounting. No parallel parser or manual session total was introduced.

For Codex, the script scans the configured session-log root, parses session metadata, and computes each explicit root's recursive descendant closure. It rejects overlapping closures. It partitions cumulative `total_token_usage` records when `total_tokens` decreases, then sums the final cumulative object in each epoch. It never sums every cumulative record or uses `last_token_usage` as cumulative evidence.

For Claude Code, the script includes the exact root transcript and its subagent log directory. It counts one usage object per API `message.id`, deduplicating repeated content-block records. Public input is uncached input plus cache-read and cache-creation input. Reasoning comes from `output_tokens_details.thinking_tokens` when recorded; this is recorded reasoning, not a claim that every model exposes its internal computation.

Selected usage must satisfy `total = input + output`, `cached input <= input`, and `reasoning <= output`. Session totals are summed once. The JSON preserves source totals, epoch boundaries, reset counts, Claude response and duplicate-record counts, and log-prefix hashes.

Rules version 4 corrects the existing version-3 timestamp convention to match the repository's accounting rule: `measuredAt` is the latest included usage timestamp, while `frozenAt` separately records manifest generation. `startedAt` is the earliest included session start. Wall-clock minutes are the ceiling of the elapsed interval; gaps between sessions are included and human hands-on time is unknown. A mixed-log regression fixture checks recursive descendants, an independent root, a counter reset, duplicate Claude usage, unrelated-session exclusion, artifact counts, and the distinction between the usage window and the later freeze.

Human prompts use the same `---` delimiter as the published prompts parser. The artifact count is Markdown files in this research directory, including its index and accounting notes; it excludes JSON, SQL, source code, and research directories for other articles. All counted Markdown files must exist both locally and in `HEAD` before their count enters frontmatter. The JSON manifest provides both counts. The new notes and exact human prompts are committed before the final freeze; the manifest and frontmatter then ship together.

## Reproduction and trust boundary

From the repository root, using the author's private logs:

```bash
pnpm -C packages/blog exec tsx scripts/research-footprint.ts \
  --root-thread 01a0743e-3475-70d2-a6a4-58772d6c746a \
  --root-thread 01a0744b-0295-76b0-8660-ed4695a74dc1 \
  --root-thread 01a0648f-0eef-7dc1-8fcc-4f3e830f049b \
  --root-thread 01a06543-7324-7450-8dfb-3b80054d91aa \
  --root-thread 01a06542-4c54-73e3-bc09-5607ee581a99 \
  --claude-transcript "$HOME/.claude/projects/-Users-goga-Documents-goga-blog/02de2c8a-ff5d-41f1-8ec2-7a78e21985e7.jsonl" \
  --research-dir drafts/research/readers-vs-bots \
  --prompts-file prompts/how-i-separate-readers-from-bots-without-javascript.prompts.md
```

Running this later against growing logs produces a later measurement. To reproduce the frozen tokens, use private copies of the included logs ending at the manifest's selected lines and verify the recorded prefix hashes. Preserve their session/subagent directory relationships and use the artifact and prompt set from this release. `frozenAt` will differ on a later run; the committed manifest remains the release record.

Private logs contain conversation and system context and are not published. The manifest makes the total **auditable by the author with integrity commitments**. Readers can inspect the public research artifacts and methodology, but cannot independently reconstruct the token total without the private logs. The prompts are selected complete human messages that shaped this article; they are not a public dump of every included session.

## Release checks

Before the freeze, all 20 blog tests passed, including the mixed-session accounting fixture. Blog and Worker typechecks, strict standalone checks of the extractor and its regression test, the 24-post production build, local research links, and whitespace checks passed. The generated sharing image was visually inspected with the new title. The final release must additionally match the manifest to frontmatter and rendered transparency values, verify all private-prefix commitments, and check the live article after pushing.

**Released and verified:** commit `789de70` was pushed to `main`. The frozen manifest records 192,964,421 tokens, 27 sessions, 41 human prompts, and 21 committed Markdown artifacts. Local and committed artifact counts match; the additional referral-activation note entered through commit `e1aa4a3` before the freeze. Every selected session prefix and Codex epoch prefix matched its private-log SHA-256 commitment. The measurement ends at `2026-09-07T00:35:59.352Z`; the manifest was frozen at `2026-09-07T00:36:19.071Z`.

The final 24-post build passed. Frontmatter, generated HTML, prompt counts and scope, canonical URL, Markdown, CSL-JSON, BibTeX, and the original RSS publication date agree. Cloudflare reports version `6fa89c91-20b4-448f-8e72-64458d5dc309` at 100%, with deployment creation at `2026-09-07T00:39:56.650Z`. Subsequent HTTP checks returned the new article and search titles, footprint, methodology, dates, and limitations. The public GitHub manifest exactly matched the committed file, and the live sharing PNG matched the locally inspected image by SHA-256. Interactive browser inspection was unavailable; the page checks used generated and live HTML. Release verification and this receipt are after the frozen usage boundary and do not change the token total.
