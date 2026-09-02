from __future__ import annotations

import sys

import torch

from common import (
    DEVICE,
    MODEL_SPECS,
    SEED,
    base_result,
    error_record,
    load_interp,
    load_tlens,
    release,
    require_offline_mps,
    set_determinism,
    snapshot_for,
    write_result,
)


FRAME = "The reader described the emotional tone of the story as {word}"
CONTRAST_WORDS = [
    ("wonderful", "terrible"),
    ("joyful", "miserable"),
    ("hopeful", "hopeless"),
    ("delightful", "awful"),
    ("uplifting", "depressing"),
    ("pleasant", "horrible"),
]
PROMPT = "After reading the detailed review, my overall reaction is"
MULTIPLIER = 4.0
N_GENERATED = 20


def build_vector(interp, layer: int) -> tuple[torch.Tensor, list[dict]]:
    from interp_engine import Address, run_with_cache

    point = Address("resid_post", layer)
    differences = []
    details = []
    for positive, negative in CONTRAST_WORDS:
        pos_text, neg_text = FRAME.format(word=positive), FRAME.format(word=negative)
        pos_tokens, neg_tokens = interp.to_tokens(pos_text).to(DEVICE), interp.to_tokens(neg_text).to(DEVICE)
        with torch.inference_mode():
            pos = run_with_cache(interp, pos_tokens, [point])[point][0, -1].float().cpu()
            neg = run_with_cache(interp, neg_tokens, [point])[point][0, -1].float().cpu()
        differences.append(pos - neg)
        details.append(
            {
                "positive": pos_text,
                "negative": neg_text,
                "positive_tokens_with_bos": int(pos_tokens.shape[1]),
                "negative_tokens_with_bos": int(neg_tokens.shape[1]),
            }
        )
    return torch.stack(differences).mean(dim=0), details


def interp_outputs(interp, prompt_tokens: torch.Tensor, vector: torch.Tensor, layer: int) -> dict:
    from interp_engine import AddSpec, LayerSteeringSpec, SteeringSpec, generate_stream, steer

    spec = SteeringSpec(
        layers={layer: LayerSteeringSpec(operations=[AddSpec(vector=vector, scale=MULTIPLIER)])},
        point="resid_post",
    )
    prompt_len = int(prompt_tokens.shape[1])
    excluded = list(range(prompt_len - 1))
    with torch.inference_mode():
        baseline = interp.hf_model(prompt_tokens).logits[0, -1].float().cpu()
    # A fresh context is important because the eager mask tracks consumed positions.
    with steer(interp, spec, prompt_token_ids=prompt_tokens, position_mask=excluded):
        with torch.inference_mode():
            logits = interp.hf_model(prompt_tokens).logits[0, -1].float().cpu()
    with steer(interp, spec, prompt_token_ids=prompt_tokens, position_mask=excluded):
        steps = list(
            generate_stream(
                interp,
                prompt_tokens,
                max_tokens=N_GENERATED,
                temperature=0.0,
                stop_at_eos=False,
                seed=SEED,
            )
        )
    ids = [step.token_id for step in steps]
    return {
        "baseline_logits": baseline,
        "steered_logits": logits,
        "argmax_token_id": int(logits.argmax()),
        "generated_token_ids": ids,
        "generated_text": interp.tokenizer.decode(ids, clean_up_tokenization_spaces=False),
        "position_mask_semantics": "excluded prompt positions [0, prompt_len-2]; final prompt token and all generated positions steered",
        "excluded_positions": excluded,
    }


def make_tlens_add_hook(vector: torch.Tensor, prompt_len: int):
    consumed = 0
    delta = (MULTIPLIER * vector).to(DEVICE, torch.float32)

    def hook_fn(activation: torch.Tensor, hook=None):
        nonlocal consumed
        seq = activation.shape[1]
        absolute = torch.arange(consumed, consumed + seq, device=activation.device)
        keep = (absolute >= prompt_len - 1).to(activation.dtype).view(1, seq, 1)
        consumed += seq
        return activation + keep * delta.to(activation.dtype)

    return hook_fn


