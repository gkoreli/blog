# Changelog

Notable changes to the publication and its supporting packages are recorded here.

## 0.6.0 — 2026-09-03

### Stats page: audience composition

- Replace the Browsers / Browser-like / Bots / AI UAs filters with four groups of the reader kinds, named for what the client was doing: Browsers, AI agents, Crawlers, Automation, plus All. The groups are disjoint and add up to All.
- Add a "Who fetched these pages" composition table listing every reader kind with its reasons in plain words (hosting providers by name, the three Browsers evidence levels by date range, named agents as links to their own view).
- Accept `kind=` on the stats API alongside `path=` and `agent=`, and reject combinations whose kind lies outside the chosen group.
- Rewrite the methodology to state the reader kinds, the three Browsers evidence levels, the two method changes (August 26 edge cutover, September 3 evidence), and the rules for hosting networks and Fetch Metadata.

## 0.5.0 — 2026-09-03

### Analytics: audience composition with provenance (ADR-0016.2, ADR-0016.3)

- Record request evidence on every edge observation: network (ASN, organisation), Fetch Metadata headers, Accept and Accept-Language presence, and the served representation.
- Partition Browsers by evidence instead of User-Agent alone: a navigation-shaped request from outside hosting networks. Hosting-network traffic is a verdict on its own and is checked before request shape; the largest inflator was one Google Cloud client sending 374 navigation-shaped "Chrome Mobile 114" page hits in three days.
- Version-gate Fetch Metadata absence on the claimed engine (Chromium 76, Firefox 90, WebKit 16.4 and later), grounded in caniuse support data, Chromium WebView behaviour since 2019, and a 2025 production measurement of iOS WebView, instead of the undated "WebViews omit it" caveat.
- Store one reader kind and one reason per row from a closed set: signed agent, AI assistant, AI search, AI crawler, search crawler, link preview, headless browser, other bot, cloud browser, HTTP client, legacy browser, browser. Backfill history with the same mapping.
- Reconstruct network evidence for the 2026-08-27 to 2026-09-03 window from Cloudflare zone analytics and Team Cymru, stored with `asn_source = 'zone-sample'`: 1,429 of 1,962 rows, 714 browser-class rows on hosting networks. Beacon rows state `beacon-script-ran`; pre-evidence edge rows state `user-agent-only`.
- Verify Web Bot Auth signatures (RFC 9421, draft-ietf-webbotauth-httpsig-protocol-00) with a dependency-free Ed25519 verifier and record the signed origin.
- Refresh AI and crawler rules from vendor documentation (OpenAI, Anthropic, Perplexity, Meta, Mistral, Amazon, Google, Apple) and add headless-browser tokens.
- Keep the public stats API and dashboard on the previous filters until the reader-kind labels ship.

### Agent-native reading and citation (ADR-0016.3)

- Negotiate representations on post and page paths: `Accept: text/markdown` returns the Markdown twin with `Content-Location`; CSL-JSON and BibTeX media types return per-post citation files. HTML and Markdown responses carry typed `Link` headers (alternate Markdown, describedby, author, license, alternate CSL-JSON) and matching head links.
- Generate `/<slug>.csl.json` and `/<slug>.bib` for every post and append a "Cite this" block to each Markdown twin.
- Generate `robots.txt` from a template with `Content-Signal: search=yes, ai-input=yes` and a content-license comment; publish `/license` from the repository LICENSE.
- Clarify LICENSE: content stays CC BY-NC-ND 4.0, quoting with attribution is welcome, code snippets inside posts are MIT.

### Research and records

- Research artifacts 00 to 09 under `packages/blog/drafts/research/readers-vs-bots/`: standards vocabulary, open-source classifier code, hosting-ASN lists, citability, agent identification, Cloudflare zone state, the September 2026 agent-web landscape, and the Fetch Metadata prior art with the 72-hour Workers Logs and zone-analytics measurements.
- Worklist FLDR-0007 with PROMPT 0011 and 0012 and TASK-0098 to TASK-0106 for the readers-versus-bots article.

