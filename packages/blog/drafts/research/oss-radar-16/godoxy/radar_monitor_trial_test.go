package monitor

// The monitor and HTTP probe are upstream code. Only time, the loopback
// service's status and the notification sink are controlled by this fixture.
import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/rs/zerolog"
	"github.com/yusing/godoxy/internal/health"
	healthcheck "github.com/yusing/godoxy/internal/health/check"
	"github.com/yusing/godoxy/internal/notif"
)

type radarNotice struct {
	Kind   string           `json:"kind"`
	Title  string           `json:"title"`
	Fields []notif.LogField `json:"fields"`
}

type radarStep struct {
	At               string        `json:"logical_time"`
	HTTPStatus       int           `json:"http_status"`
	ProbeRequests    int64         `json:"probe_requests"`
	Status           string        `json:"status"`
	ConsecFailures   int64         `json:"consecutive_failures"`
	DownCallbackSent bool          `json:"down_callback_sent"`
	Notices          []radarNotice `json:"notices_so_far"`
}

type radarCase struct {
	Name       string      `json:"case"`
	Windows    []string    `json:"effective_windows"`
	NilWindows bool        `json:"nil_windows"`
	Steps      []radarStep `json:"steps"`
}

type radarInput struct {
	at       time.Time
	code     int
	wantDown int
	wantUp   int
}

func radarWindows(t *testing.T, values ...string) []health.SilenceWindow {
	t.Helper()
	result := make([]health.SilenceWindow, 0, len(values))
	for _, value := range values {
		var window health.SilenceWindow
		if err := window.Parse(value); err != nil {
			t.Fatal(err)
		}
		result = append(result, window)
	}
	return result
}

