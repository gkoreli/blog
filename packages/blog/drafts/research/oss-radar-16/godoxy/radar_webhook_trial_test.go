package monitor

// A focused integration of the real monitor, dispatcher and Webhook provider.
// The backend rejects the first down POST with 503, then returns 204.
import (
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/yusing/godoxy/internal/health"
	healthcheck "github.com/yusing/godoxy/internal/health/check"
	"github.com/yusing/godoxy/internal/notif"
	"github.com/yusing/goutils/task"
)

func radarListen(t *testing.T, handler http.HandlerFunc) *httptest.Server {
	t.Helper()
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewUnstartedServer(handler)
	server.Listener = listener
	server.Start()
	t.Cleanup(server.Close)
	return server
}

func TestRadarWebhookDelivery(t *testing.T) {
	output := os.Getenv("RADAR_GODOXY_OUTPUT")
	if output == "" {
		t.Fatal("Set RADAR_GODOXY_OUTPUT to a fresh output directory")
	}
	if err := os.Mkdir(output, 0o700); err != nil {
		t.Fatal(err)
	}
	type delivery struct {
		Title  string `json:"title"`
		Status int    `json:"http_status"`
		Detail string `json:"observed_detail,omitempty"`
	}
	requests := make(chan delivery, 8)
	var count atomic.Int32
	hook := radarListen(t, func(w http.ResponseWriter, req *http.Request) {
		var payload struct {
			Title  string           `json:"title"`
			Fields []notif.LogField `json:"fields"`
		}
		if req.Method != http.MethodPost || json.NewDecoder(req.Body).Decode(&payload) != nil {
			t.Error("expected a JSON webhook POST")
			w.WriteHeader(400)
			return
		}
		status := http.StatusNoContent
		if count.Add(1) == 1 {
			status = http.StatusServiceUnavailable
		}
		var detail string
		for _, field := range payload.Fields {
			if field.Name == "Detail" {
				detail = field.Value
			}
		}
		w.WriteHeader(status)
		requests <- delivery{payload.Title, status, detail}
	})
	provider := &notif.Webhook{
		ProviderBase: notif.ProviderBase{Name: "owned-loopback", URL: hook.URL},
		Payload:      `{"title":$title,"fields":$fields}`,
	}
	if err := provider.Validate(); err != nil {
		t.Fatal(err)
	}
	dispatcher := notif.NewDispatcher(task.GetTestTask(t))
	dispatcher.RegisterProvider(&notif.NotificationConfig{Provider: provider})
	var code atomic.Int32
	probe := radarListen(t, func(w http.ResponseWriter, req *http.Request) {
		if req.Method != http.MethodHead || req.URL.Path != "/health" {
			t.Error("unexpected health probe")
		}
		w.WriteHeader(int(code.Load()))
	})
	target, err := url.Parse(probe.URL)
	if err != nil {
		t.Fatal(err)
	}
	var silence health.SilenceWindow
	if err := silence.Parse("03:00-04:00"); err != nil {
		t.Fatal(err)
	}
	var mon monitor
	mon.init(target, health.HealthCheckConfig{Retries: -1, Silence: []health.SilenceWindow{silence}},
		func(u *url.URL) (health.HealthCheckResult, error) {
			return healthcheck.HTTP(u, http.MethodHead, "/health", time.Second)
		})
	mon.service = "radar-webhook-fixture"
	var enqueued int
	mon.notifyFunc = func(msg *notif.LogMessage) {
		enqueued++
		dispatcher.Notify(msg)
	}
	clock := time.Date(2026, 11, 18, 3, 59, 59, 0, time.UTC)
	mon.now = func() time.Time { return clock }
	code.Store(http.StatusServiceUnavailable)
	if err := mon.checkUpdateHealth(); err != nil {
		t.Fatal(err)
	}
	if enqueued != 0 || mon.Status() != health.StatusUnhealthy {
		t.Fatal("silence should inhibit the notification, while the status remains unhealthy")
	}
	clock = clock.Add(time.Second)
	if err := mon.checkUpdateHealth(); err != nil {
		t.Fatal(err)
	}
	if enqueued != 1 || !mon.downNotificationSent.Load() {
		t.Fatal("the monitor should enqueue one down notice at the end boundary")
	}
	take := func() delivery {
		t.Helper()
		select {
		case got := <-requests:
			return got
		case <-time.After(6 * time.Second):
			t.Fatal("expected the owned webhook to receive the notice")
			return delivery{}
		}
	}
	first, retry := take(), take()
	if first.Status != 503 || retry.Status != 204 || first.Title != retry.Title ||
		!strings.Contains(first.Title, "Service went down") || retry.Detail != "Service Unavailable" {
		t.Fatalf("unexpected down delivery or retry: %+v then %+v", first, retry)
	}
	code.Store(http.StatusOK)
	if err := mon.checkUpdateHealth(); err != nil {
		t.Fatal(err)
	}
	up := take()
	if enqueued != 2 || up.Status != 204 || !strings.Contains(up.Title, "Service is up") {
		t.Fatalf("unexpected recovery delivery: %+v", up)
	}
	result := struct {
		Enqueued     int        `json:"monitor_notices"`
		HTTPRequests []delivery `json:"webhook_requests"`
	}{enqueued, []delivery{first, retry, up}}
	raw, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(output, "results.json"), append(raw, '\n'), 0o600); err != nil {
		t.Fatal(err)
	}
}
