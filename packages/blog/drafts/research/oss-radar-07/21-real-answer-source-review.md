# Source review of the two real CLI answers

Reviewed September 10, 2026 PDT / September 11 UTC. These are the first answers from the [subscription CLI experiment](20-subscription-cli-experiment.md), using the unchanged [directed question](repro/cli/prompt.txt). Neither answer was regenerated after inspection. Codex performed the initial review; a separate Codex reviewer checked the source and challenged the judgments. This is an agent review, not independent human validation.

## What happened

Both clients returned real answers. Promptfoo 0.122.2 preserved each answer, its complete emitted stdout, and capture metadata through the public summary, library JSON export, and a fresh CLI process reopening the database. The preservation checks did not grade truth.

The Codex answer preserved the measured quantities and the article's limits. Claude preserved the headline figures but made three material errors: it turned all reclassified requests into cloud-classified requests, reduced the classifier to two signals, and broadened a companion article's statement about unobserved AI access into a general lower-bound claim. The retained answer and sources make those errors inspectable.

## Records and review units

- [Codex answer](repro/cli/recorded/codex-answer.md), [capture facts](repro/cli/recorded/codex-capture.json), and [emitted web-tool events](repro/cli/recorded/codex-web-tools.json).
- [Claude answer](repro/cli/recorded/claude-answer.md), [capture facts](repro/cli/recorded/claude-capture.json), and [selected web-tool calls and results](repro/cli/recorded/claude-web-tools.json).
- [Main source copy](repro/cli/recorded/source-024.md) and [companion source copy](repro/cli/recorded/source-023.md), retained from repository revision `bde3d64`. Both source pages were accessible. The main HTML snapshot preceded generation; the companion HTML snapshot was taken during review afterward. Their capture times and hashes are in [source.json](repro/cli/recorded/source.json) and [source-023.json](repro/cli/recorded/source-023.json).

The table groups related clauses into substantive source claims. It does not count introductions, repeated conclusions, retrieval narration, or the answer's own inference that differing counters make a gap expected. Thus the unit is a **reviewed claim group linked to a source document**, not a sentence, unique fact, citation marker, or model accuracy rate. The grouping is a disclosed reviewer choice. Repeated occurrences of the same conclusion are reviewed together.

Codex has four visible links, three exact hrefs including fragments, all pointing to one document. Claude has three visible links, two distinct URLs/documents; its footer expressly maps the main source to preceding measurements and limitations, and the companion source to the proxy discussion. Those broad footer mappings count as explicit relationships here. The prompt supplied the main URL, so neither answer measures organic discovery.

## Codex: eight reviewed claim groups

| ID | Claim group | Judgment | Retained source support |
|---|---|---|---|
| C1 | Eligible successful page GETs, HTML/negotiated Markdown, and excluded routes/representations | Supported | Main article, “The request rules in the Cloudflare Worker,” eligibility paragraph |
| C2 | Network and request-header evidence produces explainable classifications | Supported | Same section, four evidence sources |
| C3 | Signatures establish signers rather than human intent | Supported | “Agent names, signatures, and request purpose” |
| C4 | Browsers may include automation and exclude legitimate access; no people-count bound | Supported | “What the Browsers category cannot establish,” opening |
| C5 | Original comparisons mixed windows and daily identifiers/visits | Supported | “Comparing edge page views with a script counter,” initial comparison |
| C6 | September 4–5: 277/372 reclassified, 74.5%, 95 Browser HTML versus 14 non-bot loads, 6.79× | Supported | “What the September 4–5 measurements show,” table and explanation |
| C7 | Rule effect does not establish classifier accuracy | Supported | Same section, no independent labels for all 277 |
| C8 | Owner marking, blockers/beacon loss, and script-running automation limit comparison | Supported | Same section and the Cloudflare FAQ paragraph in the initial comparison |

Two Codex links contain section fragments absent from the captured page's HTML IDs. They still reach the supporting document, but fail to navigate to the claimed section. This is a link-quality defect, separately recorded from source support.

## Claude: fourteen reviewed claim groups

