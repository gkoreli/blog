# interp-engine preamble animation design

## Decision

Issue #06 uses an exclusive static component named `AddressBoardHero`. It renders the article heading and a CSS-only **address board**: one Gemma-2 decoder block drawn as a residual stream with its two sublayers, the engine's named hook points lighting up in forward order, and beside each point the TransformerLens hook string it translates to. One row carries the article's argument: `blocks.4.hook_mlp_out` first attaches to the raw `mlp_out` tap, a mismatch mark appears, and the line moves to `mlp_out_post`, where the check passes.

This is the article's opening claim in visual form:

> On a sandwich-norm block, a hook name is not a tensor. TransformerLens's block-level `hook_mlp_out` fires after Gemma's post-sublayer norm; the raw MLP output is a different vector with the same name. interp-engine spells the two apart and checks every point against the other engines before it serves one.

The animation adds sequence only. Every point name, every translation, and the mismatch row stay readable as static HTML.

Implementation:

- `packages/blog/src/components/address-board-hero/address-board-hero.ts`
- `packages/blog/src/components/address-board-hero/address-board-hero.css`
- exported as `AddressBoardHero` through `packages/blog/src/components/index.ts`, consumed through `packages/blog/src/templates/components.ts`
- no client component, custom element, runtime script, or added dependency
- heading structure mirrors `BunFusionHero`: pills (issue, date), kicker tags, `<h1>` passed in, subtitle, byline, optional footprint link

## Source model and claim boundaries

All point names and translations come from `docs/ENGINE_HOOK_MAPPINGS.md` and `docs/SUPPORTED_POINTS.md` in `decoderesearch/interp-engine` at `74716092e5bad8beca1e27193ec9980a8e9a4e85`. The board shows one block at layer 4 because Neuronpedia's documented mistake was on `blocks.4.hook_mlp_out` for `gemma-2-2b` (`ENGINE_HOOK_MAPPINGS.md`, "Raw output versus residual contribution").

| Board tap (interp-engine) | TransformerLens hook | Board treatment |
|---|---|---|
| `resid_pre.4` | `blocks.4.hook_resid_pre` | spine, agrees |
| `attn_in.4` | (norm output; no block-level TL hook) | branch input, no translation shown |
| `attn_out.4` | `blocks.4.attn.hook_out` | branch, agrees |
| `attn_out_post.4` | `blocks.4.hook_attn_out` | after post-norm, agrees |
| `resid_mid.4` | `blocks.4.hook_resid_mid` | spine, agrees |
| `mlp_in.4` | (norm output; no block-level TL hook) | branch input, no translation shown |
| `mlp_out.4` | `blocks.4.mlp.hook_out` | branch, agrees |
| `mlp_out_post.4` | `blocks.4.hook_mlp_out` | the argument row: `hook_mlp_out` first lands on `mlp_out` (mismatch), then on `mlp_out_post` (agrees) |
| `resid_post.4` | `blocks.4.hook_resid_post` | spine, agrees |

Counts in the legend come from the README and `SUPPORTED_POINTS.md`: 34 canonical points, all on eager, 28 on vLLM; validator compares 50+ models. Do not show throughput numbers in the hero; they are B200-only and belong in the body.

Claim boundaries the visual must respect:

- The board is one block of one family (Gemma-2). Do not label it "every architecture".
- "Agrees" means the validator table marks the point ✅ for `google/gemma-2-2b` against `tlens_v2`, `tlens_v3` and `nnsight` (`validator/comparison/results/google/gemma-2-2b/0_result_details.md`). The board may show a check mark; it must not show a tolerance number.
- The mismatch row describes a naming difference, not a bug in TransformerLens. Use the words "same name, different tensor", never "wrong".

## Layout

Desktop (≥ 720px): a two-column board under the heading, max width about 880px.

