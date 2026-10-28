"""Offline RFC 9421 comparison; caller supplies private retained inputs.

Only the validation clock is substituted. Key resolution is scoped to each
trial's captured publisher directory. This is not a managed-provider oracle.
"""
import base64
import datetime
import hashlib
import json
from pathlib import Path
import sys
from types import SimpleNamespace
from unittest.mock import patch

root = Path(sys.argv[1]).resolve()
manifest = json.loads(Path(sys.argv[2]).read_text())
for source in manifest["sourceFiles"]:
    assert hashlib.sha256((root / source["path"]).read_bytes()).hexdigest() == source["sha256"]
sys.path.insert(0, str(root))
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from http_message_signatures import HTTPMessageVerifier, HTTPSignatureKeyResolver, InvalidSignature, HTTPMessageSignaturesException, algorithms
from http_message_signatures import signatures

original_datetime = datetime.datetime
rows = []
for trial in json.load(sys.stdin)["trials"]:
    keys = {}
    for jwk in trial["directory"]["keys"]:
        assert jwk["kty"] == "OKP" and jwk["crv"] == "Ed25519"
        canonical = json.dumps({"crv": "Ed25519", "kty": "OKP", "x": jwk["x"]}, separators=(",", ":")).encode()
        thumbprint = base64.urlsafe_b64encode(hashlib.sha256(canonical).digest()).decode().rstrip("=")
        raw = base64.urlsafe_b64decode(jwk["x"] + "=" * ((-len(jwk["x"])) % 4))
        keys[thumbprint] = Ed25519PublicKey.from_public_bytes(raw)

    class CapturedKeys(HTTPSignatureKeyResolver):
        def resolve_public_key(self, key_id):
            return keys[key_id]

    instant = original_datetime.fromisoformat(trial["now"].replace("Z", "+00:00"))

    class RecordedClock(original_datetime):
        @classmethod
        def now(cls, tz=None):
            return instant.astimezone(tz) if tz else instant.replace(tzinfo=None)

    class RecordedVerifier(HTTPMessageVerifier):
        def validate_created_and_expires(self, sig_input, max_age=None):
            with patch.object(signatures.datetime, "datetime", RecordedClock):
                return super().validate_created_and_expires(sig_input, max_age)

    verifier = RecordedVerifier(signature_algorithm=algorithms.ED25519, key_resolver=CapturedKeys())
    message = SimpleNamespace(method=trial["method"], url=trial["url"], headers=trial["headers"])
    result = {"vendor": trial["vendor"], "variant": trial["variant"]}
    try:
        proofs = verifier.verify(message, expect_tag="web-bot-auth", max_age=datetime.timedelta(days=1), require_components=("@authority",))
        result.update(returnedResults=len(proofs), error=None)
    except (InvalidSignature, HTTPMessageSignaturesException) as error:
        result.update(returnedResults=None, error=type(error).__name__)
    rows.append(result)

print(json.dumps({"checkedAt": original_datetime.now(datetime.timezone.utc).isoformat(), "sourceCommit": manifest["commit"],
    "sourceFilesRechecked": len(manifest["sourceFiles"]), "recordedClock": True, "keyResolver": "per-trial captured publisher keys by RFC thumbprint",
    "maxAgeSeconds": 86400, "rows": rows, "referenceCalls": len(rows), "externalRequests": 0,
    "limits": ["Generic RFC verification; discovery, publisher registration and Web Bot Auth admission are separate.",
        "An exception is not a complete census of valid candidates; this cohort has one eligible candidate per request."]}))
