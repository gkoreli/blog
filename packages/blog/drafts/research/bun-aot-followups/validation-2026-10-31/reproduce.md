# Reproduce the application trials

This is a macOS arm64 runner. It uses `/usr/bin/time -l` and `proc_pid_rusage`; Linux/Windows are not certified. Read the [method and limits](README.md) first. Use a compiler matching the pinned revision; changing the canary, dependencies or source creates a new comparison, not a rerun of these exact bytes.

## Inputs and preparation

Required: Python 3, GitHub CLI, curl, tar/unzip, Xcode command-line C tools, make, and the pinned Bun compiler. No system PostgreSQL installation or existing database is used. Run the following from this research directory. Keep the same shell so the temporary paths persist.

```sh
set -eu
export STUDY_SOURCE="$PWD"
export LAB_DIR="$(mktemp -d /tmp/bun-aot-study-XXXXXX)"
mkdir -p "$LAB_DIR/compiler" "$LAB_DIR/sources" "$LAB_DIR/validator" "$LAB_DIR/framework"
curl -fL https://github.com/oven-sh/bun/releases/download/canary/bun-darwin-aarch64.zip -o "$LAB_DIR/compiler/bun.zip"
printf '%s  %s\n' 67ede5394a7da4a8b1a1eb0788b72325f480bc956cb1155b6be962919c9aa581 "$LAB_DIR/compiler/bun.zip" | shasum -a 256 -c -
unzip -q "$LAB_DIR/compiler/bun.zip" -d "$LAB_DIR/compiler"
export BUN_AOT="$LAB_DIR/compiler/bun-darwin-aarch64/bun"
"$BUN_AOT" --revision
```

The canary URL is mutable. **If its digest differs, stop.** The tested release asset was GitHub asset `687869686`, uploaded October 29. GitHub may replace or remove historical canary assets. The full compiler source revision is `da867c60bf0bcbf9d6d36994f8ca0efa42075115`; a local build of it needs its own artifact hash and conditions. Do not silently substitute today's canary for the frozen test.

Download and unpack the public projects:

```sh
gh api repos/ata-core/ata-validator/tarball/8cfedd9e33af092eba91cc615fb7ca98ddc99cb0 > "$LAB_DIR/sources/ata.tar.gz"
gh api repos/saltyaom/bun-http-framework-benchmark/tarball/f654bcd175165bce2e3c83b65eaecd8e34294ffd > "$LAB_DIR/sources/frameworks.tar.gz"
gh api repos/Dave93/elysia-vs-nest/tarball/d58f3d10daa53f8e6c7b085fc3b2b2d9c38b8056 > "$LAB_DIR/sources/api.tar.gz"
for project in ata frameworks api; do
  mkdir "$LAB_DIR/sources/$project"
  tar -xzf "$LAB_DIR/sources/$project.tar.gz" --strip-components=1 -C "$LAB_DIR/sources/$project"
done
cp validator/*.mjs validator/*.py validator/package.json validator/bun.lock "$LAB_DIR/validator/"
cp results/framework-package.json "$LAB_DIR/framework/package.json"
cp results/framework-bun.lock "$LAB_DIR/framework/bun.lock"
"$BUN_AOT" install --cwd "$LAB_DIR/validator" --frozen-lockfile --ignore-scripts --no-optional
"$BUN_AOT" install --cwd "$LAB_DIR/framework" --frozen-lockfile --ignore-scripts
"$BUN_AOT" install --cwd "$LAB_DIR/sources/api/apps/elysia-api" --frozen-lockfile --ignore-scripts
"$BUN_AOT" install --cwd "$LAB_DIR/sources/api" --frozen-lockfile --ignore-scripts
clang -O2 -Wall -Wextra -pthread http-load.c -o "$LAB_DIR/http-load"
```

The validator's local `file:` dependency deliberately resolves the pinned source checkout, whose package labels itself 1.61.3. It is not a claim that every npm archive with that version contains identical source. Optional native validation is disabled in the runner. The saved lock also contains Zod, which is not imported by these measured ata fixtures.

## Isolated PostgreSQL

The runner uses loopback port **55439**. The following new server must start successfully before any seed command runs. It uses a new temporary data directory and socket directory. Do not redirect the seed to an existing database: upstream's seed recreates `bench_saas`.

```sh
cd "$LAB_DIR/sources"
curl -fsSL https://ftp.postgresql.org/pub/source/v17.10/postgresql-17.10.tar.bz2 -o postgresql-17.10.tar.bz2
curl -fsSL https://ftp.postgresql.org/pub/source/v17.10/postgresql-17.10.tar.bz2.sha256 -o postgresql-17.10.tar.bz2.sha256
shasum -a 256 -c postgresql-17.10.tar.bz2.sha256
tar -xjf postgresql-17.10.tar.bz2
cd postgresql-17.10
./configure --prefix="$LAB_DIR/postgres" --without-icu --without-readline --without-zlib
make -j4
make install
"$LAB_DIR/postgres/bin/initdb" -D "$LAB_DIR/pgdata" -U postgres -A trust --no-locale
"$LAB_DIR/postgres/bin/pg_ctl" -D "$LAB_DIR/pgdata" -l "$LAB_DIR/pg-server.log" -o "-h 127.0.0.1 -p 55439 -k $LAB_DIR" start
cd "$LAB_DIR/sources/api"
python3 - <<'PY'
from pathlib import Path
p = Path('bench/seed.ts')
Path('bench/seed-local.ts').write_text(p.read_text().replace('localhost:5432', '127.0.0.1:55439'))
PY
"$BUN_AOT" bench/seed-local.ts
```