def tlens_outputs(tlens, prompt_tokens: torch.Tensor, vector: torch.Tensor, layer: int) -> dict:
    hook_name = f"blocks.{layer}.hook_resid_post"
    tokens = prompt_tokens.to(DEVICE)
    with torch.inference_mode():
        baseline = tlens(tokens, return_type="logits")[0, -1].float().cpu()
    with tlens.hooks(fwd_hooks=[(hook_name, make_tlens_add_hook(vector, tokens.shape[1]))]):
        with torch.inference_mode():
            logits = tlens(tokens, return_type="logits")[0, -1].float().cpu()
    with tlens.hooks(fwd_hooks=[(hook_name, make_tlens_add_hook(vector, tokens.shape[1]))]):
        with torch.inference_mode():
            generated = tlens.generate(
                tokens,
                max_new_tokens=N_GENERATED,
                do_sample=False,
                stop_at_eos=False,
                use_past_kv_cache=True,
                return_type="tokens",
                verbose=False,
            )
    ids = generated[0, tokens.shape[1] :].tolist()
    return {
        "baseline_logits": baseline,
        "steered_logits": logits,
        "argmax_token_id": int(logits.argmax()),
        "generated_token_ids": ids,
        "generated_text": tlens.tokenizer.decode(ids, clean_up_tokenization_spaces=False),
        "hook": hook_name,
    }


def logits_metrics(left: torch.Tensor, right: torch.Tensor) -> dict:
    diff = (left - right).abs()
    return {
        "max_abs_diff": float(diff.max()),
        "mean_abs_diff": float(diff.mean()),
        "argmax_equal": bool(left.argmax().item() == right.argmax().item()),
        "interp_argmax_token_id": int(left.argmax()),
        "transformer_lens_argmax_token_id": int(right.argmax()),
    }


def measure_model(label: str, spec: dict) -> dict:
    snapshot, revision = snapshot_for(spec)
    layer = spec["steer_layer"]
    interp = load_interp(snapshot)
    prompt_tokens = interp.to_tokens(PROMPT).to(DEVICE)
    vector, pairs = build_vector(interp, layer)
    ie = interp_outputs(interp, prompt_tokens, vector, layer)
    token_ids = prompt_tokens.cpu()
    release(interp, prompt_tokens)

    tlens = load_tlens(snapshot, spec["tl_name"])
    tl = tlens_outputs(tlens, token_ids, vector, layer)
    release(tlens)
    shared_prefix = 0
    for a, b in zip(ie["generated_token_ids"], tl["generated_token_ids"], strict=False):
        if a != b:
            break
        shared_prefix += 1
    comparison = {
        "label": "Reproduced",
        "next_token_steered_logits": logits_metrics(ie["steered_logits"], tl["steered_logits"]),
        "next_token_unsteered_logits": logits_metrics(ie["baseline_logits"], tl["baseline_logits"]),
        "generated_tokens_exact_equal": ie["generated_token_ids"] == tl["generated_token_ids"],
        "generated_shared_prefix_tokens": shared_prefix,
    }
    for payload in (ie, tl):
        payload.pop("baseline_logits")
        payload.pop("steered_logits")
    return {
        "status": "completed",
        "requested_id": spec["requested_id"],
        "offline_snapshot": str(snapshot),
        "revision": revision,
        "point": "resid_post",
        "layer": layer,
        "prompt": PROMPT,
        "prompt_tokens_with_bos": int(token_ids.shape[1]),
        "contrast_frame": FRAME,
        "contrast_pairs": pairs,
        "vector_definition": "mean over six (positive final-token resid_post - negative final-token resid_post) vectors from interp-engine eager",
        "vector_norm": float(torch.linalg.vector_norm(vector)),
        "multiplier": MULTIPLIER,
        "delta_norm": float(torch.linalg.vector_norm(MULTIPLIER * vector)),
        "mask_exactly_expressible": True,
        "interp_engine": ie,
        "transformer_lens": tl,
        "comparison": comparison,
    }


def main() -> int:
    result = base_result("steering_parity")
    try:
        require_offline_mps()
        set_determinism()
    except Exception as exc:
        result["status"] = "blocked"
        result["errors"].append(error_record(exc, stage="device_preflight"))
        write_result("steering_parity.json", result)
        return 2
    for label, spec in MODEL_SPECS.items():
        try:
            result["models"][label] = measure_model(label, spec)
        except Exception as exc:
            result["models"][label] = {"status": "failed"}
            result["errors"].append(error_record(exc, stage="steering_parity", model=label))
    result["status"] = "completed" if not result["errors"] else "partial"
    write_result("steering_parity.json", result)
    return 0 if result["status"] == "completed" else 1


if __name__ == "__main__":
    sys.exit(main())

