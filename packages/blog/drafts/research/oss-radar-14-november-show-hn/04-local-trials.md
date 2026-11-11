# Local trials — November 11, 2026

This record supersedes the first draft's no-execution boundary for the six completed product checks below. These are small functional trials, not comparative benchmarks, security certifications or population accuracy estimates. Raw logs, checkouts, package downloads and discussion captures remain outside Git.

## Environment and versions

- Apple Silicon macOS; Node 24.14.1; Python 3.14 for standard-library fixtures, Python 3.12.8 for the Waymark setup; tmux 3.6a.
- Source checkouts match the twelve original entries in `baselines.json`.
- Released packages: `modern-web-guidance@1.0.0`, `@stroq/cli@0.32.0`; installed only under a temporary directory with npm lifecycle scripts disabled.
- OmniDiff released v0.4.0, Apple Silicon executable. Release tag commit: `c5821c27cbfd2bed80544b5be1645ac98c6b3770`, distinct from the later original source snapshot. Download archive SHA-256 `ac5d75ad752a4738f24ffd72c7e93f4bb4c9caf6ee89cc79b8b09ad1d9fca42a` matched the release's `SHA256SUMS.txt`. This is checksum verification, not independent publisher authentication.
- No user's shell, tmux or agent integration was installed or edited. No real agent conversation, reader/customer data, model API or model weights were used. Owned temporary processes were stopped.

## Modern Web Guidance

`repro/cli-fixtures.py` contains the synthetic inputs and commands. The initial check invoked the shipped CLI directly; the committed combined harness was also rerun successfully with the same synthetic outcomes. One file implements a manual dialog-backdrop click handler; another guards the same code with a `closedBy` feature check.

Result: one finding in the unguarded file and none in the guarded fallback. Search returned a relevant light-dismiss guide; retrieval returned the dialog guide, including compatibility/fallback sections. Requesting `language-model` without project opt-in exited 1 with the explicit volatile-feature gate.

The scanner reported **35 deterministic rules across 33 guides**, and explicitly limits its coverage to about one fifth of the corpus. A Git snapshot of the blog's tracked `packages/blog/src` at `0a6ee49aa0472505d79b9a922f1d79acb6924837` produced two candidates: a border-based text underline and a theme-toggle color-scheme suggestion. These are candidates inspected in source, not applied changes or measured UX gains. No whole-site modernization/compliance conclusion follows from two findings.

Initial calls used the CLI's default telemetry setting; only synthetic queries and a public Git source snapshot were involved. Source inspection later established that search queries and command metadata enter the default telemetry path. Network delivery was not measured. The committed reproduction disables telemetry explicitly with `DISABLE_TELEMETRY=1`; do not describe all initial runs as opt-out or offline.

[Normalized result](results/modern-web.json).

## Stroq

`repro/stroq.mjs` imports the released package's actual engine factory, Claude Code adapter and folder-inspection functions. Both the logical user home and application stores point to synthetic temporary directories; the credential environment is empty. It judges commands without running them. This checks shipped engine/adapter behavior, not a live installed host's response.

| Input | Result |
| --- | --- |
| `printf hello` | Allowed: empty hook output, exit 0 |
| `npm test` with a benign fixture script | Allowed: empty hook output, exit 0 |
| Fetch a script from the reserved example domain and pipe it into `sh` | Denied with `deny-encoded-exec` |
| `npm test` in a folder whose `test.js` fetches text and calls `eval` | Asked for folder review with `ask-foreign-folder` |

A separate real CLI call, `stroq hook codex`, received malformed JSON through stdin with a temporary `STROQ_HOME`. It exited **2**, wrote no stdout and explained the fail-closed result on stderr. The JSON denial response and host's interpretation are different stages; no real Codex instance was used.

The first harness invocation failed because the harness passed `path.resolve` directly to `Array.map`, which supplies extra arguments. Correcting that harness callback produced the recorded results; this was not a product failure.

