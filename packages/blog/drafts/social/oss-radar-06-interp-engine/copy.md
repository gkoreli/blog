# X thread copy (numbers rechecked against the live article, 2026-09-02; revised against the X baseline in metrics.md)

Thread of four posts. Post 1 carries the clip and the link. Character counts to verify against X's ordinary limit before posting.

## 1 — main claim + media + link

```text
Neuronpedia's server fed a Gemma Scope SAE the wrong tensor for a while. Nothing raised. The SAE returned zeros.

The cause: on a Gemma-2 block, two tools give one hook name (hook_mlp_out) to two different tensors.

interp-engine is the maintainers' fix. I audited the code and ran it on my M5 MacBook Pro.

https://gkoreli.com/oss-radar-06-interp-engine
```

Media: the preamble loop (MP4). Alt text from shot-list.md.

## 2 — personal stake

```text
My own research harness reads gemma-2-2b through TransformerLens on this Mac. Every number I have depends on reading the tensor I think I'm reading.

So I paired the names the naive way. Last-token cosine on layer 0: 0.87, and between 0.80 and 0.90 on every layer I checked. Same pairing on gpt2: 1.00000. A tensor that looks right and is wrong.
```

## 3 — surprising evidence

```text
Where the names mean the same tensor, interp-engine's eager backend and TransformerLens agree to 5.3e-4 at fp32 on MPS. At fp16, against plain transformers hooks, it matched bit for bit across 1,608 comparisons and 24 generations.

The speed claim is a different story: "40x" is eight concurrent requests on a B200 with fixed taps. One stream is 6.9x. On a Mac you get the parity table, not the speed.
```

## 4 — bounded verdict

```text
Use it in a CUDA serving stack, and use its hook-name mapper in any harness that consumes someone else's SAE or lens. Wait if you need gradients, patching, or a laptop speedup.

Scripts and the claim table are in the article. Which tensor is your SAE trained on, and how do you know?
```

Optional 5: bare link so X renders the page card. Only if post 1's card fails to render.

## Reply invitation

Post 4 ends on the one specific question. The baseline (metrics.md) shows the only originals with three or more replies asked something concrete; a generic "tell me what I got wrong" was dropped.

## After posting

One on-topic reply under the interp-engine announcement post with the parity result (5.3e-4 at fp32, bit-identical at fp16 on a Mac) and the fp16 loader crash. Replies to large accounts reach five to fifteen times an original on this account. No hashtags.
