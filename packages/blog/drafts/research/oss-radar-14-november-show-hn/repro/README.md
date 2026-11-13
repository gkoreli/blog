# Local reproduction fixtures

The later [mechanism experiment record](../06-mechanism-experiments.md) explains the source/release distinctions and new results.

Use fresh temporary output directories and the versions/revisions in [baselines](../baselines.json). These fixtures execute actual selected paths with synthetic inputs; none installs a live agent integration. [Results and limits](../04-local-trials.md) distinguish finished checks from Waymark's incomplete setup.

- `cli-fixtures.py`: Node plus Modern Web Guidance 1.0.0's `modern-web.mjs`, OmniDiff v0.4.0, and the pinned STE80 `scripts/ste_check.py`. Four absolute path arguments: those three files, then a fresh output directory. It disables Modern Web Guidance telemetry. Inspect `raw-results.json`; exit 1 is expected for changed files, style findings and the volatile-guide refusal.
- `stroq.mjs`: Node plus `@stroq/cli@0.32.0`. Arguments: its absolute `dist` directory, then a fresh output directory. Imports shipped distribution chunks; uses synthetic homes and empty credential environment. Commands and fixture script content are never executed. It includes benign and fetched/evaluated package-script controls.
- `coldframe.py`: standard-library Python. Arguments: pinned checkout, then fresh output directory. Constructs unmodified handler/server on loopback; checks HTTP/XML and logs, then shuts down.
- `tmux-status.py`: standard-library Python on Unix with tmux. Argument: a fresh output directory with no spaces. Creates its own socket, attaches its own PTY and kills only its own server. About ten seconds. This checks the status mechanism, not a reboot.
- HolyArrs 1.1.0: from follow-up commit `649795593b6f13ea26cdea326a7113b15c2c9371`, run the three named Go metadata tests using the exact command in [its result](../results/holyarrs-metadata.json). Requires Go 1.27.4; the tests use loopback stand-ins, not real providers.
- Upstream tmux adapter checks: `bash tests/agents-unit.sh` in the pinned tmux-restore checkout. These are synthetic process/session fixtures with stub tmux.
- Additional Stroq malformed-input check: run `node /absolute/dist/index.js hook codex` with invalid JSON on stdin, a fresh `STROQ_HOME`, temporary working directory and empty credential environment. Expected recorded result: exit 2, empty stdout, fail-closed stderr. Never invoke the default private-session audit.

`waymark-recovery.py` and `waymark_workflows.py` retain the **attempted** three-case protocol. The recorded auxiliary `pgserver==0.1.4` database lacks pgcrypto; this combination did not reach workflow execution. Do not present it as a passing recipe. The scripts' presence establishes neither recovery nor the expected retry outcomes. The later standalone fixture below supplies a compatible PostgreSQL setup and separate execution evidence; it reuses the workflow definitions, not the failed database recipe.

The fixtures are evidence for this review, not general installation tooling. Raw local outputs may contain temporary paths; only normalized synthetic results are committed.

## Mechanism follow-ups

- `stroq-provenance.mjs`: actual 0.32.0 engine with synthetic source events, fresh stores, reload/session controls and literal-print controls. Arguments: released CLI `dist`, fresh output directory. Runner commands never execute; one independent `/bin/sh` literal print uses an empty executable directory on PATH.
- `answer-and-archive.py`: Waymark trial Python environment (Pydantic 2.14.3) or equivalent. Arguments: pinned Flide checkout, OmniDiff v0.4.0 executable, fresh output. Executes pure answer formatting and small repack/edit ZIP comparisons. No model weights or GPU.
- `waymark-standalone.py`: Python 3.12.8 with Waymark 0.30.1. Arguments: PostgreSQL `bin` directory including pgcrypto in its installation, fresh output. Uses the existing `waymark_workflows.py`. Actual outcome on 0.30.1 differs from the original default-lost expectation; read the release comparison before interpreting it.
- `spindle-contract.ml` and `spindle-contract.dune`: a one-route temporary application. `spindle-contract.py` takes opam binary, temporary opam root, pinned temporary checkout, fresh output, and installed Zod package path. It expects a switch named `radar` with the framework's dependencies, OCaml 5.5.0 and ppx_wiretype. The test links the pinned local framework and generates/executes Zod with 4.3.6. Only its own `radar_contract/` directory is written; do not point it at a shared source checkout.

The standalone PostgreSQL build and temporary opam/pkgconf preparation are recorded in the mechanism ledger, including publisher checksums and setup failures. They are test infrastructure, not additional featured products.
