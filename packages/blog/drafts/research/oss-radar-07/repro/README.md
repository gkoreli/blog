# Promptfoo OpenRouter response probe

This offline fixture checks the normalized return value of Promptfoo's pinned OpenRouter provider. It is a small research reproduction, not a live model benchmark.

## Run

Requires Node 24. Run from this directory:

```sh
node --experimental-vm-modules probe-openrouter.mjs > result.json
```

The script makes no network requests. Node may print experimental-feature warnings to stderr; JSON goes to stdout.

## Method

The vendored `openrouter.ts.txt` is the original source from Promptfoo release 0.122.2, commit `89052308bce06f53645b1f189ada5ac9d1897347`. The text suffix keeps the evidence snapshot outside normal TypeScript compilation. The script verifies its SHA-256, strips its TypeScript types with Node, then evaluates the module with explicitly mocked imports. It calls the public provider method once.

The transport returns [response.fixture.json](response.fixture.json), invented test data containing one provider citation URL and one answer annotation for the same URL. It also carries a synthetic provider cost. A mocked cost calculator returns a different sentinel value. Neither amount is a real price or charge.

## Observation

| Field | Synthetic input | Normalized output |
|---|---:|---:|
| Provider citation URLs | 1 | 0 |
| Answer citation annotations | 1 | 0 |
| Answer text | Present | Preserved |
| Provider-reported cost field | Present | Replaced by mocked calculator output |

See [result.json](result.json) for the exact inputs, runtime, source and fixture hashes, return keys, and limits. Citation URL and annotation refer to the same source; the table does not count two distinct lost citations.

The probe establishes this module's return shape under controlled dependencies. It does not establish the behavior of an installed Promptfoo evaluation, its raw transport cache, another provider adapter, a live model, or the provider's billing. Those are next checks. No upstream issue was filed.

September 8 continuation: the separate [installed-package probe](installed/README.md) now checks programmatic summaries, the transport cache, and a custom capture provider. It confirms the summary omission and demonstrates that the full parsed fixture survives in the cache. The broader framework can retain raw data and metadata through the tested custom-provider path. The original result above remains unchanged.

## Source

[Promptfoo OpenRouter provider](https://github.com/promptfoo/promptfoo/blob/89052308bce06f53645b1f189ada5ac9d1897347/src/providers/openrouter.ts), under the retained [MIT licence](vendor/LICENSE.promptfoo). The snapshot is unmodified. The probe and fixture are original research code under this repository's code licence.
