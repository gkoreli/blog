# Launch brief: OSS Radar #06, interp-engine

Article: https://gkoreli.com/oss-radar-06-interp-engine (publishes 2026-09-02)
Title: interp-engine, Neuronpedia's New Interpretability Engine, Tested on a Mac

## Reader

People who read model internals for a living or as a hobby: SAE and steering researchers, TransformerLens and nnsight users, Neuronpedia users, and the maintainers themselves. Secondary: engineers who serve models with vLLM and have never seen an interpretability hook.

## Why a technically serious reader should care now

Neuronpedia's own server once fed a Gemma Scope SAE the wrong tensor because two tools give the same hook name to two different tensors on Gemma, and nothing raised. interp-engine, released two days ago, is the maintainers' answer; this article is the first outside audit and the first run of it on Apple Silicon.

## Breakout concept

claim → visual proof → reader consequence

- Claim: on a Gemma-2 block, `hook_mlp_out` names the post-norm contribution, not the raw MLP output; pair them naively and you get a tensor at cosine 0.87 that looks right and is wrong.
- Visual proof: the preamble animation, abstract by design (revision 2, after the owner rejected a labelled schematic). A sparse constellation behind the glass card; five links are twins, a blue and a rust strand from one node, that separate when the pulse passes and settle back with a hairline gap. The title carries the words; the motion carries the feeling that one line was two.
- Reader consequence: if you consume anyone else's hook names (an SAE, a transcoder, a lens), translate them through a model-aware mapper before you trust a number.

The number that carries the post is 0.87: the last-token cosine between the two tensors on gemma-2-2b layer 0 measured on my Mac (0.80 to 0.90 across the five layers checked), against 1.00000 on gpt2 for the same pairing.

## Evidence

- Research artifacts: packages/blog/drafts/research/interp-engine/ (audit, theory, adoption review, reproduction)
- Reproduction scripts and JSON: the `04` report and its linked results
- Maintainers' own account of the failure: docs/ENGINE_HOOK_MAPPINGS.md at commit 7471609

## Success signal

Qualified contact, not views: a reply or correction from the interp-engine or Neuronpedia maintainers; a reshare by anyone in the interpretability community; someone else running the reproduction scripts. Secondary: article visits from x.com and from the interpretability forums.

## Non-promises

No claim about speed on a Mac. No claim that TransformerLens is wrong or dormant. No claim that the field is switching engines.
