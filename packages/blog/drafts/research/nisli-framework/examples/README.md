# Practical article examples — October 21, 2026

These checks extract the two complete Nisli examples directly from the
[published article source](../../../../posts/029-openclaw-chose-solid-why-id-choose-nisli.md).
They append exports for the harness, without changing the displayed code.
Both compile in strict TypeScript against the public 0.57.0 declarations and
run against that package's production bundler entry. No blog dependencies change.

## Reproduce

Use an isolated Nisli dependency runtime containing TypeScript, esbuild, and
Playwright with Chromium, Firefox, and WebKit installed. Extract the public
`@nisli/core@0.57.0` tarball separately, as in the
[publication reproduction](../publication/README.md).

```sh
export NISLI_CORE_WORKTREE=/absolute/path/to/installed/nisli/checkout
export NISLI_ARTIFACT_ROOT=/absolute/path/to/extracted/package
node run.mjs
```

Node 24.14.1 ran this check on macOS arm64. The script writes its temporary
TypeScript sources outside the repository and saves [results.json](results.json)
here. Package-entry and exact-example SHA-256 values identify what ran.
The package-entry hash matches the earlier publication artifact.

## Results and limits

Strict typechecking passed. All assertions in [checks.ts](checks.ts) passed in
headless Chromium 149.0.7827.55, Firefox 151.0, and WebKit 26.5:

- 100 successive signal writes updated the same reply text node through typed
  component props; immediate signal reads returned the new value.
- The neighboring draft retained its input node, value, focus, and input selection.
- The preview hid old data while loading and showed an HTTP-error message.
- Starting B aborted A. A then completed despite the abort; B stayed displayed.
- Removing the component aborted C. Its late completion did not update the
  detached view, and a later selection did not start D.

The fetch stub returns real `Response` objects and deliberately ignores abort.
This separates obsolete-result protection from cooperative cancellation. It
proves that Nisli passes and aborts the signal; it does not exercise a real server
or establish that a server-side operation stopped. The drain includes a browser
task turn because `Response.text()` does not necessarily settle through
microtasks alone. The initial microtask-only harness failed its B-result check;
that was corrected before accepting these results.

The article's immediate A-to-B assignment can coalesce before the first loader
starts. The harness separately starts A, waits for admission, then selects B to
exercise a real overlapping-request race. The controlled stream is plain text,
not Markdown, and focus uses native input selection rather than document
Selection. No performance numbers, OpenClaw port, manual typing, or complete
cross-framework comparison are claimed from these checks.