## 0.4.0 — 2026-08-26

### Animations Lab

- Recompose Ambient Drift as three depth layers with separate fields, emitters, lifetimes, scales, and opacity hierarchies.
- Turn Memory Zone into a left-to-right itinerary with a named chamber and persistent color, size, alpha, and emissive state after crossing.
- Layer Text Emergence into core and ghost glyph fragments while preserving the source word as the dominant editorial object.
- Rebuild Fracture Pulse as a seven-branch hierarchy with an eight-second calm/reveal/hold/decay cycle, one restrained hue, and exact phase inspection.
- Add live phase labels and constrain the right-gutter breakout at every tested viewport without losing the adjacent instrument dock.

## 0.3.1 — 2026-08-26

### Animations Lab

- Raise the breakout workbench above the mirrored grid gutter so sliders, timeline scrubbing, and transport buttons receive pointer input.
- Add an explicit museum-grade art-direction follow-up and require owner sign-off before treating technically valid experiments as visually finished.

## 0.3.0 — 2026-08-26

### Animation framework

- Add explicit renderer-neutral particle marks: circles, velocity-aligned lozenges, hollow frames, and upright bars, with validation and matching emissive silhouettes.
- Add separate time-driven primitive clocks, stable-ID primitive timeline inspection/seeking, exact freeze semantics, and non-advancing current-frame redraws without claiming particle simulation rewind.
- Make mount time accumulate only active deltas across caller freeze, viewport suspension, zero-size surfaces, and reduced motion.
- Add timeline-driven polyline reveal, collective hold, decay, and branching fracture geometry.

### Animations Lab

- Replace the shared tadpole/comet glyph with distinct visual languages for Ambient Drift, Memory Zone, Text Emergence, and Fracture Pulse.
- Replace the buried control panel with an adjacent 1120px workbench and visible instrument dock containing Freeze, Restart, Defaults, Stress, playhead scrub, metrics, and manifest inspection.
- Add honest continuous-scene messaging, exact primitive-timeline scrubbing, persistent semantic memory transitions, responsive mobile stacking, and full-scale visual acceptance checks.

## 0.2.1 — 2026-08-26

### Animation framework

- Load Pixi’s CSP-safe static shader and uniform synchronization fallback so the Animations Lab runs without adding `'unsafe-eval'` to `script-src`.
- Preserve the next framework sequence as a backlog epic covering deterministic frames, executable plans, agent inspection, measured performance, Text Emergence V2, choreography inputs, and one selective preamble pilot.

## 0.2.0 — 2026-08-26

### Animation framework

- Recast `@gkoreli/animation` as an independent agent-native framework experiment, with gkoreli.com as its current lab and selective consumer.
- Add versioned, seeded scene declarations, structured validation diagnostics, `SceneManifestV1`, and inspectable stage phases.
- Remove the unused article-scene grammar, legacy effect descriptors, legacy timeline API, and other inert public paths.
- Fix mixed transition/continuous pipes, repeated per-frame bursts, stale occupancy on reused particle slots, pause/visibility ownership, and resume timing.
- Add real runtime frame callbacks, render-once invalidation, emissive and blend rendering, visible zone primitives, and renderer-neutral polylines.
- Replace DOM/CSS lab stand-ins with runtime-rendered Memory Zone and Fracture Pulse semantics.
- Make lab controls resettable and inspectable, derive metrics from runtime frames and live particles, and preserve reduced-motion updates.
- Record the architecture in ADR-0015.4 and update package guidance.

### Publication and analytics

- Add “How I Built First-Party Analytics for a Personal Blog,” its prompt provenance, and its public research artifacts.
- Refine the public stats, privacy, and analytics decision language around edge observations and measurement boundaries.
- Update the `llms.txt` investigation and related publication context.

### Editorial system

- Add the article-discovery positioning skill.
- Refine article shaping, evidence-led investigation, personal essay, shareability, and blog-writing guidance.
- Synchronize project worklists, prompts, decisions, tasks, and durable memories into the repository-backed backlog.
