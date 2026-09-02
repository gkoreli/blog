# interp-engine OSS Radar worklist (issue #06)

Check date: 2026-09-01 (America/Los_Angeles evening).
Baseline: `decoderesearch/interp-engine` at `74716092e5bad8beca1e27193ec9980a8e9a4e85` (main, 2026-09-01T22:52Z, PyPI 1.5.1). Announcement: https://www.neuronpedia.org/blog/interp-engine (2026-08-31). Repository created 2026-08-05; first public commit 2026-08-20 ("feat: interp-engine 1.3.3"); 31 commits at baseline; 14 stars.

Mode: project deep dive. Article focus: interp-engine as Neuronpedia's production interpretability engine, judged on hook correctness and the serving-engine bet. Side topic saved for issue #07: DFlash 2 (block-diffusion speculative drafter).

- Source and correctness audit (Codex sol/high, read-only): `01-source-audit.md`
- Product and ecosystem theory (Codex sol/high, read-only): `02-product-ecosystem-theory.md`
- Adversarial adoption review (Codex sol/high, read-only): `03-adversarial-adoption-review.md`
- Local reproduction on Apple Silicon MPS (Codex sol/high, workspace-write in scratchpad): `04-local-reproduction.md`
- Preamble animation design (Fable): `05-preamble-animation-design.md`
- Editorial synthesis and claim table (Fable): `06-editorial-synthesis.md`
- Draft fact-check and red team: `07-draft-fact-check.md`
- Visual verification: `08-visual-verification.md`
- Publication strategy assessment: `09-publication-strategy.md`

Backlog MCP was unreachable (502) at planning time; no backlog IDs recorded.

OSS Radar publication rule: no public raw-prompt page. No research footprint is published for this issue: the workers were five independent Codex threads launched from a Claude session plus editor-run reproductions, and `scripts/research-footprint.ts` assumes one Codex root thread. Worker prompts and logs stayed in the session scratchpad; the reports are the committed artifacts `01`–`04`, `07`.

Reproduction note: Codex's sandbox hides the Metal device from child processes (torch `mps.is_available() = False` inside the worker); the editor ran the reproduction scripts from an unsandboxed shell. See `04`.
