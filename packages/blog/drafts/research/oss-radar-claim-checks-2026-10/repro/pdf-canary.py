#!/usr/bin/env python3
"""Create and independently inspect a synthetic PDF redaction control."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path

from pypdf import PdfReader

CANARY = "DEMO-SECRET-482915"
PUBLIC = "PUBLIC-LINE-UNCHANGED"

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("mode", choices=["create", "positive", "inspect"])
parser.add_argument("directory", type=Path)
options = parser.parse_args()
root = options.directory
root.mkdir(parents=True, exist_ok=True)

if options.mode == "create":
    from reportlab.pdfgen import canvas
    path = root / "input.pdf"
    if path.exists():
        raise SystemExit("Refusing to overwrite the original fixture")
    document = canvas.Canvas(str(path), pagesize=(612, 792), invariant=1, pageCompression=1)
    document.setTitle("Synthetic PDF redaction test")
    document.setFont("Helvetica", 16)
    document.drawString(50, 760, "Synthetic PDF redaction test")
    document.setFont("Helvetica", 14)
    document.drawString(60, 710, CANARY)
    document.drawString(60, 650, PUBLIC)
    document.save()
    print(json.dumps({"input": str(path), "pagePoints": [612, 792],
                      "rectanglePdfCoordinates": [50, 700, 450, 30]}))
elif options.mode == "positive":
    import pymupdf
    document = pymupdf.open(root / "input.pdf")
    page = document[0]
    page.add_redact_annot(pymupdf.Rect(50, 62, 500, 92), fill=(0, 0, 0))
    page.apply_redactions()
    document.save(root / "positive-removal.pdf", garbage=4, deflate=True)
    print(json.dumps({"positiveControl": "PyMuPDF destructive redaction",
                      "version": importlib.metadata.version("PyMuPDF")}))
else:
    rows = []
    for name in ["input.pdf", "paperpilot.pdf", "positive-removal.pdf"]:
        path = root / name
        reader = PdfReader(path)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        decoded = b"\n".join(page.get_contents().get_data() for page in reader.pages)
        rows.append({"file": name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                     "bytes": path.stat().st_size, "pages": len(reader.pages),
                     "canaryExtracted": CANARY in text, "publicLineExtracted": PUBLIC in text,
                     "canaryInDecodedPageContent": CANARY.encode() in decoded,
                     "extractedText": text})
    result = {"fixture": {"canary": CANARY, "publicLine": PUBLIC, "pagePoints": [612, 792],
                           "rectanglePdfCoordinates": [50, 700, 450, 30]},
              "libraries": {name: importlib.metadata.version(name)
                            for name in ["pypdf", "reportlab", "PyMuPDF"]}, "results": rows}
    (root / "extraction-results.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))
    if not rows[0]["canaryExtracted"] or not all(row["publicLineExtracted"] for row in rows):
        raise SystemExit("Input/comparison-text control failed")
    if rows[2]["canaryExtracted"] or rows[2]["canaryInDecodedPageContent"]:
        raise SystemExit("Destructive-redaction control failed")
