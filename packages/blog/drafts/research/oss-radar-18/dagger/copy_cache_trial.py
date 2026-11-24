"""Compare ordinary Dockerfile COPY traces on two released Dagger engines.

Run in a disposable Linux Docker host with the two matching Dagger CLIs:
python3 copy_cache_trial.py NEW_CLI OLD_CLI FRESH_OUTPUT_DIRECTORY
"""

from hashlib import file_digest
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys

DOCKERFILE = '''FROM scratch AS source
COPY selected.txt /selected.txt
COPY adjacent.txt /adjacent.txt
FROM scratch AS output
COPY base.txt /result.txt
COPY --from=source /selected.txt /result.txt
'''
QUERY = '''
{
  host {
    directory(path: ".") {
      dockerBuild(dockerfile: "Dockerfile", target: "output") {
        file(path: "/result.txt") { contents }
      }
    }
  }
}
'''
HOST_QUERY = '''
{
  host {
    directory(path: ".") {
      selected: file(path: "selected.txt") { contents }
      adjacent: file(path: "adjacent.txt") { contents }
      base: file(path: "base.txt") { contents }
    }
  }
}
'''
INPUTS = {'selected': 'selected.txt', 'adjacent': 'adjacent.txt', 'base': 'base.txt'}
INITIAL_MTIME = 1700000000
COPY = 'Directory.__withDirectoryDockerfileCompat'
ANSI = re.compile(r'\x1b\[[0-?]*[ -/]*[@-~]')
SPAN = re.compile(r'^\s*(\d+)\s*:\s*(?:┆\s*)*(.*?)\s*$')
CHECKSUM = re.compile(r'^checksum def: [^/\s]+(/\S*)?$')


def parse_trace(log):
    lines = [match.groups() for line in ANSI.sub('', log).splitlines()
             if (match := SPAN.match(line))]
    open_copies = {}
    copies = []
    for index, (span, message) in enumerate(lines):
        if message == COPY + '(':
            open_copies[span] = index
        elif message.startswith((COPY + ' DONE ', COPY + ' CACHED ')) and span in open_copies:
            start = open_copies.pop(span)
            window = lines[start + 1:index]
            attributes = [line for node, line in window if node == span]
            paths = [item.split(': ', 1)[1].strip('"') for item in attributes if item.startswith('path: ')]
            sources = [item.split(': ', 1)[1].strip('"') for item in attributes if item.startswith('srcPath: ')]
            checksums = [match[1] or '/' for _, line in window if (match := CHECKSUM.match(line))]
            if paths and sources:
                copies.append({'destination': paths[0], 'source': sources[-1],
                               'cached': message.startswith(COPY + ' CACHED '),
                               'checksum_paths': checksums})
    return copies


def invoke(*args, cwd, env, text=None):
    return subprocess.run(args, cwd=cwd, env=env, input=text, capture_output=True,
                          encoding='utf-8', timeout=260)


def compare(binary, version, root):
    context = root / 'context'
    context.mkdir(parents=True)
    env = {'PATH': os.environ['PATH'], 'HOME': os.environ['HOME'], 'CI': '1', 'NO_COLOR': '1',
           'DAGGER_NO_NAG': '1'}

    def write(name, contents, modified=INITIAL_MTIME):
        path = context / name
        path.write_text(contents, encoding='utf-8')
        os.utime(path, (modified, modified))

    for name, contents in {'Dockerfile': DOCKERFILE, 'selected.txt': 'selected-v1\n',
                           'adjacent.txt': 'adjacent-v1\n', 'base.txt': 'base-v1\n'}.items():
        write(name, contents)

    phases = (
        ('first', None, None, 'selected-v1\n'),
        ('unchanged', None, None, 'selected-v1\n'),
        ('adjacent_edited', 'adjacent.txt', 'adjacent-v2\n', 'selected-v1\n'),
        ('overwritten_base_edited', 'base.txt', 'base-v2\n', 'selected-v1\n'),
        ('selected_edited', 'selected.txt', 'selected-v2\n', 'selected-v2\n'),
        ('mtime_preserved', 'selected.txt', 'selected-v3\n', None),
        ('mtime_advanced', 'selected.txt', 'selected-v3\n', 'selected-v3\n'),
    )
    observations = {}
    for index, (label, name, change, expected) in enumerate(phases):
        edit = None
        if name:
            before = (context / name).stat()
            modified = before.st_mtime if label == 'mtime_preserved' else INITIAL_MTIME + index * 60
            write(name, change, modified)
            after = (context / name).stat()
            edit = {'file': name, 'same_size': before.st_size == after.st_size,
                    'same_mtime': before.st_mtime_ns == after.st_mtime_ns}
        result = invoke(binary, '--progress=plain', '-vvv', 'query', cwd=context, env=env, text=QUERY)
        (root / f'{label}.log').write_text(result.stderr)
        if result.returncode:
            raise RuntimeError(f'{version} {label} failed, tail: {result.stderr[-800:]}')
        contents = json.loads(result.stdout)['host']['directory']['dockerBuild']['file']['contents']
        probe = invoke(binary, '--progress=plain', 'query', cwd=context, env=env, text=HOST_QUERY)
        probe.check_returncode()
        snapshot = json.loads(probe.stdout)['host']['directory']
        visible = {key: value['contents'] for key, value in snapshot.items()}
        local = {key: (context / filename).read_text() for key, filename in INPUTS.items()}
        if expected is not None:
            assert visible == local and contents == expected, (version, label, local, visible, contents)
        observations[label] = {'edit': edit, 'local_inputs': local, 'engine_host_inputs': visible,
                               'output': contents, 'copy_spans': parse_trace(result.stderr)}

    image_name = f'registry.dagger.io/engine:{version}'
    inspection = invoke('docker', 'image', 'inspect', image_name, cwd=context, env=env)
    inspection.check_returncode()
    image = json.loads(inspection.stdout)[0]
    with binary.open('rb') as handle:
        digest = file_digest(handle, 'sha256').hexdigest()
    cli = invoke(binary, 'version', cwd=context, env=env)
    cli.check_returncode()
    return {
        'cli': cli.stdout.strip(), 'cli_sha256': digest,
        'engine_image': {'repo_digests': image['RepoDigests'], 'image_id': image['Id'],
                         'os': image['Os'], 'architecture': image['Architecture']},
        'runs': observations,
    }


def main(new_cli, old_cli, output):
    output.mkdir()
    releases = {}
    for version, binary in (('v0.21.12', new_cli), ('v0.21.11', old_cli)):
        releases[version] = compare(binary, version, output / version)
        (output / f'{version}.json').write_text(json.dumps(releases[version], indent=2) + '\n')
    print(json.dumps({
        'machine': {'kernel': platform.release(), 'arch': platform.machine()},
        'releases': releases,
    }, indent=2))


if __name__ == '__main__':
    main(*(Path(value).resolve() for value in sys.argv[1:]))
