# Handoff — November 1, 2026: research complete

The supplied report has been checked, the declared research/experiments are complete, results are audited, and a [follow-up draft](09-follow-up-draft.md) is ready. [Article decision and review](03-article-brief.md). No new site post or outreach was published. Source preparation was delivered as `5054c8f`; the final result delivery accompanies this handoff.

## Accepted evidence

| Checkpoint | Accepted evidence | Private source |
| --- | --- | --- |
| Express | [Results](05-express-results.md), 18 windows / 5,615,327 responses | `/tmp/bun-aot-express-20261101/guarded/express-warm`, `guard-receipt.json`; completed phase precedes a later cold interruption |
| Fastify | [Results](06-fastify-results.md), 18 / 5,672,260 | `guarded-fastify-warm`, `fastify-guard-receipt.json` |
| Standalone serializer | [Results](07-serializer-results.md), 18 / 5,708,369, four source/native contract cases | `guarded/standalone`, `standalone-guard-receipt.json` |
| Plain JSON | [Results](07-serializer-results.md), 12 / 3,937,744; changed extra-field/coercion behavior | `guarded-json-warm`, `json-guard-receipt.json` |
| Cold/startup | [Results](08-cold-startup-results.md), 180 / 7,043,742, plus 180 readiness-only processes | `guarded-cold-startup`, `cold-startup-guard-receipt.json` |

All relative private paths use `/tmp/bun-aot-express-20261101`. Public captures total **246 timed windows and 27,977,442 completely checked responses**. Every checkpoint keeps source/binary/data identities, sample spread, complete measured response checks and the bounded guard conditions. The five guards show no detected known competing activity inside each accepted scope; ordinary/short-lived or unknown activity remains possible.

The standalone generator's emitted source, unchanged transitive dependency lock, upstream license and four semantic cases are committed. The article preserves the separate-policy comparison limit and distinguishes health readiness, the first checked business call and warmed request speed. The first-call timer includes Python connection/JSON work. This scope does not edit the predecessor article or its frozen accounting. Concurrent main commits `54b6fdd` / `25311bd` updated the predecessor through the separate real-project study; those changes are preserved, and both completed scopes remain linked from the shared worklist.

## Terminal process state

- Initial pilot session 78273: interrupted, terminal. Its incomplete data stays private.
- Overlapped full attempt session 46897: interrupted, terminal. Its directory named `accepted/` is historical and **not accepted performance**. `accepted/foreign-work.json` records overlap.
- Third guard session 56073: exit 75, terminal. Express completed before the later cold interference and is accepted separately with a time-boundary audit.
- Fastify session 36198: exit 0, terminal.
- Standalone session 20999: exit 0, terminal.
- Plain JSON session 59192: exit 0, terminal.
- Cold/startup session 10748: exit 0, terminal.

There is no running process to poll or restart for this scope. An optional coordination question received no authorization used here; no message was sent to the other task, and its processes were preserved. Independent guarded windows completed the research.

## Validation and delivery boundary

`audit-express-warm.py`, `audit-fastify-warm.py` (also `--json-control`), `audit-standalone.py` and `audit-cold-startup.py` ran against the actual private checkpoints. `verify-evidence.py` rechecks public/decompressed hashes, recomputes the saved summaries from observations, checks all measured counts/CPU arithmetic, mode positions, startup rows, generated source and contract commitments. It does not independently rerun or authenticate execution. Source syntax and scoped documentation/numeric checks accompany delivery. The original all-in-one runner/audit remain reproduction alternatives; they were not substituted for these actual phase receipts.

No production build or deployment is needed for research records. Git delivery and selected remote-file checks are separate from a site-publication claim. The next optional action is editorial review/publication of the draft, with the normal post metadata, exact prompt record, series/forward links and site checks at that time. Broader schemas, another OS and independent replication remain proposals, not reopened completed work.
