# Bun 1.4 research-footprint reset audit

Audit triggered by the author's challenge to the published session and token totals.

## Decision

The published `73.3M` total, and the later `77.3M` refresh produced by the same method, were incorrect. The recursive
thread closure included every linked research subagent, but the root session's cumulative token counter reset once
after context compaction. The version-1 script selected only the last post-reset cumulative record and omitted the
complete first accounting epoch.

The repair partitions each session's cumulative `token_count` records into monotonic epochs whenever `total_tokens`
decreases. It selects only the final cumulative object from each epoch, verifies its arithmetic, and sums those epoch
ends. It still never sums `last_token_usage` or every cumulative record.

## Reset evidence

Root session: `01a04082-e0c4-7701-9cf4-3d32898f5773`.

| Event | Log line | Timestamp | Total | Input | Cached input | Output | Reasoning output |
|---|---:|---|---:|---:|---:|---:|---:|
| First epoch end | 1477 | 2026-08-27T00:53:08.334Z | 29,649,422 | 29,567,086 | 29,022,720 | 82,336 | 32,526 |
| Counter reset | 1495 | 2026-08-27T03:42:52.304Z | 202,112 | 201,705 | 11,008 | 407 | 237 |

The drop from 29,649,422 to 202,112 cannot be cumulative session usage. Treating the final record as the full session
therefore undercounts the root by exactly the complete first epoch.

## Recursive session closure

The linked tree contains four persistent sessions:

1. `/root`
2. `/root/bun_release_code`
3. `/root/bun_product_theory`
4. `/root/bun_red_team`

The three research agents handled several tasks and follow-up turns inside those same session IDs. Task count is not
session count. No linked grandchildren exist under `source.subagent.thread_spawn.parent_thread_id`.

The three child sessions were monotonic: their final cumulative records are valid one-epoch totals. Only the root log
contained a counter decrease.

## Automatic guardian sessions

Four additional logs appeared in the same working directory and time window with
`source.subagent.other = "guardian"`:

| Session | Cumulative tokens |
|---|---:|
| `01a04085-bb9f-7ee2-a34a-5733c15c43dc` | 460,176 |
| `01a04085-df03-79a3-9a5f-6a714a0cdbf7` | 62,416 |
| `01a04085-f5ed-76b3-8026-52cdb2e8293e` | 86,564 |
| `01a04089-a7a2-7341-81b0-c9b6a19f3287` | 347,428 |

Guardian total: **956,584 tokens**.

These records contain no `parent_thread_id`. The publication's deterministic rule excludes sessions outside the
recursive thread-spawn tree unless a manifest explicitly names them. They remain excluded from the headline total;
this audit discloses them rather than silently inferring ownership from timestamps or working directory. The total is
therefore **article research-session usage**, not every internal product-side token associated with running Codex.

## Method change

- `packages/blog/scripts/research-footprint.ts` rules version moves from 1 to 2.
- Every selected session now reports `usageEpochCount` and all selected epoch-end lines, values, and prefix hashes.
- `AGENTS.md` now defines counter-reset handling and requires known unlinked guardian sessions to be disclosed.
- The final corrected totals live in `research-footprint.json` and the article frontmatter after the repaired artifact
  set is committed and frozen.

