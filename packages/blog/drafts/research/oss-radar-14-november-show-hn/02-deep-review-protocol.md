# Deeper source and field-report review

Started November 11, 2026. This continuation supersedes the first draft's source-only scope as individual results are completed. Keep the same twelve-project sample and original source revisions. A later revision or released executable needs its own recorded mapping; do not silently replace a baseline.

## Questions and evidence

For each project, read its launch discussion, consequential issue/PR conversations, relevant design/operation documents and the called implementation. Separate submitter/maintainer explanations, firsthand usage reports, questions, suggestions and promotional comments. A report is not a reproduction or proof of adoption. Recheck current issue/PR states before relying on a defect or repair.

Trace the strongest promise from input through processing, state, network/dependencies and observable output. Retain useful outcomes and material limitations at the same proof standard. The current agent-control thesis is provisional; revise or drop it if the broader evidence changes the most useful cohort argument.

## Declared local trials

Only isolated synthetic inputs and temporary checkouts. Do not install global integrations, edit the user's agent/tmux/shell settings, read private conversation stores, deploy internet-facing services, contact maintainers, call paid model APIs or download model weights for these trials.

| Project | Question and predeclared acceptance | Scope |
| --- | --- | --- |
| Modern Web Guidance | Can its actual CLI retrieve a relevant guide and distinguish a known legacy pattern from an intentional compatibility fallback? Record outputs for both; a false positive or missing pattern must remain visible. | Released CLI or pinned bundled CLI; static analysis/retrieval only, not agent-quality evaluation. |
| Stroq | Does the real hook path allow a benign command, stop an obvious policy violation, and produce the host's documented failure response on malformed input? Separately examine a harmless-looking package command whose synthetic script contains an unsafe operation. | Synthetic hook payloads and a temporary policy/store; commands are judged, not executed. Never run the default private-session audit. |
| tmux-restore | Do synthetic agent fixtures preserve the correct conversation IDs? Does a dedicated live tmux server actually run periodic-save/status callbacks while detached versus attached? Record the difference and cleanup only that server. | Upstream adapter tests plus an isolated server. No real agent conversation or machine reboot. |
| Coldframe | Can a loopback client log in to a fake controller, request fake state and produce a recorded fake control action? Check logged event/output independently. | Loopback process only; no public listener or claim of attracting real attackers. |
| OmniDiff | Can the released tool expose a consequential change in code and an archive that ordinary text diff reports opaquely? Include an unchanged/control input and unsupported/invalid input. | Synthetic local files; inspect output/exit code, not an accuracy or speed benchmark. |
| STE80 Humanizer | Does the checker preserve the distinction between stylistic findings and factual fidelity? Run a short faithful pair and a fluent but fact-changed pair; record what the checker can and cannot flag. | Python heuristic checker only; no generated rewrite or detector claim. |

Waymark's external-side-effect recovery merits a full runtime trial if the available environment can support it in a bounded setup. Otherwise trace its persistence, action delivery and failure semantics and state the execution gap. GPU-model performance and Spindle runtime conformance need suitable hardware/toolchains; no claim that CPU source inspection supplies those results.

Raw command outputs, discussion captures and downloaded source stay outside Git. Publish synthetic fixtures, exact commands, normalized results, source links, conditions and the consequences for the manuscript. A test that cannot start remains a setup result rather than a product failure.

### Additional owned-code check

After the two synthetic scanner controls, run Modern Web Guidance's static scan on a temporary Git snapshot of this blog's tracked `packages/blog/src` at a recorded commit. The question is whether its suggestions are useful in a real native-web-component codebase. Inspect every returned candidate against its context and compatibility purpose. No automatic code replacement or agent-quality claim follows from the scan. The snapshot avoids reading private working notes or concurrent uncommitted source.
