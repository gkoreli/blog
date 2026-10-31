#!/bin/sh
# Invoke only after the main framework/API load process is confirmed complete.
set -eu
STUDY_ROOT="$1"
STUDY_RUNNER="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/server-study.py"

python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite api --stage verify --include-bytecode --only api-source,api-wired-jit,api-wired-bytecode,api-wired-native --out "$STUDY_ROOT/bytecode-parity"
python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite api --stage startup --include-bytecode --only api-wired-jit,api-wired-bytecode,api-wired-native --runs 24 --out "$STUDY_ROOT/bytecode-startup"
python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite api --stage load --include-bytecode --only api-wired-jit,api-wired-bytecode,api-wired-native --routes echo,me --runs 6 --seconds 5 --concurrency 8 --out "$STUDY_ROOT/bytecode-load"
python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite api --stage verify --driver-matrix --out "$STUDY_ROOT/driver-parity"
python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite api --stage load --driver-matrix --routes user,me --runs 4 --seconds 5 --concurrency 8 --out "$STUDY_ROOT/driver-load"
python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite framework --stage soak --only elysia-jit,elysia-native --runs 2 --seconds 60 --concurrency 8 --out "$STUDY_ROOT/framework/soak"
python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite api --stage soak --only api-wired-jit,api-wired-native --runs 2 --seconds 60 --concurrency 8 --out "$STUDY_ROOT/api-soak"
for STUDY_CONNECTIONS in 1 32; do
  python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite framework --stage load --only elysia-jit,elysia-native --runs 4 --seconds 5 --concurrency "$STUDY_CONNECTIONS" --out "$STUDY_ROOT/framework/c$STUDY_CONNECTIONS"
  python3 "$STUDY_RUNNER" --root "$STUDY_ROOT" --suite api --stage load --only api-wired-jit,api-wired-native --routes echo,me --runs 4 --seconds 5 --concurrency "$STUDY_CONNECTIONS" --out "$STUDY_ROOT/api-c$STUDY_CONNECTIONS"
done
