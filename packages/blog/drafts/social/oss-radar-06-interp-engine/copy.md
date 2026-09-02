# X thread copy (draft; numbers to be rechecked against the published article)

Thread of four posts. Post 1 carries the clip and the link. Character counts to verify against X's ordinary limit before posting.

## 1 — main claim + media + link

```text
On a Gemma-2 block, TransformerLens's hook_mlp_out and the raw MLP output are two different tensors with one name.

Neuronpedia's server once fed a Gemma Scope SAE the wrong one. Nothing raised. The SAE returned zeros.

I audited interp-engine, their new engine, and ran it on my Mac.

https://gkoreli.com/oss-radar-06-interp-engine
```

Media: the preamble loop (MP4). Alt text from shot-list.md.

## 2 — personal stake

```text
I care because my own research harness reads gemma-2-2b through TransformerLens on Apple Silicon. Every number I have depends on reading the tensor I think I'm reading.

So I paired the names the naive way on my machine. Last-token cosine on layer 4: 0.87. On gpt2, the same pairing: 1.00000.
```

## 3 — surprising evidence

```text
Where the names mean the same tensor, interp-engine's eager backend and TransformerLens agree to 5e-4 at fp32 on MPS, across 40 comparisons.

The speed claim is a different story: "40x" is eight concurrent requests on a B200 with fixed taps. One stream is 6.9x. On a Mac you get the parity table, not the speed.
```

## 4 — bounded verdict

```text
Verdict: use it in a CUDA serving stack, and use its hook-name mapper in any harness that consumes someone else's SAE or lens. Wait if you need gradients, patching, or a laptop speedup.

Reproduction scripts and the claim table are in the article. Tell me what I got wrong.
```

Optional 5: bare link so X renders the page card. Only if post 1's card fails to render.

## Reply invitation

"Which tensor is your SAE trained on, and how do you know?" folded into post 4 as "Tell me what I got wrong." Keep one question, not two.
