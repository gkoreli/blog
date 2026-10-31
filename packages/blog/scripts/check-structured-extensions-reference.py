"""Execute exact pinned wheels privately; compare syntax, not vendor identity policy.

Usage: python3 check-structured-extensions-reference.py wheel_directory input.json output.json
"""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import zipfile

wheel_directory, input_path, output_path = map(Path, sys.argv[1:])
artifacts = [
    ('http_sf-1.5.0-py3-none-any.whl', '031282bd376549b04fcaa397d9ef351acdc5bd383435cccd1d8ea17b1661c80e'),
    ('typing_extensions-4.16.0-py3-none-any.whl', '481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8'),
]
raw = input_path.read_bytes()
with tempfile.TemporaryDirectory(prefix='gk-structured-reference-') as temporary:
    destination = Path(temporary)
    for name, expected in artifacts:
        path = wheel_directory / name
        assert hashlib.sha256(path.read_bytes()).hexdigest() == expected
        with zipfile.ZipFile(path) as archive:
            archive.extractall(destination)
    sys.path.insert(0, str(destination))
    import http_sf

    assert http_sf.__version__ == '1.5.0'
    rows = []
    for case in json.loads(raw)['syntax']:
        try:
            canonical = http_sf.ser(http_sf.parse(case['input'].encode(), tltype='dictionary'))
            error = None
        except http_sf.StructuredFieldError as failure:
            canonical, error = None, type(failure).__name__
        rows.append({'name': case['name'], 'canonical': canonical, 'error': error})
    sources = [{'path': str(path.relative_to(destination)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
               for path in sorted(destination.rglob('*.py'))]
result = {'reference': 'http-sf', 'version': '1.5.0', 'inputSha256': hashlib.sha256(raw).hexdigest(),
          'artifacts': [{'file': name, 'sha256': digest} for name, digest in artifacts],
          'sourceFiles': sources, 'rows': rows, 'externalRequests': 0,
          'scope': 'Parse/serialize selected Structured Field dictionaries. Generic duplicate handling differs from local security policy; no key, signature, freshness or vendor verification is supplied by this reference.'}
with output_path.open('x') as stream:
    json.dump(result, stream, indent=2)
    stream.write('\n')
print(json.dumps({'cases': len(rows), 'sourceFiles': len(sources), 'reference': 'http-sf 1.5.0'}))