- Left column, about 58% width: the block. A vertical spine (the residual stream) with three spine taps (`resid_pre`, `resid_mid`, `resid_post`). Two branches leave the spine to the right and return: **attention** and **MLP**. Each branch is drawn as `norm → sublayer → post norm → add`, with taps at `attn_in`/`mlp_in` (after the first norm), `attn_out`/`mlp_out` (raw sublayer output), and `attn_out_post`/`mlp_out_post` (after the post norm, just before the add). The two norms per branch are small labelled boxes; that is what makes the block a sandwich, and it is the visual reason the two names differ.
- Right column, about 42% width: a ledger titled `TransformerLens says`. One monospace row per translated tap, in stream order. Each row has a thin leader line to its tap on the left and a state glyph at the end: `✓` when it agrees.
- The argument row: `blocks.4.hook_mlp_out`. Its leader first points at `mlp_out` and its glyph shows `≠` with the small caption `same name, different tensor`. After a hold, the leader swings down to `mlp_out_post`, the glyph becomes `✓`, and the caption changes to `residual contribution`.
- Legend under the board: `34 points · one name each · checked against TransformerLens and nnsight`.

Mobile (< 720px): single column. The block spans the width; each tap's translation appears as a second line under the tap label instead of a separate ledger. The argument row keeps its two states, stacked.

Typography: tap labels and TL hook strings in `var(--font-mono)` at `var(--text-2xs)` to `var(--text-xs)`. Sublayer and norm boxes in the sans face. Two accent colours only: the section accent `var(--section-oss-radar)` for live taps and checks, `var(--color-link)` for TransformerLens strings. The mismatch state uses `var(--color-accent-rust)` if that token exists, otherwise a muted warning derived from the accent.

## Motion

Total sequence about 6.5 seconds, then hold. CSS animations only, `animation-fill-mode: both`, staggered by custom property delays like `BunFusionHero`.

| Time | State | What the reader learns |
|---:|---|---|
| 0.0 s | Heading and block outline visible; spine drawn; taps dim; ledger rows dim | the block shape and the two norms per branch |
| 0.3 s → 2.4 s | Taps light in forward order at 260 ms steps: `resid_pre`, `attn_in`, `attn_out`, `attn_out_post`, `resid_mid`, `mlp_in`, `mlp_out`, `mlp_out_post`, `resid_post`. A short pulse travels the spine with them | where hooks sit on a forward pass |
| 0.5 s → 2.6 s | Each ledger row fades in as its tap lights, leader line draws, `✓` appears | every point has one translation |
| 2.9 s | Argument row: leader draws to `mlp_out`, glyph `≠`, caption `same name, different tensor` | the trap |
| 4.1 s | Leader swings to `mlp_out_post`, glyph `✓`, caption `residual contribution` | the fix |
| 5.0 s | Legend fades in; hold | the scope |

Loop: no automatic loop on the page. The clip for X will be captured deterministically by seeking these animations, so the sequence must be pure CSS animation with fixed delays (no transitions triggered by JavaScript, no `animation-iteration-count: infinite` except a subtle spine pulse, which may loop).

Reduced motion (`prefers-reduced-motion: reduce`): render the final state with every tap lit, every `✓` shown, and the argument row in its resolved state with the caption `hook_mlp_out → mlp_out_post`. Nothing animates.

Accessibility: the board is a `figure role="img"` with an `aria-label` that states the claim in one sentence; inner nodes are `aria-hidden`.

## What the worker must not do

- No third accent colour, no glow, no particles, no grid backdrop beyond the `::before` treatment `BunFusionHero` already uses.
- No text smaller than `var(--text-2xs)`.
- Do not change shared styles or other components.
- Do not write body prose in the post; the post body is Fable's.

## Verification

- `pnpm typecheck`, `pnpm -C packages/blog build`, `git diff --check`.
- Playwright screenshots at 1280×900 and 390×844 of: initial frame (t=0), t=2.6 s, t=3.4 s (mismatch shown), t=5.5 s (final). Use `document.getAnimations()` and set `currentTime` on each animation after `document.fonts.ready`; do not rely on wall-clock timing.
- Check: no clipped identifiers, no wrapped hook strings on desktop, one `<h1>`, reduced-motion state renders the final board.
