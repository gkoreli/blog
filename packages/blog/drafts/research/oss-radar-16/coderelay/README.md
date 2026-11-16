# CodeRelay qualification fixture

November 16, 2026. **Eleven conditions passed against the actual pinned hub HTTP server, SQLite store and schema code.** This is bounded project qualification; the full local agent/GUI path remains untested. Read the [declaration](protocol.md), [source hashes](source-hashes.json), [normalized attempts](attempts.json) and [accepted result](results-2026-11-16.json).

Explicit agreement rejected an obsolete contract A after the author revised to B. Manual task acceptance carries no observed SHA and accepted the task at B. Refusal controls still enforced outstanding author consent, assignee permissions and task state. A completion receipt persisted after close/reopen without independent Git or test validation, as the project documents.

The next experiment must use the actual local decision service to test an author revision while a thread is being launched. The API result and inspected source support that question; they are not a reproduced running-product race.

## Reproduce

Copy this directory into an owned temporary folder. Use **Node 24.13.1 or later in major 24**, Python 3 and npm; check `node --version` in that folder because a version-manager default can differ outside the blog. The recorded run used 24.14.1. No application installer or root workspace setup is needed.

```sh
python3 prepare.py
npm ci --ignore-scripts --no-audit --no-fund
node build.mjs
node trial.mjs > local-result.json 2> local-stderr.log
```

`prepare.py` downloads six raw files from the exact upstream commit, including its MIT license and barrel-export proof. It verifies byte counts and SHA-256 before writing `.work/source/`; the build checks those hashes again. Dependencies are exact in `package.json` and the retained lockfile. esbuild's platform binary is supplied by its optional package even with lifecycle scripts disabled. The portable check installed this lock, rebuilt the fixture and reproduced the same eleven states; it adds no independent condition.

The fixture opens only a loopback listener on an ephemeral port, uses synthetic messages and owns its temporary database. The database is retained outside the repository for inspection; no credentials or random member IDs appear in the JSON receipt. It closes its own server and store. A sandbox that prohibits local listeners needs permission for this owned loopback run.

The expected receipt has `passed: 11`, the exact source SHA and the declared condition states. A source, dependency or runtime mismatch should be investigated, not relabeled as successful product behavior. Raw stderr, runtime logs and databases remain local; the committed attempt record summarizes meaningful failures without publishing operational captures.
