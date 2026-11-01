# Check Bun AOT on your own server

See whether your app saves enough RAM to justify any change in request speed. This tool builds regular Bun, bytecode and native AOT, checks the responses, then shows startup, request speed, memory, CPU and executable size. It keeps every accepted run and failure.

[Download the source ZIP](https://gkoreli.com/downloads/bun-aot-check-0.1.0.zip).

Requires Python 3.10+, `cc` (a C compiler), macOS or Linux, and a Bun build that supports native `--aot`. No Python package install. macOS is exercised here; Linux support needs a real Linux run before portability is claimed.

The tests here use Bun `1.4.4-canary.1+da867c60b`. [Official canary downloads](https://github.com/oven-sh/bun/releases/tag/canary) change over time; the tool records your selected revision. This preview builds native output for the host platform, so compare on the system you deploy to ([pinned compiler instructions](https://github.com/oven-sh/bun/blob/da867c60bf0bcbf9d6d36994f8ca0efa42075115/docs/compiler/aot.mdx)).

The AOT build type-checks the program and can reject code that `bun run` executes. For a build failure, open `private/build-<mode>.log` inside the output folder; the comparison stays incomplete.

## Try the included example

From this folder, using the exact Bun executable you want to test:

```sh
python3 compare.py --bun /path/to/bun --entry example-server.ts --cases example-cases.json --out example-results
```

For your app, run from your project folder and point to this tool:

```sh
python3 /path/to/bun-aot-check/compare.py --bun /path/to/bun --entry src/index.ts --cases aot-cases.json --out aot-results
```

Copy `example-cases.json` and replace its paths, requests and complete expected results with a few meaningful cases from your app. Include a rejected request with `"measure": false` where useful. The app should read its port from `PORT`. If it uses a fixed port, pass `--port 3000` (or its actual port); an occupied port fails before starting or loading another server. Ordinary application environment variables are inherited. The tool does not prepare a database, install your dependencies or rewrite imports. Keep the same test data and external services for each mode. All cases run once per app launch; measured cases then repeat continuously. Use a test app and database.

`--trim` adds a fourth native build. All builds use `--format=esm` so bytecode can handle top-level `await`. Framework plugins are a separate change; use your own prepared entry or supply executables explicitly:

```sh
python3 compare.py --project /path/to/app --binary jit=/path/to/jit --binary bytecode=/path/to/bytecode --binary aot=/path/to/native --cases /path/to/cases.json --out prebuilt-results
```

## Read the result

Default: one checked launch recorded separately, then six interleaved fresh-process runs per mode, two seconds of warmup and five measured seconds per selected route, eight persistent connections. Every timed response must have the expected status and bytes. Readiness and selected response checks run before load. Changed output, failed builds and startup failures stay visible. Exit codes: 0 for a completed comparison, 1 for a build/check failure, 2 for a setup error.

- `summary.md`: a compact report you can read or share, with conditions and sample ranges.
- `summary.json`: medians, min/max, startup, file bytes, request speed, end-of-route memory, CPU and request counts.
- `observations.json`: every retained sample, run order, hashes and conditions. Request headers/bodies are not copied into these reports.
- `private/`: executables and application/build logs. Logs can contain your app's own private data. Review results before sharing; the public study uses selected evidence, not this directory.

First check correctness. Then compare the work you need to serve, memory and CPU together. A smaller executable does not guarantee less RAM. Half the app memory does not guarantee half the bill. The tool reports measurements rather than picking a universal winner.

## Limits

This is an experimental local comparison tool, not a general HTTP benchmark or production certification. It supports one server process at a time, fixed HTTP/1.1 bodies with Content-Length under 120 KB, and stable requests/results. Streaming, WebSockets, arbitrary binary request bodies, dynamic timestamps and applications that spawn child processes need a different test. Headers can be checked by an application-specific test; this tool checks status and body, not every response header.

Startup ends at the first expected ready response, not necessarily a live database connection. The first checked launch is kept separately: a newly built executable can have a large one-time launch cost on macOS, while later fresh processes start much faster. A prebuilt file may already have run before this tool sees it. The tool does not identify the OS mechanism; both the first observation and subsequent samples remain visible. Warm request speed excludes startup. Filesystem and database caches are not flushed. The client shares the host, requests are closed-loop, and no CPU or RAM cap is imposed. macOS physical footprint and Linux RSS have different meanings; databases/services are excluded. Per-route retained memory can include earlier routes. Six runs provide spread, not a production capacity or reliability guarantee.

Source code is MIT under the repository [license](LICENSE). The [article and public study](https://gkoreli.com/oss-radar-08-bun-aot#sources-and-evidence) explain why these distinctions matter.

## Check a change to the tool

Use a new output folder:

```sh
python3 selftest.py --bun /path/to/bun --out /tmp/bun-aot-selftest-new
```

It exercises compiled server builds and compiler failures, rejects a Boolean where a number is expected, catches wrong responses that begin only during load, handles a startup crash, verifies that an occupied port receives no test traffic, and keeps the successful JIT/bytecode results when native type-checking rejects the same source. Those are correctness/cleanup checks; their short timings are not performance evidence.

To make the source-only download:

```sh
python3 package.py --out /path/to/bun-aot-check.zip
```
