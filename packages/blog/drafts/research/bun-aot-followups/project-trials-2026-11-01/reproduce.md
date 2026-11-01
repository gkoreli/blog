# Reproduce the real-project trials

macOS arm64, Python 3.10+, C compiler, Git/GitHub CLI, the pinned Bun and a local PostgreSQL 17 installation are required. Keep source/data versions fixed. The runner uses macOS process accounting; this is not a Linux certification. Read [the plan](00-plan.md) and [source audit](01-source-and-claim-audit.md) first.

## Isolated inputs

From this research directory, keep the same shell:

```sh
set -eu
export STUDY_SOURCE="$PWD"
export LAB_DIR="$(mktemp -d /tmp/bun-aot-projects-XXXXXX)"
mkdir -p "$LAB_DIR/compiler"
git clone https://github.com/actionhero/keryx.git "$LAB_DIR/keryx"
git -C "$LAB_DIR/keryx" checkout d119595bec716ae99b4eca740964343e47f57eee
git clone https://github.com/ramonmalcolm10/next-bun-compile.git "$LAB_DIR/next-bun-compile"
git -C "$LAB_DIR/next-bun-compile" checkout 43ab16c93774f23923654d337e6e2d9c205e4fe4
curl -fL https://github.com/oven-sh/bun/releases/download/canary/bun-darwin-aarch64.zip -o "$LAB_DIR/compiler/bun.zip"
printf '%s  %s\n' 9878f8609a02b7b23dcbb9a1b592aa8ab820ed8652975814c5646b36957e1680 "$LAB_DIR/compiler/bun.zip" | shasum -a 256 -c -
unzip -q "$LAB_DIR/compiler/bun.zip" -d "$LAB_DIR/compiler"
export BUN_STUDY="$LAB_DIR/compiler/bun-darwin-aarch64/bun"
"$BUN_STUDY" --revision
"$BUN_STUDY" install --cwd "$LAB_DIR/keryx" --frozen-lockfile --ignore-scripts
"$BUN_STUDY" install --cwd "$LAB_DIR/next-bun-compile" --frozen-lockfile --ignore-scripts
```

The canary URL changes. Stop if the digest differs; do not silently replace this experiment's `3f3a9ff87cdccf3d32d7ec6b648c664eddaae840` compiler with today's binary. The official release asset was `697873698`. If the historical binary is no longer available, build that source revision and record its own artifact hash as a new reproduction condition.

## Database for the full Keryx example

Set `PG_BIN` to PostgreSQL 17's binary directory. The original trial used 17.10 built in the earlier [application preparation](../validation-2026-10-31/reproduce.md#isolated-postgresql). Use a new data directory. The server must start successfully on the explicit loopback port before a database or migration command runs. Do not point this at an existing database.

```sh
export PG_BIN=/path/to/postgres/bin
"$PG_BIN/initdb" -D "$LAB_DIR/pgdata" -U postgres -A trust --no-locale
"$PG_BIN/pg_ctl" -D "$LAB_DIR/pgdata" -l "$LAB_DIR/postgres.log" -o "-h 127.0.0.1 -p 55441 -k $LAB_DIR" -w start
"$PG_BIN/createdb" -h 127.0.0.1 -p 55441 -U postgres keryx_study
"$PG_BIN/psql" -h 127.0.0.1 -p 55441 -U postgres -d keryx_study -v ON_ERROR_STOP=1 -f "$LAB_DIR/keryx/example/backend/drizzle/0000_eminent_tyger_tiger.sql"
"$PG_BIN/psql" -h 127.0.0.1 -p 55441 -U postgres -d keryx_study -v ON_ERROR_STOP=1 -f "$LAB_DIR/keryx/example/backend/drizzle/0001_nebulous_mephistopheles.sql"
```

Only this cluster belongs to the trial. The initial study uses the framework's documented `memory://` Redis implementation. Separate controls below use real Redis. Task workers and rate limiting are off. Keryx's real Application initializer still runs and uses PostgreSQL. The runner disables automatic migrations after applying the upstream SQL.

## Build the named corrected variants

```sh
python3 build.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-normalized" --project keryx
python3 build.py --lab "$LAB_DIR" --out "$LAB_DIR/next-final" --project next
```

