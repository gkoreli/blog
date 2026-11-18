# GoDoxy health-monitor trial

Declared November 17, 2026 before project execution. Use current released [v0.34.0](https://github.com/yusing/godoxy/releases/tag/v0.34.0), commit `77cbac6b532d7d3881010eade21fe1a7f9e4bf8e`. The preceding session inspected the silence helper and notification gate; this session must exercise the actual monitor, not a copied window function.

## Environment and boundary

Use an owned temporary source/toolchain/cache/data workspace. The module requires Go 1.27; official Go 1.27.4 for Darwin arm64 was downloaded and its archive SHA256 verified against [Go's official download metadata](https://go.dev/dl/?mode=json). Do not downgrade the module or change global toolchain configuration. Pin build submodules to the main repository's gitlinks. Omit the web UI from this backend component build.

Gopsutil's archive contains absolute links in Linux process-fd test fixtures. Safe extraction refused them. Extract regular files/directories without constructing those links and preserve their omitted paths in the setup record. Do not weaken extraction checks or claim an exact complete source tree including those fixtures.

Use the real monitor core and real HTTP probe against an owned loopback service that switches between HTTP 200 and 503. The monitor's existing clock seam controls window decisions; it does not replace the implementation. Capture actual `notif.LogMessage` calls in an owned sink and inspect status, consecutive failures, notification order/content and sent-state at every check. The router constructor, background ticker/jitter, external notification transport, container/proxy deployment and reload behavior remain outside this trial unless separately exercised.

The first full-package test build on Darwin pulled an external upstream test through `routeimpl` into Linux-only `unix.Eventfd` code. Preserve that failed build. The bounded native trial instead supplies all three unchanged production monitor files plus the authored fixture as Go's explicit file list. This excludes unrelated upstream tests; it does not stub the monitor or edit module/source code, and it cannot be reported as a passing full upstream suite.

That native link then required the project's existing `-ldflags=-checklinkname=0` setting: its time parser intentionally links `time.unitMap`. The requirement is documented in `internal/serialization/time_test.go` and used in checked-in CI commands. Supply it on this command only; do not change global `GOFLAGS`.

## Declared conditions

1. Ordinary failure outside silence produces one down notice at the configured threshold, avoids repeats, then produces one recovery notice.
2. A service fails and recovers entirely inside a silence window: status still changes, but neither down nor recovery notice is emitted.
3. A service remains down when the window ends: no notice in-window; one down notice at the next eligible check, then one recovery notice. Check the exact end boundary.
4. A failure notified before a window then recovers inside it: determine whether recovery is suppressed or follows the existing down-notice state. Do not assume the feature mutes every notification.
5. Cross-midnight windows and a declared fixed local timezone reach the actual monitor gate. Compare the same instant expressed in another zone to clarify that the window follows the supplied local clock.
6. Config defaults distinguish inherited `nil` silence from explicit empty opt-out and a custom override. Exercise their monitor consequences; do not call this a full live route/UI configuration test.

Record setup failures and all attempts. Acceptance is the observed probe/state/notification behavior, with an ordinary no-silence control and a fresh checked reproduction. Clock advances are logical controls, not elapsed downtime or performance measurements. No Docker daemon, Proxmox host, paid service, personal configuration or external message is required.

## Results and reproduction

Nine scenarios and 23 real loopback HTTP probes passed. [Normalized results](results/monitor-2026-11-17.json), [pinned setup and archive hashes](results/setup-2026-11-17.json), [all attempt dispositions](results/attempts-2026-11-17.json), [source/module hashes](source-hashes.json) and the [fieldwork record](../06-tuesday-health-silence.md) preserve their meaning and limits.

Download the source and three build submodule archives at the exact commits and hashes in the setup receipt. Extract into a fresh owned workspace, placing each submodule at its recorded path; use safe extraction and omit the three listed Linux-fd fixture links. Download and verify the official toolchain archive. Keep every Go cache/path in that workspace and populate required dependencies using the unchanged module files. No web UI or global installation is needed.

```sh
python prepare_trial.py /path/to/pinned-source
cd /path/to/pinned-source/internal/health/monitor
GOENV=off GOWORK=off GOTOOLCHAIN=local CGO_ENABLED=0 \
GOPATH=/path/to/owned/gopath GOMODCACHE=/path/to/owned/gomodcache \
GOCACHE=/path/to/owned/gocache GOPROXY=off \
RADAR_GODOXY_OUTPUT=/path/to/fresh-output \
/path/to/verified/go/bin/go test -mod=readonly -p 2 \
  -ldflags=-checklinkname=0 -count=1 -run '^TestRadarMonitorSilence$' -v \
  monitor.go last_seen.go new.go radar_monitor_trial_test.go
```

The [preparation helper](prepare_trial.py) verifies 36 source/module files and copies only the authored fixture. The output directory must not already exist. The native sandbox rejected loopback listening; the accepted run used the explicit IPv4 loopback fixture with approved tool permission. It did not require a running container engine. A fresh source-checked reproduction passed. This is a monitor/HTTP-probe/notification-callback result, not a full upstream suite, background scheduling, live route/UI, container, Proxmox or external-notification-delivery result.

## November 18 webhook trial

Use the same pinned source, submodules, Go toolchain and owned caches. Copy [`radar_webhook_trial_test.go`](radar_webhook_trial_test.go) into `internal/health/monitor` after verifying the source. Use the command above with a fresh `RADAR_GODOXY_OUTPUT` and replace the filter and final arguments as follows.

```sh
  -ldflags=-checklinkname=0 -count=1 -run '^TestRadarWebhookDelivery$' -v \
  monitor.go last_seen.go new.go radar_webhook_trial_test.go
```

This fixture connects the monitor's callback to the real notification dispatcher and Webhook provider. One loopback server supplies health probes. Another records webhook POSTs and returns 503 on the first delivery and 204 afterward. The controlled clock advances across the silence boundary. [Recorded results](results/webhook-2026-11-18.json) show two monitor notices, three actual requests and retry after the failed response. The result covers delivery to the local test receiver.
