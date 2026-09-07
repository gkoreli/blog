# Maintaining the referral reporting policy

[ADR-0016.6](../../../docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md) defines the model, matching semantics, provenance, and limits. Policy JSON files and SHA-256 commitments are permanent definitions. The generated active module chooses the runtime policy; it is not the archive. Version `2026-09-06.1` was an unshipped local-only candidate documented in research artifact 17, not a replayable archived policy. `2026-09-06.2` is the first archived policy.

## Review or update a source

Resolve a full upstream Git revision and inspect the change before importing. Independently verify the raw `spammers.txt` SHA-256, then pass both to `scripts/referral-policy.ts capture --revision REVISION --sha256 SHA256` through `pnpm -C packages/blog exec tsx`. The command downloads only those pinned GitHub files, validates them, and refuses to overwrite an existing archive, including a partial failed capture. Never replace archived files to make an integrity failure disappear.

Copy a policy JSON to a new `YYYY-MM-DD.N.json`, set its matching version and source revision, and record local rule reasons/evidence and display changes. Local rules may include or exclude, for exactly one host or its entire subtree. A local override wins over upstream; more specific local hosts win over broader local hosts; exact-host scope wins a same-host tie. Evidence must be an existing repository file or HTTPS reference. Keep evidence artifacts in Git and record the release commit so their reviewed versions remain recoverable.

Build the new version with `scripts/referral-policy.ts build --policy NEW-VERSION --previous OLD-VERSION`. The command prints upstream additions/removals and flags local/display changes, writes a new commitment, and updates the generated active module. Inspect both policy files to review the detailed local/display diff. Changing an existing committed definition fails; create another version for corrections. Both previous and next source archives remain checked in.

The current policy can be checked offline:

```bash
pnpm -C packages/blog check:referral-policy
pnpm -C packages/analytics test
pnpm -C packages/blog test
pnpm typecheck
pnpm build
```

`pnpm build` includes the policy integrity check. Use `node packages/analytics/scripts/referral-benchmark.mjs` after the analytics test compilation for a local growth measurement; its output includes synthetic counts, timings, and EXPLAIN plans, not production visitor data. No fixed timing assertion runs in CI.

## Assess retained evidence privately

Run the two SELECTs in `scripts/referral-review.sql` using the [analytics README command](../README.md#referral-abuse-defense). Keep their aggregate output private. Assess the retained hostnames under an archived policy:

```bash
pnpm -C packages/blog exec tsx scripts/referral-policy.ts assess \
  --policy 2026-09-06.2 \
  --input "$referral_review_dir/results.json" \
  --out "$referral_review_dir/assessments.json"
```

The assessment file records source/policy hashes, input-file hash, and each hostname's matched rule, reason, inclusion and display outcome. It includes private names and must not be published automatically. Only counts go to stdout. Failed D1 statements or nonzero write metadata are rejected. Output files are created with mode 0600 and cannot overwrite earlier evidence. The file evaluates hostnames; retain its linked input for the original counts and path/date distributions.

## Record an actual release

After deployment, record the deployment's actual ID and activation time, code commit, environment, policy version/hash, and verification artifact. Append corrections and rollbacks; do not revise previous activation records. The first verified activation is recorded in [2026-09-07.1](activations/2026-09-07.1.json), with [live verification](../../blog/drafts/research/readers-vs-bots/19-referral-policy-activation.md).

Create a private report capture after the live API advertises the reviewed policy:

```bash
pnpm -C packages/blog exec tsx scripts/referral-policy.ts capture-report \
  --policy 2026-09-06.2 \
  --url 'https://gkoreli.com/api/stats?range=30d&traffic=browser' \
  --out "$referral_review_dir/published-report.json"
```

The command validates the live policy and public names before writing the exact received response text and hash. A stale or pre-policy response fails; it cannot masquerade as a verified activation. Capture time, report `updatedAt`, and deployment time are separate facts. Store the private artifact durably in the author's evidence archive and put its path/hash and reviewed aggregate findings in the release record; a `/tmp` path alone is not durable retention.

Replaying a policy over today's retained D1 data answers what that policy reports now. Reconstructing an old public report additionally needs its captured response or the exact data/code/owner state. New source versions never justify deleting observations or rewriting old research counts.