| ID | Claim group | Judgment | Retained source support or conflict |
|---|---|---|---|
| A1 | Four evidence sources: network, Fetch Metadata, acceptance/language, client declarations/signatures | Supported | Main article's request-rule and signature sections. Signature verification is separate from UA matching. |
| A2 | Hosting rule, browser-version thresholds, and the named classification/reason labels | Supported | Main article's two rules. The answer loosely calls all labels categories; the source distinguishes classification reasons. |
| A3 | Two-day UTC window and 372/277/95, 74.5% | Supported | Main article's September 4–5 measurement table and text |
| A4 | 60 of **277 cloud-classified** requests passed navigation checks | **Unsupported** | 277 is the total reclassified population. The source says 60 cloud-classified requests in the original browser-UA population passed the check; it does not say all 277 were cloud-classified. |
| A5 | Observations count requests, not deduplicated people | Supported | Eligibility paragraph and measurement definitions |
| A6 | 95/14 = 6.79×; including bot-tagged RUM loads gives 16 and 5.94× | Supported | September 4–5 measurements. The answer omits some qualifications: 95 is HTML, 14 excludes `/stats`, and owner marking is incomplete. |
| A7 | Extractor reproduced the gap; bot filtering alone does not explain it | Supported | Same section, final measurement paragraphs |
| A8 | Disagreement does not establish automation, audience accuracy, people, reads, or citations | Supported | Comparison, Browsers limits, and method sections |
| A9 | Worker and RUM count different events; the article does not literally state that RUM requires JavaScript | Supported, narrow wording | The page explicitly discusses a script counter and blockers/beacon loss. Claude's literal caveat is defensible, but it omits these supported candidate mechanisms. |
| A10 | Legitimate access may be excluded; headers and signatures do not establish a person/trigger/purpose | Supported | Browsers limits and identity sections |
| A11 | September 3 publication and September 6 correction notice | Supported | Article metadata and revision history |
| A12 | Companion article reports anonymous Grok using browser headers and rotating exits across eight networks | Supported | Companion article's Grok experiment and server-counter discussion |
| A13 | UA and hosting lists are **exactly the two signals** the current method depends on | **Unsupported** | Main article explicitly also uses Fetch Metadata and Accept/Accept-Language. |
| A14 | Companion article says server-side classification is “a lower bound, not a measurement” | **Unsupported** | Its actual statement concerns logs as a lower bound **on AI reading**. The purported quotation is not literal and broadens its scope. The main article rejects a people-count bound. |

At this disclosed grouping: **22 reviewed source relationships; 19 supported, 3 unsupported, 0 unverifiable.** This describes these two answers under this review. Different grouping changes the counts; no model comparison, population accuracy rate, or human-review agreement follows.

## What the retained tool record adds

Claude made five visible WebFetch calls, three for the main article. One intermediate summary incorrectly rendered the time window as `00:00 through 06:00 UTC`. A subsequent summary supplied the correct September 4 00:00 to September 6 00:00 interval, which the final answer used. This is a recorded extraction error and correction; it is not evidence that the website changed.

The earlier summary correctly called 277 the **reclassified** population. The final answer's **cloud-classified** denominator error is therefore absent from that retained summary and present in the final text. The record helps locate the change without inferring hidden reasoning or blaming Promptfoo for generating it.

Claude describes three independent extractions. These were repeated summaries of one URL in one run, not three independent sources or confirmed independent origin fetches. WebFetch's summaries are model output; they must not be treated as exact HTML snapshots. Its result also reports Haiku usage alongside Opus usage. The top-level result's web-fetch count is zero despite five emitted WebFetch tool calls, showing why a reported usage field and an observed tool-call count need separate labels.

## Limits and public reproducibility

The question named our article. The clients, tools, default models, and answer lengths differed. One run per client cannot rank model quality, estimate citation rates, identify a fresh origin request, or measure actual readers. CLI records do not expose the full remote retrieval history or raw service HTTP responses. Invoice reconciliation was not performed.

The [public selection manifest](repro/cli/recorded/manifest.json) commits to published artifacts. Complete raw stdout, stderr, session logs, and HTML remain in the private evidence archive; hashes do not let readers reconstruct those private records. Readers can inspect both final answers, selected tool events, source copies, grouping, judgments, and the runnable wrapper. Goga can repeat the exact preservation checks with the retained private exports.
