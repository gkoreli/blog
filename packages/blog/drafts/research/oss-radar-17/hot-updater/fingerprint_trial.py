"""Compare the published Hot Updater fingerprint engines with a bare RN fixture.

Use a fresh output directory in a disposable Linux guest with Python, Node,
npm, and zsh. The fixture installs public packages without lifecycle scripts and runs
fingerprint commands locally. Its native project files are synthetic inputs.
"""

from hashlib import sha256
import json
import os
from pathlib import Path
import platform
import subprocess
import sys


PLATFORMS = ('ios', 'android')
XCODE_PROJECT = 'ios/RadarApp.xcodeproj/project.pbxproj'
APP_GRADLE = 'android/app/build.gradle'
SWIFT_SOURCE = 'ios/RadarApp/Mode.swift'
SPEC_PATH = 'src/NativeRadarDevice.ts'
CONFIG_PATH = 'hot-updater.config.ts'
EXTRA_BUILD_FILES = {'ios': [XCODE_PROJECT], 'android': [APP_GRADLE]}
SPEC = '''import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';
export interface Spec extends TurboModule {
  getModel(): string;
}
export default TurboModuleRegistry.getEnforcing<Spec>('RadarDevice');
'''
NEW_METHOD = SPEC.replace('  getModel(): string;', '  getModel(): string;\n  getBuildKind(): string;')


def write(project, relative_path, contents):
    target = project / relative_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(contents, encoding='utf-8')


def config(project, fingerprint=None):
    options = json.dumps(fingerprint or {}, indent=2)
    write(project, CONFIG_PATH, f'''import {{bare}} from '@hot-updater/bare';
export default {{
  build: bare({{enableHermes: true}}),
  updateStrategy: 'fingerprint',
  fingerprint: {options},
}};
''')


def build_numbers(project, number):
    write(project, XCODE_PROJECT, f'// !$*UTF8*$!\n{{ CURRENT_PROJECT_VERSION = {number}; }}\n')
    write(project, APP_GRADLE, f"android {{\n  namespace 'dev.radar.app'\n  defaultConfig {{\n    applicationId 'dev.radar.app'\n    versionCode {number}\n    versionName '1.0.0'\n  }}\n}}\n")


def seed(project, version):
    project.mkdir()
    dependencies = {
        '@hot-updater/bare': version,
        '@hot-updater/react-native': version,
        '@react-native-community/cli': '20.1.0',
        '@react-native-community/cli-platform-android': '20.1.0',
        '@react-native-community/cli-platform-ios': '20.1.0',
        'hot-updater': version,
        'react': '19.2.3',
        'react-native': '0.85.2',
    }
    if version == '1.0.2':
        dependencies['@expo/fingerprint'] = '0.20.14'
    manifest = {
        'name': 'radar-app', 'version': '1.0.0', 'private': True,
        'dependencies': dependencies,
        'codegenConfig': {
            'name': 'RadarAppSpec', 'type': 'modules', 'jsSrcsDir': 'src',
            'android': {'javaPackageName': 'dev.radar.app'},
        },
    }
    write(project, 'package.json', json.dumps(manifest, indent=2) + '\n')
    config(project, {'extraSources': EXTRA_BUILD_FILES} if version == '1.0.2' else None)
    build_numbers(project, 37)
    write(project, SPEC_PATH, SPEC)
    write(project, 'src/App.tsx', 'export const title = "Old title";\n')
    write(project, SWIFT_SOURCE, 'func radarMode() -> String { "red" }\n')
    write(project, 'ios/Podfile', "platform :ios, '15.1'\ntarget 'RadarApp' do\nend\n")
    write(project, 'ios/RadarApp/Info.plist', '''<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict><key>CFBundleIdentifier</key><string>dev.radar.app</string></dict></plist>
''')
    write(project, 'android/gradle.properties', 'hermesEnabled=true\nnewArchEnabled=true\n')
    write(project, 'android/settings.gradle', "rootProject.name = 'RadarApp'\ninclude ':app'\n")
    write(project, 'android/app/src/main/AndroidManifest.xml', '''<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="dev.radar.app">
  <application android:label="Radar App" />
</manifest>
''')


