# PaperPilot synthetic-document test

Prepared October 30, 2026 Pacific, before creating the PDF fixture or running the operation.

## Reader and claim

The October 26 [author launch](https://news.ycombinator.com/item?id=50238740) offers local document processing, redaction and MCP integration, and explicitly requests edge-case testing. [moooff plans to integrate it with a local browser agent](https://news.ycombinator.com/item?id=50241654). The launch's privacy promise makes content removal a consequential adoption check. No reader has personally asked us to audit their private document. The redaction and downstream-model questions are research hypotheses, not measured search demand or invented reader quotes.

Source baseline: `KrushnaVardhanReddy/PaperPilot@1e6ea36467066a124289e88b1d3ee7d636f3d5b5`, full archive at `/tmp/oss-radar-five-claims-2026-10-30/paperpilot-fixture`. The source tree and selected files are separately saved in the sibling `PaperPilot/` directory. The repository was pinned before the experiment; recheck current main/release before publishing any remaining defect.

The tool reference says redaction deletes underlying text operators and vector data. The inspected `paperpilot-pdf/src/operations/redact.rs` instead appends graphics operations drawing a filled black rectangle. The actual MCP `pdf_redact` handler in `paperpilot-mcp/src/server.rs` creates this operation, executes it and saves the result. Still inspect `LopdfDocument::load` and `save`, the surrounding MCP call path and any alternate exposed redaction modes before drawing a final conclusion.

## Competing explanations

1. The exposed operation paints an overlay and leaves extractable text; the docs overstate it.
2. A save/sanitization step or another dispatched implementation removes content despite the small operation's appearance.
3. The operator or client is expected to select a different destructive redaction path; a distinction is missing from the docs.

## Bounded reproduction

- Use only a synthetic, one-page PDF with an obvious canary string in a known rectangle and harmless comparison text outside it. No user or reader documents, real identifiers or private transcripts.
- Use the PDF skill's artifact-operation marker before authoring the fixture, the bundled PDF runtime, and render the input and outputs. Record page size and rectangle coordinates.
- Build/run the pinned project's actual redaction operation in a temporary source checkout. Prefer the smallest real crate/entry path; retain the source feature/build choices and compiler version. A hand-written imitation of the overlay is insufficient evidence about PaperPilot.
- Inspect output through an independent text extractor and decoded PDF content streams, and render it to establish whether the canary is visually hidden. Preserve original and output hashes.
- Include two controls: untouched input still yields the canary; an independently applied destructive redaction removes it while retaining the harmless comparison text. A whole-page rasterization or blank output is not an adequate positive control.
- If feasible without running a cloud model, call the actual MCP tool with the same file/coordinates and compare its output. Trace any paths/metadata or returned extracted text separately from outbound traffic.

Pass for the documented permanent-redaction claim: the covered canary cannot be extracted from the selected output path or recovered from retained source text/image objects. Failure of this one synthetic text case disproves the broad promise for that pinned operation; success on one case does not establish safe redaction of every PDF object type.

## Boundaries and next action

No fixture, operation execution or failure has been reproduced yet. Do not publicly call the product's redaction unsafe from source inspection alone. Do not infer a network upload from its `reqwest` dependency. Local processing, MCP tool results, model-provider transmission and optional downloads require separate evidence.

Next: inspect document load/save and crate build requirements; create the synthetic fixture and run the real operation. Rust 1.96.1 is already present in mise's installation directory; use a task-local PATH instead of changing global tool settings. The PDF skill was read and its use announced, but its required create/edit marker has **not** yet been run. No PaperPilot build or test process is running at this checkpoint.

## Execution update

The frozen procedure above has now been executed. The marker completed once before the first authoring command. Three PDF paths were used, reusing the same PaperPilot output for the operation/CLI/MCP runs. Rust's mise entry is a symlink to the rustup binary directory rather than an installation with another `bin/` subdirectory; the existing rustup 1.96.1 toolchain was selected without a global change. Real default-feature CLI and full MCP transport confirm the operation-level finding. [Results, controls and limitations](04-paperpilot-findings.md) supersede the unexecuted status above. No owned process remains running.
