# Research reproduction sources

The two historical FATE summaries are preserved as `baseline/fate-final.txt` and `baseline/fate-san.txt`; the original baseline manifest/scripts use the `.log` names. Their bytes are unchanged.

`baseline/` preserves the earlier optimization experiment and its dated measurements. `formal/` adds checked C obligations, TLA+ models, fault injection, two robustness fixes, and reproducible drivers. Run in disposable output directories; raw logs, checkouts, executables and bitmap dumps do not belong in Git.

FFmpeg-derived C files, extracted functions and patches retain FFmpeg's LGPL-2.1-or-later terms and original notices. See [COPYING.LGPLv2.1](COPYING.LGPLv2.1). Goga's original orchestration scripts are MIT. Vendoring this evidence does not relicense FFmpeg. The pinned upstream source supplies the full decoder context.

Start with [formal reproduction instructions](formal/README.md). Benchmark and proof records are separate. A successful check applies to its exact source, assumptions, bounds and tools; benchmark timings remain empirical.