def run(project, label, *arguments, timeout=40, settings=None):
    env = {
        'HOME': os.environ['HOME'], 'PATH': os.environ['PATH'], 'CI': '1',
        'NO_COLOR': '1', 'LANG': 'C.UTF-8', 'NPM_CONFIG_USERCONFIG': '/dev/null',
        'NPM_CONFIG_UPDATE_NOTIFIER': 'false',
    }
    env.update(settings or {})
    proc = subprocess.run(arguments, cwd=project, env=env, text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    write(project.parent, f'logs/{project.name}-{label}.txt', proc.stdout + proc.stderr)
    if proc.returncode:
        raise RuntimeError(f'{project.name} {label} exited {proc.returncode}: {proc.stderr[-1600:]}')
    return proc


def install(project):
    run(project, 'install', 'npm', 'install', '--ignore-scripts', '--no-audit',
        '--no-fund', '--registry=https://registry.npmjs.org', timeout=240)
    lock_file = (project / 'package-lock.json').read_bytes()
    packages = json.loads(lock_file)['packages']
    selected = ['hot-updater', '@hot-updater/bare', '@hot-updater/react-native',
                '@hot-updater/cli-tools', '@expo/fingerprint', 'react-native',
                '@react-native-community/cli', '@react-native-community/cli-platform-ios',
                '@react-native-community/cli-platform-android']
    modules = {}
    for name in selected:
        key = f'node_modules/{name}'
        if key in packages:
            locked = packages[key]
            actual = json.loads((project / key / 'package.json').read_text())
            assert actual['version'] == locked['version'], name
            modules[name] = {'version': actual['version'], 'integrity': locked['integrity']}
    return {'lock_sha256': sha256(lock_file).hexdigest(), 'installed': modules}


def summarize(record):
    return {
        name: {
            'hash': record[name]['hash'], 'engine': record[name].get('engine'),
            'sources': [source.get('filePath') or source.get('id') for source in record[name]['sources']],
        }
        for name in PLATFORMS
    }


def create(project, label):
    command = run(project, label, 'node', 'node_modules/hot-updater/dist/index.mjs',
                  'fingerprint', 'create')
    return json.loads((project / 'fingerprint.json').read_text()), command.stdout + command.stderr


def hash_at_build(project, label):
    persisted = (project / 'fingerprint.json').read_bytes()
    values = {}
    for name in PLATFORMS:
        command = run(project, f'{label}-{name}', 'node', 'node_modules/hot-updater/dist/index.mjs',
                      'fingerprint', 'hash', '-p', name)
        value = command.stdout.strip()
        assert len(value) in (40, 64) and all(char in '0123456789abcdef' for char in value), value
        values[name] = {'hash': value, 'warning': command.stderr.strip()}
    assert persisted == (project / 'fingerprint.json').read_bytes()
    return values


def ios_build_script(project, configuration):
    derived = project.parent / f'{project.name}-ios-{configuration.lower()}'
    script = 'node_modules/@hot-updater/react-native/ios/scripts/generate-fingerprint-hash.zsh'
    command = run(project, f'ios-{configuration.lower()}-header', 'zsh', script, settings={
        'CONFIGURATION': configuration, 'DERIVED_FILE_DIR': str(derived),
        'HOT_UPDATER_APP_ROOT': str(project),
    })
    text = (derived / 'HotUpdaterBuildFingerprintHash.h').read_text()
    assert text.startswith('#define HOT_UPDATER_BUILD_FINGERPRINT_HASH "'), text
    return {'hash': text.strip().split('"')[1], 'warning': command.stderr.strip()}


def old_cli(project):
    baseline, _ = create(project, 'baseline')
    build_numbers(project, 38)
    bump, _ = create(project, 'build-numbers')
    build_numbers(project, 37)
    write(project, SPEC_PATH, NEW_METHOD)
    spec, _ = create(project, 'spec')
    return baseline, {'baseline': summarize(baseline), 'build_numbers': summarize(bump),
                      'codegen_spec': summarize(spec)}


def current_cli(project, legacy):
    write(project, 'fingerprint.json', json.dumps(legacy))
    old_record = hash_at_build(project, 'old-record')
    baseline, transition = create(project, 'upgrade')
    assert baseline['inputs']['adapter'] == 'bare', baseline['inputs']
    assert all(baseline[name]['engine'] == 'hot-updater/interface@1' for name in PLATFORMS)

    # A native build does not need to load the deployment config once the
    # fingerprint inputs have been recorded.
    write(project, CONFIG_PATH, 'throw new Error("Fixture deployment config must stay unloaded");\n')
    observations = {'old_record': old_record, 'baseline': summarize(baseline),
                    'upgrade_reports_engine_change': 'engine changed' in transition.lower()
                    or 'created with @expo/fingerprint' in transition.lower(),
                    'build_baseline': hash_at_build(project, 'build-baseline')}
    build_numbers(project, 38)
    observations['build_numbers'] = hash_at_build(project, 'build-numbers')
    build_numbers(project, 37)

    write(project, 'src/App.tsx', 'export const title = "New title";\n')
    observations['ui_source'] = hash_at_build(project, 'ui-source')
    write(project, 'src/App.tsx', 'export const title = "Old title";\n')

    write(project, SPEC_PATH, NEW_METHOD)
    observations['codegen_spec'] = hash_at_build(project, 'codegen-spec')
    observations['ios_build_script_with_changed_spec'] = {
        name: ios_build_script(project, name) for name in ('Debug', 'Release')
    }
    write(project, SPEC_PATH, SPEC)
    ios_spec = 'src/NativeRadarIOS.ios.ts'
    write(project, ios_spec, SPEC.replace("'RadarDevice'", "'RadarIOS'"))
    observations['ios_only_spec'] = hash_at_build(project, 'ios-only-spec')
    (project / ios_spec).unlink()

    write(project, SWIFT_SOURCE, 'func radarMode() -> String { "blue" }\n')
    observations['app_swift_unlisted'] = hash_at_build(project, 'app-swift-unlisted')
    config(project, {'extraSources': {'ios': [SWIFT_SOURCE]}})
    tracked, _ = create(project, 'track-swift')
    observations['app_swift_listed'] = summarize(tracked)
    write(project, SWIFT_SOURCE, 'func radarMode() -> String { "red" }\n')
    observations['app_swift_listed_change'] = hash_at_build(project, 'tracked-swift-change')

    config(project, {'extraSources': EXTRA_BUILD_FILES})
    listed, _ = create(project, 'track-build-files')
    observations['build_files_listed'] = summarize(listed)
    build_numbers(project, 38)
    observations['build_files_listed_change'] = hash_at_build(project, 'tracked-build-file-change')
    build_numbers(project, 37)

    config(project, {'nativeVersion': 2})
    marked, _ = create(project, 'native-version')
    observations['native_version'] = summarize(marked)
    return observations


def main():
    output = Path(sys.argv[1]).resolve()
    output.mkdir(mode=0o700)
    env = {'arch': platform.machine(), 'system': platform.freedesktop_os_release()['PRETTY_NAME'],
           'python': platform.python_version(),
           'node': subprocess.check_output(['node', '--version'], text=True).strip(),
           'npm': subprocess.check_output(['npm', '--version'], text=True).strip(),
           'zsh': subprocess.check_output(['zsh', '--version'], text=True).strip()}
    report = {'environment': env, 'releases': {}}
    versions = ('1.0.2', '1.1.0', '1.1.17')
    for version in versions:
        project = output / version
        seed(project, version)
        report['releases'][version] = install(project)
    old, old_observations = old_cli(output / '1.0.2')
    report['releases']['1.0.2']['observations'] = old_observations
    for version in versions[1:]:
        report['releases'][version]['observations'] = current_cli(output / version, old)
    write(output, 'results.json', json.dumps(report, indent=2) + '\n')


if __name__ == '__main__':
    main()
