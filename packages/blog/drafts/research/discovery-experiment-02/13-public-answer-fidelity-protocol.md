# Can an agent preserve the signature evidence in its answer?

October 31, 2026 UTC. Continues the [discovery worklist](00-worklist.md) and [previous iteration's next experiment](01-repeat-and-decision.md). Frozen before sending any trial prompt. Source baseline `b31cb86`. Owner instruction: “Go agead next experiment”.

## Question, hypothesis and service

Discovery already returned the fetcher study for the signature-coverage question, and Arcjet reused its capture. The next useful outcome is a complete answer that preserves the engineering evidence. Hypothesis: the corrected canonical article supports a faithful answer; an older reproduction may propagate a broader identity claim. A neutral search-enabled answer tests source selection separately from either supplied-source condition. One answer per condition can reveal a concrete failure or successful supported use; it cannot estimate service-wide accuracy or a citation probability.

The [earlier article-snapshot trial](02-source-supplied-answer-fidelity.md) already found a substantively useful answer with a strict citation-destination failure (five of six required criteria). Heading IDs were repaired and activated; the one served check was rejected, and that failure remains. This new experiment uses an external web answer service with live source selection, not another article-only worker or a retry of the rejected delivery control. New answer citations must retain their own destination/support status.

Availability check before freezing: ChatGPT displayed a human-verification challenge, so no prompt was submitted and no challenge was solved. Grok's anonymous landing page displayed acceptance of terms by messaging; no message was sent. Perplexity opened an available composer with Search selected and no new agreement or login flow. Use **Perplexity web UI, Search selected**, with the model unavailable unless the answer UI exposes it. Account identity, personalization and cross-session memory are not established. Three fresh visible search sessions, in the order below, share that browser/service condition. They are controlled owner-authored agent-use trials, separate from organic audience counts and the previous web-tool searches.

The core question is an expanded successor to the earlier short search query, not a paired longitudinal measurement:

```text
Does DuckAssistBot's Web Bot Auth signature cover the User-Agent and request path? Explain what a successful verification establishes, whether the proof can be reused for another request, and whether it proves a person intended or read a particular article. Distinguish the captured implementation from general protocol requirements. Cite the sources you rely on. Keep the answer under 500 words.
```

## Frozen conditions and stop rule

1. **Neutral:** submit exactly the core question, with no supplied source.
2. **Canonical supplied:** prefix the core question with `Read this source before answering: https://gkoreli.com/which-ai-fetchers-send-which-headers` followed by `Use other sources if needed; say explicitly if you cannot read the supplied source.`
3. **Reproduction supplied:** use the identical prefix and instruction, replacing only the URL with `https://wpnews.pro/news/which-ai-fetchers-send-which-headers-measured-on-a-live-site`.

Join each prefix, instruction and core question with a blank line. Create a new session for each condition; do not coach, regenerate, correct or select a preferred answer. Stop after three submitted prompts, keeping every error or unavailable response. If an account/verification/agreement gate appears, leave that condition unavailable and continue independent source/rubric work. Do not accept new terms, change settings, pay, contact a publisher or schedule another run.

Record exact prompt, service/mode, submission and observation times, exposed model, answer completion state, full answer text and visible citation destinations. Raw captures and session identifiers remain private. Capture citations only from the answer and its visible source UI; a supplied link echoed in the prompt is not an answer citation, and a source card is not proof that each answer claim is supported. A URL supplied by the author tests supported retrieval/use, not unseeded discovery.

The neutral question includes no source URL, but the service's hidden context is unavailable. We cannot control which fetch headers the service sends when reading our site or prove that its origin requests are excluded. Treat these as labelled controlled uses; do not subtract guessed requests, infer a person or run production SQL to identify them. Separate any direct owner source checks and use the current collector's reviewed eligibility before those checks. No direct own-site check is planned merely to run the rubric.

## Frozen claim rubric

Ground truth: the [dated article source](../../../posts/023-which-ai-fetchers-send-which-headers.md#duckassistbot-what-its-signature-actually-covers), [20-case reproduction](../analytics-retrospective/96-fetcher-reference-coverage-correction.md), its [closed results](../analytics-retrospective/fetcher-reference-coverage.json), and RFC 9421's [insufficient coverage](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) and [replay](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.2) sections. An existing historical capture is ground truth for that capture, not proof of today's vendor behavior. Current external sources will be inspected to verify their claim version.

| ID | Criterion |
| --- | --- |
| coverage | Identifies the captured proof's covered components as authority/hostname and Signature-Agent; does not say User-Agent or path were signed. |
| unsigned | Explains that the captured User-Agent and request path are not authenticated by this proof; no automatic request-specific binding follows. |
| key | Describes verification as a cryptographic result under a key, covered components and verification policy; does not promote that into proof of every unsigned client-identity claim. |
| reuse | Explains that this coverage can allow reuse across requests within applicable validity/policy constraints; expiry alone is not complete replay prevention. No claim of observed malicious replay is needed or warranted. |
| intent | Does not infer a person's intent, reading or the use of a particular article from a successful signature verification alone. |
| scope | Distinguishes the dated captured implementation from universal/current protocol requirements or every DuckAssistBot request. |

For each criterion record **supported**, **contradicted**, **not addressed**, or **unavailable**, plus an inspectable answer passage/location and review rationale. Unsupported confidence is not a pass; an omission is not a contradiction. Use categorical review rather than a keyword score. Primary task success requires supported coverage, unsigned-boundary and intent criteria, with no contradiction in any criterion. Also report completeness separately across all six criteria; do not silently drop omissions. Citation presence and source support remain separate assessments.

This is author-agent review against explicit replay evidence, not an independent human panel or automated truth verdict. The authoring agent knows the expected answer; fresh service sessions do not remove this grading limitation. OpenAI's [evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices) supports task-specific criteria and logged comparisons; no API/Evals platform or new dependency is needed here.

## Decision and delivery

If a canonical-supported answer succeeds, retain the article and count that controlled supported use positively. If an answer contradicts the capture, identify the exact source/passage before choosing an article repair, source-version note or follow-up trial. A reproduction-only failure does not establish that editing the canonical page will fix it, and an unavailable answer does not establish bad content. Build only a reusable review artifact or small validator if the actual capture/review exposes a need. Update the existing skill narrowly for demonstrated lessons. Keep source delivery, any publication intervention and observed outcome separate. No article change is assumed.
