"""Synthetic CLI export/hoop controls, with no editor, Bluetooth or sewing hardware."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

if len(sys.argv) != 4:
    raise SystemExit("Usage: python3 zigzag-export.py /zigzag-cli /fresh-fixtures /fresh-receipt.json")
binary, fixtures, output = map(Path, sys.argv[1:])
assert not fixtures.exists() and not output.exists()
fixtures.mkdir(parents=True)
results = []
for name, width in [("within-hoop", 20), ("over-hoop", 150)]:
    source = fixtures / (name + ".svg")
    source.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}mm" height="5mm" viewBox="0 0 {width} 5"><rect width="{width}" height="5" fill="#336699"/></svg>\n')
    pes, dst = [fixtures / (name + "." + extension) for extension in ["pes", "dst"]]
    result = subprocess.run([str(binary), "convert", str(source), "--hoop", "100x100",
        "-o", str(pes), "-o", str(dst)], capture_output=True, text=True, timeout=60)
    (fixtures / (name + ".log")).write_text(result.stdout + result.stderr)
    artifacts = []
    for path in [pes, dst]:
        if path.exists():
            data = path.read_bytes()
            artifacts.append({"format": path.suffix[1:], "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(), "header": data[:8].decode("ascii", errors="replace")})
    diagnostics = [line for line in result.stderr.splitlines() if line.startswith(("error:", "warning:", "note:"))]
    results.append({"case": name, "sourceWidthMm": width, "hoopMm": [100, 100],
        "exitCode": result.returncode, "diagnostics": diagnostics, "artifacts": artifacts})
    assert result.returncode == 0 and len(artifacts) == 2
    assert any("hoop sews" in line for line in diagnostics) == (name == "over-hoop")

roundtrip = subprocess.run([str(binary), "info", str(fixtures / "within-hoop.pes")],
    capture_output=True, text=True, timeout=60)
(fixtures / "reopen-pes.log").write_text(roundtrip.stdout + roundtrip.stderr)
assert roundtrip.returncode == 0
receipt = {"sourceCommit": "ad19cb09dcf5649fac55b43a083714bcd2b761d4",
    "version": subprocess.check_output([str(binary), "--version"], text=True).strip(),
    "features": "Core CLI; GUI and Bluetooth disabled", "cases": results,
    "reopenPes": {"exitCode": roundtrip.returncode, "output": roundtrip.stderr.replace(str(fixtures), "<fixture>")},
    "hardwareConnected": False, "sewOutPerformed": False,
    "scope": "Two authored SVG exports and one file reopen. Diagnostics/exit behavior, not stitch quality or device acceptance."}
with output.open("x") as destination:
    destination.write(json.dumps(receipt, indent=2) + "\n")
print(json.dumps({"cases": len(results), "overHoopReported": True,
    "overHoopFilesWritten": True, "overHoopExitCode": results[1]["exitCode"], "hardwareConnected": False}))
