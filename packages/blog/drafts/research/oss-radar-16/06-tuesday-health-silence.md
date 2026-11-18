# November 17 — GoDoxy during scheduled downtime

[November 18's fieldwork and draft](07-wednesday-current-release-checks.md) add delivery through an actual webhook and supersede this record's next-work section.

**Milestone:** the real released health-monitor implementation and HTTP probe passed nine controlled scenarios, followed by a source-checked reproduction. Twenty-three real loopback probes exercised thresholding, silence, recovery and defaults; emitted notifications were captured at the callback boundary. The article and full product/host evaluation remain unfinished. Publication stays paused.

This completes the monitor experiment selected in the [morning handoff](05-tuesday-inbox-ownership.md#attempts-and-next-work). [Protocol and reproduction](godoxy/README.md), [normalized observations](godoxy/results/monitor-2026-11-17.json), [setup/source pins](godoxy/results/setup-2026-11-17.json) and [all attempt dispositions](godoxy/results/attempts-2026-11-17.json) preserve the result and limits.

## A return to operating the same product

[#1](../../../posts/002-oss-radar-01-vercel-winter-2026-cohort.md) introduced GoDoxy as a self-hosted reverse proxy with container discovery/lifecycle work, Proxmox and idle sleep. The [reconstructed March 19 checkpoint](https://github.com/yusing/godoxy/tree/213e4a5cdb635bf1f5f5985fd04515ad592497d5) and its README already describe those jobs. Its exact relationship to the original article's audit is unknown; it is a checked dated comparison, not a recovered original audited SHA. Current [v0.34.0](https://github.com/yusing/godoxy/releases/tag/v0.34.0), commit **`77cbac6b532d7d3881010eade21fe1a7f9e4bf8e`**, continues those jobs. Neither a larger README nor this release establishes a product pivot.

The earlier article's broad cloud-cost and reduced-administration claims are not established by this work. This return should use concrete operating evidence rather than carry those claims forward. An ordinary reverse proxy with separate container and health tooling remains the relevant comparison; no comparative cost, throughput, uniqueness or reliability benchmark was run.

Historical [monitor source](https://github.com/yusing/godoxy/blob/213e4a5cdb635bf1f5f5985fd04515ad592497d5/internal/health/monitor/monitor.go#L230) already tracks failed checks, sends down notices and conditions recovery on a previous down notice. The new part is [daily silence windows](https://github.com/yusing/godoxy/blob/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e/internal/health/silence.go) and their integration into the actual [failed-check notification gate](https://github.com/yusing/godoxy/blob/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e/internal/health/monitor/monitor.go#L228). A suppressed down notice leaves its sent flag false. Every later failed check revisits the gate, so the service need not become healthy and fail again to produce a notice after silence ends. The historical code was inspected, not executed.

This is useful maintenance work for people who already operate the service. [PR #296](https://github.com/yusing/godoxy/pull/296) supplies a firsthand reason: a contributor wanted to avoid repeated warnings during a regular backup outage. It is one person's operating case, not an adoption or market-demand measurement.

## What actually ran

The released source was unchanged. The module and three backend build submodules use their pinned commits; the web UI was not built. Official Go 1.27.4 on Darwin arm64 was installed only in the owned temporary workspace, with its archive checksum matched against [official download metadata](https://go.dev/dl/?mode=json). Go environment/workspace files and automatic toolchain selection were disabled; module resolution used unchanged pins and owned caches. The accepted execution used `GOPROXY=off` after resolution.

The fixture invokes the real monitor's `init` and `checkUpdateHealth`, the actual HTTP checker and the actual notification-body formatter. A temporary service bound only to `127.0.0.1` answered HEAD `/health` with controlled HTTP 200 or 503. Each check had to produce a real observed request, the expected health state and notification counts. The monitor's existing clock seam controls window membership. The sink records the emitted `notif.LogMessage`; it does not claim delivery to a webhook, phone or notification platform.

The [36 checked source/module files](godoxy/source-hashes.json) cover the called monitor/check/configuration paths and local module manifests/sums. Main and submodule archives are pinned separately. Safe archive extraction omitted three absolute links belonging to Linux process-fd test fixtures in gopsutil; no production Go source was changed. The skipped paths and exact archives are recorded.

## Observed behavior

| Actual probe sequence | Result | Consequence |
| --- | --- | --- |
| Healthy → two failed probes outside silence → another failure → healthy | The configured two-failure threshold produced one down callback, no duplicate, then one recovery callback | An ordinary no-silence control passed |
| Failure and recovery entirely within 03:00–04:00 | Health became unhealthy and then healthy; neither callback was emitted | Silence does not make the service healthy. Recovery stays quiet when there was no down callback |
| Still down at 03:59:59, checked again at exactly 04:00 | No in-window callback; one down callback at the explicit boundary check, no repeat, then recovery | The pending notice was deferred rather than lost. Real production timing still depends on the polling schedule |
| Down callback before the window, recovery inside it | A recovery callback was emitted inside silence | This is down-notification silence, not blanket suppression of all notification types |
| Failure across 23:30–00:30 in a fixed UTC−08 clock | The two in-window probes stayed quiet; the explicit 00:30 check emitted down, then recovery emitted up | Cross-midnight membership reached the actual monitor gate |
| The same instant represented in UTC | It was outside that clock's 23:30–00:30 interval and emitted down | Window membership follows the supplied local clock. A real container `TZ` change and daylight-saving transitions were not tested |
| Inherited `nil`, explicit empty opt-out and custom override under the same defaults | Inherited silence suppressed the 03:10 down callback; empty and the custom 05:00–06:00 window allowed it | The three configuration states have different monitor consequences |

The configuration result uses the real `HealthCheckConfig.ApplyDefaults`. The actual [route finalizer](https://github.com/yusing/godoxy/blob/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e/internal/routevalidate/finalize.go#L115) calls that same method. We did not exercise live route loading, WebUI edits, persistence or hot reload. Logical clock advances and local probe latency are not downtime or performance measurements.

The sent flag records that the monitor called its notification function. This fixture's sink succeeds locally. An external dispatcher's queues, retries and delivery failures remain outside the result; the existing comment about a notice having been sent must not become a claim that a person received it.

## Setup friction and contrary evidence

Several distinct failures preceded the accepted trial. The first offline build lacked upstream test dependencies. After resolving them, the full package test build reached a Darwin limitation through external tests → `routeimpl` → Linux-only `unix.Eventfd`. The bounded native trial supplied all three unchanged production monitor files and the authored fixture explicitly, excluding those unrelated tests. It is not a passing full upstream suite.

Linking then required the existing project flag `-ldflags=-checklinkname=0`, documented in [the time parser's test](https://github.com/yusing/godoxy/blob/77cbac6b532d7d3881010eade21fe1a7f9e4bf8e/internal/serialization/time_test.go#L11) and checked-in CI. It was applied only to this command. The sandbox next rejected loopback listening; the accepted run used an explicit IPv4 loopback listener with approved tool permission. No VM, daemon or global configuration was started or changed. A sandboxed Podman availability probe also failed to access its socket; that did not establish the VM's actual running state.

The accepted trial and a fresh preparation-helper reproduction both passed all nine scenarios and 23 probes. Failed builds and their logs are retained separately. These setup limits must not be called a failed Linux deployment or a product runtime defect.

The separate [certificate report #298](https://github.com/yusing/godoxy/issues/298) and [maintainer response](https://github.com/yusing/godoxy/issues/298#issuecomment-6910386206) still matter to the entry: v0.34.0's script chooses HTTP-only setup when autocert was not configured. It does not establish general fallback from missing certificate files to plaintext. That script/listener path was inspected previously and not executed in this monitor trial.

## Provisional take and next work

The return has a concrete result: scheduled downtime can stay out of down-notification traffic while health continues to reflect failed probes, and a continuing failure remains eligible for a later notice. That improves one recurring operator task; it does not remove responsibility for backups, timezones, certificates, updates or incident recovery. No reduced-cost or production-reliability recommendation is earned by these component controls.

A representative Docker/Proxmox route, live configuration change and actual notification backend would strengthen an adoption take. The current result supports a narrow explanation of the shipped silence feature and its precise behavior. Keep that distinction when writing an unequal project entry in the cohort article.

**Next bounded action:** NemoClaw. Recheck the supported installation/runtime/version mapping and trace one real OpenShell policy change before choosing a live control. The current main snapshot is not a mapped stable install. Establish container/host availability with an appropriately permitted read; the earlier sandboxed Podman failure is not proof no runtime exists. Use owned temporary installation/configuration and a disposable sandbox if supported. Preserve policy rejection versus transport ambiguity, and do not claim containment from a client-only test. Do not install global tooling, use paid services or publish. Hermes skill reuse and Plannotator's live Inbox/host work remain unfinished after this step.

No manuscript or project entry is marked reviewed. Raw archives, SDK, module caches, API captures, synthetic state and stdout/stderr remain outside Git under `/private/tmp/oss-radar-16-20261117/godoxy-session`. Public evidence contains the authored fixture, normalized observations, reproduction setup and limits. No new human writing prompt arrived in this scheduled session. The publication pause and empty manifest remain in force.

## Verification

The source-checked reproduction passed nine scenarios and 23 real probes. Independent artifact inspection confirmed every 200/503 probe's healthy/unhealthy state, the cumulative notification sequence and eleven emitted callbacks. The helper verified 36 source/module files; the fixture hash matches the setup receipt, and archive/toolchain/submodule checks are recorded. Go compilation/vet, fixture formatting, Python syntax, JSON consistency, Markdown fences and 88 local file/anchor links passed. The private-prompt guard is part of scoped delivery. #15's accepted source hash and the empty publication manifest were preserved. No live production acceptance is claimed for these research changes.
