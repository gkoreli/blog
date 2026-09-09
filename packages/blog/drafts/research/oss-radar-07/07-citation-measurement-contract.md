# Citation measurement contract for the blog

Proposed September 8, 2026. This note defines the next experiment's records and reporting units. It is not a production schema, an executed live study, or a new analytics series. [Design/prior art](06-promptfoo-design-and-prior-art.md) and [trigger provenance](04-trigger-provenance-and-ai-citations.md) establish its basis.

**AI citations are a topic; counting them is analytics, and checking whether their sources support an answer is evaluation.** The same saved answer can feed both. Request analytics observes a different part of the process, with only some defensible joins between them.

## Records before rates

Keep the task, execution attempt, answer, citation, source capture, and review distinct. A retry belongs to the same planned run but has its own attempt ID. A cache replay is not a fresh model observation. An answer can cite several sources; one URL can appear beside several claims. A source can support a claim without proving causal reliance.

| Record | Key | Minimum fields |
|---|---|---|
| Planned run | `run_id` | Question, wording condition, repetition, frozen protocol/input hashes, known trigger and evidence |
| Attempt | `attempt_id` | Run/parent IDs, timestamps, provider/route/model settings, HTTP outcome, retries, provider request ID, local cache status |
| Raw capture | `capture_id` | Attempt ID, raw-body hash, storage reference, capture completeness, field-presence record |
| Answer | `answer_id` | Attempt ID, exact text, completion status, source-list field and annotation field stored separately |
| Citation occurrence | `citation_id` | Answer ID, raw URL, provider field/index or answer span, associated claim when reviewed |
| Source capture | `source_capture_id` | Raw URL, final URL if fetched, fetch time/status, content hash/representation, access limitation |
| Claim review | `review_id` | Answer claim/span, citation IDs, source-capture IDs, supported/unsupported/unverifiable result, rubric/reviewer, preserved qualifications |
| Origin association | `association_id` | Attempt and request IDs, matching method, observation window, matched/ambiguous/unmatched result, explicit limits |

Field values need provenance: observed, provider-stated, inferred, or unknown. These labels do not establish a trust ranking by themselves. Raw storage and public storage have different requirements; publish only reviewed records. The fixture uses invented content and a fake key, but a live response can carry material that needs removal from the public copy. Preserve a record of redaction without calling that public copy complete raw evidence.

## Missing is different from empty

Each provider-specific evidence field should retain one of: `present_nonempty`, `present_empty`, `not_returned`, `parse_failed`, or `capture_incomplete`. A documented empty list supports a narrower absence claim than a field the API did not return. Keep complete answer text for independent inspection, with any parser/manual extraction method named.

The installed probe reports **zero retained structured fields** for the built-in summary because the source fixture is known to contain them. In the wild, the same missing summary fields would leave citation observation unavailable. They would not establish zero citations by the model. That distinction is the reason to fix capture before drawing a chart.

## Metrics and denominators

| Metric | Numerator | Denominator / unit | What it can say |
|---|---|---|---|
| Capture completeness | Attempts with all fields required by the frozen contract, including recorded absences | All executed attempts, failures retained | Whether the measurement process preserved its own evidence |
| Citation observation coverage | Completed answers whose citations can be assessed under the declared method | All completed answers | How much of the dataset is observable; publish unavailable cases |
| Citation presence | Assessable answers with at least one explicit citation | Assessable completed answers | Citation frequency within the sample, not all AI use |
| Blog inclusion | Assessable answers citing at least one gkoreli.com URL | Assessable completed answers in the same condition | Inclusion in this task sample; supplied-URL tests excluded from discovery results |
| Citation occurrences | Retained individual references | Occurrence count per answer; report unique URLs/domains separately | How references are distributed without merging units |
| Reviewed support | Assessable citation-to-claim relations judged supported | All assessable reviewed relations; list unverifiable relations separately | Source support under the retained rubric; not causal reliance |
| Claim coverage | Checkable answer claims with supporting citations | Checkable claims in the reviewed sample | Whether important answer claims have support; rubric decides claim boundaries |
| Origin join coverage | Controlled attempts with a validated shared marker/ID in relevant captures | Controlled attempts where an origin observation is expected by the protocol | Coverage of the chosen association method; not a human count or organic census |
| Cost per completed answer | All recorded incurred charges for the batch, including failed attempts and paid grading | Valid completed answers under the frozen rule | Cost for this route/task/settings; estimated charges labeled separately |

Publish counts with each ratio, and keep wording conditions apart before any aggregate. Repeated answers to one question are clustered observations, not new independent tasks. An exploratory sample can describe variation without establishing a general population effect.

## What the analytics thread can own

The existing [Measurement boundaries plan](../../../../../docs/folders/FLDR-0008.md) already gives signed-agent identity and citation observation distinct questions. Keep that structure. Request analytics can report observed access; a separate saved-answer dataset can report citations and support judgments. Only join the records when the evidence supports the relationship.

An initial engineering continuation can ask: **Which citation events can a blog owner observe, and which remain outside its request logs?** Use recorded immediate, scheduled, and cached cases to answer it after the [proposed test](04-trigger-provenance-and-ai-citations.md) runs. Do not implement new production storage merely to make the diagram real. Static experiment files can establish the missing fields first.

This leaves three distinct outputs from shared work: a Promptfoo adoption verdict in Radar, a useful capture/review tool for the blog, and an engineering article grounded in its operation. A broader citation topic can grow from repeated findings; no new genre or ten-post-plan replacement is needed today.
