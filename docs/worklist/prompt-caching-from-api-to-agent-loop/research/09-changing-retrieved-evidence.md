# Correcting a source can be cheaper than preserving its cache

Measured September 29, 2026 at 06:55–06:56 UTC; September 28 in Los Angeles.

A harness has retrieved an inventory snapshot. The model has already answered from it. A fresh snapshot arrives with a different price and quantity. Should the harness replace the old source, append the new one, or keep the old answer as part of the conversation?

We tested all three choices against Sonnet 5.5. Appending the correction reused more cached tokens, but replacing the short source and dropping the obsolete answer cost less. The replacement kept the long background prefix intact and rewrote only 76 tokens. The append retained the old question and answer, then added the correction: 290 newly cached tokens.

That is a useful limit on “preserve as much cache as possible.” The amount of history retained and the location of the edit matter too.

## The same question, two source versions

The fixture contains a long, unchanged system block and one small inventory record. The system block includes explicit rules: use the highest source revision, treat assistant answers as derived summaries, and recompute arithmetic from the current source. Most of its length is synthetic background included to pass the cache threshold. This is a deliberately simple test with a clear correction rule.

```text
Version 1
source_id=inventory:v1; revision=1
SKU-PINE: unit_price_usd=17; units=6

Version 2
source_id=inventory:v2; revision=2
SKU-PINE: unit_price_usd=23; units=9
```

The first request asks for the current price, quantity, total, source identifier, and whether an earlier assistant answer conflicts with the current source. It returns this actual answer in both repetitions:

```json
{"unit_price_usd":17,"units":6,"total_usd":102,"source_id":"inventory:v1","stale_assistant_answer_present":false}
```

The script saves the entire returned assistant content array. The two branches that keep the old answer replay that array unchanged. No replacement text is invented on the assistant's behalf. This run returned text only, with zero reported thinking tokens; the script would also preserve other returned blocks without editing their signatures.

Each repetition then sends three branches:

| Request | Evidence sent | Old generated answer sent? | Correct current total |
|---|---|---|---:|
| Original | Version 1 | No | $102 |
| Replace and drop answer | Version 2 replaces version 1 | No | $207 |
| Append and keep answer | Version 1 remains; version 2 is appended with an explicit correction | Yes | $207 |
| Replace and keep answer | Version 2 replaces version 1 | Yes, still stating $102 | $207 |

These are different ways to construct a request. They deliberately differ in both source placement and retained conversation. They do not isolate a single variable such as the word “supersedes.”

## What the cache counters showed

We placed five-minute cache markers after the stable system block and after the retrieved source. The append branch also marked the new correction. The final question was unmarked. Anthropic documents these markers as boundaries for a full prompt prefix, so a marker before the changing source gives the provider an unchanged prefix to reuse. [Prompt caching documentation](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).

Each row below ran twice. Token counts and estimated costs were identical across the two repetitions.

| Request | Cached tokens read | Tokens written to cache | Ordinary input tokens | Output tokens | Estimated full request cost |
|---|---:|---:|---:|---:|---:|
| Original, cold | 0 | 3,586 | 116 | 54 | $0.0097370 |
| Replace and drop answer | 3,510 | 76 | 116 | 54 | $0.0016640 |
| Append and keep answer | 3,586 | 290 | 116 | 54 | $0.0022142 |
| Replace and keep answer, **already warm** | 3,586 | 0 | 284 | 54 | $0.0018252 |

The first replacement reads the 3,510-token stable prefix. The write through its new source boundary contains 76 tokens, including the provider’s input formatting. The append branch reads 76 more cached tokens, because it retains version 1, but writes 290 new tokens for the remaining conversation and correction. It costs about **33% more than the first replacement** in this fixture. Both produce the same current price, quantity, total, and source identifier.

That difference is small in dollars and specific to this layout. A much longer source, an earlier edit, a different checkpoint, or many later turns could change the comparison. Appending also leaves more tokens in the request, which matters when the context window fills. A cache hit reduces the price of reading retained text; it does not remove that text from the model's input.

The final row needs care. The first replacement has already written the version 2 prefix, so the last request can read it. Its high hit count does **not** show that changing the source somehow preserved the old source's cache. It reuses the new branch created two requests earlier. All branches ran within seconds of one another, with no eviction or expiry test.

A useful way to read the append and replace costs is:

```text
Replace and drop answer:
  read stable background + write short corrected source + read question + produce answer

Append and keep answer:
  read stable background and old source
  + write old question, old answer, and correction
  + read question + produce answer
```

Here “read question” means ordinary input processing and billing. Only the explicitly counted cache reads receive the cache-read rate.

## The old answer is a separate thing to manage

Replacing a retrieved source does not automatically edit the assistant's previous answer. The last branch intentionally contains an inconsistent transcript: its first user message now contains version 2, but the retained assistant answer still gives the values from version 1.

