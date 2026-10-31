# Install the analytics, then decide what its report means

October 31, 2026 UTC. Continues the [fresh-schema result](14-fresh-install-portability.md) after the owner's “Go ahead.” Test setup outside the blog and whether the resulting report supports an operator decision. These are agent-operated local trials, not independent customer adoption or human calibration.

## Preserve the failures before changing the setup

A separate agent starts from a committed `f2c1c48` source archive with no `node_modules`, following the setup guide under an imposed offline condition. Installation stops at `ERR_PNPM_NO_OFFLINE_TARBALL`, first naming Wrangler 4.71.0. No server starts. This demonstrates an incomplete local cache, not failure of the guide's normal online installation. The agent preserves the command, exit status and first failure without inventing a successful operator result.

A second, manually prepared project contains only the analytics source/schema, a Worker using the package export and its own dependency tree. Offline resolution initially lacks ipaddr.js metadata. An authorized registry install succeeds, but inspection exposes another condition: outside the repository, mise selects Node 20.20.2 and pnpm 11.25.0. The install log records pnpm 11.25.0. Preserve those artifacts, copy the runtime pin and repeat with Node 24.14.1/pnpm 9.15.4, then install a separate Wrangler 4.71.0. Lifecycle scripts are disabled for these trial installs.

That standalone Worker installs its local schema and serves twelve controlled HTTP requests. The runtime warns that the requested March 6 compatibility date exceeds its March 1 support and falls back. Successful startup alone would have hidden this mismatch. Cloudflare's [compatibility-date contract](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) treats the date as a choice of runtime behavior, not a runtime version. Align only the local example and its regression with the supported date; leave production configuration untouched.

## Make the working setup reproducible

The new [local-project generator](../../../../analytics/scripts/create-local-project.mjs) creates a new directory, refusing an existing target. It copies library TypeScript, the fresh schema and code licence; uses a private file dependency; includes the evaluated runtime/package-manager pins and Wrangler version; and generates two distinct local keys in ignored, mode-0600 `.dev.vars`. It provisions no cloud resources and supplies no deployment command. It strips repository test scripts from the copied package so the consumer does not inherit blog-tooling dependencies.

The [updated guide](../../../../analytics/examples/minimal-worker/README.md) supplies both standalone and in-repository paths. The actual generated project installs offline **after** the preceding online attempts populate the cache, migrates its own local D1 and runs its own Wrangler. This is a warm-cache acceptance result, not a cold offline-install guarantee. Its March 1 compatibility date produces no fallback warning.

The generated copy captures four concurrently edited verifier source files. Its 72 TypeScript inputs are frozen under private hashes; this trial adds no acceptance claim for those other changes. The earlier manual trial uses committed baseline source. The [receipt](local-project-trial-checks.json) separates those inputs rather than treating them as one committed release.

## A report that changes an operator decision

Both HTTP trials produce the same controlled composition:

| Observation | Result |
| --- | ---: |
| Stored/public page events | 6 |
| Rotating daily client IDs | 3 |
| Headless-browser events | 3 |
| Unsigned ExaSearchBot declarations, `ai-search` | 2 |
| Unresolved client events | 1 |
| Events without referrers | 6 |

Read `totals.views`, `totals.dailyClients`, `byKind` and `byAgent` together. Six events do not establish six readers; three daily IDs do not establish three people. The Exa name is an unsigned declaration, and missing referrers leave acquisition unknown. This fixture cannot choose the blog's next article. It does show why a total without composition is inadequate for that decision. HEAD, prefetch, direct Markdown and the missing page do not add observations. The trial waits for six stored acknowledgements before its final report, rather than treating page delivery as persistence.

The example now logs the existing closed calculation receipt. Its empty report returns **100 local D1 reads**, and its six-event report returns **5,320 reads**; both report zero writes. Attempt counts remain unavailable, so metadata stays partial. These are provider-returned local last-attempt counters, not production costs, global quota consumption or a per-reader cost model. Observation writes are separate.

**Decision:** keep this starter local until shared report caching and query budgets are deliberately implemented. Installing the source package without the blog is viable under these conditions; exposing its uncached report publicly is not the next step. The existing blog cache is separate and is not changed by this experiment. The setup guide now makes both report interpretation and this operating boundary explicit.

## Acceptance and next step

The scoped generator test passes, **393 tests in the available combined analytics tree** pass, workspace types pass, and the existing 22-request native portability regression passes after the example change. Both owned servers stop; raw logs, frozen requests/reports and source snapshots are saved under the receipt's 103-file private manifest. Generated secret values are excluded from that archive and Git. No production request, production SQL, human label, optional capture activation or deployment is performed.

This bounded setup trial is complete. Independent customer use, real content demand and audience growth remain unmeasured here. The next product iteration can provide a small reusable report-cache integration with bounded keys, invalidation and measured misses/hits; it should use the existing blog cache contract before inventing another policy. Public deployment, privacy/retention choices and the six previously recorded measurement inputs retain their own acceptance requirements.
