# Fresh browser trials: honest refusals, two stored controls and missing fetch evidence

November 1, 2026 UTC. Continues the [frozen live-trial plan](07-live-trial-plan.md), [trace method](08-live-trace-method.md) and [separate real signed-request recovery](12-real-proof-replay.md). The [minimized findings](live-browser-findings.json) omit private conversation URLs, row/operation references, addresses, credentials and raw signing material.

**Final captured window accepted.** The tail connection was confirmed before **00:26:35 UTC**. The owned terminal was stopped after **00:41:19 UTC** and confirmed stopped before **00:41:47.645034 UTC**. Those are controller clock bounds, not a reconstructed exact process start/stop. The final stream parses completely and preserves the two exact control readbacks. It is a finite captured stream, not a guaranteed complete request census.

## What the accessible assistants actually said

The plan was frozen at **00:26:35 UTC**, before the submitted browser trials. Each assistant received its own exact article URL with an assigned query label, plus this instruction:

```text
Open this exact URL: <assistant's uniquely assigned article URL>
Return the page's H1 and quote one sentence from its "Maintaining this reference" section. If you cannot access the page, say so; do not infer its contents from the URL or search snippets.
```

The complete actual prompts, including each assigned public URL, are retained in the findings JSON. We did not put the requested answer into the prompt or open those exact assigned URLs ourselves.

| Interface | Displayed configuration | Completed answer | Recorded time boundary |
| --- | --- | --- | --- |
| Gemini | Flash-Lite, signed out | “I cannot access the page directly.” | Observed complete before 00:28:30 UTC |
| Perplexity | Search selected, signed out; model not exposed | “I can’t access the page right now, so I can’t provide its H1 or quote from ‘Maintaining this reference.’” | Observed complete before 00:29:30 UTC; UI displayed 4s |

Exact submission timestamps were not recorded. The completion bounds are observation limits, not invented send times or measured request durations. Both answers declined to supply unsupported page content. Neither is a successful fresh-fetch observation, and neither claimed a successful fetch that our evidence disproves.

The parent investigator also received an inaccessible-URL result from a Codex web-open attempt, after **00:28:37 UTC** and before **00:29:11 UTC**. That tool result has no accepted invocation/storage chain. A local **Claude Code 2.1.280** attempt ran from **00:29:11.096473 to 00:29:11.798426 UTC** and failed because the existing OAuth session had expired and could not refresh. Its retained structured output contains **zero tool uses**: no WebFetch call ran. This is an execution prerequisite failure, not a measured fetcher behavior or a signing result. The advertised model in its initialization is not evidence that a model response executed.

ChatGPT remained at a challenge/interstitial; Claude and Copilot displayed sign-in screens. Duck.ai and Grok presented first-message acceptance of terms. No prompt was submitted through those gated interfaces. These unavailable interfaces stay separate from the two submitted browser prompts; they do not become failed fetches or a fresh seven-service survey.

## The collection path works for the two direct controls

Two separate agent-operated browser navigations used their own operator labels: one opened the follow-up, and the other opened the original article. They did not reuse an assistant's assigned URL. Their actual invocation timestamps are **00:26:51.872** and **00:30:23.303 UTC**, and both returned HTTP 200 from execution Worker `b06bde7e-9a63-4c65-bee7-4f0c265cdbc2`.

Each invocation contains one observation attempt and one acknowledged stored receipt. The finite set of returned decimal references was frozen before the one remote primary-key read. That read returned two rows for **four reported reads, zero writes, one attempt and no database-change flag**. Running the actual current `storedObservationReceipt` source over both stored projections yields exact deep equality with their respective acknowledged receipts. The statement is the same native-preflighted projection prepared by the extractor, rather than a narrower check that only compares a status flag.

Both controls are HTML observations, stored as `browser`, with no signature and `is_owner=0`. The operator was an agent driving a browser. These are useful positive controls for the collection chain and a concrete reminder that Browser signals do not identify a person. They are also deliberate public-counted experiment events; they must not be called organic growth. They occurred November 1 UTC, outside the separately analyzed October 31 day.

The final private extraction, checked at **00:41:31.548 UTC**, contains **26 complete JSON objects, two assigned-label matches, zero malformed completed frames, zero outside-text fragments and zero unparsed-suffix bytes**. The matches are these operator controls. This supersedes the interim fourth extraction's 25-object count. Its frozen SQL has the same hash and exact reference set as the already executed two-row readback: `f3a740fda66708296079f739bb1bebe82e2bbe0acaa0b9350470e356b6bf7b2b`. The final native D1 preflight again accepts the actual projection with an integer-primary-key plan; this creates no second remote query.

## Missing records stay missing evidence

The parent investigator's native query for the frozen probe prefix returned zero events in its scoped Last 1 hour view. A separate prompts-page lookup returned seven older records around **October 31, 23:38 UTC**. Those records precede these new trials and do not repair a missing fresh prompts-page chain. The newly opened prompts page rendered, but no fresh matching live invocation/acknowledged row has been accepted.

No matching assistant request was present in the final assigned-label captured stream. That observation does not prove no request was attempted or that a request was blocked before the Worker. Provider logging, collection, retention and query representation can leave gaps. Keep the visible refusal, scoped returned zero and missing server chain as separate facts; do not choose a failure cause from them.

## The independent citation remains a real positive outcome

The parent investigator rechecked [Arcjet's signature-base explanation](https://arcjet.com/learn/web-bot-auth#signature-base) in the browser before **00:30:00 UTC**. It uses the published DuckAssistBot capture alongside SeatGeek's ChatGPT example to explain their different covered fields, and its inline citation targets the original study. The inspected anchor has `rel="noopener noreferrer"`, with no `nofollow` qualifier. This is an observed earned backlink and technical use of the research as evidence. It is not a measured ranking improvement or an authenticated referral visit.

## Accepted result and remaining limits

Accepted: two actual browser answers, the interface gates, the Codex tool failure, the Claude Code prerequisite failure, two complete invocation/receipt/row controls, exact current-source receipt equality, the bounded read cost, the stopped tail and its complete parse, and the frozen final browser ledger. The [separate real-proof result](12-real-proof-replay.md) accepts a real signed production request and its three untouched replays; it is not silently assigned to these failed controlled fetches.

No successful fresh assistant-fetch chain is accepted. The rendered prompts page also lacks a fresh accepted chain. Those gaps remain limits rather than unfinished parsing work or invented successes. No runtime behavior, production protection, credential, permission or diagnostic-capture setting was changed by this acceptance lane. The parent investigation owns browser operations, native lookups and production reads; this lane performed only offline comparisons and wrote minimized evidence.
