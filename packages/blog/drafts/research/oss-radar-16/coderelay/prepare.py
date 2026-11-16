"""Fetch only the declared, hash-checked CodeRelay source files into this fixture."""

import hashlib
import json
from pathlib import Path
from urllib.request import urlopen


def main():
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / "source-hashes.json").read_text())
    source_root = root / ".work" / "source"
    for relative, expected in manifest["files"].items():
        relative_path = Path(relative)
        if relative_path.is_absolute() or ".." in relative_path.parts:
            raise ValueError("Source path must stay inside the fixture")
        url = (
            "https://raw.githubusercontent.com/"
            + manifest["repository"]
            + "/"
            + manifest["revision"]
            + "/"
            + relative
        )
        with urlopen(url, timeout=20) as response:
            data = response.read(1024 * 1024)
        if len(data) != expected["bytes"]:
            raise ValueError("Unexpected byte count: " + relative)
        if hashlib.sha256(data).hexdigest() != expected["sha256"]:
            raise ValueError("Unexpected source hash: " + relative)
        destination = source_root / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
    print("Verified and materialized", len(manifest["files"]), "pinned source files")


if __name__ == "__main__":
    main()
