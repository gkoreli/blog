# Perplexity URL controls: the ordinary URL changes the result

November 5, 2026 America/Los_Angeles / UTC. This extends the [initial Context.dev/Perplexity batch](03-context-and-perplexity.md), preserving that single refusal as a dated result. It supersedes any reading of that refusal as a sufficient stopping point for testing Perplexity's retrieval capability.

## The owner pushed the question further

After the initial agent-operated refusal, Goga continued the same browser conversation. Seven visible follow-up prompts challenged the failure, requested other probe values and suggested `#`. The material conversation was reviewed from its beginning and end and preserved privately. Its [reviewed inputs](perplexity-controls-inputs.json) retain the complete rendered follow-up prompts; those are browser text, not an exported original message serialization.

The conversation showed a correct cited answer for the query-free article: body H1, maintenance sentence, `@authority` and `signature-agent`, with path/query/method/User-Agent unsigned. Other query-bearing variants were reported as fetch failures. A fragment-only URL returned the article; a query plus fragment still failed. These later turns occurred around 06:57–06:59 local, outside the initial capture that had stopped nearly eight hours earlier. They establish visible answer outcomes, without a retrospective origin-request claim.

That was a useful correction to the investigation. A failed uniquely labelled URL did not justify stopping before testing the ordinary page. Nor did it establish that Perplexity lacked search or retrieval tools. The distinction being tested is URL-dependent behavior, not capability versus incapability for an entire provider.

## Three fresh conversations

The repeat used the same existing signed-in Free-plan Search interface, with Computer disabled and no named default model exposed. Each URL form received the same question in a separate fresh conversation: return the H1, maintenance sentence and DuckAssistBot coverage; cite the actual source and disclose a different URL if used. Expected answers were absent. Only the URL changed. Questions ran sequentially, with each completed answer saved before the next submission and without opening source links.

| Input | Completed answer | Displayed duration |
| --- | --- | --- |
| `?probe=bot-grill-20261105-perplexity-query-01` | Reported exact-URL failure, explicitly fell back to the query-free article, returned all three parts correctly with citations | 8 seconds |
| `#bot-grill-20261105-perplexity-fragment-01` | Returned all three parts correctly, citing the fragment URL | 3 seconds |
| Plain canonical article URL | Returned all three parts correctly, with one displayed source | 3 seconds |

These are displayed service durations, not a latency benchmark. The query trial displayed two sources, the article and its prompts page. The fragment trial displayed two source URLs and disclosed correcting an initial tool input containing duplicated Markdown-link text. One source card retains that malformed suffix after `#`. The completed answer's requested facts remain correct, but the disclosure is not independently captured tool-wire data.

The successful fragment answer is [shown in an actual screenshot](assets/perplexity-fragment-20261105.png); [plain-URL](assets/perplexity-plain-20261105.png) and [query/fallback](assets/perplexity-query-20261105.png) screenshots preserve the other interfaces. Full private UI snapshots support the coverage check where screenshots cut off the answer. [Results](perplexity-controls-results.json) retain per-variant outcomes.

## A fragment is a prompt distinction, not an origin label

RFC 3986 specifies that a fragment is separated before dereferencing the resource. In ordinary HTTP retrieval, `/article#probe=x` and `/article` have the same request target. The fragment can survive in the prompt and citation without reaching the publisher. [RFC 3986 §3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5).

This has two practical consequences. First, a fragment-only success is a useful retrieval result, even though it cannot provide the query label this logging method wanted. Second, the measurement input is itself a treatment: adding a probe query can change the tool's behavior. Compare it with the ordinary URL rather than assuming instrumentation is neutral.

The successful answers demonstrate correct controlled source use. They do not prove a fresh HTTP fetch. Cached content, indexed content, URL handling, an intermediary or a retrieval bug remain possible explanations. The observed failures do not establish a provider-wide ban on query parameters, and no particular internal cause is selected.

## The new capture and positive control

The [origin evidence](perplexity-controls-evidence.json) records the separately bounded GET tail and all same-article candidates, including query-free requests if present. A fragment has no exact query label to match, so candidates must not be assigned automatically to a particular conversation. The [configuration](perplexity-controls-config.json) selects only the real query label and a distinct controller label for exact storage checks.

When the stream was quiet, one positive control was frozen before execution. The controller itself requested the article with `?probe=bot-grill-20261105-collector-control-01` and an explicitly non-vendor User-Agent. It received HTTP 200 and appeared in the tail. This is synthetic controller traffic, excluded from every Perplexity outcome. It establishes receipt of the control and shows that this site served one query-bearing request; it does not rule out a vendor-specific edge outcome or establish complete logging.

The stopped-stream facts, full-receipt readback of that control and any provider candidates are recorded in the evidence and [checks](perplexity-controls-checks.json), rather than inferred from answer correctness. No historical owner-turn origin requests are reconstructed from the later stream. The earlier unavailable security-event check remains unavailable; no new manual credential route was attempted.

The tail ran **15:03:01.693–15:11:02.556 UTC**, stopped at its eight-minute bound and contains 22,757 bytes: three complete invocation objects, no malformed/outside fragments and no incomplete suffix. The synthetic control is the only request for the tested article. There are zero exact Perplexity query-label matches and zero other article requests, including the canonical URL, in this stream. No Perplexity stored row is therefore selected or claimed.

The synthetic control has one attempt, one matched acknowledgement and a unique returned reference. Native workerd/D1 preflight confirms its exact primary-key query. Fresh Wrangler metadata and constant-access checks succeed, followed by one exact SELECT: **one read, zero writes and one attempt**. Its full receipt equals the acknowledgement. That verifies the control's pipeline, not an unobserved provider fetch; the absence result remains bounded to this stream.

## What changed

The skill now requires bounded canonical/search/fragment controls when a retrieved URL fails under otherwise available access, and keeps fallback URLs visible. It explicitly distinguishes prompt labels from HTTP targets and offers a separately identified positive control for a quiet capture. A provider's first refusal remains evidence about that attempt, rather than the end of the capability test.

This repeat adds three correct cited answers and a reproducible query-versus-ordinary-URL distinction. Freshness, the internal error cause, API/MCP/CLI/Computer behavior and other providers' query handling remain separate questions. The article remains unpublished. [Private archive commitment](perplexity-controls-archive.json).
