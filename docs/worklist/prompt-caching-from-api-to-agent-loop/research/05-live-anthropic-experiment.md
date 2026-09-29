# Changing context on Sonnet 5.5: measured cache reuse

Run: 2026-09-29 05:59:24–06:00:02 UTC, September 28 in Los Angeles. Direct Anthropic Messages API, returned model `claude-sonnet-5-5`, standard service, reported global inference geography. Three serial repetitions of nine ordered cases. No automatic retries. All 27 requests completed normally.

## Result

Changing the early system policy caused zero cache reads. Expressing that change as a new system message preserved 7,870 cached input tokens. A middle edit preserved the earlier 5,371-token boundary. Returning to the original request restored its full 7,870-token hit: the intervening edit did not erase the old branch in this run.

| Case | Requests | Read tokens per request | Written tokens per request | Ordinary input | Mean estimated request cost | Median time to first text |
|---|---:|---:|---:|---:|---:|---:|
| Initial baseline | 3 | 0 | 7,870 | 13 | $0.019921 | 1.270 s |
| Identical repeat | 3 | 7,870 | 0 | 13 | $0.001820 | 1.214 s |
| Early system edit | 3 | 0 | 7,871 | 13 | $0.019934 | 1.432 s |
| Early edit repeated | 3 | 7,871 | 0 | 13 | $0.001830 | 1.312 s |
| Original branch revisited | 3 | 7,870 | 0 | 13 | $0.001820 | 1.209 s |
| Middle record edit | 3 | 5,371 | 2,499 | 13 | $0.007568 | 1.442 s |
| Middle edit repeated | 3 | 7,870 | 0 | 13 | $0.001820 | 1.304 s |
| Appended system update | 3 | 7,870 | 0 | 46 | $0.002486 | 1.761 s |
| Inline tool addition | 3 | 7,870 | 0 | 122 | $0.002038 | 1.289 s |

Reads/writes were identical across the three repetitions of each case. Output token counts differed for appended system updates. Every response contained the expected `currency` and record `code` fields, 27/27. This is a narrow synthetic instruction/retrieval check, not a coding benchmark or general correctness guarantee.

Total estimated spend: **$0.1777092**, including input, writes, reads, and output. This is computed from returned usage at checked list rates, not an invoice reconciliation. The user authorized up to $10; the script's plan reserve was $4.443756. The reserve treats every visible JSON byte as an input token plus a 20,000-token allowance per request, at the one-hour write rate, and reserves the full output cap. It is a deliberately conservative planning bound for this synthetic workload, not a universal tokenizer/billing bound.

## What ran

[Source](../lab/anthropic-cache-probe.py) and [sanitized results, all observations, ranges, and private receipt hashes](../lab/anthropic-results.json).

The prompt had a top-level system policy plus synthetic reference text, two user-content blocks of record data, and a final JSON request. Explicit five-minute cache markers ended the system block and each of the two record blocks. A non-deferred `lookup` tool was present from the beginning. `output_config.effort` was `low`, output capped at 512 tokens; thinking mode was left at the model default. No top-level automatic-cache control was set.

The first request asked for currency USD and `RECORD-137`. The early edit changed that policy to EUR inside the original system block. The middle edit changed `VALUE-137` to `REVISED-137` inside the second record block. The appended update retained the original prompt and added a system instruction to use EUR from that point onward. Each replicate had a different run/replicate identifier near the start to separate its prefix from the other replicates. Baseline usage confirmed a miss in each case.

The inline-tool case appended a new `lookup_extra` definition in a `tool_addition` block using `inline-tools-2026-09-15`. The response preserved the prefix and returned the requested JSON. The prompt explicitly forbade tool use, so this test establishes **request acceptance and cache reuse**, not execution or successful selection of the newly added tool. No tool actually ran.

All variants branch from the same synthetic input within a replicate. They do not append prior generated answers. This isolates request-representation effects; a long real agent session may behave differently.

## Measurement boundaries

- **Reported cache use:** observed in returned read/write counters. We cannot inspect Anthropic's physical tensor store.
- **Correctness:** two expected fields matched. We did not measure hallucination rates, instruction equivalence, security properties, or complex task success.
- **Timing:** wall-clock client measurements over separate HTTPS requests; first-text time includes transport, queuing, prefill, and any preceding hidden reasoning. No randomized order, controlled server load, or statistical speed claim. Cache-read cases can still be slower.
- **Retention:** all requests ran close together, well within five minutes. This does not validate TTL edges, eviction under load, concurrency, cross-session sharing, or another region.
- **Pricing:** $2 ordinary input, $2.50 five-minute writes, $4 one-hour writes, $0.20 reads, $10 output per million tokens. We requested only five-minute writes. [Checked pricing](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [Sonnet 5.5](https://platform.claude.com/docs/en/models/sonnet-5-5/overview).
- **Accounting:** Anthropic input buckets are disjoint: ordinary input + cache creation + cache reads. Cache-creation TTL subcounts are a breakdown, not more tokens to add. Output includes reported thinking tokens; they must not be added again.

The appended-system group was cheaper than rewriting the head, but its median first-text time was higher. Two responses spent extra tokens on thinking. This run supports an input-cost finding and a feasibility finding; it does not establish a latency improvement from appending the update.

## Reproduction and private evidence

The executable defaults to a dry run and never reads credentials in that mode. `--execute` requires a private output directory, reads only the API/workspace values it needs from `.env`, and records raw synthetic requests/SSE events there. It never writes credentials. The local raw directory is `/tmp/prompt-cache-api-20260928-run1`; preserve it or copy it to durable private storage before cleaning temporary files. Public results include SHA-256 receipts, synthetic expected/returned fields, normalized usage, and timestamps, with no account IDs, response IDs, headers, or credentials.

Before the measured run, two model-list requests returned HTTP 400 because the initially supplied key needed a workspace header. The user supplied `ANTHROPIC_WORKSPACE_ID`; a subsequent model-list request confirmed the requested model. These were discovery requests, not failed paid inference cases. The 27-request run encountered no errors.

Return to [the worklist](../README.md).
