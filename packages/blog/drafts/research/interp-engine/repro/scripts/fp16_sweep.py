from __future__ import annotations

import argparse
import gc
import json
import math
import os
import random
import statistics
import sys
import threading
import time
import traceback
from contextlib import AbstractContextManager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable

import torch

from common import BASELINE_SHA, MODEL_SPECS, RESULTS, SEED, snapshot_for, versions


THRESHOLDS = {
    "mean_cosine_min": 0.9999,
    "max_abs_diff_max": 0.002,
    "individual_position_cosine_min": 0.99,
    "generated_token_ids_exact": True,
    "nonfinite_values_allowed": 0,
}
FULL_SETTINGS = {
    "device": "mps",
    "dtype": "float16",
    "prompt_lengths": [64, 512, 2048],
    "prompts_per_length": 8,
    "new_tokens": 32,
    "models": {
        "gemma-2-2b": {"layers": [0, 13, 19, 25]},
        "gpt2": {"layers": [0, 3, 6, 11]},
    },
}
SMOKE_SETTINGS = {
    "device": "cpu",
    "dtype": "float32",
    "prompt_lengths": [16, 32],
    "prompts_per_length": 2,
    "new_tokens": 2,
    "models": {"gpt2": {"layers": [0, 1]}},
}
ATTENTION_MATRIX_POINTS = frozenset({"attn_scores", "attn_probs"})

# Public-domain source: short excerpts/adaptations from Austen, Carroll, Dickens,
# Melville, the King James Bible, and the United States Declaration of Independence.
# Keeping the text here makes prompt construction entirely offline and reproducible.
PUBLIC_DOMAIN_TEXT = (
    "It is a truth universally acknowledged, that a single man in possession of a good fortune, "
    "must be in want of a wife. However little known the feelings or views of such a man may be on "
    "his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding "
    "families, that he is considered as the rightful property of some one or other of their daughters.",
    "Alice was beginning to get very tired of sitting by her sister on the bank, and of having "
    "nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no "
    "pictures or conversations in it, and what is the use of a book, thought Alice, without either?",
    "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age "
    "of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season "
    "of light, it was the season of darkness, it was the spring of hope, it was the winter of despair.",
    "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my "
    "purse, and nothing particular to interest me on shore, I thought I would sail about a little "
    "and see the watery part of the world.",
    "To every thing there is a season, and a time to every purpose under the heaven: a time to be "
    "born, and a time to die; a time to plant, and a time to pluck up that which is planted.",
    "We hold these truths to be self-evident, that all people are created equal, that they are "
    "endowed with certain unalienable rights, that among these are life, liberty, and the pursuit "
    "of happiness; and that governments derive their just powers from the consent of the governed.",
)


class BlockedError(RuntimeError):
    pass


def now() -> str:
    return datetime.now(UTC).isoformat()


def address_key(point: str, layer: int | None) -> str:
    return point if layer is None else f"{point}.{layer}"


def sync(device: str) -> None:
    if device == "mps":
        torch.mps.synchronize()


def clear_working_memory(device: str) -> None:
    gc.collect()
    if device == "mps":
        torch.mps.empty_cache()


class MemorySampler(AbstractContextManager):
    """Sample process-wide MPS allocation while one operation runs."""

    def __init__(self, device: str) -> None:
        self.device = device
        self.stop_event = threading.Event()
        self.peak_current = 0
        self.peak_driver = 0
        self.thread: threading.Thread | None = None

    def _sample_once(self) -> None:
        if self.device != "mps":
            return
        self.peak_current = max(self.peak_current, int(torch.mps.current_allocated_memory()))
        self.peak_driver = max(self.peak_driver, int(torch.mps.driver_allocated_memory()))

    def _sample(self) -> None:
        while not self.stop_event.is_set():
            self._sample_once()
            self.stop_event.wait(0.002)

    def __enter__(self) -> "MemorySampler":
        if self.device == "mps":
            self.thread = threading.Thread(target=self._sample, daemon=True)
            self.thread.start()
        return self

    def __exit__(self, *_args: object) -> None:
        if self.thread is not None:
            self.stop_event.set()
            self.thread.join()
            self._sample_once()


