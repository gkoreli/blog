# Private article and evidence-resource accounting

Run from the repository root with the pinned Node runtime and the existing tsx loader:

```sh
pnpm -C packages/blog exec node --import tsx scripts/resource-reach.mjs /private/input.json /private/new-report-directory
```

This offline command reads a bounded regular UTF-8 JSON file, then creates `report.json` and `brief.md` in a **new** directory (0700; files 0600). It never fetches, collects, queries D1, follows redirects or overwrites an output directory. The report retains the exact input-byte SHA-256. Keep supplied inputs and outputs private; registry labels and context are operator-supplied and may contain sensitive text. The synthetic [example](examples/resource-reach.demo.json) is an input-contract demonstration, not traffic evidence.

The `resource-reach-v1` envelope requires `provenance` (`saved-events` or `synthetic`), `scope`, `registry`, and `events`. Unknown fields reject. Scope declares `selectionId`, `registryVersion`, `inclusionContext`, `capturedAt`, `startInclusive` and `endExclusive`; dates are UTC ISO strings with `Z`, seconds and optional three-digit milliseconds. The selection is half-open. Capture time and a window extending after it stay explicit; completeness is never inferred.

Registry `articles` have globally unique `id`, exact canonical `path`, `title`, optional `aliases`, and an `evidence` array. Each evidence resource and each `siteResources` entry has its own unique ID, path, title and optional aliases. A path has one owner. Parent relationships are explicit; `/prompts`, redirects, percent decoding, case and trailing-slash equivalence are never inferred. IDs are scoped to the registry version. Registry labels do not reconstruct historical metadata.

Each event requires a unique opaque `reference`, `path`, nullable `observedAt`, `assessment` (`included`, `owner-excluded`, `referral-excluded`, `unassessed`), nullable `storedKind`, nullable `collection` and `classifier` stamps, nullable `observationSource` and `representation`. The caller supplies assessments; the analyzer does not run owner/referral policy. Known times outside the window reject, including excluded events. Missing/malformed times remain counted and visible. Unknown kinds and provenance values become explicit unrecognized states. Valid date-version stamp syntax is preserved without claiming semantic compatibility or activation.

Each supplied event appears once in article/evidence/site/unmapped accounting. Only included events contribute registered-resource metrics. Quality, stored kinds and method histories remain available for all selected events and separately for included events, overall and by role; excluded/unassessed denominators remain explicit. A parent’s related total sums article and evidence events, never unique people, article views, comprehension or use. Stored kinds and method histories remain available per resource. Event references, unregistered paths and arbitrary unknown source values are omitted from reports. No suppression claim applies to registry labels or supplied scope text.

Limits: 8 MiB input, 4096 events, 1024 articles, 64 evidence resources per article, 1024 site resources, 4096 total resources, 8192 registered paths, 16 aliases per resource and 128 normalized measurement histories. Overflow rejects the whole input. A zero means no included event in the supplied slice, not zero demand. Source authenticity and population completeness remain unestablished.

See [Research 125](../drafts/research/analytics-retrospective/125-explicit-resource-reach-accounting.md) for historical acceptance and primary-source design references.