Expected seed: 50,000 users and 200,000 orders. The original deterministic generator is retained; only its connection host/port change. Timed routes perform reads. Correctness checks make a small number of order inserts, whose generated ID/date are normalized exactly as in the upstream comparison.

## Build and check

```sh
cd "$STUDY_SOURCE"
python3 prepare-servers.py --root "$LAB_DIR"
python3 server-study.py --root "$LAB_DIR" --suite framework --stage verify --out "$LAB_DIR/framework/parity"
python3 server-study.py --root "$LAB_DIR" --suite api --stage verify --out "$LAB_DIR/api-parity"
cd "$LAB_DIR/validator"
python3 measure.py --bun "$BUN_AOT" --out "$LAB_DIR/validator/final" --runs 12
```

No timing is accepted before matching expected outputs. The API's ordinary packaged mode uses explicit dependency imports; Elysia's full plugin is another mode. The generated wrappers do not modify the upstream route handlers or database layer. The framework fixtures still require their unchanged video asset directory; executable bytes alone do not include that external 14.15 MB file.

The first validator runner compares runtime and raw emitted APIs with normalized error descriptors. Those APIs have different returned data/error/default behavior. Its observations are retained for that narrower question. The matching-output runner below checks full results before timing and supplies the fairer API comparison used in the updated article.

## Main server trials

Run performance work sequentially, on AC power, with other builds stopped. The scripts terminate only their own child servers and pick free HTTP ports. Keep logs and all numeric observations, including failed or slower trials.

```sh
cd "$STUDY_SOURCE"
python3 capture-inputs.py --root "$LAB_DIR" --out "$LAB_DIR/inputs.json"
python3 server-study.py --root "$LAB_DIR" --suite framework --stage startup --runs 24 --out "$LAB_DIR/framework/startup"
python3 server-study.py --root "$LAB_DIR" --suite api --stage startup --runs 24 --out "$LAB_DIR/api-startup"
python3 server-study.py --root "$LAB_DIR" --suite framework --stage noise --only elysia-jit --runs 5 --seconds 5 --out "$LAB_DIR/framework/noise"
python3 server-study.py --root "$LAB_DIR" --suite api --stage noise --only api-wired-jit --runs 5 --seconds 5 --out "$LAB_DIR/api-noise"
python3 server-study.py --root "$LAB_DIR" --suite framework --stage load --runs 6 --seconds 8 --concurrency 8 --out "$LAB_DIR/framework/load"
python3 server-study.py --root "$LAB_DIR" --suite api --stage load --runs 8 --seconds 8 --concurrency 8 --out "$LAB_DIR/api-load"
```

## Matching-output, bytecode, driver and longer controls

These are separate batches. The shorter controls do not replace the main pass. The extra builder uses `--bytecode --format=esm`, because this API has top-level `await`; omitting the format selects CommonJS and failed in our initial setup. This changes a build option, without changing the application source.

```sh
python3 build-extras.py --root "$LAB_DIR"
cd "$LAB_DIR/validator"
python3 measure-contract.py --bun "$BUN_AOT" --out "$LAB_DIR/validator/contract" --runs 12
cd "$STUDY_SOURCE"
sh run-controls.sh "$LAB_DIR"
python3 summarize.py --root "$LAB_DIR" --out "$LAB_DIR/accepted"
```

The strict validator gate requires matching serialized results, input mutation and data identity for all 103 selected cases of the two timed schemas. All 133 labeled verdicts must match. The 30 untimed defaults cases are still reported, including one multiple-error ordering difference; the adapter is not a general replacement for ata's preprocessing.

The control script runs the three-way JIT/bytecode/native startup and hot-route comparison; a four-cell JIT/native × Bun SQL/postgres.js check; two 60-second processes per JIT/native mode on framework JSON and API authenticated read; and four blocks per JIT/native pair at one and 32 connections. `summarize.py` refuses incomplete batches and checks run positions, request/histogram counts, response failures and memory consistency before computing summaries. Its CPU analysis uses the host calibration recorded by `capture-inputs.py`.

This guide assembles the executed runners and observed setup steps. A fresh machine has not independently run it end to end. Neither preparation commands nor our own repeated processes count as an independent operator replication. All 13 server batches and both validator batches were accepted; [results and limits](README.md), [hashed evidence manifest](results/evidence-manifest.json), [publication worklist](00-plan.md).

Stop only this study's database when finished:

```sh
"$LAB_DIR/postgres/bin/pg_ctl" -D "$LAB_DIR/pgdata" stop
```
