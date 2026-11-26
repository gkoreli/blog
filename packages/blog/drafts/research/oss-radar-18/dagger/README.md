# Dagger Dockerfile COPY

Dagger v0.21.12 shipped November 17 at `6ccf00943c1b4f065dea791b6d6ee956573fdabe`. A CI user reported slower Dockerfile builds after restoring the runner's disk snapshot. They had upgraded Dagger and changed a Dockerfile cache mount, so their report leaves the effects of those changes open. Version 0.21.8 brought content-based identity to Dockerfile layers. The maintainers later isolated the cost of hashing the whole copy result and backported a narrower checksum. The 0.21.11 release at `631cdb609aaddc0037c2ba713e7642cadf645ff4` is the baseline. [Release](https://github.com/dagger/dagger/releases/tag/v0.21.12) · [Earlier layer-cache change](https://github.com/dagger/dagger/pull/13765) · [CI user's report](https://github.com/dagger/dagger/issues/14749) · [Backport and maintainer measurements](https://github.com/dagger/dagger/pull/15040) · [Apache-2.0 license](https://github.com/dagger/dagger/blob/6ccf00943c1b4f065dea791b6d6ee956573fdabe/LICENSE).

The Dockerfile-compatible copy implementation loads and evaluates the source directory, then resolves the selected paths for an unfiltered `COPY`. It combines their paths and content hashes with the destination parent's identity and arguments such as ownership and permissions. The digest becomes the result's cache identity. The filtered path used for `COPY --exclude` still performs the copy and hashes the result. The shipped change also narrows the checksum of a single source file. [Copy identity](https://github.com/dagger/dagger/blob/6ccf00943c1b4f065dea791b6d6ee956573fdabe/core/schema/directory.go#L594-L686) · [Source checksum](https://github.com/dagger/dagger/blob/6ccf00943c1b4f065dea791b6d6ee956573fdabe/core/contenthash.go) · [Engine checksum](https://github.com/dagger/dagger/blob/6ccf00943c1b4f065dea791b6d6ee956573fdabe/engine/contenthash/checksum.go).

## Release trial

Both published Linux ARM64 CLIs ran their matching engine images on Docker 29.5.2 in an Alpine 3.23.4 guest. The scratch source stage holds two files. In the final stage a base file is written first, then `COPY --from` replaces it with the selected file. Each run reads the output file and makes a separate request for the files visible to Dagger's host directory. The receipt records the checksum requests under the specific final copy span. The 0.21.12 engine already held an initial result from fixture development. The edited inputs below exercised the checksum path in both engines. [Fixture](copy_cache_trial.py) · [Engine digests, bytes and copy spans](dagger-comparison-2026-11-24.json).

| Input change | 0.21.11 final copy | 0.21.12 final copy | Output on both versions |
| --- | --- | --- | --- |
| Unchanged repeat | Cache hit | Cache hit | `selected-v1` |
| Adjacent file changed | Checksum request for result root | Checksum request for `/selected.txt` | `selected-v1` |
| Base file changed before the final copy replaces it | Checksum request for result root | Checksum request for `/selected.txt` | `selected-v1` |
| Selected file changed | Checksum request for result root | Checksum request for `/selected.txt` | `selected-v2` |

The edited runs reached the final copy even when its output stayed the same. The trace shows the hash input at that stage. These small builds leave the maintainer's memory and timing claims as separate evidence. In another 0.21.12 fixture, `COPY inputs/ /package/` produced both input files and requested a checksum for `/inputs`. With `--exclude=adjacent.txt`, the artifact contained only `selected.txt` and the checksum request named the result root. Both observations came from a scratch stage with a relative `inputs/` directory holding those two files. [Earlier copy code](https://github.com/dagger/dagger/blob/631cdb609aaddc0037c2ba713e7642cadf645ff4/core/schema/directory.go#L596-L637) · [Filtered and unfiltered observations](dagger-filter-2026-11-24.json).

## A file edit before the checksum

The first comparison kept file modification times fixed. It stopped at the assertion for the selected-file edit because 0.21.12 returned the previous bytes. The revised trial advanced modification times for the ordinary edits and used a separate control to locate the stale read. That control saved `selected-v3` locally at the same size and modification time. The two engines' host directories and cached copies both returned `selected-v2`. After advancing the same file's modification time, the host directory and output both returned `selected-v3`. The pinned file-sync diff uses metadata including size and modification time to decide whether to read a regular file again. [File comparison](https://github.com/dagger/dagger/blob/6ccf00943c1b4f065dea791b6d6ee956573fdabe/engine/filesync/diff.go#L173-L190) · [All seven phases per release](dagger-comparison-2026-11-24.json).

For a pipeline that generates files with preserved timestamps, read the imported file before interpreting a Dockerfile cache trace. This result covers the engine's ordinary host directory on one Linux guest. The fixture uses local engine images and reads via the [GraphQL API](https://docs.dagger.io/api/reference/).

```sh
python3 copy_cache_trial.py /path/to/dagger-0.21.12 /path/to/dagger-0.21.11 /tmp/fresh-dagger-trial
```

## November 26 upstream check

The latest stable release endpoint still returned v0.21.12. An open Dagger change describes dependency steps rerunning across Git commits on v1.0.0-beta.21 when the selected file was unchanged. Its proposed fix covers narrowed Git reads and API `withDirectory` copies with `include` patterns. The source distinction matters here because the tested path is Dockerfile `COPY`, which already has its own identity implementation. The PR remained open at `633ff7e38d351ccb0f79014596bc4eb1491bcbe7` and supplies maintainer-reported evidence for a separate path. [Stable release](https://github.com/dagger/dagger/releases/tag/v0.21.12) · [Open narrowed-read proposal and its reproduction](https://github.com/dagger/dagger/pull/14990).
