# Try Bun AOT on a small example

No npm packages, TypeScript compiler checkout or benchmark client to build. Download [example.ts](example.ts) and [compare.py](compare.py) into an empty folder. You need Python 3 and a Bun preview with `--aot` support. The tested compiler was `1.4.4-canary.1+73b53109f` on macOS arm64; AOT is experimental.

Run three commands from that folder:

```sh
bun build example.ts --compile --outfile jit
bun build example.ts --compile --aot --trim --outfile aot
python3 compare.py --jit ./jit --aot ./aot
```

The script checks both outputs against a checksum calculated independently in Python, alternates the run order, and prints median time, executable size and available memory counters. It saves the observations in `comparison.json`. On macOS, `peak_physical_bytes` and `peak_rss_bytes` are separate measurements; on Linux it records RSS through GNU `time`; on other platforms it only records time and file size. Only the macOS path has been run here. System restrictions that block memory counters are errors, not zero-memory results.

The example builds 250,000 small records and reads them repeatedly. This is a **new synthetic workload**, not the article's TypeScript compiler or tiny server. It doesn't promise a speedup or reproduce the compiler's 64% memory saving. The initial local trial actually ran slower under AOT while using less memory and producing a much smaller file. That is useful to find out before changing an application.

To change the workload, set `ROWS` or `ROUNDS` before running the comparison. The independent checksum follows those inputs. `ROWS` accepts 1–1,000,000 and `ROUNDS` accepts 1–1,000. Start with the defaults.

If you use a preview executable outside PATH, use its full path for the two build commands and add `--bun /full/path/to/bun` to the comparison. Windows users need executable names appropriate to their shell. The runner checks a fixed-size example and whole fresh-process runs with warm filesystem caches; it is not a production workload or an isolated throughput measurement.

Source and runner are MIT under the repository's [license](../../../../../../LICENSE). The [article](https://gkoreli.com/oss-radar-08-bun-aot) explains why results vary; [the follow-up worklist](../00-worklist-index.md) records the actual trial and its limits.
