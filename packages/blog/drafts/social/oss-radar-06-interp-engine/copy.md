# X thread copy (numbers rechecked against the live article, 2026-09-02; revised against the X baseline in metrics.md)

Thread of four posts. Every post is at or under 280 characters (X counts any URL as 23), so none is truncated behind "Show more". The first and last posts both appear on the profile: post 1 holds the clip and the link (the clip replaces the OG card), post 4 holds the call to action and the link again with no media, so the OG card renders there. Both profile-visible posts therefore have media.

## 1 — main claim + clip + link (shows on the profile; the clip replaces the OG card)

Length: 271 characters (URL counted as 23).

```text
Neuronpedia's server fed an SAE the wrong tensor. Nothing raised. It returned zeros.

On a Gemma-2 block, two tools give one hook name to two different tensors.

interp-engine is the maintainers' fix. I audited it and ran it on my M5 MacBook Pro.

https://gkoreli.com/oss-radar-06-interp-engine
```

Media: the preamble loop (MP4). Alt text from shot-list.md.

## 2 — personal stake

Length: 279 characters (URL counted as 23).

```text
My own research harness reads gemma-2-2b through TransformerLens on this Mac. Every number I have depends on reading the tensor I think I'm reading.

So I paired the names the naive way. Last-token cosine: 0.87 on layer 0, 0.80 to 0.90 on every layer I checked. On gpt2: 1.00000.
```

No media.

## 3 — surprising evidence

Length: 280 characters (URL counted as 23).

```text
Where the names mean the same tensor, interp-engine and TransformerLens agree to 5.3e-4 at fp32 on MPS. At fp16, against plain transformers hooks: bit-identical across 1,608 comparisons.

The speed claim is narrower. "40x" is eight concurrent requests on a B200. One stream: 6.9x.
```

No media.

## 4 — call to action + link (shows on the profile; no media attached, so the OG card renders)

Length: 280 characters (URL counted as 23).

```text
Use it in a CUDA serving stack, and use its hook-name mapper in any harness that consumes someone else's SAE or lens. Wait if you need gradients, patching, or a laptop speedup.

Which tensor is your SAE trained on, and how do you know?

Scripts and claims: https://gkoreli.com/oss-radar-06-interp-engine
```

No media. The link card is the media.

## Reply invitation

Post 4 ends on the one specific question. The baseline (metrics.md) shows the only originals with three or more replies asked something concrete; a generic "tell me what I got wrong" was dropped.

## After posting

One on-topic reply under the interp-engine announcement post with the parity result (5.3e-4 at fp32, bit-identical at fp16 on a Mac) and the fp16 loader crash. Replies to large accounts reach five to fifteen times an original on this account. No hashtags.