func TestRadarMonitorSilence(t *testing.T) {
	output := os.Getenv("RADAR_GODOXY_OUTPUT")
	if output == "" {
		t.Fatal("Set RADAR_GODOXY_OUTPUT to a fresh output directory")
	}
	if err := os.Mkdir(output, 0o700); err != nil {
		t.Fatal(err)
	}
	var results []radarCase
	utc := func(day, hour, minute, second int) time.Time {
		return time.Date(2026, 11, day, hour, minute, second, 0, time.UTC)
	}
	localZone := time.FixedZone("fixture-UTC-08", -8*60*60)
	local := func(day, hour, minute int) time.Time {
		return time.Date(2026, 11, day, hour, minute, 0, 0, localZone)
	}
	window := radarWindows(t, "03:00-04:00")
	config := func(windows []health.SilenceWindow, retries int64) health.HealthCheckConfig {
		return health.HealthCheckConfig{Interval: time.Second, Timeout: time.Second,
			Retries: retries, Silence: windows}
	}
	run := func(name string, cfg health.HealthCheckConfig, steps []radarInput) {
		t.Helper()
		var status atomic.Int64
		var requests atomic.Int64
		status.Store(http.StatusOK)
		server := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodHead || r.URL.Path != "/health" {
				t.Errorf("unexpected probe: %s %s", r.Method, r.URL.Path)
			}
			requests.Add(1)
			w.WriteHeader(int(status.Load()))
		}))
		listener, err := net.Listen("tcp4", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		server.Listener = listener
		server.Start()
		defer server.Close()
		u, err := url.Parse(server.URL)
		if err != nil {
			t.Fatal(err)
		}
		var mon monitor
		mon.init(u, cfg, func(target *url.URL) (health.HealthCheckResult, error) {
			return healthcheck.HTTP(target, http.MethodHead, "/health", time.Second)
		})
		mon.service = "radar/" + name
		var current time.Time
		mon.now = func() time.Time { return current }
		notices := make([]radarNotice, 0)
		down, up := 0, 0
		mon.notifyFunc = func(message *notif.LogMessage) {
			kind := "unknown"
			switch message.Level {
			case zerolog.WarnLevel:
				kind = "down"
				down++
			case zerolog.InfoLevel:
				kind = "up"
				up++
			default:
				t.Errorf("unexpected notification level %s", message.Level)
			}
			body, err := message.Body.Format(notif.LogFormatRawJSON)
			if err != nil {
				t.Fatal(err)
			}
			var fields []notif.LogField
			if err := json.Unmarshal(body, &fields); err != nil {
				t.Fatal(err)
			}
			for i := range fields {
				if fields[i].Name == "Time" || fields[i].Name == "Last Seen" {
					fields[i].Value = "<wall-clock field, not a timing result>"
				}
				fields[i].Value = strings.ReplaceAll(fields[i].Value, server.URL, "<owned-probe>")
			}
			notices = append(notices, radarNotice{kind, message.Title, fields})
		}
		result := radarCase{Name: name, Windows: make([]string, 0), NilWindows: mon.config.Silence == nil}
		for _, w := range mon.config.Silence {
			result.Windows = append(result.Windows, w.String())
		}
		for _, step := range steps {
			current = step.at
			status.Store(int64(step.code))
			before := requests.Load()
			if err := mon.checkUpdateHealth(); err != nil {
				t.Fatal(err)
			}
			if requests.Load() != before+1 {
				t.Fatalf("%s: actual HTTP probe was not observed", name)
			}
			wantStatus := health.StatusHealthy
			if step.code == http.StatusServiceUnavailable {
				wantStatus = health.StatusUnhealthy
			}
			if mon.Status() != wantStatus || down != step.wantDown || up != step.wantUp {
				t.Fatalf("%s at %s: status=%s down=%d up=%d, wanted status=%s down=%d up=%d",
					name, current, mon.Status(), down, up, wantStatus, step.wantDown, step.wantUp)
			}
			result.Steps = append(result.Steps, radarStep{current.Format(time.RFC3339), step.code,
				requests.Load(), fmt.Sprint(mon.Status()), mon.numConsecFailures.Load(),
				mon.downNotificationSent.Load(), append([]radarNotice{}, notices...)})
		}
		results = append(results, result)
		progress, err := json.MarshalIndent(results, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(output, "progress.json"), append(progress, '\n'), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	run("ordinary_down_threshold_and_recovery", config(nil, 2), []radarInput{
		{utc(17, 2, 50, 0), 200, 0, 0}, {utc(17, 2, 51, 0), 503, 0, 0},
		{utc(17, 2, 52, 0), 503, 1, 0}, {utc(17, 2, 53, 0), 503, 1, 0},
		{utc(17, 2, 54, 0), 200, 1, 1},
	})
	run("failure_and_recovery_inside_silence", config(window, 2), []radarInput{
		{utc(17, 3, 10, 0), 503, 0, 0}, {utc(17, 3, 11, 0), 503, 0, 0},
		{utc(17, 3, 12, 0), 200, 0, 0},
	})
	run("still_down_at_exact_window_end", config(window, 2), []radarInput{
		{utc(17, 3, 59, 58), 503, 0, 0}, {utc(17, 3, 59, 59), 503, 0, 0},
		{utc(17, 4, 0, 0), 503, 1, 0}, {utc(17, 4, 0, 1), 503, 1, 0},
		{utc(17, 4, 1, 0), 200, 1, 1},
	})
	run("earlier_down_recovers_inside_silence", config(window, -1), []radarInput{
		{utc(17, 2, 55, 0), 503, 1, 0}, {utc(17, 3, 10, 0), 200, 1, 1},
	})
	midnight := radarWindows(t, "23:30-00:30")
	run("cross_midnight_local_clock", config(midnight, -1), []radarInput{
		{local(17, 23, 45), 503, 0, 0}, {local(18, 0, 15), 503, 0, 0},
		{local(18, 0, 30), 503, 1, 0}, {local(18, 0, 31), 200, 1, 1},
	})
	run("same_instant_expressed_in_utc", config(midnight, -1), []radarInput{
		{local(17, 23, 45).UTC(), 503, 1, 0},
	})
	defaults := config(window, -1)
	inherit := config(nil, -1)
	inherit.ApplyDefaults(defaults)
	run("nil_windows_inherit", inherit, []radarInput{{utc(17, 3, 10, 0), 503, 0, 0}})
	optOut := config([]health.SilenceWindow{}, -1)
	optOut.ApplyDefaults(defaults)
	run("empty_windows_opt_out", optOut, []radarInput{{utc(17, 3, 10, 0), 503, 1, 0}})
	override := config(radarWindows(t, "05:00-06:00"), -1)
	override.ApplyDefaults(defaults)
	run("custom_window_overrides_default", override, []radarInput{{utc(17, 3, 10, 0), 503, 1, 0}})
	result := struct {
		Source string      `json:"source_commit"`
		Go     string      `json:"go"`
		OS     string      `json:"os"`
		Arch   string      `json:"arch"`
		Cases  []radarCase `json:"cases"`
		Limit  string      `json:"limits"`
	}{"77cbac6b532d7d3881010eade21fe1a7f9e4bf8e", runtime.Version(), runtime.GOOS,
		runtime.GOARCH, results, "Logical clock and notification callback; no router/ticker/container/external-delivery acceptance."}
	encoded, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(output, "results.json"), append(encoded, '\n'), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Logf("saved %d monitor scenarios with actual HTTP probes", len(results))
}
