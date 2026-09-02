from __future__ import annotations

import statistics
import sys
import threading
import time
from typing import Callable

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
    synchronize,
    write_result,
)


PROMPT_SOURCE = (
    "The research team met beside the old harbor to review observations, compare careful notes, "
    "and decide which small experiments should be repeated before publishing the weekly summary. "
)
PROMPT_TOKENS = 128
NEW_TOKENS = 64
RUNS = 3


class MPSMemorySampler:
    def __init__(self) -> None:
        self.stop_event = threading.Event()
        self.peak_current = 0
        self.peak_driver = 0
        self.thread = threading.Thread(target=self._sample, daemon=True)

    def _sample(self) -> None:
        while not self.stop_event.is_set():
            self.peak_current = max(self.peak_current, int(torch.mps.current_allocated_memory()))
            self.peak_driver = max(self.peak_driver, int(torch.mps.driver_allocated_memory()))
            self.stop_event.wait(0.002)

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *_args):
        self.stop_event.set()
        self.thread.join()
        self._sample_once()

    def _sample_once(self) -> None:
        self.peak_current = max(self.peak_current, int(torch.mps.current_allocated_memory()))
        self.peak_driver = max(self.peak_driver, int(torch.mps.driver_allocated_memory()))


def exact_prompt_tokens(tokenizer, *, prepend_bos: bool) -> torch.Tensor:
    text = PROMPT_SOURCE * 20
    ids = tokenizer.encode(text, add_special_tokens=False)
    if prepend_bos:
        bos = tokenizer.bos_token_id
        if bos is None:
            raise ValueError("prepending BOS was requested but tokenizer has no bos_token_id")
        ids = [bos, *ids]
    if len(ids) < PROMPT_TOKENS:
        raise ValueError(f"prompt source produced only {len(ids)} tokens")
    return torch.tensor([ids[:PROMPT_TOKENS]], dtype=torch.long)


def timed_runs(fn: Callable[[], int]) -> dict:
    # One warm-up, excluded.
    warmup_tokens = fn()
    synchronize()
    observations = []
    for _ in range(RUNS):
        synchronize()
        with MPSMemorySampler() as memory:
            start = time.perf_counter()
            produced = fn()
            synchronize()
            elapsed = time.perf_counter() - start
        observations.append(
            {
                "label": "Reproduced",
                "elapsed_seconds": elapsed,
                "generated_tokens": produced,
                "tokens_per_second": produced / elapsed,
                "sampled_peak_current_allocated_bytes": memory.peak_current,
                "sampled_peak_driver_allocated_bytes": memory.peak_driver,
            }
        )
    return {
        "warmup_generated_tokens": warmup_tokens,
        "runs": observations,
        "median_tokens_per_second": statistics.median(x["tokens_per_second"] for x in observations),
        "peak_memory_method": "2 ms sampling of torch.mps current_allocated_memory and driver_allocated_memory",
        "max_sampled_peak_current_allocated_bytes": max(x["sampled_peak_current_allocated_bytes"] for x in observations),
        "max_sampled_peak_driver_allocated_bytes": max(x["sampled_peak_driver_allocated_bytes"] for x in observations),
    }


def bench_interp(snapshot, spec: dict, layer: int) -> dict:
    from interp_engine import Address, capture_generation

    model = load_interp(snapshot)
    tokens = exact_prompt_tokens(model.tokenizer, prepend_bos=True).to(DEVICE)

    def run() -> int:
        completion, cache = capture_generation(
            model,
            tokens,
            [Address("resid_post", layer)],
            max_tokens=NEW_TOKENS,
            temperature=0.0,
            seed=SEED,
        )
        rows = cache[Address("resid_post", layer)].shape[1]
        if rows != PROMPT_TOKENS + len(completion.token_ids) - 1:
            raise AssertionError(f"unexpected capture rows {rows}")
        return len(completion.token_ids)

    data = timed_runs(run)
    data.update(
        {
            "implementation": "interp-engine eager capture_generation",
            "capture_semantics": "generate, then one full recapture forward over prompt + generated[:-1]",
            "capture_point": f"resid_post.{layer}",
        }
    )
    release(model, tokens)
    return data


