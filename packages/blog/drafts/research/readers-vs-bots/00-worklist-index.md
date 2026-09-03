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
| `05-referred-traffic-measurement.md` | TASK-0101: fetch-metadata presence on real referred traffic | Fable, after daytime traffic |
| `06-rule-and-vocabulary-decision.md` | TASK-0102: the settled predicate and names, with citations | Fable |
| `07-living-center-and-form.md` | TASK-0103: shape-article output, protected passages | Fable with Goga |

## Tasks

- `TASK-0098` evidence ledger (done)
- `TASK-0099` standards vocabulary (in progress)
- `TASK-0100` open-source code and ASN lists (in progress)
- `TASK-0101` measure fetch metadata on referred traffic (blocks 0102)
- `TASK-0102` settle rule and names, amend ADR, ship
- `TASK-0103` living center, form, protected material
- `TASK-0104` 14-day calibration against Cloudflare Web Analytics

Backlog MCP was unreachable (502) when this worklist opened; folder, prompt, and task files were written by hand in the same format.