[Engine/adapter result](results/stroq.json), [malformed-input result](results/stroq-malformed.json).

## tmux-restore

The pinned upstream `tests/agents-unit.sh` finished with **51 passed, zero failed** on this Mac. These use synthetic process/session fixtures and stub tmux; the count is not 51 successful real-agent recoveries.

`repro/tmux-status.py` started a dedicated tmux server on a unique temporary socket with `/dev/null` configuration. In two five-second windows, its status callback ran **zero times while detached** and **once after a PTY client attached**. The script then stopped only its server/client. This confirms the attached-client dependency, not an every-second or minute-save performance promise. It does not test shutdown, sleep, power loss or reboot recovery.

[Normalized live result](results/tmux-status.json).

## OmniDiff

`repro/cli-fixtures.py` creates two Python files where a function moves and its return value changes, plus two ZIPs with one changed `policy.txt` and one unchanged member. It invokes the released executable in JSON mode with `--exit-code`.

- The code result identified the changed digit at its before/after positions, without painting the unchanged function body as a replacement. This is a small structural-review result, not a general correctness score.
- The ZIP result named `policy.txt` as changed and counted the other member unchanged; ordinary `git diff --no-index` reported only that the binary files differ. The JSON summary counted a removed and added line; it did not expose the new policy value in that summary.
- An identical-file control returned exit 0 with `no_changes`.
- Comparing a ZIP to invalid archive bytes returned exit 1 as a generic binary difference, without crashing. It did not claim to have decoded the invalid member.

[Normalized outputs and release mapping](results/omnidiff.json).

## Coldframe

`repro/coldframe.py` imports the unchanged pinned server and handler, constructing the HTTP server on **127.0.0.1 with an OS-selected port** instead of invoking `main()`'s wildcard bind. It sends real HTTP/XML requests and independently reads the recorded events.

A wrong login returned no session token. The default fake login succeeded. Starting defrost on fake node 2 changed the returned fake state and appended a `control` event with `node=2`, `action=start_defrost`, `defrost=true`. The listener was shut down after the checks. No certificate, Modbus service, genuine controller, internet listener or external attacker was involved.

[Normalized result](results/coldframe.json).

## STE80 Humanizer

The pinned Python checker received three synthetic texts. The faithful text included uncertainty and a limit of 40 requests. The second removed the uncertainty, removed retries and changed 40 to 400. **Both returned no style findings.** A style-heavy control returned seven findings, covering its chatbot opener and stock words.

The checker accepts one text; comparing fact preservation is outside its interface. This is a demonstration of the boundary between style and fidelity, not a reported defect in a promised source/rewrite comparator. No model-backed rewrite was generated or evaluated.

[Normalized result](results/ste80.json).

## Waymark setup and unexecuted recovery protocol

The trial fixture prepares three cases: restart during durable sleep, loss of an in-flight action with default policy, and explicit retry of `ActionExecutionLost` after an append-only synthetic outside effect. The intended acceptance is respectively preserved progress, explicit uncertain-execution failure and possible duplicate effects under opt-in retry. **Those end-to-end outcomes have not been established.**

Waymark 0.30.1 installed from its published Apple Silicon wheel into a temporary Python 3.12 environment. A temporary `pgserver==0.1.4` PostgreSQL 16.2 instance starts without IP listeners. The first attempt required a nonempty authority hostname for sqlx's URL parsing; after correcting that harness URL, the executor reached migrations and stopped because the auxiliary PostgreSQL package omits **pgcrypto**. This is an unsuitable database bundle for the trial, not a demonstrated Waymark recovery defect.

A bounded attempt to add pgcrypto from the checksum-verified PostgreSQL 16.2 source encountered the bundle's old SDK/linker configuration. No product source or migration was patched to bypass the requirement. All owned database/executor processes stopped. Waymark's uncertain-action/retry semantics and upgrade downtime remain documented and code-inspected; they must not be labelled reproduced. The fixture scripts are retained as the attempted protocol, not as a successful recovery recipe for this auxiliary database package.
