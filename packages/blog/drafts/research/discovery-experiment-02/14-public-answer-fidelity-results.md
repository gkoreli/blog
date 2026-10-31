# A relevant citation did not deliver the capture-specific answer

October 31, 2026 UTC. Execution of the [frozen protocol](13-public-answer-fidelity-protocol.md), following the [earlier article-snapshot trial](02-source-supplied-answer-fidelity.md). These are separate conditions and outcomes. [Categorical review](public-answer-review.json) preserves the six criteria, each answer-paragraph reference, source-support assessments and capture hashes.

## What ran

Perplexity's web UI had Search selected, showed a Sign In control and exposed no selected backend model. No model was changed. The first neutral prompt was submitted at 15:42:12.452 UTC; the completed answer was observed at 15:42:26.454. The service displayed Finished 5s. That is an observed UI duration, not an independently measured completion clock.

The answer contains 132 whitespace-separated words in two paragraphs. Both inline citation groups were expanded separately, including their second entries. Paragraph one cites Google's Web Bot Auth guide and Arcjet; paragraph two cites Google's guide and Cloudless. The source panel displays ten sources. No canonical article citation is observed. These citation groups are distinct from the retrieved-source panel and from any supplied prompt URL. Host/path destinations are transcribed from AX link values with HTTPS review links; exact hidden tracking and redirect behavior are unavailable.

The canonical-source prompt was submitted in a fresh visible session at 15:43:56.757. At 15:44:13.599, the service required sign-in and exposed no complete answer. The reproduction condition was not submitted after that gate. The existing neutral session also became gated on a later read-only reopen; its complete answer and citation inspection had already been retained. No answer regeneration, follow-up coaching, new agreement, sign-in, paid option, anonymous-session reset, alternate-account route or new prompt occurred after the gate.

| Condition | Submission | Answer outcome | Primary task |
| --- | --- | --- | --- |
| Neutral question | Submitted once | Complete | Not passed |
| Canonical source supplied | Submitted once | Sign-in gate | Unavailable |
| Reproduction supplied | Not submitted | Stop rule after gate | Unavailable |

This is one completed answer among three planned conditions, not three bad answers. The answer-quality denominator is one; the source-supplied contrast remains untested. ChatGPT's verification challenge and Grok's agreement notice were pre-trial availability checks, with no prompts sent there. Perplexity's optional cookie choice was declined; an initial dismissible sign-in offer was closed without authentication. Its later mandatory gate was respected. An explicit user choice for another execution route was requested while independent review continued; it is not assumed granted.

## What the answer got right and left unresolved

The answer keeps general signature coverage tied to `Signature-Input`, associates verification with a key and signed components, and explicitly avoids inferring human intent or reading. It distinguishes its general explanation from capture-specific knowledge it could not establish. Those are positive supported subtask results in an actual agent answer, without requiring a human identity.

The required task remains incomplete: the answer does not identify the captured covered components, establish that this proof leaves User-Agent/path unsigned, or explain the capture's reuse window. Review records **three supported criteria and three not addressed**, with no contradiction assigned within the six-criterion rubric. The strict primary task fails because the required coverage and unsigned-boundary criteria are missing. That is neither a population accuracy estimate nor a verdict that its cautious general explanation has no value.

## The consequential source-support gap

[Arcjet's full guide](https://arcjet.com/learn/web-bot-auth), in What exactly gets signed?, reports the DuckAssistBot authority/Signature-Agent coverage and ten-minute window and links to our study. [Cloudless's own observation table](https://cloudless.sh/log/web-bot-auth-in-the-wild/) independently reports those covered components and an approximate ten-minute lifetime for its own DuckAssistBot captures. The answer cites these sources but declines to establish those details. The model's internal retrieved passages and exact source versions are unavailable, so we cannot assign the cause to retrieval, excerpt selection or synthesis.

This tests a real distinction for analytics: **source selection, answer citation and supported task completion are separate observable stages**. A source-card count or URL match cannot stand in for understanding. Arcjet's existing reference creates an inspectable route from our published evidence to a source selected by this agent; this trial does not prove the answer consumed that referenced passage or create a second independent Arcjet reference.

The Web Pulse copy still contains the older broad identity wording next to the same narrow signature example in the separately inspected source. Since its supplied-source trial did not run, the hypothesis that it changes answer fidelity stays untested. We do not infer propagation from merely finding an older copy. [RFC 9421's coverage and replay sections](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) support the frozen evidence boundary; this review does not repeat cryptographic vendor tests.

## Build, checks and decision

The new [offline review verifier](../../../scripts/verify-answer-review.mjs) checks that every completed answer has every rubric criterion reviewed, rejects grades on blocked/not-submitted conditions, keeps service cohorts separate, verifies private capture/prompt/protocol hashes and binds paragraph locations, methods and observation clocks. Its output explicitly labels the reviews as supplied assessments. It reconciles evidence and arithmetic; it is not an automated truth judge.

Run the saved case with the private capture directory identified in the [acceptance receipt](public-answer-checks.json):

```sh
node packages/blog/scripts/verify-answer-review.mjs \
  packages/blog/drafts/research/discovery-experiment-02/public-answer-review.json \
  /private/path/to/raw-captures
```

Five focused tests cover actual denominators, contradictory versus omitted criteria, complete review requirements, separate method cohorts and real capture/hash/method/clock bindings. All 174 site tests, workspace types, syntax and the actual eleven-capture verification pass in an isolated checkout. The updated discovery skill routes to the focused answer-fidelity procedure; links and instruction preservation are checked separately. There is no article, collector, classifier, schema, public report, retention or production SQL change. No application build or served-behavior claim is needed for this offline script and research record.

**Decision:** retain article prose, preserve the neutral answer's useful distinctions and strict task failure, and add claim-level citation support to the experiment workflow. The source-supplied contrast requires an explicitly available execution route. A different service or source-snapshot worker cohort must have its own declared conditions and must not be pooled with this Perplexity run. No external outreach, account change or future automation is scheduled.
