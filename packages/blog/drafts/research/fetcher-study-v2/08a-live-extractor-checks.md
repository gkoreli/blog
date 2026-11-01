# Live-tail extractor checks

November 1, 2026 UTC. Continues the [live trace method](08-live-trace-method.md). These are offline artifact and local native SQL checks, not assistant findings or a fresh production query.

Eight [maintained controls](extract-live-fetches.test.mjs) pass under Node 24.14.1 with the workspace's explicit tsx loader:

```sh
node --import ./packages/blog/node_modules/tsx/dist/loader.mjs --test \
  packages/blog/drafts/research/fetcher-study-v2/extract-live-fetches.test.mjs
```

They cover formatted object streams with quoted braces/escapes/nesting and an incomplete suffix; malformed completed objects and non-JSON noise; exact origin/single-label/frozen attribution; omission of sensitive headers, arbitrary UA text, raw signature and nonce; exact unique attempt/stored joins; text IDs above JavaScript's safe-integer boundary; invalid/overflow/SQL-shaped reference rejection; closed handling of unknown receipt fields; and malformed time/status values.

The initial accepted private extraction is `/private/tmp/fetcher-live-20261101/extract-03`: **14 completed JSON objects, one matched operator-control invocation, one returned joined primary-key reference, zero malformed completed frames, zero outside-text fragments, and zero unparsed-suffix bytes**. Those counts describe that snapshot. The live stream can grow; they are not the final trial denominator. All matched raw records and exact references remain private.

The frozen SELECT's SHA-256 is `2a7cf088ab8ed3368efbfbc7fae571be230748dad77a14f5e6ec9e4639ea4cca`. Current source schema SHA-256 is `a53392e14c69a62ce1c73c9f8c24afff2e773f68d55831490896e45fa6f93099`. Native local D1 selects the expected one seeded reference and reports `SEARCH page_observations USING INTEGER PRIMARY KEY (rowid=?)`. It exercises the actual prepared projection, not a narrower substitute. The source SELECT includes stored signature/classification/network evidence and excludes source addresses, daily client identifiers, referrers and optional diagnostic payloads. Actual production contents, costs and persistence remain for the parent investigator's separately controlled remote readback.

Initial failed attempts are retained privately:

- A root-level `--import tsx` invocation failed because tsx is a blog-package dependency; the command now resolves its explicit workspace loader.
- The first native attempt could not open a loopback listener under the default sandbox. Reviewed local execution was then available.
- The first reviewed native attempt used D1 `exec` on multiline schema text and failed with incomplete input. The corrected preparer follows the repository's existing native harness: strip line comments, prepare complete semicolon-delimited statements, then run a D1 batch against the fresh canonical schema. The failed `extract-02` receipt/log remain distinct from accepted `extract-03`.

No remote D1 statement, site request, protection change, credential change or capture binding activation was performed by this implementation lane. The script is a tool for interpreting the real captured trials; its generated test controls are not article findings.