def build_prompts(tokenizer: Any, length: int, count: int, *, model_offset: int) -> list[torch.Tensor]:
    bos = tokenizer.bos_token_id
    if bos is None:
        raise BlockedError(f"{type(tokenizer).__name__} has no BOS token id")
    prompts: list[torch.Tensor] = []
    for prompt_index in range(count):
        rng = random.Random(SEED + model_offset * 100_003 + length * 101 + prompt_index)
        passages = list(PUBLIC_DOMAIN_TEXT)
        pieces: list[str] = []
        # Different deterministic passage orders and harmless separators prevent all eight
        # prompts from being prefixes of one repeated corpus.
        while len(pieces) < max(24, length // 20):
            rng.shuffle(passages)
            for passage in passages:
                pieces.append(passage)
                pieces.append(f" Section {rng.randrange(1, 10_000)}. ")
        ids = tokenizer.encode(" ".join(pieces), add_special_tokens=False)
        while len(ids) < length - 1:
            ids.extend(ids)
        exact = [int(bos), *[int(x) for x in ids[: length - 1]]]
        if len(exact) != length:
            raise AssertionError(f"built {len(exact)} tokens, expected {length}")
        prompts.append(torch.tensor([exact], dtype=torch.long))
    return prompts


def nonfinite_counts(tensor: torch.Tensor) -> dict[str, int]:
    t = tensor.detach()
    if not (t.is_floating_point() or t.is_complex()):
        return {"nan": 0, "posinf": 0, "neginf": 0, "total": 0}
    nan = int(torch.isnan(t).sum().item())
    posinf = int(torch.isposinf(t).sum().item())
    neginf = int(torch.isneginf(t).sum().item())
    return {"nan": nan, "posinf": posinf, "neginf": neginf, "total": nan + posinf + neginf}


def position_vectors(tensor: torch.Tensor, point: str) -> torch.Tensor:
    """Return [batch * token-position, feature] for the cosine requirements."""
    if point in ATTENTION_MATRIX_POINTS:
        # Canonical scores/probs are [batch, heads, query, key]. A position is one
        # query token and its vector is every head/key entry at that query.
        if tensor.ndim != 4:
            raise ValueError(f"{point} should be rank 4, got {tuple(tensor.shape)}")
        tensor = tensor.permute(0, 2, 1, 3)
        return tensor.reshape(tensor.shape[0] * tensor.shape[1], -1)
    if tensor.ndim < 2:
        raise ValueError(f"{point} should include batch and token axes, got {tuple(tensor.shape)}")
    return tensor.reshape(tensor.shape[0] * tensor.shape[1], -1)


def tensor_metrics(interp_tensor: torch.Tensor, plain_tensor: torch.Tensor, point: str) -> dict[str, Any]:
    a = interp_tensor.detach().cpu()
    b = plain_tensor.detach().cpu()
    interp_nf = nonfinite_counts(a)
    plain_nf = nonfinite_counts(b)
    result: dict[str, Any] = {
        "interp_shape": list(a.shape),
        "plain_shape": list(b.shape),
        "shape_equal": tuple(a.shape) == tuple(b.shape),
        "interp_dtype": str(a.dtype).removeprefix("torch."),
        "plain_dtype": str(b.dtype).removeprefix("torch."),
        "interp_nonfinite": interp_nf,
        "plain_nonfinite": plain_nf,
        "max_abs_diff": None,
        "mean_cosine": None,
        "min_position_cosine": None,
        "position_count": 0,
    }
    if not result["shape_equal"]:
        return result
    if interp_nf["total"] or plain_nf["total"]:
        return result
    af = a.to(torch.float64)
    bf = b.to(torch.float64)
    result["max_abs_diff"] = float((af - bf).abs().max().item())
    av = position_vectors(af, point)
    bv = position_vectors(bf, point)
    an = torch.linalg.vector_norm(av, dim=-1)
    bn = torch.linalg.vector_norm(bv, dim=-1)
    denom = an * bn
    dots = (av * bv).sum(dim=-1)
    cosines = torch.empty_like(dots)
    nonzero = denom > 0
    cosines[nonzero] = dots[nonzero] / denom[nonzero]
    both_zero = (an == 0) & (bn == 0)
    cosines[both_zero] = 1.0
    cosines[~nonzero & ~both_zero] = 0.0
    result["position_count"] = int(cosines.numel())
    result["mean_cosine"] = float(cosines.mean().item())
    result["min_position_cosine"] = float(cosines.min().item())
    return result


INTERP_LOAD_DEVIATION = (
    "interp-engine load_model(device='mps', dtype='float16') hands transformers device_map='mps'; on this machine "
    "(torch 2.13.0, transformers 5.14.1, macOS 26.5.2, Apple M5) that streamed bf16->fp16 load segfaults in "
    "transformers core_model_loading._materialize_copy (or hangs). The sweep therefore loads interp-engine's eager "
    "model on CPU in float16 and moves hf_model to MPS afterwards; EagerModel.device derives from the parameters, so "
    "capture and generation then run on MPS. The fp32 direct-to-MPS path used by the earlier scripts was unaffected."
)


def load_interp_model(snapshot: Path, *, device: str, dtype_name: str) -> Any:
    from interp_engine import load_model

    if device == "mps" and dtype_name == "float16":
        model = load_model(
            str(snapshot),
            backend="eager",
            device="cpu",
            dtype=dtype_name,
            attn_implementation="eager",
            model_kwargs={"local_files_only": True},
        )
        model.hf_model.to(device)
        return model
    return load_model(
        str(snapshot),
        backend="eager",
        device=device,
        dtype=dtype_name,
        attn_implementation="eager",
        model_kwargs={"local_files_only": True},
    )


def load_plain_model(snapshot: Path, *, device: str, dtype: torch.dtype) -> Any:
    from transformers import AutoModelForCausalLM

    model = AutoModelForCausalLM.from_pretrained(
        snapshot,
        local_files_only=True,
        dtype=dtype,
        attn_implementation="eager",
    ).to(device)
    model.eval()
    model.requires_grad_(False)
    return model


def release_model(model: Any, *, device: str) -> None:
    if model is not None:
        module = getattr(model, "hf_model", model)
        try:
            module.to("cpu")
        except (AttributeError, RuntimeError, TypeError):
            pass
    clear_working_memory(device)


def enumerate_applicable(interp: Any, layers: list[int]) -> tuple[list[tuple[str, int | None]], list[dict[str, Any]]]:
    """Use model.points(), then resolution, to distinguish declared from applicable points."""
    applicable: list[tuple[str, int | None]] = []
    excluded: list[dict[str, Any]] = []
    for spec in interp.points():
        targets: list[int | None] = [None] if spec.scope.value == "global" else list(layers)
        for layer in targets:
            try:
                if spec.name in ATTENTION_MATRIX_POINTS:
                    assert layer is not None
                    if interp.arch.is_linear_attention_layer(layer):
                        raise ValueError("this layer does not compute softmax attention")
                    interp.arch.attn_module(layer)
                else:
                    interp.resolve_point(spec.name, layer)
            except Exception as exc:
                excluded.append(
                    {
                        "point": spec.name,
                        "layer": layer,
                        "address": address_key(spec.name, layer),
                        "reason": str(exc),
                    }
                )
            else:
                applicable.append((spec.name, layer))
    return applicable, excluded


class PlainAttentionCapture(AbstractContextManager):
    """Wrap Transformers' documented eager-attention registry for scores/probs.

    Q/K arrive here after RoPE (and after any cache update), so scores can be
    independently recomputed with the same scaling, GQA expansion, softcap, and mask.
    The family eager implementation remains responsible for the real forward and supplies
    attn_probs. No interp-engine helper is used on this side.
    """

    IMPLEMENTATION = "gkoreli_plain_fp16_sweep"

    def __init__(self, model: Any, layer_modules: dict[int, Any], wanted_layers: set[int]) -> None:
        self.model = model
        self.layer_modules = layer_modules
        self.wanted_layers = wanted_layers
        self.store: dict[str, torch.Tensor] = {}
        self.configs: list[Any] = []
        self.previous: list[Any] = []

    @staticmethod
    def _family_forward(module: Any) -> Callable[..., Any]:
        imported = sys.modules.get(type(module).__module__)
        fn = getattr(imported, "eager_attention_forward", None)
        if fn is None:
            raise BlockedError(f"no family eager_attention_forward for {type(module).__name__}")
        return fn

    def __enter__(self) -> "PlainAttentionCapture":
        from transformers.masking_utils import ALL_MASK_ATTENTION_FUNCTIONS, eager_mask
        from transformers.modeling_utils import ALL_ATTENTION_FUNCTIONS

        by_id = {id(module): layer for layer, module in self.layer_modules.items()}
        defaults = {id(module): self._family_forward(module) for module in self.layer_modules.values()}
        config_by_id: dict[int, Any] = {}
        for module in self.layer_modules.values():
            cfg = getattr(module, "config", None) or self.model.config
            config_by_id[id(cfg)] = cfg
        self.configs = list(config_by_id.values())
        self.previous = [getattr(cfg, "_attn_implementation", None) for cfg in self.configs]

        def implementation(
            module: Any,
            query: torch.Tensor,
            key: torch.Tensor,
            value: torch.Tensor,
            attention_mask: torch.Tensor | None = None,
            *args: Any,
            **kwargs: Any,
        ) -> Any:
            layer = by_id[id(module)]
            if layer in self.wanted_layers:
                groups = query.shape[1] // key.shape[1]
                expanded_key = key.repeat_interleave(groups, dim=1) if groups > 1 else key
                scaling = kwargs.get("scaling")
                if scaling is None:
                    scaling = getattr(module, "scaling", None) or query.shape[-1] ** -0.5
                scores = torch.matmul(query, expanded_key.transpose(2, 3)) * float(scaling)
                softcap = kwargs.get("softcap")
                if softcap is not None:
                    scores = torch.tanh(scores / float(softcap)) * float(softcap)
                if attention_mask is not None:
                    scores = scores + attention_mask
                self.store[address_key("attn_scores", layer)] = scores.detach().cpu()
            output, probabilities = defaults[id(module)](
                module, query, key, value, attention_mask, *args, **kwargs
            )
            if layer in self.wanted_layers:
                self.store[address_key("attn_probs", layer)] = probabilities.detach().cpu()
            return output, probabilities

        ALL_ATTENTION_FUNCTIONS.register(self.IMPLEMENTATION, implementation)
        ALL_MASK_ATTENTION_FUNCTIONS.register(self.IMPLEMENTATION, eager_mask)
        for cfg in self.configs:
            cfg._attn_implementation = self.IMPLEMENTATION
        return self

    def __exit__(self, *_args: object) -> None:
        from transformers.masking_utils import ALL_MASK_ATTENTION_FUNCTIONS
        from transformers.modeling_utils import ALL_ATTENTION_FUNCTIONS

        for cfg, previous in zip(self.configs, self.previous, strict=True):
            cfg._attn_implementation = previous
        type(ALL_ATTENTION_FUNCTIONS)._global_mapping.pop(self.IMPLEMENTATION, None)
        type(ALL_MASK_ATTENTION_FUNCTIONS)._global_mapping.pop(self.IMPLEMENTATION, None)


class PlainCapture(AbstractContextManager):
    def __init__(self, model: Any, addresses: list[tuple[str, int | None]]) -> None:
        self.model = model
        self.addresses = addresses
        self.store: dict[str, torch.Tensor] = {}
        self.handles: list[Any] = []
        self.methods: dict[str, str] = {}
        self.attention_context: PlainAttentionCapture | None = None

    @staticmethod
    def _first(value: Any) -> torch.Tensor:
        return value[0] if isinstance(value, (tuple, list)) else value

    def _save(self, key: str, tensor: torch.Tensor, method: str) -> None:
        if key in self.store:
            raise RuntimeError(f"plain hook for {key} fired twice")
        self.store[key] = tensor.detach().cpu()
        self.methods[key] = method

    def _forward(
        self,
        point: str,
        layer: int | None,
        module: Any,
        method: str,
        transform: Callable[[Any], torch.Tensor] | None = None,
    ) -> None:
        key = address_key(point, layer)

        def hook(_module: Any, _inputs: Any, output: Any) -> None:
            tensor = transform(output) if transform is not None else self._first(output)
            self._save(key, tensor, method)

        self.handles.append(module.register_forward_hook(hook))

    def _pre(
        self,
        point: str,
        layer: int | None,
        module: Any,
        method: str,
        transform: Callable[[Any], torch.Tensor] | None = None,
    ) -> None:
        key = address_key(point, layer)

        def hook(_module: Any, inputs: Any) -> None:
            tensor = transform(inputs) if transform is not None else self._first(inputs)
            self._save(key, tensor, method)

        self.handles.append(module.register_forward_pre_hook(hook))

    def _gemma(self) -> None:
        trunk = self.model.model
        layers = trunk.layers
        for point, layer in self.addresses:
            if point in ATTENTION_MATRIX_POINTS:
                continue
            if layer is None:
                global_map = {
                    "embeddings": (trunk.embed_tokens, "output", "embed_tokens output (module includes Gemma scale)"),
                    "final_norm": (trunk.norm, "output", "model.norm output"),
                    "lm_head": (self.model.lm_head, "output", "lm_head output before final-logit softcap"),
                }
                module, side, method = global_map[point]
                (self._forward if side == "output" else self._pre)(point, None, module, method)
                continue
            block = layers[layer]
            if point == "resid_pre":
                self._pre(point, layer, block, "decoder-layer input")
            elif point == "attn_in":
                self._forward(point, layer, block.input_layernorm, "input_layernorm output")
            elif point == "value":
                self._forward(point, layer, block.self_attn.v_proj, "v_proj output before head reshape")
            elif point == "z":
                self._pre(point, layer, block.self_attn.o_proj, "o_proj input (post-attention per-head z, flattened)")
            elif point == "attn_out":
                self._forward(point, layer, block.self_attn, "self_attn output before post-attention norm")
            elif point == "attn_out_post":
                self._forward(point, layer, block.post_attention_layernorm, "post_attention_layernorm output")
            elif point == "resid_mid":
                self._pre(point, layer, block.pre_feedforward_layernorm, "pre_feedforward_layernorm input")
            elif point == "mlp_in":
                self._forward(point, layer, block.pre_feedforward_layernorm, "pre_feedforward_layernorm output")
            elif point == "mlp_pre":
                self._forward(point, layer, block.mlp.gate_proj, "gate_proj output")
            elif point == "mlp_pre_linear":
                self._forward(point, layer, block.mlp.up_proj, "up_proj output")
            elif point == "mlp_act":
                self._pre(point, layer, block.mlp.down_proj, "down_proj input = act(gate_proj) * up_proj")
            elif point == "mlp_out":
                self._forward(point, layer, block.mlp, "mlp output before post-feedforward norm")
            elif point == "mlp_out_post":
                self._forward(point, layer, block.post_feedforward_layernorm, "post_feedforward_layernorm output")
            elif point == "resid_post":
                self._forward(point, layer, block, "decoder-layer output")
            else:
                raise BlockedError(f"plain Gemma hook map has no applicable point {point}.{layer}")

    def _gpt2(self) -> None:
        trunk = self.model.transformer
        layers = trunk.h
        for point, layer in self.addresses:
            if point in ATTENTION_MATRIX_POINTS:
                continue
            if layer is None:
                global_map = {
                    "embeddings": (trunk.wte, "word-token embedding output (position embedding excluded)"),
                    "final_norm": (trunk.ln_f, "final ln_f output"),
                    "lm_head": (self.model.lm_head, "lm_head output"),
                }
                module, method = global_map[point]
                self._forward(point, None, module, method)
                continue
            block = layers[layer]
            if point == "resid_pre":
                self._pre(point, layer, block, "GPT2Block input (token + position embedding at layer 0)")
            elif point == "attn_in":
                self._forward(point, layer, block.ln_1, "ln_1 output")
            elif point == "value":
                self._forward(
                    point,
                    layer,
                    block.attn.c_attn,
                    "raw c_attn fused Q/K/V output (interp-engine's canonical capture side on GPT-2)",
                )
            elif point == "z":
                self._pre(point, layer, block.attn.c_proj, "attention c_proj input (per-head z, flattened)")
            elif point in {"attn_out", "attn_out_post"}:
                self._forward(point, layer, block.attn, "attention module output; post point aliases raw on GPT-2")
            elif point == "resid_mid":
                self._pre(point, layer, block.ln_2, "ln_2 input")
            elif point == "mlp_in":
                self._forward(point, layer, block.ln_2, "ln_2 output")
            elif point == "mlp_pre":
                self._forward(point, layer, block.mlp.c_fc, "c_fc output before activation")
            elif point == "mlp_act":
                self._pre(point, layer, block.mlp.c_proj, "MLP c_proj input after activation")
            elif point in {"mlp_out", "mlp_out_post"}:
                self._forward(point, layer, block.mlp, "MLP output; post point aliases raw on GPT-2")
            elif point == "resid_post":
                self._forward(point, layer, block, "GPT2Block output")
            else:
                raise BlockedError(f"plain GPT-2 hook map has no applicable point {point}.{layer}")

    def __enter__(self) -> "PlainCapture":
        architecture = type(self.model).__name__
        if architecture == "Gemma2ForCausalLM":
            self._gemma()
            layer_modules = {i: layer.self_attn for i, layer in enumerate(self.model.model.layers)}
        elif architecture == "GPT2LMHeadModel":
            self._gpt2()
            layer_modules = {i: layer.attn for i, layer in enumerate(self.model.transformer.h)}
        else:
            raise BlockedError(f"no independent plain-transformers hook map for {architecture}")
        wanted = {layer for point, layer in self.addresses if point in ATTENTION_MATRIX_POINTS and layer is not None}
        if wanted:
            self.attention_context = PlainAttentionCapture(self.model, layer_modules, wanted)
            self.attention_context.__enter__()
        return self

    def __exit__(self, *_args: object) -> None:
        try:
            if self.attention_context is not None:
                self.store.update(self.attention_context.store)
                for key in self.attention_context.store:
                    point = key.split(".", 1)[0]
                    self.methods[key] = (
                        "recomputed from post-RoPE Q/K with eager scaling, GQA expansion, softcap, and mask"
                        if point == "attn_scores"
                        else "returned by the model family's plain Transformers eager attention function"
                    )
                self.attention_context.__exit__(*_args)
        finally:
            for handle in self.handles:
                handle.remove()


def capture_interp(interp: Any, tokens: torch.Tensor, addresses: list[tuple[str, int | None]]) -> dict[str, torch.Tensor]:
    from interp_engine import Address, run_with_cache

    requested = [Address(point, layer) if layer is not None else Address(point) for point, layer in addresses]
    with torch.inference_mode():
        cache = run_with_cache(interp, tokens, requested)
    copied = {address_key(point, layer): cache[Address(point, layer) if layer is not None else Address(point)].detach().cpu() for point, layer in addresses}
    del cache
    return copied


def capture_plain(
    plain: Any, tokens: torch.Tensor, addresses: list[tuple[str, int | None]]
) -> tuple[dict[str, torch.Tensor], dict[str, str]]:
    capture = PlainCapture(plain, addresses)
    with torch.inference_mode(), capture:
        output = plain(tokens, use_cache=False)
    del output
    expected = {address_key(point, layer) for point, layer in addresses}
    missing = sorted(expected - set(capture.store))
    if missing:
        raise RuntimeError(f"plain-transformers capture did not produce {missing}")
    return capture.store, capture.methods


def generate_interp(interp: Any, tokens: torch.Tensor, new_tokens: int, *, device: str) -> tuple[list[int], dict[str, Any]]:
    from interp_engine import generate_stream

    sync(device)
    with MemorySampler(device) as memory:
        start = time.perf_counter()
        ids = [
            int(step.token_id)
            for step in generate_stream(
                interp,
                tokens,
                max_tokens=new_tokens,
                temperature=0.0,
                stop_at_eos=False,
                seed=SEED,
            )
        ]
        sync(device)
        elapsed = time.perf_counter() - start
    return ids, {
        "elapsed_seconds": elapsed,
        "tokens_per_second": len(ids) / elapsed,
        "sampled_peak_current_allocated_bytes": memory.peak_current,
        "sampled_peak_driver_allocated_bytes": memory.peak_driver,
    }


def generate_plain(plain: Any, tokens: torch.Tensor, new_tokens: int, tokenizer: Any, *, device: str) -> tuple[list[int], dict[str, Any]]:
    pad = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else tokenizer.eos_token_id
    sync(device)
    with MemorySampler(device) as memory:
        start = time.perf_counter()
        with torch.inference_mode():
            generated = plain.generate(
                tokens,
                do_sample=False,
                max_new_tokens=new_tokens,
                min_new_tokens=new_tokens,
                use_cache=True,
                pad_token_id=pad,
            )
        sync(device)
        elapsed = time.perf_counter() - start
    ids = [int(x) for x in generated[0, tokens.shape[1] :].tolist()]
    del generated
    return ids, {
        "elapsed_seconds": elapsed,
        "tokens_per_second": len(ids) / elapsed,
        "sampled_peak_current_allocated_bytes": memory.peak_current,
        "sampled_peak_driver_allocated_bytes": memory.peak_driver,
    }


def row_passes(row: dict[str, Any]) -> dict[str, bool]:
    metrics = row["metrics"]
    return {
        "shape": bool(metrics["shape_equal"]),
        "same_dtype": metrics["interp_dtype"] == metrics["plain_dtype"],
        "finite": metrics["interp_nonfinite"]["total"] == 0 and metrics["plain_nonfinite"]["total"] == 0,
        "max_abs": metrics["max_abs_diff"] is not None
        and metrics["max_abs_diff"] <= THRESHOLDS["max_abs_diff_max"],
        "mean_cosine": metrics["mean_cosine"] is not None
        and metrics["mean_cosine"] >= THRESHOLDS["mean_cosine_min"],
        "min_position_cosine": metrics["min_position_cosine"] is not None
        and metrics["min_position_cosine"] >= THRESHOLDS["individual_position_cosine_min"],
    }


def aggregate_model(model_result: dict[str, Any]) -> dict[str, Any]:
    rows = model_result["rows"]
    generations = model_result["generations"]
    finite_max = [r["metrics"]["max_abs_diff"] for r in rows if r["metrics"]["max_abs_diff"] is not None]
    finite_min_cos = [
        r["metrics"]["min_position_cosine"] for r in rows if r["metrics"]["min_position_cosine"] is not None
    ]
    cosine_weight = sum(r["metrics"]["position_count"] for r in rows if r["metrics"]["mean_cosine"] is not None)
    weighted_cosine = (
        sum(
            r["metrics"]["mean_cosine"] * r["metrics"]["position_count"]
            for r in rows
            if r["metrics"]["mean_cosine"] is not None
        )
        / cosine_weight
        if cosine_weight
        else None
    )
    nonfinite_interp = sum(r["metrics"]["interp_nonfinite"]["total"] for r in rows)
    nonfinite_plain = sum(r["metrics"]["plain_nonfinite"]["total"] for r in rows)
    generation_matches = sum(bool(g["token_ids_exact"]) for g in generations)
    throughput_rows = [g for g in generations if g["prompt_tokens"] == 512]
    interp_tps = [g["interp_engine"]["tokens_per_second"] for g in throughput_rows]
    plain_tps = [g["plain_transformers"]["tokens_per_second"] for g in throughput_rows]
    all_row_criteria = {name: all(r["criteria"][name] for r in rows) for name in next(iter(rows))["criteria"]} if rows else {}
    criteria = {
        **all_row_criteria,
        "generation_ids": bool(generations) and generation_matches == len(generations),
        "coverage": len(rows) == model_result["expected_row_count"],
    }
    return {
        "raw_row_count": len(rows),
        "expected_row_count": model_result["expected_row_count"],
        "unique_addresses": len({r["address"] for r in rows}),
        "worst_max_abs_diff": max(finite_max) if finite_max else None,
        "worst_min_position_cosine": min(finite_min_cos) if finite_min_cos else None,
        "mean_cosine_over_all_positions": weighted_cosine,
        "interp_nonfinite_total": nonfinite_interp,
        "plain_nonfinite_total": nonfinite_plain,
        "generation_matches": generation_matches,
        "generation_total": len(generations),
        "generation_match_rate": generation_matches / len(generations) if generations else None,
        "throughput_512": {
            "interp_engine_median_tokens_per_second": statistics.median(interp_tps) if interp_tps else None,
            "plain_transformers_median_tokens_per_second": statistics.median(plain_tps) if plain_tps else None,
            "observations_per_stack": len(throughput_rows),
        },
        "memory": {
            "method": "2 ms sampling of process-wide torch.mps current/driver allocation; both model stacks resident",
            "interp_engine_max_sampled_peak_driver_bytes": max(
                (g["interp_engine"]["sampled_peak_driver_allocated_bytes"] for g in generations), default=0
            ),
            "plain_transformers_max_sampled_peak_driver_bytes": max(
                (g["plain_transformers"]["sampled_peak_driver_allocated_bytes"] for g in generations), default=0
            ),
        },
        "criteria": criteria,
        "pass": bool(criteria) and all(criteria.values()),
    }


def measure_model(
    label: str,
    spec: dict[str, Any],
    settings: dict[str, Any],
    *,
    omit_long_attention: bool,
) -> dict[str, Any]:
    device = settings["device"]
    dtype_name = settings["dtype"]
    dtype = getattr(torch, dtype_name)
    layers = list(settings["models"][label]["layers"])
    snapshot, revision = snapshot_for(spec)
    interp = None
    plain = None
    started = time.perf_counter()
    try:
        interp = load_interp_model(snapshot, device=device, dtype_name=dtype_name)
        applicable, excluded = enumerate_applicable(interp, layers)
        plain = load_plain_model(snapshot, device=device, dtype=dtype)
        if getattr(interp.config, "_attn_implementation", None) != "eager":
            raise BlockedError("interp-engine model did not retain attn_implementation='eager'")
        if getattr(plain.config, "_attn_implementation", None) != "eager":
            raise BlockedError("plain Transformers model did not retain attn_implementation='eager'")

        max_positions = int(getattr(plain.config, "max_position_embeddings", max(settings["prompt_lengths"])))
        lengths: list[int] = []
        skipped_lengths: list[dict[str, Any]] = []
        for length in settings["prompt_lengths"]:
            if length > max_positions:
                skipped_lengths.append(
                    {
                        "length": length,
                        "reason": f"checkpoint max_position_embeddings={max_positions}; extending positions would not be the same model",
                    }
                )
            else:
                lengths.append(length)

        model_result: dict[str, Any] = {
            "status": "running",
            "requested_id": spec["requested_id"],
            "offline_snapshot": str(snapshot),
            "revision": revision,
            "architecture": type(plain).__name__,
            "tokenizer_class": type(interp.tokenizer).__name__,
            "layers": layers,
            "registry_declared_points": [point.name for point in interp.points()],
            "applicable_addresses": [address_key(point, layer) for point, layer in applicable],
            "excluded_addresses": excluded,
            "skipped_prompt_lengths": skipped_lengths,
            "scoped_deviations": [],
            "rows": [],
            "generations": [],
            "expected_row_count": 0,
        }
        if device == "mps" and dtype_name == "float16":
            model_result["scoped_deviations"].append(INTERP_LOAD_DEVIATION)
        if skipped_lengths:
            model_result["scoped_deviations"].append(
                "GPT-2's 1024-position checkpoint cannot run a 2048-token control without changing the model; that length is excluded."
            )
        if omit_long_attention and 2048 in lengths:
            model_result["scoped_deviations"].append(
                "Attention-matrix points (attn_scores and attn_probs) were captured at 64 and 512 only, using the article's time-box deviation."
            )

        prompt_sets = {
            length: build_prompts(interp.tokenizer, length, settings["prompts_per_length"], model_offset=sum(map(ord, label)))
            for length in lengths
        }
        for length in lengths:
            addresses = [
                address
                for address in applicable
                if not (omit_long_attention and length == 2048 and address[0] in ATTENTION_MATRIX_POINTS)
            ]
            model_result["expected_row_count"] += len(addresses) * settings["prompts_per_length"]
            for prompt_index, cpu_tokens in enumerate(prompt_sets[length]):
                print(
                    f"[{now()}] {label}: prompt {prompt_index + 1}/{settings['prompts_per_length']} at {length} tokens",
                    file=sys.stderr,
                    flush=True,
                )
                tokens = cpu_tokens.to(device)
                capture_start = time.perf_counter()
                interp_tensors = capture_interp(interp, tokens, addresses)
                sync(device)
                clear_working_memory(device)
                plain_tensors, methods = capture_plain(plain, tokens, addresses)
                sync(device)
                capture_elapsed = time.perf_counter() - capture_start
                for point, layer in addresses:
                    key = address_key(point, layer)
                    row = {
                        "prompt_length": length,
                        "prompt_index": prompt_index,
                        "point": point,
                        "layer": layer,
                        "address": key,
                        "plain_capture_method": methods[key],
                        "metrics": tensor_metrics(interp_tensors[key], plain_tensors[key], point),
                    }
                    row["criteria"] = row_passes(row)
                    row["pass"] = all(row["criteria"].values())
                    model_result["rows"].append(row)
                del interp_tensors, plain_tensors

                interp_ids, interp_perf = generate_interp(
                    interp, tokens, settings["new_tokens"], device=device
                )
                plain_ids, plain_perf = generate_plain(
                    plain, tokens, settings["new_tokens"], interp.tokenizer, device=device
                )
                shared_prefix = 0
                for left, right in zip(interp_ids, plain_ids, strict=False):
                    if left != right:
                        break
                    shared_prefix += 1
                model_result["generations"].append(
                    {
                        "prompt_tokens": length,
                        "prompt_index": prompt_index,
                        "requested_new_tokens": settings["new_tokens"],
                        "interp_token_ids": interp_ids,
                        "plain_token_ids": plain_ids,
                        "token_ids_exact": interp_ids == plain_ids and len(interp_ids) == settings["new_tokens"],
                        "shared_prefix_tokens": shared_prefix,
                        "interp_engine": interp_perf,
                        "plain_transformers": plain_perf,
                        "capture_and_compare_seconds": capture_elapsed,
                    }
                )
                del tokens
                clear_working_memory(device)

        model_result["aggregate"] = aggregate_model(model_result)
        model_result["status"] = "completed"
        model_result["elapsed_seconds"] = time.perf_counter() - started
        return model_result
    finally:
        release_model(plain, device=device)
        release_model(interp, device=device)


def fmt_number(value: float | None, digits: int = 6) -> str:
    return "—" if value is None else f"{value:.{digits}g}"


def fmt_gib(value: int) -> str:
    return f"{value / (1024**3):.2f} GiB" if value else "n/a"


def make_summary(result: dict[str, Any]) -> str:
    verdict = "BLOCKED" if result["status"] == "blocked" else ("PASS" if result.get("pass") else "FAIL")
    lines = [
        "# fp16 eager parity sweep",
        "",
        f"Status: **{result['status']}** · Overall verdict: **{verdict}**",
        "",
        "| Model | Points × layers coverage | Worst max-abs | Worst min-cosine | Mean cosine | Non-finite (IE/plain) | Generation match | Median tok/s (IE/plain, 512) | Peak Metal driver (IE/plain) | Verdict |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for label, model in result.get("models", {}).items():
        if model.get("status") != "completed":
            lines.append(f"| {label} | — | — | — | — | — | — | — | — | BLOCKED/ERROR |")
            continue
        aggregate = model["aggregate"]
        throughput = aggregate["throughput_512"]
        memory = aggregate["memory"]
        coverage = f"{aggregate['unique_addresses']} addresses; {aggregate['raw_row_count']}/{aggregate['expected_row_count']} rows"
        generation = f"{aggregate['generation_matches']}/{aggregate['generation_total']}"
        tps = (
            f"{fmt_number(throughput['interp_engine_median_tokens_per_second'], 4)} / "
            f"{fmt_number(throughput['plain_transformers_median_tokens_per_second'], 4)}"
        )
        peak = (
            f"{fmt_gib(memory['interp_engine_max_sampled_peak_driver_bytes'])} / "
            f"{fmt_gib(memory['plain_transformers_max_sampled_peak_driver_bytes'])}"
        )
        lines.append(
            f"| {label} | {coverage} | {fmt_number(aggregate['worst_max_abs_diff'])} | "
            f"{fmt_number(aggregate['worst_min_position_cosine'])} | "
            f"{fmt_number(aggregate['mean_cosine_over_all_positions'])} | "
            f"{aggregate['interp_nonfinite_total']} / {aggregate['plain_nonfinite_total']} | "
            f"{generation} | {tps} | {peak} | {'PASS' if aggregate['pass'] else 'FAIL'} |"
        )
    lines.extend(
        [
            "",
            "Pass marks: exact shape and same dtype for every row; max absolute error ≤ 0.002; "
            "mean cosine ≥ 0.9999; every token-position cosine ≥ 0.99; zero non-finite values; "
            "and exact IDs for all generated tokens.",
            "",
            "Plain-side recompute: only `attn_scores`, from the Q/K tensors passed to Transformers' "
            "documented eager-attention interface after RoPE/cache update. The recompute applies the "
            "family call's scale, grouped-query expansion, Gemma softcap, and additive mask. "
            "`attn_probs` is the tensor returned by that family eager implementation; all other points are module I/O hooks.",
        ]
    )
    deviations = [
        f"{label}: {deviation}"
        for label, model in result.get("models", {}).items()
        for deviation in model.get("scoped_deviations", [])
    ]
    if deviations:
        lines.extend(["", "Scoped deviations:", "", *[f"- {item}" for item in deviations]])
    errors = result.get("errors", [])
    if errors:
        lines.extend(["", "Errors:", "", *[f"- {item['stage']}: {item['type']}: {item['message']}" for item in errors]])
    return "\n".join(lines) + "\n"


def error_record(exc: BaseException, stage: str, model: str | None = None) -> dict[str, Any]:
    return {
        "stage": stage,
        "model": model,
        "type": type(exc).__name__,
        "message": str(exc),
        "traceback_summary": "".join(traceback.format_exception(exc))[-8000:],
    }


def preflight(settings: dict[str, Any]) -> dict[str, Any]:
    if os.environ.get("HF_HUB_OFFLINE") != "1":
        raise BlockedError("HF_HUB_OFFLINE=1 is required")
    device = settings["device"]
    observed = {
        "mps_built": torch.backends.mps.is_built(),
        "mps_available": torch.backends.mps.is_available(),
        "mps_device_count": torch.mps.device_count(),
    }
    if device == "mps":
        if not observed["mps_built"] or not observed["mps_available"]:
            raise BlockedError(f"MPS is unavailable: {observed}")
        torch.empty(1, device="mps", dtype=torch.float16)
        torch.mps.synchronize()
    for label in settings["models"]:
        snapshot_for(MODEL_SPECS[label])
    return observed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="interp-engine vs independent plain-Transformers fp16 parity sweep")
    parser.add_argument("--smoke", action="store_true", help="CPU/float32 GPT-2 smoke with tiny prompts")
    parser.add_argument(
        "--omit-long-attention",
        action="store_true",
        help="time-box deviation: omit attn_scores/attn_probs at 2048 tokens (still capture them at 64/512)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = SMOKE_SETTINGS if args.smoke else FULL_SETTINGS
    output_name = "fp16_sweep_smoke.json" if args.smoke else "fp16_sweep.json"
    summary_name = "fp16_sweep_smoke_summary.md" if args.smoke else "fp16_sweep_summary.md"
    result: dict[str, Any] = {
        "schema_version": 1,
        "measurement": "fp16_sweep_smoke" if args.smoke else "fp16_sweep",
        "status": "running",
        "pass": False,
        "started_at": now(),
        "finished_at": None,
        "versions": versions(),
        "interp_engine_baseline_sha": BASELINE_SHA,
        "offline": os.environ.get("HF_HUB_OFFLINE") == "1",
        "settings": settings,
        "thresholds": THRESHOLDS,
        "criteria": {},
        "omit_long_attention": bool(args.omit_long_attention),
        "models": {},
        "errors": [],
    }
    exit_code = 1
    try:
        result["device_observed"] = preflight(settings)
    except Exception as exc:
        result["status"] = "blocked"
        result["errors"].append(error_record(exc, "preflight"))
        exit_code = 2
    else:
        random.seed(SEED)
        torch.manual_seed(SEED)
        for label in settings["models"]:
            try:
                result["models"][label] = measure_model(
                    label,
                    MODEL_SPECS[label],
                    settings,
                    omit_long_attention=bool(args.omit_long_attention),
                )
            except BlockedError as exc:
                result["models"][label] = {"status": "blocked", "scoped_deviations": []}
                result["errors"].append(error_record(exc, "model_setup", label))
                result["status"] = "blocked"
                exit_code = 2
            except Exception as exc:
                result["models"][label] = {"status": "failed", "scoped_deviations": []}
                result["errors"].append(error_record(exc, "measurement", label))
        if result["status"] != "blocked":
            completed = result["models"] and all(
                model.get("status") == "completed" for model in result["models"].values()
            )
            criterion_names = sorted(
                {
                    name
                    for model in result["models"].values()
                    if model.get("status") == "completed"
                    for name in model["aggregate"]["criteria"]
                }
            )
            result["criteria"] = {
                name: bool(completed)
                and all(model["aggregate"]["criteria"].get(name, False) for model in result["models"].values())
                for name in criterion_names
            }
            result["pass"] = bool(completed) and all(
                model["aggregate"]["pass"] for model in result["models"].values()
            )
            result["status"] = "completed" if completed else "failed"
            exit_code = 0 if result["pass"] else 1
    result["finished_at"] = now()
    RESULTS.mkdir(parents=True, exist_ok=True)
    (RESULTS / output_name).write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    summary = make_summary(result)
    (RESULTS / summary_name).write_text(summary)
    print(summary, end="")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
