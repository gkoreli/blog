# OSS Radar #17 research

November 19, 2026. A rollout can keep serving the old behavior while new work starts. Who keeps getting the old feature, how long can an old database client keep writing, and which mobile binaries can take a JavaScript update? The working selection follows those decisions at three different layers.

## Sources and selection

Five public repositories were considered on November 19. The pool came from public releases and implementation discussions, with Hot Updater and InsForge revisited from [issue #1](../../../posts/002-oss-radar-01-vercel-winter-2026-cohort.md). The search favored releases with a practical coexistence question and a path that could be exercised locally. It includes a September database release and an October return visit alongside November releases. [Discovery policy](../../../../../docs/worklist/oss-radar-weekly/sources.md).

| Project and release | Source of interest | Working selection |
| --- | --- | --- |
| [flagd v0.19.0](https://github.com/open-feature/flagd/releases/tag/flagd/v0.19.0), November 17 | OpenFeature's evaluator and [maintainer experiment guide](https://github.com/open-feature/flagd/pull/2096) explain how a stable hash can still put people in different groups when a rule changes | Tested. Who keeps the new variant when rollout weights grow or the pairs change order? |
| [pgroll v0.16.3](https://github.com/xataio/pgroll/releases/tag/v0.16.3), September 8 | The migration CLI and [client configuration discussion](https://github.com/xataio/pgroll/issues/829) show where the old and new application versions meet | Tested. Which writes and values survive a rollback when a new client has already written data? |
| [Hot Updater v1.1.0](https://github.com/gronxb/hot-updater/releases/tag/v1.1.0), October 19 | A [bare React Native user's report](https://github.com/gronxb/hot-updater/issues/1552) led to a change in how the CLI identifies compatible native builds | Return candidate. Source and discussion checked. The released fingerprint CLI trial is next |
| [Argo Rollouts v1.10.2](https://github.com/argoproj/argo-rollouts/releases/tag/v1.10.2), November 4 | Kubernetes controller release at `be8a6221c6c9751cd14497f31a2cb3c33690375a` | Background. A representative canary would add a cluster and traffic-routing layer to the allocation question |
| [InsForge v2.3.5](https://github.com/InsForge/InsForge/releases/tag/v2.3.5), October 23 | Prior issue's reserve and current storage-policy changes at `c1c886e775d286433e4b50c78c24335783e8fc00` | Background. The current release gives a storage-policy question for another investigation |

## flagd and who gets a variant

Application teams can ask the flagd process to resolve a flag for a given identity. In the released daemon, a fractional rule without an explicit hash input deterministically encodes the flag key and the context's targeting key as a CBOR pair. The evaluator hashes that input with Murmur3 and maps it into cumulative weight ranges in array order. Moving a pair can move its interval for every identity even when its weight stays the same. The source and Apache-2.0 license are pinned at `11037220611eab982261d2348b13147b4450b562`. [Hash input](https://github.com/open-feature/flagd/blob/11037220611eab982261d2348b13147b4450b562/core/pkg/evaluator/fractional.go#L143-L184) · [Bucket selection](https://github.com/open-feature/flagd/blob/11037220611eab982261d2348b13147b4450b562/core/pkg/evaluator/fractional.go#L278-L293) · [License](https://github.com/open-feature/flagd/blob/11037220611eab982261d2348b13147b4450b562/LICENSE).

The trial called v2 `ResolveString` on the released Linux ARM64 daemon over guest loopback. A separate flag confirmed each atomic file replacement had taken effect before the next requests. The same 128 invented keys went through every phase. [Fixture](flagd/cohort_trial.py) · [Results and binary hashes](flagd/results-2026-11-19.json).

| Rule | Keys assigned to `new` | Retained from prior phase |
| --- | ---: | ---: |
| `new` 10, `old` 90 | 12 | All 12 on an unchanged repeat |
| `new` 25, `old` 75 | 32 | 12 of 12 |
| `old` 75, `new` 25 | 21 | 0 of 32 |

The last edit moved the `new` interval from the beginning to the end. Fifty-three keys changed assignment across that edit. A request without a `targetingKey` returned the configured `old` variant with reason `DEFAULT`. These are counts for the saved keys and one rule on one daemon. The first attempt ended at startup because the fixture had omitted `HOME`. The accepted attempt supplied the guest user's home and checked a clean daemon exit.

For a simple ramp, an operator needs to track the actual interval assigned to the new variant. For an experiment that must hold control and test assignments fixed, flagd's maintainers recommend two separate fractional operations, one for enrollment and one for the split, with separate seeds. Their guide checks that arrangement and reports its own evaluator results. A two-stage run on the shipped daemon and a client-identity change remain open. [Maintainer guide and test description](https://github.com/open-feature/flagd/pull/2096).

## pgroll and what a schema rollback keeps

Two application versions can use views in different Postgres schemas while pgroll maintains both representations of a column. The released type-change operation requests a backfill and requires `up` and `down` SQL. Generated row triggers compare the connection's `search_path` to the latest schema name when deciding which conversion to run. An open collaborator issue records that other application uses of `search_path` can conflict with this choice. A Kotlin user evaluating canary deployment also asked how to coordinate draining new application traffic with a database rollback. The tested source and Apache-2.0 license are pinned at `777a5350e09012b29d26b9611122046d8a96fc1c`. [Type-change operation](https://github.com/xataio/pgroll/blob/777a5350e09012b29d26b9611122046d8a96fc1c/pkg/migrations/op_change_type.go) · [Trigger function](https://github.com/xataio/pgroll/blob/777a5350e09012b29d26b9611122046d8a96fc1c/pkg/backfill/templates/function.go#L17-L27) · [Design issue](https://github.com/xataio/pgroll/issues/829) · [Canary question](https://github.com/xataio/pgroll/issues/997) · [License](https://github.com/xataio/pgroll/blob/777a5350e09012b29d26b9611122046d8a96fc1c/LICENSE).

On PostgreSQL 17.12 the released CLI changed a non-null `quantity` column from text to integer with `quantity::integer` and `quantity::text` as its conversions. After backfill, the old view read `007` and the new one read `7`. One old client inserted `009` and one new client inserted `11`, each using its schema as `search_path`. The new client then updated the first row to `8` and back to `7`. Rollback removed the new schema and left `7`, `009`, and `11` in the old text column. Running the migration again and completing it removed the old schema and kept the three values as integers. [Versioned example](https://github.com/xataio/pgroll/blob/777a5350e09012b29d26b9611122046d8a96fc1c/examples/18_change_column_type.yaml) · [Fixture](pgroll/type_rollback_trial.py) · [Results and binary hash](pgroll/results-2026-11-19.json).

An early attempt copied a legacy `name` field that v0.16.3 rejects. A second attempt got both views and backfill, then failed when an insert qualified the new view with the connection still on the default `search_path`. The accepted run reproduced that rejection by the old column's `NOT NULL` constraint as a control. Rollback in this toy database restored the old column type and kept the writes made during the migration. The old client still saw the loss of the original padding in the updated row. Pooling, concurrent load, and production lock time remain open. [Client configuration guide](https://pgroll.com/docs/latest/guides/clientapps).

## Hot Updater and the installed native interface

Issue #1 covered Hot Updater as an over-the-air update service for React Native teams leaving CodePush. A reconstructed March 19 source checkpoint at `b1f3fb155fe6b06acd27bcc1139de8450f7f35b1` used `@expo/fingerprint` directly. At the October release pin `bb510d3db7348b6eb0285c89292dac660faaf6f2`, the CLI uses the adapter's fingerprint implementation when supplied and falls back to `reactNativeCliFingerprint`. The owner describes v1.1.0's bare and Rock adapters as tracking the JavaScript-to-native interface so that version-only and build-number edits keep the same fingerprint. The owner also says the engine upgrade changes the fingerprint once and requires new store builds. [March source checkpoint](https://github.com/gronxb/hot-updater/blob/b1f3fb155fe6b06acd27bcc1139de8450f7f35b1/packages/hot-updater/src/utils/fingerprint/index.ts) · [Current dispatch](https://github.com/gronxb/hot-updater/blob/bb510d3db7348b6eb0285c89292dac660faaf6f2/packages/hot-updater/src/utils/fingerprint/nativeFingerprint.ts) · [Merged change](https://github.com/gronxb/hot-updater/pull/1570) · [Owner's release note](https://github.com/gronxb/hot-updater/issues/1552#issuecomment-6259374272).

The proposed review is scoped to the fingerprint CLI under the repository's root MIT license. The server and console have separate license files with a hosted-service attribution condition. Next, run the v1.1.0 CLI against the same bare React Native fixture after a build-number change and after a native codegen specification change. Bundle delivery and on-device behavior would require a separate trial. [Root license](https://github.com/gronxb/hot-updater/blob/bb510d3db7348b6eb0285c89292dac660faaf6f2/LICENSE) · [Server license](https://github.com/gronxb/hot-updater/blob/bb510d3db7348b6eb0285c89292dac660faaf6f2/packages/server/LICENSE) · [Console license](https://github.com/gronxb/hot-updater/blob/bb510d3db7348b6eb0285c89292dac660faaf6f2/packages/console/LICENSE).

## Reproduce the two executed trials

The receipts use release artifacts verified against GitHub's asset digests. The trials ran on Alpine 3.23.4 ARM64 with Python 3.12.13 in a Lima VZ guest. Use a disposable guest and a fresh output directory for each run. For pgroll, run as an unprivileged guest user with `initdb`, `pg_ctl`, and `psql` on `PATH`. The fixture starts a fresh cluster on its own Unix socket and stops it at the end.

```sh
python3 flagd/cohort_trial.py /path/to/flagd /tmp/flagd-trial
python3 pgroll/type_rollback_trial.py /path/to/pgroll /tmp/pgroll-trial
```