The model corrected its answer and identified the stale assistant answer in both repetitions. The append branch did the same. Across all eight requests, every checked field matched: current price, quantity, computed total, exact source identifier, and the stale-answer flag. We found **no answer failure in this fixture**.

This result supports a narrow claim: with these explicit source-precedence instructions and this small record, the model handled a stale derived answer correctly. It does not show that arbitrary summaries, plans, code edits, or tool outputs will remain correct after their supporting evidence changes. Those artifacts can contain facts copied from the old source, and a provider's cache cannot decide which copies the harness intended to invalidate.

For a harness, it helps to distinguish three objects:

1. **The source version:** the retrieved record or file contents used as evidence.
2. **The derived work:** an assistant answer, summary, plan, or proposed action based on that version.
3. **The model's reusable computation:** the cached prefix for the request that contained those objects.

Changing the first object can make the second obsolete. Whether the third remains reusable depends on the request's unchanged prefix. These are different questions. The experiment measures the third with API counters and checks five fields in the new answer; it does not test a complete dependency-tracking system for derived work.

A practical design could attach source identifiers and revisions to stored summaries, then regenerate or explicitly invalidate summaries whose inputs changed. That is a proposed harness design, not something this experiment implemented. The request-construction examples here show why that information would be useful.

## Correction and deletion have different requirements

The append request keeps version 1 in the context. It tells the model that version 2 takes precedence. That can express a correction, but it does not remove the old values from the request.

Even the replace-and-keep-answer request still contains the old values in the assistant's earlier answer. If the goal were to remove an old value from the model's next input, replacing only the source block would be incomplete. A harness would need to inspect derived summaries and other copies too. This fixture contains synthetic prices; it is not a privacy, provider-retention, or deletion test.

Dropping a source or answer from the next request also says nothing about physical deletion of an existing provider cache entry. Cache reuse, context construction, and provider data retention require separate evidence. [Anthropic API retention documentation](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention).

## Methods, cost, and limits

The [executable](../lab/context-evidence-probe.py) sends eight direct Messages API requests: two repetitions of four cases in the table's fixed order. The [public results](../lab/context-evidence-results.json) include every answer, expected field, usage count, request hash, and private-receipt hash.

- Returned model: `claude-sonnet-5-5`. Effort: `low`. Output cap: 512 tokens. Thinking mode left at the default; reported thinking tokens were zero in all eight responses.
- No tools, SDK translation, top-level automatic caching, beta headers, or retries. The baseline system text includes a distinct run and repetition identifier near its beginning. Both original requests reported zero cache reads.
- All requests ended with `end_turn`. We preserved actual prior assistant content for the two branches that needed it. The drop-answer branch starts from source text alone.
- Cost: **$0.0308808** for this experiment. Combined with the earlier 27-request experiment: **$0.20859**. These are usage-based estimates at checked list rates, not invoice reconciliations.
- Rates per million tokens: $2 ordinary input, $2.50 five-minute writes, $4 one-hour writes, $0.20 reads, $10 output. Only five-minute writes occurred. [Anthropic cache pricing](https://platform.claude.com/docs/en/build-with-claude/prompt-caching).
- Planning reserve: $0.94096, below the separate $1 experiment cap. It reserves all eight output caps and treats up to 25,000 serialized request bytes plus a 20,000-token allowance per request as five-minute cache writes. This is a conservative allowance for this fixture, not a general guarantee about provider tokenization.
- We record whole-request elapsed time but draw no latency conclusion. The run is small, ordered, and uncontrolled for network or server load. It does not establish a general quality advantage for either request layout.

## Reproduce or check the evidence

Dry-run planning reads no credentials and makes no network requests:

```sh
python3 -B docs/worklist/prompt-caching-from-api-to-agent-loop/lab/context-evidence-probe.py
```

An authorized live reproduction requires a fresh private directory under `/tmp` and a new public-output filename. Never overwrite the measured results:

```sh
python3 -B docs/worklist/prompt-caching-from-api-to-agent-loop/lab/context-evidence-probe.py \
  --execute \
  --private-dir /tmp/prompt-cache-context-evidence-new-run \
  --public-output /tmp/prompt-cache-context-evidence-new-results.json
```

The script reads only supported API-key and workspace fields from `.env` when executing. It does not log those values. Raw receipts for the measured run are in `/tmp/prompt-cache-context-evidence-20260928-run1`, outside Git. Each receipt contains the request and complete response; the public file omits account identifiers, response IDs, signatures, and credentials.

An independent check should recompute each private file's SHA-256, hash its sorted-key request JSON, compare returned usage and parsed answer with the public row, and recalculate costs using decimal arithmetic. For each keep-answer branch, compare its assistant content array byte-for-byte after canonical JSON serialization with the original response's content array. Finally, check that the replacement source changed while the system block did not, and that the append branch retained the original user message. This verifies what was actually sent, rather than relying on case names.

Return to [the worklist](../README.md).
