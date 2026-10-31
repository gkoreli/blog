#!/usr/bin/env python3
"""Run PaperPilot's actual CLI and MCP stdio redaction paths on a synthetic file."""
import argparse
import hashlib
import json
from pathlib import Path
import selectors
import subprocess
import time

from pypdf import PdfReader

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--bin-dir", type=Path, required=True)
parser.add_argument("--directory", type=Path, required=True)
options = parser.parse_args()
root = options.directory.resolve()
cli = options.bin_dir.resolve() / "paperpilot"
mcp = options.bin_dir.resolve() / "paperpilot-mcp"
input_pdf = root / "input.pdf"
output_pdf = root / "paperpilot.pdf"

def inspect():
    reader = PdfReader(output_pdf)
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    content = b"\n".join(page.get_contents().get_data() for page in reader.pages)
    return {"sha256": hashlib.sha256(output_pdf.read_bytes()).hexdigest(),
            "canaryExtracted": "DEMO-SECRET-482915" in text,
            "canaryInDecodedPageContent": b"DEMO-SECRET-482915" in content,
            "publicLineExtracted": "PUBLIC-LINE-UNCHANGED" in text}

args = [str(cli), "redact", "--input", str(input_pdf), "--pages", "1", "--rect", "50,700,450,30",
        "--output", str(output_pdf), "--json"]
output_pdf.unlink(missing_ok=True)
completed = subprocess.run(args, capture_output=True, text=True, timeout=30)
result = {"cli": {"exitCode": completed.returncode, "stdout": completed.stdout,
                  "stderr": completed.stderr, "output": inspect()},
          "binaries": {name: hashlib.sha256(path.read_bytes()).hexdigest()
                       for name, path in [("cli", cli), ("mcp", mcp)]}}
if completed.returncode:
    raise SystemExit("CLI redaction failed")

process = subprocess.Popen([str(mcp)], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                           stderr=subprocess.PIPE, text=True, bufsize=1)
events = selectors.DefaultSelector()
events.register(process.stdout, selectors.EVENT_READ)
transcript = []

def send(message):
    transcript.append({"direction": "client", "message": message})
    process.stdin.write(json.dumps(message) + "\n")
    process.stdin.flush()

def receive(request_id):
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        if not events.select(timeout=max(0.01, deadline - time.monotonic())):
            continue
        line = process.stdout.readline()
        if not line:
            raise RuntimeError("MCP stdout closed before the response")
        message = json.loads(line)
        transcript.append({"direction": "server", "message": message})
        if message.get("id") == request_id:
            return message
    raise TimeoutError("MCP response deadline exceeded")

try:
    send({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
        "protocolVersion": "2025-06-18", "capabilities": {},
        "clientInfo": {"name": "oss-radar-synthetic-test", "version": "1.0"}}})
    result["initialize"] = receive(1)
    if "error" in result["initialize"]:
        raise RuntimeError("MCP initialization failed")
    send({"jsonrpc": "2.0", "method": "notifications/initialized"})
    arguments = {"input": str(input_pdf), "output": str(output_pdf), "page": 1,
                 "x": 50, "y": 700, "width": 450, "height": 30}
    output_pdf.unlink(missing_ok=True)
    send({"jsonrpc": "2.0", "id": 2, "method": "tools/call",
          "params": {"name": "pdf_redact", "arguments": arguments}})
    response = receive(2)
    result["mcp"] = {"response": response, "output": inspect()}
    arguments = {**arguments, "page": 999, "output": str(root / "invalid-page.pdf")}
    send({"jsonrpc": "2.0", "id": 3, "method": "tools/call",
          "params": {"name": "pdf_redact", "arguments": arguments}})
    invalid = receive(3)
    result["invalidPage"] = {"response": invalid, "outputExists": (root / "invalid-page.pdf").exists()}
finally:
    process.stdin.close()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.terminate()
        process.wait(timeout=5)
    result["mcpProcessExitCode"] = process.returncode
    result["mcpStderr"] = process.stderr.read()
    events.close()
    (root / "mcp-transcript.json").write_text(json.dumps(transcript, indent=2) + "\n")
    (root / "entrypoint-results.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result, indent=2))
if "error" in response or response.get("result", {}).get("isError"):
    raise SystemExit("MCP redaction failed")
if result["invalidPage"]["outputExists"] or not (
        "error" in invalid or invalid.get("result", {}).get("isError")):
    raise SystemExit("Invalid-page negative control failed")
