# Local reproduction fixtures

Use fresh temporary output directories and the versions/revisions in [baselines](../baselines.json). These fixtures execute actual selected paths with synthetic inputs; none installs a live agent integration. [Results and limits](../04-local-trials.md) distinguish finished checks from Waymark's incomplete setup.

- `cli-fixtures.py`: Node plus Modern Web Guidance 1.0.0's `modern-web.mjs`, OmniDiff v0.4.0, and the pinned STE80 `scripts/ste_check.py`. Four absolute path arguments: those three files, then a fresh output directory. It disables Modern Web Guidance telemetry. Inspect `raw-results.json`; exit 1 is expected for changed files, style findings and the volatile-guide refusal.
- `stroq.mjs`: Node plus `@stroq/cli@0.32.0`. Arguments: its absolute `dist` directory, then a fresh output directory. Imports shipped distribution chunks; uses synthetic homes and empty credential environment. Commands and fixture script content are never executed. It includes benign and fetched/evaluated package-script controls.
- `coldframe.py`: standard-library Python. Arguments: pinned checkout, then fresh output directory. Constructs unmodified handler/server on loopback; checks HTTP/XML and logs, then shuts down.
- `tmux-status.py`: standard-library Python on Unix with tmux. Argument: a fresh output directory with no spaces. Creates its own socket, attaches its own PTY and kills only its own server. About ten seconds. This checks the status mechanism, not a reboot.
- Upstream tmux adapter checks: `bash tests/agents-unit.sh` in the pinned tmux-restore checkout. These are synthetic process/session fixtures with stub tmux.
- Additional Stroq malformed-input check: run `node /absolute/dist/index.js hook codex` with invalid JSON on stdin, a fresh `STROQ_HOME`, temporary working directory and empty credential environment. Expected recorded result: exit 2, empty stdout, fail-closed stderr. Never invoke the default private-session audit.

`waymark-recovery.py` and `waymark_workflows.py` retain the **attempted** three-case protocol. The recorded auxiliary `pgserver==0.1.4` database lacks pgcrypto; this combination did not reach workflow execution. Do not present it as a passing recipe. The scripts' presence establishes neither recovery nor the expected retry outcomes. A future runtime trial needs a compatible PostgreSQL setup and fresh acceptance evidence.

The fixtures are evidence for this review, not general installation tooling. Raw local outputs may contain temporary paths; only normalized synthetic results are committed.
