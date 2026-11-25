# restic and partially changed restore targets

restic v0.20.0, tag commit `9c88ff768f10c192dc6a87619a65a16374080e33`, rewrites a changed, hard-linked target in full. A user of older versions reported damaged byte ranges when pre-seeding a restore from an earlier one using hard links. The maintainers found that the restorer recorded matching chunks from the old file before the writer replaced that file. The fix clears those matches when the file needs restoration and has multiple links. A new file then receives every chunk. [Release](https://github.com/restic/restic/releases/tag/v0.20.0) · [User report](https://github.com/restic/restic/issues/22085) · [Fix and upstream test](https://github.com/restic/restic/pull/22086) · [BSD-2-Clause license](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/LICENSE).

## Release trial

One local backup repository held two versions of a synthetic 8 MiB file and an unchanged labels file. Seven of the eight stored data chunks were shared between snapshots. The fixture restored the earlier version, made a conventional copy and a hard-linked copy of the restore, then restored the newer snapshot over each using `--overwrite if-changed`. The checks compare the whole file's SHA-256 and whether its inode is still shared with the earlier restore. This ran on macOS 27.2 ARM64. The official `.bz2` asset matched SHA-256 `0962c515acd9fb6937a658e9d8505200f72a6a0c6a2d334c0290b8002377dfb7`. [Fixture](restore_links_trial.py) · [Results](macos-2026-11-24.json).

Both targets matched the newer snapshot's expected bytes. In the hard-linked target, the changed file received its own inode, the unchanged labels kept their link to the earlier restore, and the earlier bytes stayed intact. An initial attempt passed a tree ID to `restic cat tree`. The released command expects a snapshot and subfolder. The first run stopped at that metadata check, and the accepted run used a fresh repository and `snapshot:/src`.

The earlier report describes files with the expected size and modification time and damaged contents. A whole-file hash verifies the result of a restore. The trial covers one local repository and one filesystem. The report's network-backed repository and NFS destination describe a separate environment.

## November 25 incremental backup control

The default incremental backup classified an unchanged repeat as one unmodified file and added zero data blobs. We then changed the source to `edition-B` with the same size, modification time, and inode. Its `ctime` advanced. The next ordinary backup reported one changed file and added one data blob. Reading the file from that snapshot gave `edition-B`, matching a forced reread. The default and forced results agree on both Linux and macOS ARM64. [Linux evidence](../mtime-alpine-2026-11-25.json) · [macOS evidence](../mtime-macos-2026-11-25.json).

The archiver can reuse a prior file's blob list when metadata matches and the repository still has those blobs. Its default regular-file comparison includes `ctime` and inode alongside size and modification time. This check concerns a local Unix file edit and a default backup configuration. The Linux ARM64 release archive matched SHA-256 `1188daded239bccb5952a01d2ad33e77a0d3dc34f9d9fc1e7fdda618d44938ef`. [Reuse branch](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/archiver/archiver.go#L523-L546) · [Metadata comparison](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/archiver/archiver.go#L632-L659) · [Fixture](../mtime_inputs_trial.py).

### Existing restore target control

Separate restore destinations began with `edition-B` in the target and its hard-linked peer. The local snapshot contained `edition-A` at the same size. Every invocation passed `--verify`. [Fixture](../destination_reuse_trial.py) · [Linux receipt](../destination-alpine-2026-11-25.json) · [macOS receipt](../destination-macos-2026-11-25.json).

| Restore policy and target | Target afterwards | Files verified | Hard link still shared |
| --- | --- | ---: | --- |
| `if-changed`, size and modification time match the snapshot | `edition-B` | 0 | Yes |
| `if-changed`, target modification time advanced | `edition-A` | 1 | No |
| `always`, size and modification time match the snapshot | `edition-A` | 1 | No |

The peer remained `edition-B` in every case, and the two ARM64 platforms agreed. The `if-changed` path treats matching size and modification time as sufficient. Its verification pass visits files recorded as content restores and skips metadata-only work. The number of files verified describes that set. [Matching size and time](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/restorer/restorer.go#L734-L769) · [Verification file selection](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/restorer/restorer.go#L645-L682).
