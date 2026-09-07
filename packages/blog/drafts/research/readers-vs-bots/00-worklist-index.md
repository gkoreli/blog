# Readers vs bots — article worklist index

**Current article title:** How I Classify Browser and Bot Requests Without JavaScript. The stable published URL retains the original readers-versus-bots slug.

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

Referral-abuse repair: [worklist FLDR-0009](../../../../../docs/folders/FLDR-0009.md), [ADR-0016.5](../../../../../docs/adr/0016.5-referral-abuse-defense.md), [Matomo/provenance ADR-0016.6](../../../../../docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md), and [verification artifact 18](18-matomo-referral-policy-verification.md). The candidate combines a pinned community list and local exceptions, prevents arbitrary hostname promotion, discloses exclusions, and preserves evidence. Production activation and live checks are recorded in [artifact 19](19-referral-policy-activation.md); TASK-0121 is complete. Manual browser QA remains unperformed.

**Current bookkeeping:** [artifact 16](16-claims-and-work-status-2026-09-06.md) records the correction checklist, completed extractor validation, private capture location, and remaining work. The [extractor](../../../scripts/analytics-evidence.md) is implemented; grouping repairs, article corrections, and controlled trials remain open. TASK-0104's current contract supersedes its original ratio thresholds and waiting instruction.

**Next two implementation priorities:** TASK-0119 separates client identity evidence from traffic purpose; TASK-0120 measures classification and beacon delivery with known clients. Scope, acceptance criteria, article outputs, and proposed collection limits are in `13-two-priority-implementation-plan.md`, subject to the scope clarification below. The grouping correction and controlled trials are not implemented; investigation of existing data is in progress.

**September 5 PDT scope and stopping rule:** [FLDR-0008](../../../../../docs/folders/FLDR-0008.md) now maps the ten initial article slots, their current status, and evidence gates. Correct article 024's unsupported claims and add the compact dated production result, then close this revision. The full 95-versus-14 investigation belongs to lane row 10; the signed/unsigned identity study belongs to row 4. TASK-0120 is in progress, starting with existing Cloudflare logs and traces. Do not build another tracing system before establishing an actual evidence gap. The verifier remains; TASK-0119's immediate scope is grouping and wording.

**Evidence-backed refinement:** [artifact 14](14-evidence-backed-implementation-plan.md) adds commit-pinned source reviews of Plausible, GoatCounter, Matomo Device Detector, and Anubis; protocol references; collection contracts; controlled lifecycle/cache experiments; and release gates for the same two tasks.

**Existing Cloudflare evidence:** [artifact 15](15-existing-cloudflare-evidence-2026-09-06.md) records the current log/trace-access boundary, a refined correlation with candidates for 77 of 95 D1 rows, 19 Redroid-UA candidates, and finer RUM results. These are diagnostic correlations, not an exact reconciliation. Individual trace spans and controlled-client trials remain outstanding.

**September 5 follow-up:** `12-production-followup-2026-09-05.md` records two complete UTC days of new production evidence, the 372 → 95 classification impact, 95 versus 14 script page loads, repeated-referrer traffic, verified signatures, and the separate deployment/migration boundaries. SQL and aggregate results are stored alongside it. TASK-0104 remains open for the longer window; the early result does not validate its proposed ratio threshold.

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

**September 6 revision:** [article revision audit](17-article-revision-2026-09-06.md) records the corrected claim boundary, metadata, validation, and release. The full edge-versus-RUM investigation remains TASK-0120 / FLDR-0008 row 10.