`build.py` is a parameterized reproduction, rather than the original task-specific helper. Original executed argument lists, hashes and patch are retained in results. Keryx has one source change: normalize its template path. Lua/templates and runtime-discovered modules are included explicitly; handlers are unchanged. The ordinary baseline runs that same source with Bun. The minimal upstream packaged JIT and AOT commands both failed before `--help`; their failures are part of the evidence, not working numerical baselines.

The Next fixture starts from the upstream sharp example. Two added files provide a deterministic force-dynamic JSON route and static text asset. The original page/image handlers are unchanged. Both final launchers use the same thirteen-property console prelude; native additionally permits disk-loaded code. Next's extracted JS is interpreted in that mode. This does not implement the separate official native Next standalone recipe.

## Check, then measure sequentially

Use fresh output folders and do not run builds or other load tests alongside measurement. The site repository must include `packages/blog/tools/bun-aot-check/`, which supplies the checked client and accounting helper; hashes identify those exact inputs.

```sh
python3 study.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-verify" --project keryx --stage verify --runs 1
python3 study.py --lab "$LAB_DIR" --out "$LAB_DIR/next-verify" --project next --stage verify --runs 1
python3 study.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-startup" --project keryx --stage startup --runs 12
python3 study.py --lab "$LAB_DIR" --out "$LAB_DIR/next-startup" --project next --stage startup --runs 12
python3 study.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-load" --project keryx --stage load --runs 6
python3 study.py --lab "$LAB_DIR" --out "$LAB_DIR/next-load" --project next --stage load --runs 6
python3 extra-checks.py --lab "$LAB_DIR" --out "$LAB_DIR/next-dynamic" --stage next-dynamic
```

Every selected output is checked before load. Each measured response must match the full accepted body/status. PNGs have CRC and pixel checks. The rejected Keryx case checks all error fields except its explicitly validated timestamp. Headers are checked before timing; timed requests check body/status. The fixed C client requires HTTP/1.1 Content-Length responses under 120 KB; these selected routes satisfy that framing.

Startup reports the first expected page/action response. Next's extraction is separate: verify uses fresh runtime trees; startup/load pre-extract them. The additional dynamic-startup control measures process launch to the first actual JSON API result. Warmed route trials use two seconds warmup, five measured seconds, eight connections, six alternating fresh processes per mode and reversed route order. File-system/database caches are not flushed. App memory excludes PostgreSQL and the load generator; physical footprint is distinct from RSS and executable/extracted bytes. No imposed CPU/RAM limit, remote load generator, production soak or cloud-price claim.

The `private/` outputs contain application/build logs and binaries. Review before sharing. Committed evidence contains selected methods, hashes, full numeric observations and diagnostics, not private mail or arbitrary process lists.

## Cookie, real-service and timer controls

These follow the original timed batches; run sequentially. `extra-checks.py --stage keryx` is expected to exit nonzero because original native MCP startup fails. Inspect its ten rows: all eight CLI cases and source MCP must pass; the only failure should be native MCP startup. The original v1 checker misread rejection stderr; `executed-extra-checks-v1.py` preserves it and also identifies the exact runner used for the first-dynamic capture. The current checker fixes only that parsing bug.

```sh
python3 extra-checks.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-extra-v2" --stage keryx
```

Run that expected-failure command separately from a shell with `set -e`; inspect the saved result before continuing. Do not turn an arbitrary nonzero exit into an accepted result.

```sh
python3 cookie-study.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-cookie"
curl -fL https://download.redis.io/releases/redis-8.0.3.tar.gz -o "$LAB_DIR/redis-8.0.3.tar.gz"
printf '%s  %s\n' 33f37290b00b14e9a884dd4dcba335febd63ea16c51609d34fa41e031ad587df "$LAB_DIR/redis-8.0.3.tar.gz" | shasum -a 256 -c -
tar -xzf "$LAB_DIR/redis-8.0.3.tar.gz" -C "$LAB_DIR"
make -C "$LAB_DIR/redis-8.0.3" -j4 MALLOC=libc BUILD_TLS=no
python3 external-redis.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-external"
python3 long-redis.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-long"
python3 prepare-timer-fix.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-timer-fixed"
python3 timer-study.py --lab "$LAB_DIR" --out "$LAB_DIR/timer-short" --stage short
python3 timer-study.py --lab "$LAB_DIR" --out "$LAB_DIR/timer-long-fixed" --stage long-fixed
```

