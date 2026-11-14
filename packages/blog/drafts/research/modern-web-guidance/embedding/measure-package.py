"""Verify a previously downloaded official archive and installed package, without extraction."""
import base64
import hashlib
import json
from pathlib import Path
import sys
import tarfile

archive, metadata_file, installed, output = map(Path, sys.argv[1:])
metadata = json.loads(metadata_file.read_text())
data = archive.read_bytes()
assert metadata['name'] == 'modern-web-guidance' and metadata['version'] == '1.0.0'
assert metadata['dist']['integrity'] == 'sha512-' + base64.b64encode(hashlib.sha512(data).digest()).decode()
files = []
with tarfile.open(archive, 'r:gz') as handle:
    for item in handle.getmembers():
        if not item.isfile():
            continue
        relative = Path(item.name).relative_to('package')
        assert '..' not in relative.parts
        payload = handle.extractfile(item).read()
        assert (installed / relative).read_bytes() == payload, str(relative)
        files.append({'path': relative.as_posix(), 'bytes': len(payload), 'sha256': hashlib.sha256(payload).hexdigest()})
assert sum(item['bytes'] for item in files) == metadata['dist']['unpackedSize']
receipt = {
    'version': metadata['version'],
    'registryMetadata': 'https://registry.npmjs.org/modern-web-guidance/1.0.0',
    'tarball': metadata['dist']['tarball'],
    'integrity': metadata['dist']['integrity'],
    'archiveSha256': hashlib.sha256(data).hexdigest(),
    'compressedArchiveBytes': len(data),
    'regularFileBytes': sum(item['bytes'] for item in files),
    'regularFilesVerifiedAgainstInstalled': len(files),
    'sizeBoundary': 'Compressed official tarball versus sum of regular-file payloads; excludes filesystem block allocation and Node runtime.',
    'files': sorted(files, key=lambda item: item['path']),
}
output.write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({key: value for key, value in receipt.items() if key != 'files'}))
