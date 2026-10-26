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
