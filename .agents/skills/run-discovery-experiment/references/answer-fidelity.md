# Review complete agent answers and citations

Use this mode when the outcome is whether an agent can understand or apply published evidence. A supported controlled answer is a useful agent-use observation without a human label; keep it separate from organic audience growth and unseeded discovery.

Freeze the question, service/mode/model when exposed, context, source conditions, claim rubric, primary outcome and stop rule before submission. Reuse earlier trials and repairs as history; a new service, question or source version is a new condition, not a favorable retry or a longitudinal comparison by default. Supply source snapshots only in explicitly source-supplied conditions. An unavailable login, challenge or agreement step does not authorize changing accounts or providers silently.

Save exact prompts, the full completed answer, visible completion state and each citation group before leaving the page. Anonymous answers may become inaccessible later. Record submission and observation clocks by what they actually mark; do not turn an observed completion state into an exact completion time. Keep raw answers, source captures and session identifiers private.

Distinguish:

- A source in the search/source panel, an inline answer citation, an echoed prompt URL and a successfully inspected destination.
- A relevant source, a working URL/fragment and a source passage that supports the particular cited claim.
- Evidence present in a separately retrieved full source and evidence available to the answering model. Hidden retrieval chunks and source versions may differ.

Inspect each inline citation group separately. Different paragraphs can display the same first source while citing different additional sources. Do not assign the global source list to every answer claim. Inspect content and actual destinations when claiming support; the earlier snapshot experiment found correct subjects with nonexistent HTML fragments.

Grade against independently inspectable evidence, not confidence or keyword presence. Keep supported, contradicted, not-addressed and unavailable distinct. An abstention can avoid an error while leaving the requested task incomplete. Preserve specific successful criteria even when the strict primary task fails. Report criteria completeness alongside primary success; do not treat omitted diagnostics as contradictions or silently drop required criteria.

For a public review packet with private captures, use the [offline review verifier](../../../../packages/blog/scripts/verify-answer-review.mjs):

```sh
node packages/blog/scripts/verify-answer-review.mjs /path/to/review.json /private/capture-directory
```

The [worked protocol](../../../../packages/blog/drafts/research/discovery-experiment-02/13-public-answer-fidelity-protocol.md) and [categorical review](../../../../packages/blog/drafts/research/discovery-experiment-02/public-answer-review.json) define the input. The verifier checks capture/prompt/protocol hashes, paragraph/method/clock bindings, complete criterion coverage and denominators. It reconciles supplied reviews; it does not establish their truth. Inputs are bounded regular UTF-8 files, and capture basenames cannot traverse directories. It prints counts and hashes, not raw answers, and performs no network/account operation.

Keep completed, blocked and not-submitted conditions separate; use completed answers as the answer-quality denominator. Start separate cohorts for changed services/methods. Source-supplied success cannot establish discovery lift. A source-card or citation-presence metric alone cannot establish comprehension, claim support or application. Preserve the original outcome after a source or delivery repair; any later trial gets its own condition and date.
