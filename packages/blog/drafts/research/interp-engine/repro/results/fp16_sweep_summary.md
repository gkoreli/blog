# fp16 eager parity sweep

Status: **completed** · Overall verdict: **FAIL**

| Model | Points × layers coverage | Worst max-abs | Worst min-cosine | Mean cosine | Non-finite (IE/plain) | Generation match | Median tok/s (IE/plain, 512) | Peak Metal driver (IE/plain) | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| gemma-2-2b | 67 addresses; 1608/1608 rows | 0 | 1 | 1 | 8290 / 8290 | 24/24 | 4.129 / 7.874 | 13.33 GiB / 13.34 GiB | FAIL |
| gpt2 | 63 addresses; 1008/1008 rows | 0 | 1 | 1 | 339272 / 339272 | 16/16 | 34.88 / 44.49 | 1.62 GiB / 1.62 GiB | FAIL |

Pass marks: exact shape and same dtype for every row; max absolute error ≤ 0.002; mean cosine ≥ 0.9999; every token-position cosine ≥ 0.99; zero non-finite values; and exact IDs for all generated tokens.

Plain-side recompute: only `attn_scores`, from the Q/K tensors passed to Transformers' documented eager-attention interface after RoPE/cache update. The recompute applies the family call's scale, grouped-query expansion, Gemma softcap, and additive mask. `attn_probs` is the tensor returned by that family eager implementation; all other points are module I/O hooks.

Scoped deviations:

- gemma-2-2b: interp-engine load_model(device='mps', dtype='float16') hands transformers device_map='mps'; on this machine (torch 2.13.0, transformers 5.14.1, macOS 26.5.2, Apple M5) that streamed bf16->fp16 load segfaults in transformers core_model_loading._materialize_copy (or hangs). The sweep therefore loads interp-engine's eager model on CPU in float16 and moves hf_model to MPS afterwards; EagerModel.device derives from the parameters, so capture and generation then run on MPS. The fp32 direct-to-MPS path used by the earlier scripts was unaffected.
- gpt2: interp-engine load_model(device='mps', dtype='float16') hands transformers device_map='mps'; on this machine (torch 2.13.0, transformers 5.14.1, macOS 26.5.2, Apple M5) that streamed bf16->fp16 load segfaults in transformers core_model_loading._materialize_copy (or hangs). The sweep therefore loads interp-engine's eager model on CPU in float16 and moves hf_model to MPS afterwards; EagerModel.device derives from the parameters, so capture and generation then run on MPS. The fp32 direct-to-MPS path used by the earlier scripts was unaffected.
- gpt2: GPT-2's 1024-position checkpoint cannot run a 2048-token control without changing the model; that length is excluded.