Run the session diagnostic from the example backend with explicit configuration, then retain only its final JSON record plus the runner hash:

```sh
python3 - <<'PYTHON'
import hashlib, json, os, socket, subprocess
from pathlib import Path
lab = Path(os.environ['LAB_DIR']); source = Path(os.environ['STUDY_SOURCE']) / 'session-profile.ts'
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
env = {**os.environ, 'NODE_ENV':'production',
       'DATABASE_URL':'postgres://postgres@127.0.0.1:55441/keryx_study',
       'DATABASE_AUTO_MIGRATE':'false', 'REDIS_URL':'memory://',
       'TASKS_ENABLED':'false', 'RATE_LIMIT_ENABLED':'false',
       'WEB_SERVER_ENABLED':'true', 'WEB_SERVER_HOST':'127.0.0.1',
       'WEB_SERVER_PORT':str(port), 'MCP_SERVER_ENABLED':'false', 'LOG_LEVEL':'fatal'}
r = subprocess.run([os.environ['BUN_STUDY'], str(source), str(lab)],
                   cwd=lab/'keryx/example/backend', env=env, capture_output=True,
                   text=True, timeout=30, check=True)
(lab/'session-profile-output.log').write_text(r.stdout+r.stderr)
data = next(json.loads(line) for line in r.stdout.splitlines() if line.startswith('{"before"'))
data['runner_sha256'] = hashlib.sha256(source.read_bytes()).hexdigest()
(lab/'session-profile.json').write_text(json.dumps(data, indent=2)+'\n')
PYTHON
```

Its key counts are 0/20/21/21. The Redis hash was verified against the official [redis-hashes record](https://github.com/redis/redis-hashes/blob/master/README). Each real-Redis runner starts/stops its own loopback service. These are distinct profiles; the one-route four-cell timer comparison is the article's primary Keryx result. Do not substitute two-route session-control medians.

`prepare-timer-fix.py` instruments actual registered HTTP actions with original/fixed source, verifies fast/slow/abort/thrown contracts and compiles a separate native executable. `timer-study.py` changes that single source method only between owned processes, restores it in finally and checks the original hash before starting. Four short rotations balance all four cells. The two fixed minute checks have six ten-second segments each; they are not six independent trials.

## Verify actual standalone behavior

Run after all performance batches. These scripts temporarily rename only their own cloned source directories and restore them in finally; use isolated clones with no other work in them.

```sh
python3 build-mcp.py --lab "$LAB_DIR" --out "$LAB_DIR/keryx-prebuilt"
python3 mcp-proof.py --lab "$LAB_DIR" --binary "$LAB_DIR/keryx-prebuilt/native" --out "$LAB_DIR/native-mcp-proof"
python3 next-package-proof.py --lab "$LAB_DIR" --out "$LAB_DIR/next-package-proof"
python3 summarize.py --lab "$LAB_DIR" --out "$LAB_DIR/accepted-complete"
```

The MCP variant uses Keryx's real UI bundler at build time, then imports its prebuilt HTML in the existing declaration. It is separate from the timeout fix; no combined-variant claim. The proof checks MCP initialize/tool list/public status with source hidden, no Bun on PATH and no child processes. Its anonymous UI resource list is empty under existing auth rules, so UI/browser/authenticated tools are not certified.

The Next proof verifies page, JSON, static bytes and PNG pixels from fresh extracted files with source/node_modules hidden, empty cwd and no Bun on PATH. `build.py` was exercised for each project, then `next-package-proof.py --binaries "$LAB_DIR/next-reproduced"` verified both rebuilt Next modes. A fresh Next build changes its build ID and page hash; compare modes within the same build, not an old binary against a later `.next` page.

`capture.py` packages this original study's historical probes plus accepted captures; it expects their original names and lab-only inputs. It is an archival script, not a requirement for a new reproduction. `verify.py` checks the committed evidence offline. A fresh reproduction must record its own compiler/build/source hashes and conditions rather than overwrite the published capture.

Stop only the cluster created above after all tests finish:

```sh
"$PG_BIN/pg_ctl" -D "$LAB_DIR/pgdata" -w stop
```
