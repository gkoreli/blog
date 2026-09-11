# ShipTogether worklist

**Current state — September 11, 2026:** the unauthenticated audit is complete. ShipTogether is a co-founder matching network Goga came across; the audit is recorded in the [product audit](01-shiptogether-product-audit.md) with pinned `robots.txt`, `sitemap.xml`, and `llms.txt` captures.

**Why it is here:** the product itself is a small indie app with almost no content — 11 public Shipyard projects across nine months, one public builder profile, 100+ Android downloads. The reusable finding is the inverse: it publishes a more deliberate agent-readable surface than sites many times its size, including a hand-enumerated allow-list of sixteen named AI agents and an `llms.txt` that scripts the one-line summary it wants assistants to repeat. That surface is the same one this blog measures from the reading end.

**Access boundary:** no account was created; no authenticated surface was read. Matching quality, chat, and video calling are unevaluated and must not be described as tested.

## Worklist

| Work | State | Record |
|---|---|---|
| Unauthenticated product and corpus audit | Complete | [Product audit](01-shiptogether-product-audit.md) |
| Pin robots/sitemap/llms captures with hashes | Complete | [`capture/`](./capture/) |
| Enumerate and parse every public Shipyard project | Complete: 11 of 11 | [Product audit](01-shiptogether-product-audit.md) |
| Record the published annual-price discrepancy | Complete; not reported to the owner | [Product audit](01-shiptogether-product-audit.md) |
| Test whether assistants honour a publisher's `Notes for assistants` block | Open — proposed, not run | [Product audit](01-shiptogether-product-audit.md) next action |
| Decide whether this feeds an article or stays reference | Open — Goga's call | — |

## Artifact map

- [Product audit](01-shiptogether-product-audit.md): what the product is, the agent surface in detail, the full public corpus with engagement counts, ownership, the price discrepancy, verdict, and limits.
- [`capture/robots.txt`](./capture/robots.txt) — sha256 `f54eb5dfca2e982bccabcbc46c9858c3197fd32f975fd4095dee72e9e5430182`, 7,432 bytes.
- [`capture/sitemap.xml`](./capture/sitemap.xml) — sha256 `6cf236faf39855157d1516d762c7a18a7323860083fd3c2d4936bb3fbfdcba05`, 3,642 bytes.
- [`capture/llms.txt`](./capture/llms.txt) — sha256 `8e4c2cc7aed0b73d402da2f3a57fb210fecdaa79728adebd38b35d3b298d39c5`, 2,845 bytes.

All three captured 2026-09-11T17:07:26Z UTC.

## Related lanes

This folder does not belong to an existing worklist and does not claim priority over one. The proposed follow-up experiment, if promoted, belongs beside the citation work rather than here:

- [`llms-txt-geo`](../llms-txt-geo/) — the convention and the discovery claims this specimen tests.
- [`agent-native-lane`](../agent-native-lane/) — publisher-side agent surfaces; [TASK-0132](../../../../../docs/tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md) retains its priority in that lane.
- [`engineering-credibility`](../engineering-credibility/) — the "proof over pitch" premise is the same question about what a reader can actually check.

## Next bounded action

Goga's decision: promote the instruction-compliance experiment (does the scripted `llms.txt` sentence propagate into assistant answers?) or file this as reference and stop. Nothing here schedules an article.
