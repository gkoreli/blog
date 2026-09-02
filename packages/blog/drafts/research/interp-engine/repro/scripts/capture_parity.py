from __future__ import annotations

import sys

import torch

from common import (
    DEVICE,
    MODEL_SPECS,
    base_result,
    error_record,
    load_interp,
    load_tlens,
    release,
    require_offline_mps,
    set_determinism,
    snapshot_for,
    tensor_metrics,
    write_result,
)


PROMPT = (
    "On a quiet autumn morning, the small library opened early while neighbors gathered "
    "to read, share coffee, and discuss plans for the coming week."
)
# HookedTransformer (TransformerLens v2 class, still the default in 3.x) exposes the
# block-level hook_attn_out / hook_mlp_out AFTER Gemma-2's post-sublayer norms
# (transformer_block.py: "we do it before the hook so hook_attn_out captures that
# which is added"). Those are interp-engine's *_post contribution points. The raw
# module outputs have no HookPoint in this class; `attn.hook_out` / `mlp.hook_out`
# exist only on the v3 TransformerBridge.
POINT_TO_TL = {
    "resid_post": "blocks.{layer}.hook_resid_post",
    "resid_mid": "blocks.{layer}.hook_resid_mid",
    "attn_out_post": "blocks.{layer}.hook_attn_out",
    "mlp_out_post": "blocks.{layer}.hook_mlp_out",
}
# Deliberately naive pairings: the raw module output against the block-level TL
# name. On gpt2 (no post-sublayer norm) these must agree; on gemma-2-2b they must not.
NAIVE_PAIRINGS = {
    "mlp_out": "blocks.{layer}.hook_mlp_out",
    "attn_out": "blocks.{layer}.hook_attn_out",
}


def measure_model(label: str, spec: dict) -> dict:
    from interp_engine import Address, run_with_cache

    snapshot, revision = snapshot_for(spec)
    addresses = [Address(point, layer) for layer in spec["layers"] for point in [*POINT_TO_TL, *NAIVE_PAIRINGS]]
    interp = load_interp(snapshot)
    tokens = interp.to_tokens(PROMPT).to(DEVICE)
    with torch.inference_mode():
        ie_cache = run_with_cache(interp, tokens, addresses)
    ie_tensors = {str(address): ie_cache[address].float().cpu() for address in addresses}
    token_ids = tokens.cpu()
    tokenizer_name = type(interp.tokenizer).__name__
    release(interp, ie_cache, tokens)

    tlens = load_tlens(snapshot, spec["tl_name"])
    names = [template.format(layer=layer) for layer in spec["layers"] for template in POINT_TO_TL.values()]
    with torch.inference_mode():
        _, tl_cache = tlens.run_with_cache(token_ids.to(DEVICE), names_filter=names)

    rows = []
    for layer in spec["layers"]:
        for point, template in POINT_TO_TL.items():
            address = f"{point}.{layer}"
            tl_name = template.format(layer=layer)
            row = {
                "label": "Reproduced",
                "layer": layer,
                "point": point,
                "transformer_lens_hook": tl_name,
                "mapping_caveat": None,
                **tensor_metrics(ie_tensors[address], tl_cache[tl_name]),
            }
            rows.append(row)

    wrong_pairing = []
    for layer in spec["layers"]:
        for point, template in NAIVE_PAIRINGS.items():
            wrong = template.format(layer=layer)
            wrong_pairing.append(
                {
                    "label": "Reproduced",
                    "layer": layer,
                    "interp_point": point,
                    "transformer_lens_hook": wrong,
                    "mapping_caveat": (
                        "Naive pairing: TL block-level hook fires after the post-sublayer norm on "
                        "Gemma-2 (residual contribution); interp raw point is the module output. "
                        "Expected to agree on gpt2 and to differ on gemma-2-2b."
                    ),
                    **tensor_metrics(ie_tensors[f"{point}.{layer}"], tl_cache[wrong]),
                }
            )
    release(tlens, tl_cache)
    return {
        "status": "completed",
        "requested_id": spec["requested_id"],
        "offline_snapshot": str(snapshot),
        "revision": revision,
        "tokenizer_class": tokenizer_name,
        "prompt": PROMPT,
        "prompt_token_count_with_bos": int(token_ids.shape[1]),
        "layers": spec["layers"],
        "rows": rows,
        "naive_pairings": wrong_pairing,
    }


def main() -> int:
    result = base_result("capture_parity")
    try:
        require_offline_mps()
        set_determinism()
    except Exception as exc:
        result["status"] = "blocked"
        result["errors"].append(error_record(exc, stage="device_preflight"))
        write_result("capture_parity.json", result)
        return 2

    for label, spec in MODEL_SPECS.items():
        try:
            result["models"][label] = measure_model(label, spec)
        except Exception as exc:
            result["models"][label] = {"status": "failed"}
            result["errors"].append(error_record(exc, stage="capture_parity", model=label))
    result["status"] = "completed" if not result["errors"] else "partial"
    write_result("capture_parity.json", result)
    return 0 if result["status"] == "completed" else 1


if __name__ == "__main__":
    sys.exit(main())

