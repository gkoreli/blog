# Check what your User-Agent parser claims

## Inspect one supplied header privately

Create a regular UTF-8 JSON file with `userAgent` as a string or null and optional `mobileHint` as a string or null. For example, `{"userAgent":"Mozilla/5.0 (Linux; Android 10; K) Chrome/150.0.0.0 Mobile Safari/537.36","mobileHint":"?1"}`. Then run from this source repository with its dependencies installed:

```sh
pnpm -C packages/blog exec node --import tsx tools/user-agent-check/inspect.mjs /absolute/path/to/input.json
```

The report includes declared names, browser/platform conflicts, reported versions, form preferences and cautions about known frozen-version patterns. A reported Android 10 token is not evidence the actual device runs Android 10. Authentication is never performed. Missing, empty and unrecognized inputs remain distinct. No raw header, arbitrary URL, address or contact text is echoed. No network call or file write occurs. Inputs above 262144 bytes, unsupported fields, malformed UTF-8/JSON, devices and FIFOs are rejected with a fixed error; there is no silent truncation. Your local input/output can still be private evidence; choose where to retain them.

Library consumers can import `assessUserAgent` from `@gkoreli/analytics/user-agent` in this private TypeScript workspace source. It is not yet a published npm package. It takes supplied text and optional already-received mobile preference; no caller-provided headers, hints or tokens acquire identity authority. This is a useful interpretation primitive, not a full browser/device detector or complete HTTP grammar validator.

For a plain JavaScript project, the same pure entry can be bundled from the checked source without a Worker or collector:

```sh
pnpm -C packages/blog exec esbuild ../analytics/src/user-agent-assessment.ts --bundle --platform=neutral --format=esm --outfile=/tmp/user-agent-claims.mjs
```

Import `assessUserAgent` from that file in your own code. Keep the emitted profile and source version with results. The portable bundle was loaded outside the repository with external transport disabled; that is local portability evidence, not an independent operator trial.

## Exercise the extraction contract

Sixteen selected examples test one explicit contract: extract software declarations without obtaining them from a phone name, an app-name lookalike or a recognized absolute URI. Preserve real appended products and all competing named declarations. A result is a lexical claim, not a verified vendor, person, device or purpose.

Run the deliberately weak demonstration with Node 24:

```sh
node packages/blog/tools/user-agent-check/check.mjs --demo
```

It should report failed cases and exit **1**. It is a tiny example of a whole-header matching mistake, not our complete historical classifier or another library's implementation.

Run the actual current blog parser from the repository with its installed dependencies:

```sh
pnpm -C packages/blog exec node --import tsx tools/user-agent-check/check.mjs --adapter tools/user-agent-check/blog-adapter.mjs
```

To use another parser, create an adapter that exports a default synchronous or asynchronous function accepting a User-Agent string and returning:

```js
export default function assess(userAgent) {
  const result = yourParser(userAgent);
  return {
    namedClients: result.allCandidateNames,
    automationClaim: result.hasAutomationDeclaration,
  };
}
```

Then run:

```sh
node check.mjs --adapter /absolute/path/to/adapter.mjs
```

`namedClients` contains canonical catalogue names: this pack uses `GPTBot`, `ChatGPT-User` and `Googlebot`. Comparison ignores order but retains duplicates as a failure. An unknown explicit name such as `UnknownBot` can supply generic automation evidence without supplying a catalogue name. `automationClaim: false` means only that this contract found no automation declaration in the supplied text; it must not become a human label. The blog's adapter deliberately exposes its coarse lexical field, not its final context-dependent reader kind.

An ordinary boolean bot library may intentionally use broader whole-header signals or return only a first match. Such an API cannot satisfy every part of this extraction contract without an additional adapter or parser. A failed case does not by itself establish a defect under that library's documented policy. The tool does not rate libraries against one universal definition of a bot.

The JSON report includes the fixture-file SHA-256, every result, expected values and a reason to inspect each case. Exit 0 means all selected controls passed; exit 1 means at least one failed; exit 2 means setup failed. It reads only the bundled public fixture file and the adapter you explicitly execute. It fetches no URLs, ingests no private logs and stores nothing. A supplied adapter is your own executable code and can perform additional work.

The cases are simplified test strings derived from the blog's reviewed examples, not captured requests or human labels. The FEVER phone model follows [Matomo issue 5484](https://github.com/matomo-org/device-detector/issues/5484); CUBOT and Phantom cases follow the [pinned source review](../../drafts/research/analytics-retrospective/129-oss-detection-source-review.md). The URI and multiple-declaration policies follow [the domain audit](../../drafts/research/analytics-retrospective/130-detection-domain-audit.md). These purposively selected controls cannot estimate an affected-visit rate, detector precision/recall, or how many other sites have a problem.

The runner and example adapter are MIT under the repository code licence. The examples document input facts and explicit expected extraction behavior. No dependency or runtime collector change is required.
