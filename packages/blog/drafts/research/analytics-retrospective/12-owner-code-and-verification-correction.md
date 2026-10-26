# Owner-code usability and verification correction — October 25 Pacific / October 26 UTC

The owner reached the setup page but did not remember the existing ADMIN_SECRET. That exposed a usability gap: the page offered a working endpoint without a practical credential path. The owner asked whether something else could be entered. No admin secret was read, reset or put in chat.

## Scoped temporary alternative

The existing owner endpoint now also accepts an optional OWNER_MARK_GRANT secret containing a 256-bit random bearer token, issuedAt and expiresAt. Its duration must be positive and no longer than fifteen minutes. The server rejects malformed, oversized, future, expired and nonfinite-clock grants. Only /api/owner reads this binding; newsletter/admin authentication continues using ADMIN_SECRET. The original admin path remains valid.

Possession permits marking the current request's daily identity while the grant is valid. It is not a person identity or a one-time credential. The resulting mark remains scoped to the client inputs and UTC day, not the token's remaining lifetime. The code is generated privately, never stored in Git or query strings, and can be removed from the Worker after acceptance. The form says Owner code and explicitly distinguishes it from a Cloudflare account password. No new publicly callable token-issuance endpoint or persistent browser storage is added.

Local acceptance: **61 analytics tests and 106 blog tests pass**, with workspace typechecks. New cases cover exact issue/expiry boundaries, wrong tokens, invalid clocks, malformed/overlong grants and the unchanged admin fallback. Activation, private grant issuance, actual browser marking and public exclusion remain separate acceptance steps.

## Correction to the previous verification claim

The hardening release reported 106/106 blog tests passing. That claim was wrong for its final source: the RUM fixture had gained two excluded owner-path loads but retained its old expected excluded total of five. The final combined command continued into a successful typecheck, and the agent missed the test failure. Its retained log contains **105 passes and one failure**, with actual seven versus expected five.

The runtime filter correctly excluded the two added owner paths. This continuation changes the expected fixture total to seven and reruns the blog suite separately: **106/106 pass**. It does not change the runtime RUM filter or historical captures. The failed run remains in the private archive, and the release receipt now carries this correction rather than silently calling the prior run successful.

The earlier 59 analytics tests and local D1/build results are unaffected. Temporary-grant checks bring analytics tests to 61. A later passing run does not retroactively make the previous report accurate.

## Production acceptance — October 26, 03:02–03:05 UTC

Source `f23f470` activated at 03:01:23 UTC. A private fifteen-minute grant was installed through ordinary Wrangler secret handling, with no admin reset. The agent entered it into the existing production form in the **Codex in-app browser**, submitted the form and opened its /privacy verification link. The form confirmed the October 26 UTC mark and cleared the input. This is an actual browser UI flow operated by the agent; it is not a claim that Goga clicked it or that his separate Chrome profile is excluded.

The [sanitized receipt](owner-browser-acceptance.json) and [exact SELECTs](owner-browser-verification.sql) preserve acceptance. Both aggregates passed Miniflare/workerd local D1 first. Production returned one newly persisted owner mark and one matching /privacy observation, version 2026-10-26.2, with zero publicly eligible views under the report's owner predicate. Its internal category and null source path are consistent with the unrecognized /owner source; this does not test an origin-only homepage referrer.

A cold seven-day Browser /privacy report returned **two views**. The independent grouped reconciliation found **three raw matching views, one owner-excluded, zero referral-excluded and two included**. The pinned local referral evaluator assessed the privately captured grouped hosts. No matching row was newer than the public calculation time. An equivalent repeat returned HIT and identical bytes. This checks the selected report and shared public selection; it is not a separate live exercise of every panel/filter combination.

The first Wrangler --file execution returned only an execution summary, costing six reads. The --command result retrieval cost six more, and report reconciliation cost 2,292: **2,304 measured SELECT reads, zero row writes**, within the 20,000 ceiling. The successful mark itself writes an owner row; public cold-report work and migration bookkeeping are additional. The historical 14,866-row audit population is unchanged by this later check.

After use, the temporary binding was removed; that release activated at **03:03:43 UTC**. A secret-name-only listing confirmed its absence and the existing ADMIN_SECRET binding's presence. The local plaintext grant was deleted. The grant's removal does not undo the daily owner mark. No secret value, client ID, IP address or real unapproved referrer hostname is published.

**Remaining gate:** a human-operated visit from Goga's intended normal-browser profile and that profile's current-day persistence/exclusion check. The agent-operated in-app flow proves the form/endpoint/navigation/report path for its recorded client inputs. It does not silently substitute for the human/browser condition in ADR-0016.9 or complete the paired beacon-calibration matrix. Native sampling/retention/join acceptance and signature-profile work remain open.

Publication acceptance: the article update from `d870aed` is served with Markdown byte-for-byte equal to the isolated build, and posts.json reports fourteen complete shaping messages. Owner/article HEAD checks return 200. This is availability/Markdown/provenance acceptance, not a rendered article-layout test. [Receipt](owner-browser-acceptance.json).
