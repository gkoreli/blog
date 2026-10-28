# Documented methods for DuckDuckBot and Google-Agent

October 27 Pacific / October 28 UTC. Implements the bounded follow-up from [the capability audit](45-goal-and-method-coverage-audit.md). Human trials remain deferred; this is vendor-method engineering, not a human-detection experiment.

## What changed and why

The earlier catalogue recognized DuckDuckBot and Google-Agent without a configured per-client verification method. We now check their dedicated published IP feeds, retaining the existing strict `ipaddr.js` boundary, fixed endpoints, source hashes, freshness checks, relay abstention and four-source request budget. New feeds are appended so the priority of existing sources does not change.

| Declaration | Primary documentation | Deliberately scoped method |
|---|---|---|
| DuckDuckBot | [DuckDuckGo bot page](https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot) | [Published IP feed](https://duckduckgo.com/duckduckbot.json); no inherited mapping for DuckAssistBot. |
| Google-Agent | [Google's specific client entry](https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers#google-agent) | [Dedicated agent IP ranges](https://developers.google.com/static/crawling/ipranges/user-triggered-agents.json); no inherited mapping for Googlebot or Gemini Notebook. |
| Google-Agent signing | [Google's experimental guide](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth) | Compare a locally verified selected proof to `https://agent.bot.goog`. The documented `g` label is supported. Not every request signs. |

No reader IP is forwarded to these sources or added to their URLs. No dependency, schema, optional capture, native rule, classifier or cryptographic verifier policy changes. Native feed controls reuse the hash-committed public snapshots captured in research 45: 486 DuckDuckBot prefixes and 20 Google-Agent prefixes. They are dated fixtures, not a fresh network-health check.

## Keep selected proof and declaration conflicts separate

Previously, the signature-method table contained only Exa. Its `every(origin matches)` comparison did not distinguish several expected origins. Adding Google unchanged would turn a partial match into a global mismatch. Against the accepted source `96fab49`, a verified Exa-origin verdict with ExaUser + Google-Agent instead appears as matching-origin because Google is still unmapped. Both behaviors lose the extension's important conflict.

The new child profile records expected-origin count and the numbers of documented declarations matching or differing from the **selected** verified proof. These counts are null when no applicable, non-injected proof exists. Distinct configured origins produce `conflicting-origins` even when a signature is absent. A selected match remains inspectable without resolving the conflict. Duplicate/reordered declarations do not change the result. Unmapped-declaration counts retain their existing overlap.

Reports add two event counts: declarations naming conflicting signing origins, and the subset whose selected proof matches one of them. They are not independent people, unique agent actions, proof of the unsigned User-Agent, or a multi-signer consensus. Existing candidate-selection/unassessed evidence remains separate. The UI explains partial Google rollout and rejects an older cached payload lacking the new counts.

The method registry is separate from reviewed directory-publication facts and approved public signer names. Those two catalogues are unchanged in this iteration; no generic key trust or new public-name approval follows from adding a declaration association. A valid Google-origin proof can therefore remain Other in the signer-name breakdown while its documented-method match is recorded. This is an explicit remaining visibility improvement, not a failed signature.

## Native results, exclusions and cost

[The maintained check](../../../scripts/check-documented-methods.mjs) uses native workerd, local D1, the saved public feed bodies and newly generated test keys served through an intercepted directory transport. Signing bytes are constructed independently of the application's signature-base builder. The initial native signing control omitted the dictionary-member selector and correctly failed before discovery; the corrected control signs `signature-agent;key="g"`. That fixture correction is not a production verifier repair.

[Saved results](documented-methods-local.json):

- Eight native IP controls cover listed, not-listed, unavailable and Worker-relay states for each new declaration.
- Twelve actual collector/storage controls cover unsigned, signed, unrelated-origin, mixed-origin, related-but-unmapped, owner-excluded and referral-excluded inputs. Stored child statuses match the emitted receipts. Ordinary unsigned Google-Agent stays not-verified.
- Ten included events contain four signing-origin conflicts; two have a selected match. One owner record and one excluded-referral record are omitted correctly. Neither excluded matching control inflates the included matching-origin total.
- The same native local report costs **7,547 reads before and after**, zero extra reads and zero diagnostic writes. Common output is identical after removing the two new fields. Scoped and empty reports pass.

These are controlled local outcomes. A generated test key substituted at a vendor endpoint does **not** authenticate a Google action. No new production visit or diagnostic SELECT is used for these tests. Native Cloudflare cryptographic agreement, authentic current-profile vendor traffic and population error rates are not established.

## Versioning, checks and delivery

Collection becomes `2026-10-28.7`; the IP and documented-signature child profiles become `2026-10-28.1`; report/cache becomes `2026-10-28.2`. Classifier `.27.5`, verifier `.28.6`, signature envelope and directory-publication profile remain unchanged. Historical stored evidence is not reclassified through today's registry.

The source-derived catalogue now has **48 recognized declarations / 13 with at least one configured per-declaration method / 35 with neither**. Ten IP sources map eleven declarations; two documented signing origins map three. These are catalogue counts, not verified traffic shares.

Analytics 226/site 106 tests, workspace type checks, content validation, helper syntax and an isolated 32-post production build pass. The shared development output is untouched. The retrospective gains one concise paragraph linking these methods and preserving the authentic-Google limitation; raw prompts remain at 31. [Check commitments](documented-methods-checks.json) distinguish local evidence from publication and activation. Source delivery, native deployment activation and measured production acceptance must be recorded separately.

[Publication acceptance](documented-methods-release.json) records source `af96048`, its native Ready build (44 seconds), and Wrangler's 100% deployment to Worker `7493e47d-3c4f-4057-88fd-29ea7637fa12` at 02:51:51 UTC. All seven expected binding names remain present; the optional owner-grant/diagnostic/calibration bindings remain absent. The served article Markdown and dashboard client bytes match the isolated build; the dashboard HTML contains the new explanation. Three bounded HTTP GETs include one eligible publication probe supplied with the existing referral exclusion. No report API or diagnostic SELECT is called; this probe's persistence/exclusion is not separately read back.

Private evidence is preserved in the restricted `2026-10-28-documented-methods` archive with a hash manifest and three references to the prior public-source captures. Raw responses and fixture records stay outside Git. October 31 is a review date, not an automatic erasure claim.

Next: improve the separate Google directory/display visibility and test genuine signed traffic when available. Do not manufacture a vendor proof or reopen human trials. Keep replay, native agreement, human/device accuracy and privacy/retention decisions open.

[Research 47](47-google-publisher-and-display-history.md) completes the separate Google publisher/display mapping and versions historical receipt projections. This release remains the pre-extension record.
