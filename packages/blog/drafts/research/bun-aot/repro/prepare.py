"""Prepare the pinned macOS arm64 reproduction in this scratch directory."""
import argparse, hashlib, json, os, pathlib, platform, subprocess, zipfile

ROOT = pathlib.Path(__file__).resolve().parent
SHA = 'b7ef38afea38fc313296629cae1a01c880782c4350f125b796c98c1ab79d4194'
TS = '050880ce59e30b356b686bd3144efe24f875ebc8'
EFFECT = '8b0eac6ac46a689a7208500e2ccf9e3b80fc3898'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--bun-zip', type=pathlib.Path, required=True)
args = parser.parse_args()
if platform.system() != 'Darwin' or platform.machine() != 'arm64':
    raise SystemExit('This artifact and these accepted results are macOS arm64 only.')
if hashlib.sha256(args.bun_zip.read_bytes()).hexdigest() != SHA:
    raise SystemExit('The artifact does not match the checked public CI hash.')
bun = ROOT / 'bun-darwin-aarch64/bun'
bun.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(args.bun_zip) as archive:
    bun.write_bytes(archive.read('bun-darwin-aarch64/bun'))
bun.chmod(0o755)
env = dict(os.environ, BUN_ENABLE_CRASH_REPORTING='0', DO_NOT_TRACK='1')

def run(command, cwd=ROOT):
    print(' '.join(map(str, command)), flush=True)
    subprocess.run(list(map(str, command)), cwd=cwd, env=env, check=True)

for name, url, revision, tag in [
    ('TypeScript', 'https://github.com/microsoft/TypeScript', TS, 'v6.0.3'),
    ('effect', 'https://github.com/Effect-TS/effect', EFFECT, None),
]:
    folder = ROOT / name
    if not folder.exists():
        if tag:
            run(['git', 'clone', '--depth', '1', '--branch', tag, url, folder])
        else:
            run(['git', 'clone', '--filter=blob:none', '--no-checkout', url, folder])
            run(['git', 'checkout', revision], cwd=folder)
    actual = subprocess.check_output(['git', '-C', str(folder), 'rev-parse', 'HEAD'], text=True).strip()
    if actual != revision:
        raise SystemExit(f'{name} is at {actual}; expected {revision}. Existing work was not reset.')
run(['npm', 'ci', '--ignore-scripts'])
run(['node', 'scripts/processDiagnosticMessages.mjs', 'src/compiler/diagnosticMessages.json'], cwd=ROOT/'TypeScript')

compiler_options = {
    'rootDir': str(ROOT/'TypeScript/src'), 'types': ['node'], 'typeRoots': [str(ROOT/'node_modules/@types')],
    'composite': False, 'declaration': False, 'declarationMap': False, 'emitDeclarationOnly': False,
    'isolatedDeclarations': False, 'noEmit': True,
}
(ROOT/'aot-tsconfig.json').write_text(json.dumps({
    'extends': str(ROOT/'TypeScript/src/tsconfig-base.json'),
    'compilerOptions': compiler_options, 'files': [str(ROOT/'TypeScript/src/tsc/tsc.ts')],
}, indent=2))
effect_options = {
    'noEmit': True, 'incremental': False, 'composite': False, 'rootDir': str(ROOT/'effect/packages/effect/src'),
    'target': 'ES2022', 'module': 'NodeNext', 'moduleDetection': 'force', 'verbatimModuleSyntax': True,
    'allowJs': False, 'rewriteRelativeImportExtensions': True, 'erasableSyntaxOnly': True, 'strict': True,
    'exactOptionalPropertyTypes': True, 'noUnusedLocals': True, 'noUnusedParameters': True,
    'noImplicitOverride': True, 'noFallthroughCasesInSwitch': True, 'stripInternal': False,
    'skipLibCheck': True, 'noErrorTruncation': True, 'jsx': 'react-jsx', 'types': ['node'],
    'typeRoots': [str(ROOT/'node_modules/@types')],
}
(ROOT/'effect-tsconfig.json').write_text(json.dumps({
    'include': [str(ROOT/'effect/packages/effect/src')], 'compilerOptions': effect_options,
}, indent=2))
for mode, flags in [('jit', []), ('aot', ['--aot']), ('aot-wide', ['--aot', '--aot-huge-heap'])]:
    run([bun, 'build', '--compile', *flags, '--production', '--format=esm',
         '--tsconfig-override='+str(ROOT/'aot-tsconfig.json'),
         '--define', '__filename='+json.dumps(str(ROOT/'TypeScript/lib/tsc.js')),
         '--define', '__dirname='+json.dumps(str(ROOT/'TypeScript/lib')),
         ROOT/'TypeScript/src/tsc/tsc.ts', '--outfile', ROOT/('tsc-'+mode)])
run(['clang', '-O2', '-pthread', ROOT/'http-load.c', '-o', ROOT/'http-load'])
run([bun, '--revision'])