def bench_tlens(snapshot, spec: dict, layer: int) -> dict:
    model = load_tlens(snapshot, spec["tl_name"])
    tokens = exact_prompt_tokens(model.tokenizer, prepend_bos=True).to(DEVICE)
    hook_name = f"blocks.{layer}.hook_resid_post"

    def run() -> int:
        captured = []

        def cache_hook(activation, hook=None):
            captured.append(activation.detach().clone())
            return activation

        with model.hooks(fwd_hooks=[(hook_name, cache_hook)]):
            generated = model.generate(
                tokens,
                max_new_tokens=NEW_TOKENS,
                do_sample=False,
                stop_at_eos=False,
                use_past_kv_cache=True,
                return_type="tokens",
                verbose=False,
            )
        if sum(x.shape[1] for x in captured) != PROMPT_TOKENS + NEW_TOKENS - 1:
            raise AssertionError("TransformerLens caching hook saw an unexpected number of rows")
        return int(generated.shape[1] - tokens.shape[1])

    data = timed_runs(run)
    data.update(
        {
            "implementation": "TransformerLens generate with a forward caching hook",
            "capture_semantics": "capture prompt prefill and each generated position during KV-cached decoding",
            "capture_point": hook_name,
        }
    )
    release(model, tokens)
    return data


def bench_transformers(snapshot, spec: dict) -> dict:
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(snapshot, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(
        snapshot,
        local_files_only=True,
        dtype=torch.float32,
        attn_implementation="eager",
    ).to(DEVICE)
    model.eval()
    tokens = exact_prompt_tokens(tokenizer, prepend_bos=True).to(DEVICE)
    pad = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id

    def run() -> int:
        with torch.inference_mode():
            generated = model.generate(
                tokens,
                max_new_tokens=NEW_TOKENS,
                min_new_tokens=NEW_TOKENS,
                do_sample=False,
                use_cache=True,
                pad_token_id=pad,
            )
        return int(generated.shape[1] - tokens.shape[1])

    data = timed_runs(run)
    data.update(
        {
            "implementation": "plain transformers generate",
            "capture_semantics": "no hooks and no activation capture",
            "capture_point": None,
        }
    )
    release(model, tokens)
    return data


def measure_model(label: str, spec: dict) -> dict:
    snapshot, revision = snapshot_for(spec)
    layer = spec["steer_layer"]
    return {
        "status": "completed",
        "requested_id": spec["requested_id"],
        "offline_snapshot": str(snapshot),
        "revision": revision,
        "prompt_tokens": PROMPT_TOKENS,
        "requested_new_tokens": NEW_TOKENS,
        "warmups": 1,
        "measured_runs": RUNS,
        "capture_layer": layer,
        "interp_engine_eager": bench_interp(snapshot, spec, layer),
        "transformer_lens": bench_tlens(snapshot, spec, layer),
        "plain_transformers": bench_transformers(snapshot, spec),
    }


def main() -> int:
    result = base_result("throughput_mps")
    try:
        require_offline_mps()
        set_determinism()
    except Exception as exc:
        result["status"] = "blocked"
        result["errors"].append(error_record(exc, stage="device_preflight"))
        write_result("throughput_mps.json", result)
        return 2
    for label, spec in MODEL_SPECS.items():
        try:
            result["models"][label] = measure_model(label, spec)
        except Exception as exc:
            result["models"][label] = {"status": "failed"}
            result["errors"].append(error_record(exc, stage="throughput_mps", model=label))
    result["status"] = "completed" if not result["errors"] else "partial"
    write_result("throughput_mps.json", result)
    return 0 if result["status"] == "completed" else 1


if __name__ == "__main__":
    sys.exit(main())
