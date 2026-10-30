"""Offline RFC comparison. Recheck the pinned source; caller supplies exact bytes.

Profiles/metadata admission in our adapter are not replaced by this generic library.
No monkeypatch of crypto, component resolution, key lookup or digest validation.
"""
import base64
import datetime
import hashlib
import json
from pathlib import Path
import sys
from types import SimpleNamespace
from unittest.mock import patch

source = Path(sys.argv[1]).resolve()
manifest = json.loads(Path(sys.argv[2]).read_text())
for entry in manifest['sourceFiles']:
    assert hashlib.sha256((source / entry['path']).read_bytes()).hexdigest() == entry['sha256']
sys.path.insert(0, str(source))
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from http_sf.compat import Dictionary
from http_message_signatures import HTTPMessageVerifier, HTTPSignatureKeyResolver, algorithms, signatures

original_datetime = datetime.datetime
rows = []
calls = 0
for trial in json.load(sys.stdin)['trials']:
    context = trial['context']
    body = bytes(context['body'])
    keys = {}
    for jwk in json.loads(body)['keys']:
        if jwk.get('kty') != 'OKP' or jwk.get('crv') != 'Ed25519':
            continue
        canonical = json.dumps({'crv': 'Ed25519', 'kty': 'OKP', 'x': jwk['x']}, separators=(',', ':')).encode()
        kid = base64.urlsafe_b64encode(hashlib.sha256(canonical).digest()).decode().rstrip('=')
        keys[kid] = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(jwk['x'] + '='))

    class CapturedKeys(HTTPSignatureKeyResolver):
        def resolve_public_key(self, key_id):
            return keys[key_id]

    instant = original_datetime.fromisoformat(trial['now'].replace('Z', '+00:00'))

    class RecordedClock(original_datetime):
        @classmethod
        def now(cls, tz=None):
            return instant.astimezone(tz) if tz else instant.replace(tzinfo=None)

    class RecordedVerifier(HTTPMessageVerifier):
        def validate_created_and_expires(self, sig_input, max_age=None):
            with patch.object(signatures.datetime, 'datetime', RecordedClock):
                return super().validate_created_and_expires(sig_input, max_age)

    verifier = RecordedVerifier(signature_algorithm=algorithms.ED25519, key_resolver=CapturedKeys())
    verifier.max_clock_skew = datetime.timedelta(0)
    headers = {name.lower(): value for name, value in context['headers']}
    message = SimpleNamespace(status_code=context['status'], headers=headers,
        request=SimpleNamespace(method='GET', url=context['requestUrl'], headers={}))
    proofs = []
    try:
        inputs = Dictionary()
        inputs.parse(headers.get('signature-input', '').encode())
        labels = list(inputs)
    except Exception:
        labels = []
    for label in labels:
        proof = {}
        for mode, required in [('crypto', ()), ('authority', ('"@authority";req',)),
                               ('bodyBound', ('"@authority";req', 'content-digest'))]:
            calls += 1
            try:
                results = verifier.verify(message, expect_tag='http-message-signatures-directory', expect_label=label,
                    require_components=required, max_age=None, body=body if mode == 'bodyBound' else None)
                proof[mode] = len(results) == 1
                proof[mode + 'Error'] = None
            except Exception as error:
                proof[mode] = False
                proof[mode + 'Error'] = type(error).__name__
        proofs.append(proof)
    rows.append({'name': trial['name'], 'proofs': proofs})
print(json.dumps({'sourceCommit': manifest['commit'], 'sourceFilesRechecked': len(manifest['sourceFiles']),
    'clockSkewSeconds': 0, 'recordedClock': True, 'maxAgeSeconds': None, 'rows': rows,
    'referenceCalls': calls, 'externalRequests': 0,
    'limits': ['Generic RFC library; does not enforce our JWK metadata admission or component subset.',
        'Three separate calls per label: signature only, authority coverage, authority plus signed body digest.',
        'The body argument explicitly enables library digest checking; signature verification alone does not.']}))
