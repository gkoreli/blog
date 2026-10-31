# PaperPilot: content survived the successful redaction

October 30, 2026 Pacific. The previous goal turn was **progress**: it published and served-verified the tsrs investigation. This turn reproduces a second distinct product claim through its actual local entry points. The five-topic objective remains active.

## Reader need and result

The original [launch author](https://news.ycombinator.com/item?id=50238740) offers privacy-preserving document tools and asks for edge-case tests. [moooff's intended local-agent integration](https://news.ycombinator.com/item?id=50241654) is evidence of prospective use. No reader personally requested this redaction audit; content removal was a consequential hypothesis drawn from the advertised permanent-redaction feature.

Pinned source: `KrushnaVardhanReddy/PaperPilot@1e6ea36467066a124289e88b1d3ee7d636f3d5b5`. The public main endpoint still returned that SHA during the experiment; GitHub's latest-release endpoint returned 404. This is a current-source-build finding, not a test of a separately distributed desktop binary. Source and lockfile hashes are in the operation record.

Actual result: the direct operation, default-feature CLI and default-feature MCP stdio server all produce the same output hash, `e738356139d0564755e31c8f037c0b5c292cc3390d4312dfdf370e5e72ce2bf8`. The secret is visually covered, but still extractable by `pypdf` and present in decoded page content. PaperPilot's own `extract-text` also prints it. CLI exits 0 with success; MCP reports success and `isError: false`. A page-999 MCP request errors and creates no PDF. The MCP child exits 0 after stdin closes; no owned server remains running. A final harness correction deletes the previous output before each exposed entry-point call; the fresh-output rerun produces the same bytes and findings, ruling out accidental reuse of an earlier artifact.

## Reproduction and controls

[Protocol](03-paperpilot-protocol.md); [generator/independent extraction](repro/pdf-canary.py); [actual-operation wrapper](repro/paperpilot-redaction.rs); [CLI and full MCP stdio runner](repro/paperpilot-entrypoints.py).

The PDF skill's required marker completed exactly once immediately before the first authoring command, with three expected PDF paths. The same `paperpilot.pdf` path is overwritten for each actual entry point and captured by hash. No real personal data was used. Input: US Letter, 612×792 PDF points; canary `DEMO-SECRET-482915` drawn at (60,710), with unrelated `PUBLIC-LINE-UNCHANGED` at (60,650). Redaction rectangle: x=50, y=700, width=450, height=30. The PyMuPDF control uses the equivalent top-origin rectangle (50,62,500,92).

1. Create the deterministic synthetic PDF with ReportLab 4.4.9.
2. Build the real operation with Rust 1.96.1 and the lockfile: `cargo build --locked --no-default-features -p paperpilot-pdf --example paperpilot_redaction_probe`. Only a new example wrapper was added to the temporary source tree; no library behavior was changed.
3. Build the actual products with default features: `cargo build --locked -p paperpilot-mcp -p paperpilot-cli --bin paperpilot-mcp --bin paperpilot`. Both builds passed.
4. Invoke `paperpilot redact` and connect to the actual MCP process using initialize, initialized notification and tools/call. Negotiated protocol 2025-06-18, rmcp 3.5.1. This is actual transport, not `--direct-tool-call` diagnostic mode or an LLM simulation.
5. Extract with pypdf 6.10.0; inspect decoded page content. Invoke PaperPilot's own extractor too.
6. Independently remove the same region using PyMuPDF 2.0 and garbage-collect unused objects when saving. pypdf finds no canary in extracted text or decoded page content; the public line remains.
7. Render all three PDFs with Poppler at 120 DPI and visually inspect them. Input shows the canary; both edited outputs hide it behind a black rectangle. The public line remains legible. Fontconfig emitted cache-write warnings in the sandbox but returned success and produced the inspected renders; no missing-glyph/rendering defect was observed.

The focused existing library redaction test passed: one selected, 164 filtered. An initial command without `--lib` tried compiling unrelated OCR integration targets under disabled default features and failed to compile; no full-suite pass is claimed. The existing selected test checks drawing operators/coordinates on a blank page, not removal of sensitive source content.

Temporary runtime: `/tmp/oss-radar-five-claims-2026-10-30/pdf-venv`, created from the bundled Python 3.12 runtime, with pinned PyMuPDF 2.0 added. It imported additional ONNX-runtime dependencies; no offline/no-telemetry claim is made for that third-party control library. Rust was selected through a task-local PATH and `RUSTUP_TOOLCHAIN=1.96.1`; global Rust settings were unchanged. Build artifacts are in the task's temporary Cargo target directory.

## Claim table

| Claim | Product says | Code/test | Evidence state | Inference | Why it matters |
| --- | --- | --- | --- | --- | --- |
| Permanent redaction removes underlying content | Tool reference explicitly promises operator/vector removal; CLI help says permanent removal | Actual CLI and MCP output preserve the canary, including through the tool's own extractor | Reproduced contradiction on one synthetic file | This one failure falsifies the broad promise for this pinned path | Do not use the tested command to prepare confidential files for sharing |
| Success means the requested operation completed | CLI success JSON; MCP success message | Both return success; invalid page returns an error | Reproduced | Success reflects executing the overlay, not checking a content-removal postcondition | Test the promised property independently |
| The rectangle covers the intended region | Coordinates and preview | Input/output/control renders inspected; secret fully hidden, other line intact | Reproduced | The failure is not a wrong-rectangle test setup | The visible result can look correct while disclosure remains |
| A hidden string can be removed without blanking the page | Independent control, not a PaperPilot promise | PyMuPDF removal plus pypdf extraction/content inspection preserves the comparison line | Reproduced, narrow | Validates the fixture and removal criterion, not every PDF form | Distinguish drawing and destructive removal |
| Local PDF tooling prevents cloud uploads | Launch's stated motivation | No cloud model used; local path processed; no complete network audit | Reported motivation; code-inspected local operation | No document-upload failure established; client/model handling is separate | Do not turn a redaction failure into an unsupported network claim |

## Code and competing theories

The operation appends `q`, `rg`, `re`, `f`, `Q`; `LopdfDocument::save` clones the document and calls lopdf save. The CLI `handle_redact` and MCP `pdf_redact` branch invoke this exact path. The protocol handler forwards to `execute_call_tool`; there is no additional removal pass on the tested path. A searched workflow alias returns input bytes unchanged, not an alternative destructive removal; it was not independently exercised and is not a separate published defect.

| Theory | View | Evidence for | Evidence against / limit | Direction state | What would change the conclusion |
| --- | --- | --- | --- | --- | --- |
| One local engine makes private document tools available across CLI and AI-agent interfaces | Maintainer product thesis | Shared Rust operation, actual CLI/MCP execution without a model | Correct execution of the shared code does not prove its security postcondition | Shipped tested paths; wider interfaces reported | Real content removal and recovery checks on exposed paths |
| Another save, sanitize or frontend pass removes the content despite the overlay source | Plausible rival explanation | A more complete pipeline could in principle remove text | Load/save and both actual exposed paths still yield identical recoverable bytes | Tested and rejected for these paths | A different documented path that demonstrably removes covered content |
| The failure is just the test rectangle missing the secret | Setup alternative | Different PDF coordinate conventions can cause mistakes | The secret is visibly hidden; equivalent independent removal succeeds | Tested and rejected | A fixture/render showing wrong placement |

Product map: replaces some online-PDF-utility workflows; wraps lopdf and related engines; extends a shared core through multiple interfaces; relies on the client's filesystem and, for AI-assisted workflows, a separate host/model. Model-provider handling remains outside the local PDF operation. The article makes no legal/license-port allegation, no assertion of malicious intent, no whole-product privacy verdict and no claim to have tested the desktop/WASM builds.

## Public evidence and manuscript

- [Independent extraction](results/paperpilot-extraction.json)
- [CLI/MCP outcomes and binary hashes](results/paperpilot-entrypoints.json)
- [Build/source/visual/test record](results/paperpilot-operation.json)
- [Current-source check](results/paperpilot-source-check.json)
- [Article](../../../posts/034-oss-radar-10-paperpilot-redaction.md)

The illustration is an unedited Poppler rendering of the actual synthetic output, copied to the article's public image directory. CSS displays its top region; there is no fabricated terminal or edited evidence. Its SHA-256 is retained. Raw MCP exchanges and fixture PDFs stay outside Git in the task's temporary directory; build output remains in private tool receipts. Public JSON preserves outcomes, versions, hashes and narrowly selected synthetic results; no private operational data.

Manuscript is 890 rendered words, about 4.45 minutes, leads with recovery through the tool's own extractor, and names the current-source scope in the opening. It teaches a recovery test, explains the real code path, and keeps the local/model boundary separate. OSS Radar has no prompt file or unmeasured token-cost badge. No maintainer response, repair, reader adoption or new external outreach is claimed. Local Markdown validation passes 24 posts; an isolated build produces 35 posts. Title, canonical, social metadata, HTML/Markdown claims and exact image bytes pass [local publication checks](results/paperpilot-publication-checks.json). Source push and served acceptance remain to complete before counting the second article as published.
