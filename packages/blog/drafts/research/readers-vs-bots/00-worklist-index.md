# Readers vs bots — article worklist index

**Working title:** How I Separate Readers from Bots on a Static Blog Without JavaScript (title rule: subject first; final title decided in TASK-0103).

**Worklist:** `FLDR-0007`. **Author directive:** `PROMPT 0011`. **Engineering decision under revision:** `docs/adr/0016.2-browser-evidence-and-reader-tier.md`.

**State when the worklist opened:** 2026-09-03 01:55 UTC. Evidence columns went live in production at 01:35 UTC the same night. The public rule and the class names are not settled. Goga's decision that history stays in Browsers is settled.

**Governing decision on timing:** write from inside the problem. The rule can settle after the first draft exists; the article's evidence boundary names what is still open. Continuation evidence (TASK-0104) earns a later piece, it does not delay this one.

## Artifacts

| File | Role | Owner |
|---|---|---|
| `01-author-prompts.md` | Goga's verbatim prompts from the night of 2026-09-02, in order | Goga (verbatim), agent (collected) |
| `02-evidence-ledger.md` | Every number with its query and read time | Fable |
| `03-standards-and-vocabulary.md` | MRC/IAB, Cloudflare, GA4, Matomo, Plausible, Fathom, GoatCounter, Umami definitions with URLs | Claude opus research worker |
| `04-open-source-and-asn-lists.md` | What the open-source tools' code actually checks; hosting-ASN list survey; Sec-Fetch precedents | Claude opus research worker |
| `05-citability-and-citation-visibility.md` | Scholar, DOIs (Rogue Scholar, Zenodo), OpenAlex, backlink APIs, cite-this conventions | Claude opus research worker |
| `06-agent-identification-and-taxonomies.md` | Web Bot Auth, vendor agent UAs, headless fingerprints (with experiment), MeshClaw/Hermes, taxonomies, Cloudflare AI Crawl Control | Claude opus research worker |
| `07-cloudflare-agent-readiness-and-zone-state.md` | Zone robots.txt, AI Crawl Control state, Agent Readiness scan results | Fable (dashboard read) |
| `08-agent-native-landscape-2026-09.md` | Dated survey: what is shipping vs proposal in September 2026 | Claude opus research worker |
| `09-fetch-metadata-prior-art.md` | TASK-0101 closed on prior art: caniuse 95.72%, Android WebView since Chromium 76, iOS WebView measured in mdn/browser-compat-data #27928; version-gated verdict rule | Fable, 2026-09-03 |
| (no artifact 10) | TASK-0102/0105 decisions are recorded in ADR-0016.3 (section A, "Public labels", build-list status), the task outcome sections, and CHANGELOG 0.5.0/0.6.0 rather than a separate artifact | Fable, 2026-09-03 |
| `11-living-center-and-form.md` | TASK-0103: shape-article output, protected passages | Fable with Goga |

## Tasks

- `TASK-0098` evidence ledger (done)
- `TASK-0099` standards vocabulary (done, artifact 03)
- `TASK-0100` open-source code and ASN lists (done, artifact 04)
- `TASK-0101` fetch metadata absence rule (done, closed on prior art; artifact 09)
- `TASK-0102` settle rule and names, ship (done, 0.6.0)
- `TASK-0103` living center, form, protected material (open; Goga's prose)
- `TASK-0104` 14-day calibration against Cloudflare Web Analytics (open; around 2026-09-17; method and decision rule in the task file)
- `TASK-0105` audience composition taxonomy (done, 0.5.0 + 0.6.0)
- `TASK-0106` citable articles and reference visibility (citable half done in 0.5.0; "Referenced by" open)

Decision record for all of the above: `docs/adr/0016.3-audience-composition-and-citable-articles.md`.

Backlog MCP was unreachable (502) when this worklist opened; folder, prompt, and task files were written by hand in the same format.
