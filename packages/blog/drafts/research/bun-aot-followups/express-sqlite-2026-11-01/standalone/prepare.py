#!/usr/bin/env python3
"""Create a separate project with the exact same serializer as a direct dependency."""
import argparse
import shutil
from pathlib import Path

source = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--base', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
args = parser.parse_args()
if args.out.exists():
    parser.error('Use a fresh output directory')
args.out.mkdir(parents=True)
for name in ['database.mjs', 'cases.json', 'fixture.sqlite', '.mise.toml']:
    shutil.copy2(args.base / name, args.out / name)
for name in ['package.json', 'generate.mjs', 'contract.mjs']:
    shutil.copy2(source / name, args.out / name)
if (source / 'pnpm-lock.yaml').exists():
    shutil.copy2(source / 'pnpm-lock.yaml', args.out / 'pnpm-lock.yaml')
else:
    # Expose the already locked transitive package directly; resolve nothing new.
    lock = (args.base / 'pnpm-lock.yaml').read_text()
    assert '  fast-json-stringify@7.2.0:' in lock
    assert lock.count('      fastify:\n') == 1
    lock = lock.replace('      fastify:\n',
                        '      fast-json-stringify:\n        specifier: 7.2.0\n        version: 7.2.0\n      fastify:\n', 1)
    (args.out / 'pnpm-lock.yaml').write_text(lock)
entry = (source.parent / 'fastify.mjs').read_text()
entry = "import standalone from './serializer.cjs';\n" + entry.replace(
    'const app = Fastify({ logger: false });',
    'const app = Fastify({ logger: false });\napp.setSerializerCompiler(() => standalone);')
(args.out / 'fastify-static.mjs').write_text(entry)
