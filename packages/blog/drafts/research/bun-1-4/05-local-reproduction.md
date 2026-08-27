# Bun 1.4.0 local reproduction

Checked 2026-08-26 on macOS arm64 (`Darwin 25.5.0`). The repository's installed `bun` remained at `1.3.14`; the audit used the official `bun-darwin-aarch64.zip` release asset from [`bun-v1.4.0`](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0), extracted under `/tmp`.

## Binary identity

- `bun --version`: `1.4.0`
- `bun --revision`: `1.4.0+34cbb9a40`
- Full revision reported by `Bun.revision`: `34cbb9a40b4bd1bd767d134a7065e66c2432a676`
- Release ZIP SHA-256: `c669e97f6164e1c96e0701748db98dfa77492908cbd8394c7557134a735de381`
- Extracted binary size on this platform: `63,558,256` bytes

## Reproduction

One TypeScript script exercised four built-ins from the release's expanded standard-library claim:

1. `Bun.Terminal` spawned `/bin/sh`, accepted PTY input, returned exit code `0`, and produced the marker `BUN_PTY_OK`.
2. `Bun.markdown.html()` preserved an `onerror` event-handler attribute in raw HTML.
3. `Bun.JSON5.parse('{answer: 42,}')` returned `{ "answer": 42 }`.
4. `Bun.stringWidth('bun 🥖')` returned `6`.

The Markdown result reproduces the official warning that `Bun.markdown` does not sanitize output. It proves parser behavior for this input; it does not show script execution in a browser.

Evidence state: **Reproduced** for the four behaviors above. No performance, browser automation, image processing, cron persistence, compatibility, or security benchmark was run.

## Command

```bash
/tmp/bun-1.4-audit.JOUMSS/unpacked/bun-darwin-aarch64/bun \
  /tmp/bun-1.4-audit.JOUMSS/repro.ts
```

The temporary script and binary are not publication artifacts. This document preserves the result and its boundary.

## Exact reproduction script

The release binary remains an official external artifact under `/tmp`; the 956-byte TypeScript input is preserved
below so the behavior check can be rerun after downloading and verifying the matching Bun binary.

```ts
const unsafeMarkdown = '<img src=x onerror="globalThis.pwned=true">';
const markdownHtml = Bun.markdown.html(unsafeMarkdown).trim();

let terminalOutput = '';
const decoder = new TextDecoder();
const proc = Bun.spawn(['/bin/sh'], {
  terminal: {
    cols: 80,
    rows: 24,
    data(_terminal, bytes) {
      terminalOutput += decoder.decode(bytes);
    },
  },
});

if (!proc.terminal) throw new Error('Bun.Terminal was not attached');
proc.terminal.write("printf 'BUN_PTY_OK\\n'; exit\n");
const guard = setTimeout(() => proc.kill(), 2_000);
const exitCode = await proc.exited;
clearTimeout(guard);

console.log(JSON.stringify({
  version: Bun.version,
  revision: Bun.revision,
  markdownHtml,
  markdownPreservedEventHandler: markdownHtml.includes('onerror='),
  terminalExitCode: exitCode,
  terminalSawMarker: terminalOutput.includes('BUN_PTY_OK'),
  json5: Bun.JSON5.parse('{answer: 42,}'),
  stringWidth: Bun.stringWidth('bun 🥖'),
}, null, 2));
```
