"""Use a released GoDoxy binary to compare live reload with quiet-window expiration.

Run in a disposable Linux guest: TZ=UTC python3 route_reload_trial.py BINARY FRESH_DIR MODE
MODE is reload or expires. Both backends, the webhook, and GoDoxy listen on loopback.
"""

from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import sys
import threading
import time
from urllib.request import ProxyHandler, Request, build_opener


def wait_for(predicate, seconds, description):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if predicate():
            return
        time.sleep(0.12)
    raise AssertionError(description)


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def main():
    binary, output = (Path(arg).resolve() for arg in sys.argv[1:3])
    mode = sys.argv[3]
    if mode not in ("reload", "expires"):
        raise ValueError("MODE must be reload or expires")
    if time.localtime().tm_gmtoff != 0:
        raise ValueError("Set TZ=UTC so the fixture and proxy agree on the clock")
    output.mkdir(mode=0o700)
    config_dir = output / "config"
    config_dir.mkdir()
    started = time.monotonic()
    inherited, override = "inherited", "override"
    status = {inherited: 200, override: 200}
    probes = dict.fromkeys(status, 0)
    notices = []
    conditions = []
    phase = "startup"
    lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_HEAD(self):
            self.do_GET()

        def do_GET(self):
            route = self.server.route
            if self.path == "/health":
                with lock:
                    probes[route] += 1
                    code = status[route]
                body = f"fixture health {code}".encode()
            else:
                code, body = 200, f"fixture route {route}".encode()
            self.send_response(code)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command == "GET":
                self.wfile.write(body)

        def do_POST(self):
            payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            title = payload.get("title", "")
            fields = {field.get("name", field.get("Name")): field.get("value", field.get("Value"))
                      for field in payload.get("fields", [])}
            service = fields.get("Service Name")
            if service and ("Service went down" in title or "Service is up" in title):
                with lock:
                    notices.append({
                        "kind": "down" if "went down" in title else "up",
                        "service": service.casefold(),
                        "phase": phase,
                        "at": datetime.now().astimezone().isoformat(timespec="milliseconds"),
                        "response_status": 204,
                    })
            self.send_response(204)
            self.end_headers()

    def listen(route):
        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        server.route = route
        threading.Thread(target=server.serve_forever, daemon=True).start()
        return server

    sources = {route: listen(route) for route in status}
    receiver = listen(None)
    proxy_port, api_port = free_port(), free_port()
    opener = build_opener(ProxyHandler({}))
    now = datetime.now().astimezone()
    end = now.replace(second=0, microsecond=0) + timedelta(minutes=2 if mode == "expires" else 10)
    window = f"{(now - timedelta(minutes=3)):%H:%M}-{end:%H:%M}"
    routes = ""
    for route, server in sources.items():
        routes += f"{route}:\n  host: 127.0.0.1\n  port: {server.server_port}\n  healthcheck:\n    path: /health\n"
        if route == override:
            routes += "    silence: []\n"
    (config_dir / "routes.yml").write_text(routes)

    def configure(windows):
        next_file = config_dir / "config.yml.next"
        next_file.write_text(f"""match_domains: [example.test]
defaults:
  healthcheck:
    interval: 1s
    timeout: 1s
    retries: -1
    silence: {json.dumps(windows)}
providers:
  include: [routes.yml]
  notification:
    - name: radar
      provider: webhook
      url: http://127.0.0.1:{receiver.server_port}/notice
      payload: '{{"title": $title, "fields": $fields}}'
""")
        next_file.replace(config_dir / "config.yml")

    def serves(route):
        request = Request(f"http://127.0.0.1:{proxy_port}/report",
                          headers={"Host": f"{route}.example.test"})
        try:
            with opener.open(request, timeout=2) as response:
                return response.status == 200 and response.read().decode() == f"fixture route {route}"
        except OSError:
            return False

    def count(kind, route):
        with lock:
            return sum(item["kind"] == kind and item["service"] == route for item in notices)

    configure([window])
    env = {
        "PATH": "/usr/bin:/bin", "TZ": "UTC", "GODOXY_HTTP_ADDR": f"127.0.0.1:{proxy_port}",
        "GODOXY_HTTPS_ADDR": "", "GODOXY_API_ADDR": f"127.0.0.1:{api_port}",
        "GODOXY_API_USER": "fixture", "GODOXY_API_PASSWORD": secrets.token_urlsafe(24),
        "GODOXY_INIT_TIMEOUT": "25s",
    }
    passed = False
    with (output / "proxy.log").open("wb") as log:
        proc = subprocess.Popen([str(binary)], cwd=output, stdout=log, stderr=log, env=env)
        try:
            wait_for(lambda: (all(map(serves, status)) and min(probes.values()) > 0)
                     or proc.poll() is not None, 30, "both routes should serve and probe")
            assert proc.poll() is None, f"proxy exited early: {proc.returncode}"
            assert len(notices) == 0
            conditions.append("both proxy routes served while healthy")
            with lock:
                phase = "window"
                before = dict(probes)
                status.update(dict.fromkeys(status, 503))
            wait_for(lambda: count("down", override) == 1
                     and all(probes[route] >= old + 3 for route, old in before.items()),
                     18, "override should send while inherited route keeps checking")
            assert count("down", inherited) == 0
            assert all(map(serves, status))
            conditions.append("inherited silence deferred the down notification and the explicit empty list sent it")

            if mode == "reload":
                phase = "reload"
                configure([])
                wait_for(lambda: count("down", inherited) == 1 and count("down", override) == 2,
                         30, "reload should send the deferred alert and repeat the unchanged route's down alert")
                conditions.append("removing default silence repeated the unchanged route's down alert")
            else:
                phase = "expiration"
                remaining = (end - datetime.now().astimezone()).total_seconds()
                wait_for(lambda: count("down", inherited) == 1, max(1, remaining) + 18,
                         "elapsed silence should release the deferred down alert")
                first_inherited_down = next(item for item in notices if item["service"] == inherited)
                assert datetime.fromisoformat(first_inherited_down["at"]) >= end
                before = dict(probes)
                wait_for(lambda: all(probes[route] >= old + 2 for route, old in before.items()),
                         15, "both routes should keep checking after the window")
                assert count("down", override) == 1
                conditions.append("natural expiration sent only the deferred down alert")

            assert all(map(serves, status))
            with lock:
                phase = "recovery"
                status.update(dict.fromkeys(status, 200))
            wait_for(lambda: count("up", inherited) == 1 and count("up", override) == 1,
                     18, "both routes should send recovery")
            conditions.append("both routes delivered a single recovery alert")
            passed = True
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=8)
                except subprocess.TimeoutExpired:
                    proc.kill()
                    proc.wait(timeout=5)
            for server in [*sources.values(), receiver]:
                server.shutdown()
                server.server_close()
            report = {
                "mode": mode, "passed": passed, "window_utc": window, "conditions": conditions,
                "notices": notices, "probes": probes, "proxy_exit_status": proc.returncode,
                "elapsed_seconds": round(time.monotonic() - started, 2),
            }
            encoded = json.dumps(report, indent=2) + "\n"
            (output / "results.json").write_text(encoded)
            print(encoded, end="", flush=True)


if __name__ == "__main__":
    main()
