"""Execute a caller-pinned primary-source checkout, with fixture public keys only."""
import base64
import datetime
import hashlib
import json
from pathlib import Path
import sys
from types import SimpleNamespace

sys.path.insert(0, str(Path(sys.argv[1]).resolve()))
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from http_message_signatures import HTTPMessageVerifier, HTTPSignatureKeyResolver, InvalidSignature, HTTPMessageSignaturesException, algorithms

fixture = json.load(sys.stdin)
keys = {}
for directory in fixture["directories"].values():
    for jwk in directory["keys"]:
        canonical = json.dumps({"crv": "Ed25519", "kty": "OKP", "x": jwk["x"]}, separators=(",", ":")).encode()
        kid = base64.urlsafe_b64encode(hashlib.sha256(canonical).digest()).decode().rstrip("=")
        raw = base64.urlsafe_b64decode(jwk["x"] + "=" * ((-len(jwk["x"])) % 4))
        keys[kid] = Ed25519PublicKey.from_public_bytes(raw)


class FixtureKeys(HTTPSignatureKeyResolver):
    def resolve_public_key(self, key_id):
        return keys[key_id]


verifier = HTTPMessageVerifier(signature_algorithm=algorithms.ED25519, key_resolver=FixtureKeys())
rows = []
for trial in fixture["cases"]:
    message = SimpleNamespace(method="GET", url="https://publication.example/a", headers=trial["headers"])
    calls = []
    for label in [None, "one", "two"]:
        try:
            results = verifier.verify(message, expect_tag="web-bot-auth", expect_label=label,
                                      max_age=datetime.timedelta(days=1), require_components=("@authority",))
            calls.append({"selectedLabel": label or "tagged-set", "returnedResults": len(results),
                          "fixtureLabels": [result.label for result in results], "error": None})
        except (InvalidSignature, HTTPMessageSignaturesException) as error:
            # An exception does not mean zero proofs are cryptographically valid.
            calls.append({"selectedLabel": label or "tagged-set", "returnedResults": None,
                          "error": type(error).__name__})
    rows.append({"name": trial["name"], "calls": calls})
print(json.dumps({"rows": rows, "referenceCalls": len(rows) * 3, "externalRequests": 0}))
