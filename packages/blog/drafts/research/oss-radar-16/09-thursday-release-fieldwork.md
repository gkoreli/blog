# November 19 — release fieldwork for OSS Radar #16

The revised [manuscript](article.md) opens with GoDoxy's second outage notice. The Linux release binary reproduced that result alongside a wall-clock control. Hermes's released chat CLI reproduced a separate gap between recognizing a skill and using it. These results sharpen the earlier [fieldwork](07-wednesday-current-release-checks.md) at the same project pins.

## GoDoxy through a live configuration change

The [official v0.34.0 Linux ARM64 binary](https://github.com/yusing/godoxy/releases/tag/v0.34.0) matched the published SHA-256 on the host and in an Alpine 3.23.4 guest. Lima used the Apple Virtualization driver without host mounts or dynamic port forwarding. The [fixture](godoxy/route_reload_trial.py) drove the deployed HTTP listener and two file-provider routes. Both routes proxied a synthetic report and polled an explicit `/health` path. The default silence window applied to one route. The other set `silence: []`.

In both conditions, both health endpoints began answering 503. The route with the explicit empty list issued one down alert while the other continued to probe and stayed quiet. The wall-clock condition waited for expiration, and the inherited route then sent its deferred alert. The explicit override sent no second down alert. In the other condition, an edit removed the global window with both endpoints still at 503. The running proxy sent the inherited route's deferred alert plus a second alert for the route with the persistent explicit override. The receiver returned HTTP 204 every time. Both conditions subsequently saw one recovery alert per route.

This distinguishes a notice generated again on reload from an HTTP retry, which the [earlier trial](godoxy/results/webhook-2026-11-18.json) observed after 503. The [release-binary receipt](godoxy/results/linux-routes-2026-11-19.json) records UTC receipt times, counts, tool versions, fixture hash and exact binary. The earlier exploratory attempt required specifying `/health` on each file-provider route and normalizing the human-readable service names. The fresh fixture incorporates these changes. Shared HTTPS and container lifecycle were outside the trial.

## Hermes through the actual chat CLI

[v0.23.2](https://github.com/NousResearch/hermes-agent/releases/tag/v0.23.2), Python 3.14.6 and its frozen runtime dependencies were used in an isolated profile. Ollama 0.21.2 served the verified local Qwen3.5 4B model. The CLI ran the same synthetic dispatch prompt in two fresh sessions, with only the skills toolset and background review disabled. It exposed the saved skill in the first session. The model named it, made no tool calls, and asked where to find the record after being given its fields. The second session explicitly preloaded the skill and returned exactly `RIVET/D4/007/mz2/coil`. Both runs completed successfully.

This reproduces the missed load from the November 18 exploratory CLI run. The [fixture and exact outputs](hermes/results/agent-skill-2026-11-19.json) establish what happened for this task and model. The [direct-load and edit trial](hermes/results/skill-reuse-2026-11-18.json) remains separate evidence about supplying the saved procedure. The CLI result is neither a reliability estimate nor a test of skill creation by the model.

## Current versions and remaining limits

The default NemoClaw installer now points to [v0.0.145, commit `6f36feffb7a0f448194eafef3042e7ad47faa0de`](https://github.com/NVIDIA/NemoClaw/tree/6f36feffb7a0f448194eafef3042e7ad47faa0de). The installer, blueprint OpenShell 0.0.116 bounds, host policy action, blueprint client, and shared response classifier have identical Git blobs at the tested v0.0.144 pin and this tag. On November 18 the unmodified v0.0.144 upstream policy tests passed 70 cases in `policy-live-state.test.ts` and 65 in the two finality/outcome suites. Their gateway responses were scripted. The new copy uses the branch movement as release context and keeps its tests attributed to v0.0.144.

Plannotator v0.29.0 still supplies the Inbox evidence. Its actual reply and read-mark trial passed on the release. The evening attempt to reach a real T3 turn ended before an end-to-end result. The article keeps the two tested observations and leaves follow-through open. Hermes and GoDoxy retain the release versions named above. The [November 18 preview](08-review-and-readiness.md) remains historical after the November 19 source revision.
