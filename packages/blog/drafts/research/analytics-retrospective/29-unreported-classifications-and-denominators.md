# Missing classifications still belong in the denominator

October 27, 2026 UTC. Continues [receipt fidelity](28-receipt-export-fidelity.md); source baseline `0badd15`. Human-operated trials remain deferred by the owner. This is a reporting repair, with synthetic native-D1 acceptance; production prevalence is a separate question.

## Finding and counterexample

The existing **Assistants & signed clients** filter already discloses its union of declared on-demand clients and historical/unknown-role signed clients. `kind=ai-assistant` selects the narrower declared role. Neither signature verification nor that declaration establishes a human trigger. No new filter, historical role recovery, or reclassification follows from this audit.

The actual gap was in report completeness. Headline queries included nullable or unrecognized stored `reader_kind` values, but the composition SQL excluded null kinds and the decoder silently dropped unknown kinds or null reasons. The Unresolved selection only matched the literal `unresolved` kind. A missing signed-client reason also became Other, conflating unavailable evidence with an unreviewed origin.

The [maintained native reproducer](../../../scripts/check-unreported-kinds.mjs) pins baseline stats, partition and contract sources and compares them with the repaired report over identical stored rows. Fifteen deliberately synthetic rows exercise ten included events plus older, owner-excluded, referral-excluded, other-path and future boundaries. The [native result](unreported-kinds-local.json) records every selected report's metering.

| Selected seven-day `/audit` report | Before | After |
|---|---:|---:|
| Headline views | 10 | 10 |
| Views represented in composition | 5 | 10 |
| Sum of the five traffic groups | 6 | 10 |
| Unresolved selection | 1 | 5 |
| Combined assistants/signed selection | 3 | 3 |
| Declared assistant subset | 1 | 1 |

**These are fixture counts, not measured production incidence.** No unknown classifications were seeded into production. The initial fixture attempted an invalid named-client/coarse-traffic combination; it was corrected to respect the existing schema before the accepted comparisons. No constraint or classification rule was relaxed.

## Reporting contract

- Missing stored kinds project to Unresolved with `classification-not-recorded`.
- Unrecognized stored kinds project to Unresolved with `unrecognized-stored-classification`; arbitrary source strings are not published.
- A known kind with a null or empty reason stays in that kind, with `classification-reason-unavailable`. This also distinguishes a missing signed-client reason from Other.
- SQL normalizes before grouping and `COUNT(DISTINCT daily_client_id)`. Two bad source kinds sharing one client produce two views and one client in their combined reason. Clients must not be summed across groups.
- Both `traffic=unresolved` and `kind=unresolved` select the same missing/unknown projection, including known declared names whose stored kind is missing. Incompatible known roles still fail validation.
- The decoder rejects invalid counts, missing sections, invalid kinds/reasons, duplicate groups and a composition sum differing from the headline. It no longer returns a silently incomplete composition.

Stored rows are byte-equivalent in the native before/after check. Signature and native-category intersection tables retain their separate raw missing-kind marker; the composition projection does not manufacture an original classification. A four-row known-valid control has an identical full response. Owner/referral/path/future boundaries, all-time selection and empty results are checked.

The complete ten-event native report costs **7,489 → 7,513 reads**, zero writes; the four-row control costs **4,905 → 4,917**. These fixture costs are not forecasts. Report/cache version becomes `2026-10-27.8`; collection `.8`, classifier `.5`, verifier `.6`, signature evidence `.4` and receipt `.2` do not change. No schema migration or expanded diagnostic activation.

## Source cross-references

| Primary source | Consequence for this implementation |
|---|---|
| [SQLite IN/NOT IN and NULL](https://www.sqlite.org/lang_expr.html#the_in_and_not_in_operators) | `NOT IN` does not capture NULL; the selection explicitly includes `IS NULL`. |
| [SQLite aggregate functions](https://www.sqlite.org/lang_aggfunc.html) | `COUNT(*)` counts rows; distinct non-null clients are computed after the closed projection in the same SQL group. |
| [ExaSearchBot](https://crawler.exa.ai/), [ExaUser](https://crawler.exa.ai/exauser) | Search crawling and user/application-triggered retrieval remain separate declared roles. |
| [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) | A selected-component signature cannot supply a missing role or human trigger. |
| [ADR-0016.8](../../../../../docs/adr/0016.8-declared-client-roles-and-signer-evidence.md) | Preserve stored history and independent signing evidence; amend only the report projection. |

Sources checked October 27, 2026. New regression tests bring analytics to 172 passes; site tests remain 106 and workspace type checks pass. [Source checks](unreported-kinds-source-checks.json) also accept a 32-post isolated build and rendered fixture labels/scopes: All ten, Unresolved five, combined three and declared assistant one. Keyboard clearing restores ten. Some automated pointer activations had no observed effect; cause is unestablished and no pointer/lifecycle fix is claimed. At a settled 390px viewport the page width is 390px; this is no real-device trial. Initial resize inspection showed transient overflow before settling.

The [single bounded production SELECT](unreported-kinds-production-query.json), prepared and accepted in native local D1, selects seven-day All traffic for `/privacy`. Its fifteen events reconcile with fifteen composition views, with zero missing-kind or missing-reason rows in that selection. Wrangler `--command` uses 8,013 reads, zero writes, `changes=0` and `changed_db=false`, under a 50,000-read ceiling. This does not measure completeness across all retained history. Cold HTTP report work remains additional. Source delivery, activation and live/cache acceptance are separate gates.

## Remaining limits

This does not recover discarded User-Agents or establish R1's operator. Organic signed/native agreement, full loss/sampling attribution, replay/DNS boundaries, retention/lawful-basis work and human/device error rates remain open. The bounded actual selection establishes report completeness for that scope. The next acceptance step is the activated public report/cache and served article; broader history prevalence needs its own budgeted investigation. Human trials remain deferred.


## Activated release acceptance

[Release receipt](unreported-kinds-release.json) accepts source `345a653`, native Ready build and 100% activation. The scoped API matches the prepared SELECT's fifteen events and all composition rows; both evidence intersections sum to fifteen. A same-connection SJC MISS/HIT pair is byte-identical. Live methodology includes the unknown-kind projection; served Markdown matches the isolated build and the rendered article links this record. The article remains 1,250 words with 31 shaping prompts. No extra direct SELECT was needed for release acceptance; cold API fills/browser inspection are additional service work. The owned preview is stopped and viewport reset.

This completes the reporting repair's release, not the wider investigation. Next bounded work: isolate the observed pointer-activation discrepancy before changing event handling; any wider historical completeness census needs a separate budget. Human trials remain deferred. Private operational captures remain outside Git with a review date of October 31, 2026; that date is not a verified erasure/backup guarantee.


Follow-up: [Research 30](30-filter-pointer-targets-and-browser-trust.md) reproduces the pointer-target problem and accepts a local wrapping repair. It supersedes the unexplained local pointer behavior above; production activation/acceptance for that repair remains separate. The frozen denominator release receipt retains its original limits.
