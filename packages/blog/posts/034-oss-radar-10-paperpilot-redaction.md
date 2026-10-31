---
title: "OSS Radar #10: PaperPilot Left the Secret in My Redacted PDF"
seoTitle: "PaperPilot PDF Redaction Test: The Hidden Text Was Still Recoverable"
alternativeHeadline: "PaperPilot's CLI and MCP redaction reported success, but its own text-extraction command recovered the covered text from a synthetic PDF"
date: "2026-10-30"
description: "PaperPilot's redaction painted a black rectangle and returned success. Its own text-extraction command recovered the secret. I tested the CLI, MCP and a removal control."
section: oss-radar
tags: [oss-radar, pdf, privacy, mcp, testing]
---

# OSS Radar #10: PaperPilot Left the Secret in My Redacted PDF

I used PaperPilot to black out a synthetic secret in a PDF, then read it back with **PaperPilot's own text-extraction command**. Both its CLI and MCP redaction tool reported success. The black rectangle looked right; the original text was still there.

That contradicts the project's [permanent-redaction documentation](https://github.com/KrushnaVardhanReddy/PaperPilot/blob/1e6ea36467066a124289e88b1d3ee7d636f3d5b5/apps/docs/src/content/docs/reference/tools/pdf_redact.md). I tested the source at current main on October 30, 2026, using one manufactured document. No private document or cloud model was involved.

The useful findings:

- The real CLI and MCP tool produced the same recoverable PDF.
- An independent removal control hid the text and removed it from extraction.
- A successful operation and a convincing preview did not establish permanent redaction.

## The secret came back in two commands

PaperPilot offers an open-source PDF engine through a CLI, desktop app, browser, local API and MCP. Its [launch](https://news.ycombinator.com/item?id=50238740) emphasizes keeping confidential documents on your machine. [One reader planned to integrate it into a local browser agent](https://news.ycombinator.com/item?id=50241654). That makes the difference between hiding and removing information consequential.

I made a one-page PDF with `DEMO-SECRET-482915` in a known position and `PUBLIC-LINE-UNCHANGED` below it. Then I ran the actual CLI built from the pinned source:

```bash
paperpilot redact --input input.pdf --pages 1 \
  --rect 50,700,450,30 --output redacted.pdf --json

paperpilot extract-text --input redacted.pdf --output recovered.txt --json
```

Both commands returned success. The recovered text included:

```text
DEMO-SECRET-482915
PUBLIC-LINE-UNCHANGED
```

The first line sat entirely beneath the black rectangle. A normal PDF rendering showed the rectangle and the untouched public line:

<figure>
  <img src="/images/oss-radar-10-paperpilot-redacted.png" alt="Synthetic PaperPilot output: a black rectangle covers the secret, while PUBLIC-LINE-UNCHANGED remains visible below it." width="1020" height="1320" style="width:100%;height:auto;max-height:280px;object-fit:cover;object-position:top" loading="lazy">
  <figcaption>The covered text remained recoverable from this same file. The test uses a manufactured secret.</figcaption>
</figure>

I also called `pdf_redact` through a real MCP stdio connection, including initialization. It returned `PDF redacted successfully.` with `isError: false`. Its output was byte-identical to the CLI's. An invalid-page request failed, so the success response was not just an unconditional stub.

## What the operation actually does

The [redaction implementation](https://github.com/KrushnaVardhanReddy/PaperPilot/blob/1e6ea36467066a124289e88b1d3ee7d636f3d5b5/paperpilot-pdf/src/operations/redact.rs) adds five PDF graphics operations: save drawing state, select black, define a rectangle, fill it, restore state. It appends those operations to the page.

It does not remove the existing text operations. The [save method](https://github.com/KrushnaVardhanReddy/PaperPilot/blob/1e6ea36467066a124289e88b1d3ee7d636f3d5b5/paperpilot-pdf/src/document.rs) clones and saves the document; it adds no removal step. The [CLI handler](https://github.com/KrushnaVardhanReddy/PaperPilot/blob/1e6ea36467066a124289e88b1d3ee7d636f3d5b5/paperpilot-cli/src/commands/group_b.rs) and [MCP handler](https://github.com/KrushnaVardhanReddy/PaperPilot/blob/1e6ea36467066a124289e88b1d3ee7d636f3d5b5/paperpilot-mcp/src/server.rs) both call that operation and save its output.

PDF viewers paint the new rectangle over the earlier text. Text extraction can still read the earlier text instructions. I confirmed that with an independent parser, `pypdf`, and found the secret in the decoded page content too. Recovering it required no password, OCR or forensic reconstruction.

The docs specifically say the underlying operators and vector data are deleted. The tested path does not deliver that behavior.

## The control that distinguishes removal from a black bar

I applied a separate destructive-redaction operation with PyMuPDF to the same rectangle in the original file, then saved a new document with unused objects removed. I checked it with `pypdf` as well as rendering it.

| Output | Secret visible in preview | Secret extracted | Public line preserved |
| --- | --- | --- | --- |
| Untouched input | Yes | Yes | Yes |
| PaperPilot CLI | No | Yes | Yes |
| PaperPilot MCP | No | Yes | Yes |
| Independent removal control | No | No | Yes |

The control matters: the rectangle was in the right place, the test string was extractable before redaction, and removing it did not require destroying the rest of the page. One successful control still cannot establish safe redaction for every PDF. Scanned images, annotations and attachments need their own tests.

PaperPilot's existing redaction unit test passed. It checks the added drawing operations and rectangle coordinates, using a page without sensitive text. A regression test should start with actual content beneath the rectangle and attempt to recover it afterwards.

## Local processing answers a different privacy question

PaperPilot's useful architectural choice is sharing one local engine across several interfaces. That can spare users an upload to an online PDF utility. It also means the same operation's behavior reaches both the tested command line and agent tool.

This experiment found a failure in local content removal. It did not find a document upload, and I did not test the desktop or browser builds. The tested MCP response contained an output path and no extracted text. [MCP leaves model use to its host](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture#scope), so where an AI client sends files it later reads is a separate check.

I built the pinned source with Rust 1.96.1 and its lockfile, tested the operation directly, then built the real CLI and MCP binaries with their default features. The source implementation was unchanged. [The generator, runners, hashes and results are public](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10). The linked commit was still current main when checked; I tested source builds, not a separately released desktop binary.

I would not use that version's redaction command to prepare confidential documents for sharing. The result that would change that advice is specific: the exposed CLI and MCP paths must remove the covered content, with extraction tests that catch this case. A black rectangle and a success message already passed.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Permanent-redaction promise — states what the tool claims to remove. | [Pinned tool reference](https://github.com/KrushnaVardhanReddy/PaperPilot/blob/1e6ea36467066a124289e88b1d3ee7d636f3d5b5/apps/docs/src/content/docs/reference/tools/pdf_redact.md) | Source checked October 30, 2026 |
| Rectangle overlay and existing test — explains the observed file and missing recovery check. | [Redaction implementation](https://github.com/KrushnaVardhanReddy/PaperPilot/blob/1e6ea36467066a124289e88b1d3ee7d636f3d5b5/paperpilot-pdf/src/operations/redact.rs) | Same pinned source |
| Independent reproduction — records the actual entry points, synthetic input and removal control. | [Scripts and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10) | October 30, 2026 |
