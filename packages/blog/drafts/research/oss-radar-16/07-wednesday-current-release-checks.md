# November 18 — four release checks for the Monday draft

The four entries are Hermes Agent, Plannotator, NemoClaw, and GoDoxy. [November 17's selection](04-tuesday-discovery-and-memory.md#current-selection) and [the first dossiers](02-participant-dossiers.md) retain the discovery and discussion evidence. This pass advances each entry and narrows the two integration claims that still need a live host.

## Hermes Agent ships procedures as files

The release check still returned [v0.23.2](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.2). Yesterday's real memory-store work covered masking, session snapshots, and concurrent writers. Today's trial followed the separate skill path. Actual `skill_manage` saved a synthetic workshop procedure. New subprocesses subsequently inspected the catalog, loaded the text with `skill_view`, and loaded it again after `skill_manage` changed a single code. The fixture verified the saved bytes and the exact one-code change.

Ollama 0.21.2 served the verified local Qwen3.5 4B model on loopback. The fixture ran the same two inputs with a task alone, with the catalog description, and with the loaded procedure. It recorded zero, zero, and two exact matches respectively. A seventh call matched the revised rule. The compared inputs purposely depend on a local convention the controls do not specify. The fixture selects the skill and supplies its text directly. The result supports keeping explicit procedures in a file that a new process can load and use. Selection, automatic authoring, and whole-agent quality remain open. [Reproduction](hermes/README.md#november-18-skill-reuse) · [Inputs, exact outputs, and model receipt](hermes/results/skill-reuse-2026-11-18.json).

## Plannotator preserves the browser reply through a server restart

[v0.29.0](https://github.com/backnotprop/plannotator/releases/tag/v0.29.0) superseded v0.28.67 on November 18 at 08:02 UTC. Its MIT and Apache files byte-match the earlier release's files. The released Apple Silicon binary served a fresh local Inbox for Playwright and two synthetic MCP identities. The person-side reply came from clicking Send in Chrome. HTTP 200 returned, the reply persisted, and the browser showed that T3 was waiting. The unrelated reader saw the text without advancing the checked mark or adding a delivery object. After a clean server restart, the original identity read the persisted reply and advanced the mark. It did not receive a queued agent turn.

The setup attempts reached four distinct failures before the accepted run. The extracted binary needed its execute bit restored and still matched the release hash. The built-in test-sandbox flag refused the actual home path. The normal CLI ran with owned data under an OS sandbox. The fixture then needed to accept the CLI's advertised `localhost` origin and use the current read schema, which accepts `agent_session` without an `agent_host` argument. The last run completed both server shutdowns. [Script and reproduction](plannotator/README.md#november-18-browser-trial) · [Three browser and reader outcomes](plannotator/results/browser-reply-2026-11-18.json).

The pending reply and the separate queued-send behavior in the [earlier component trial](05-tuesday-inbox-ownership.md#what-happened) explain why this is useful in real review. A browser can show that a reply exists and a reader can mark it checked. A real supported agent host acting on that reply is a further step. This trial used no T3 account or model. The rule governs reply acknowledgment for the shared thread.

## NemoClaw pins the runtime and can distinguish an ambiguous result

GitHub resolved `lkg` and `v0.0.144` to the same commit, `82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f`. The tagged installer uses `lkg` by default. Its blueprint sets OpenShell's minimum and maximum to 0.0.116. The macOS ARM64 archive matched both the project's reviewed checksum list and GitHub's release digest. The real binary reported the pinned version and advertised the read/write flags used by the client. The main branch and newer standalone OpenShell release were inspected as context only. [Version mapping](nemoclaw/README.md) · [Hashes and client outcomes](nemoclaw/results/policy-client-2026-11-18.json).

The real v0.0.144 blueprint client ran against eight scripted command captures. Its three read methods separated effective/global, current base, and earlier base revision. A status-zero fixture produced the client's applied result. An explicit failed precondition produced rejected. Transport interruption, timeout, and generic nonzero status produced ambiguous. The host action's base-policy read-back, revision comparison, and concurrent-write reconciliation were read at the same pin. This run confirms how the client builds commands and interprets responses. The official binary ran version/help only. macOS prerequisites document Docker Desktop or Colima, neither of which was available on this host. Gateway reconciliation, sandbox enforcement, and replacement remain unverified.

This is enough to explain the operator's diagnostic path and pick a compatible release pair. A recommendation for unattended operation would need a supported disposable host and an observed active-policy check.

## GoDoxy emits one outage notice and retries its delivery

[v0.34.0](https://github.com/yusing/godoxy/releases/tag/v0.34.0) was still the current release. The [previous monitor result](06-tuesday-health-silence.md#observed-behavior) stopped at the notification callback. The new fixture wired the unchanged production monitor, real HTTP checker, dispatcher, and Webhook provider to owned local listeners. A failed probe at 03:59:59 marked the service unhealthy without a callback. The same failure at 04:00 emitted the down callback. The destination returned 503 to the first POST and 204 to the retry. Recovery returned one callback and one accepted POST. The sequence produced two monitor notices and three actual webhook requests.

This verifies the boundary between suppression, emission, and transport with a retryable response. Production delivery still depends on the receiver, scheduling, and configuration. The accepted Go component build used the same three production monitor files and verified caches as the November 17 trial. No full proxy, live route edits, Proxmox, external webhook, or calendar transition ran. [Reproduction](godoxy/README.md#november-18-webhook-trial) · [Outcome and called-source hashes](godoxy/results/webhook-2026-11-18.json).

## Handoff

The four [project reviews](article.md) use the new outcomes at their measured scope. A section on what to try makes NemoClaw the heavier evaluation and keeps Plannotator's unattended-agent advice conditional on an actual host. See the [readiness record](08-review-and-readiness.md) for exact-source checks and the remaining Monday release action.
