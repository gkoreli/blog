from __future__ import annotations

import gc
import importlib.util
import importlib.metadata
import json
import os
import platform
import random
import traceback
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
import torch


ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"
SEED = 1729
DEVICE = "mps"
DTYPE = "float32"
BASELINE_SHA = "74716092e5bad8beca1e27193ec9980a8e9a4e85"

MODEL_SPECS: dict[str, dict[str, Any]] = {
    "gemma-2-2b": {
        "requested_id": "google/gemma-2-2b",
        "cache_dir": "models--google--gemma-2-2b",
        "tl_name": "google/gemma-2-2b",
        "layers": [0, 6, 13, 19, 25],
        "steer_layer": 13,
    },
    "gpt2": {
        "requested_id": "openai-community/gpt2",
        # The hub stores this checkpoint under its canonical legacy id. The
        # requested openai-community/gpt2 repo is the same GPT-2 checkpoint.
        "cache_dir": "models--gpt2",
        "tl_name": "gpt2",
        "layers": [0, 3, 6, 9, 11],
        "steer_layer": 6,
    },
}


def now() -> str:
    return datetime.now(UTC).isoformat()


def versions() -> dict[str, str]:
    names = ("torch", "transformers", "interp-engine", "transformer-lens")
    return {
        "python": platform.python_version(),
        **{name: importlib.metadata.version(name) for name in names},
        "macos": platform.mac_ver()[0],
        "machine": platform.machine(),
    }


def base_result(measurement: str) -> dict[str, Any]:
    try:
        torch.empty(1, device=DEVICE)
        mps_tensor_creation = "succeeded"
    except Exception as exc:
        mps_tensor_creation = f"{type(exc).__name__}: {exc}"
    cache_preflight: dict[str, Any] = {}
    for label, spec in MODEL_SPECS.items():
        try:
            snapshot, revision = snapshot_for(spec)
            cache_preflight[label] = {
                "requested_id": spec["requested_id"],
                "snapshot": str(snapshot),
                "revision": revision,
                "config_present": (snapshot / "config.json").is_file(),
            }
        except Exception as exc:
            cache_preflight[label] = {"error": f"{type(exc).__name__}: {exc}"}
    return {
        "schema_version": 1,
        "measurement": measurement,
        "status": "running",
        "reproduction_label": "Reproduced",
        "started_at": now(),
        "finished_at": None,
        "versions": versions(),
        "device_requested": DEVICE,
        "device_observed": {
            "mps_built": torch.backends.mps.is_built(),
            "mps_available": torch.backends.mps.is_available(),
            "mps_device_count": torch.mps.device_count(),
            "mps_tensor_creation": mps_tensor_creation,
        },
        "dtype": DTYPE,
        "seed": SEED,
        "interp_engine_baseline_sha": BASELINE_SHA,
        "offline": os.environ.get("HF_HUB_OFFLINE") == "1",
        "vllm_installed": importlib.util.find_spec("vllm") is not None,
        "offline_model_cache_preflight": cache_preflight,
        "models": {},
        "errors": [],
    }


def write_result(filename: str, result: dict[str, Any]) -> None:
    RESULTS.mkdir(parents=True, exist_ok=True)
    result["finished_at"] = now()
    (RESULTS / filename).write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")


def error_record(exc: BaseException, *, stage: str, model: str | None = None) -> dict[str, Any]:
    return {
        "stage": stage,
        "model": model,
        "type": type(exc).__name__,
        "message": str(exc),
        "traceback_summary": "".join(traceback.format_exception(exc))[-4000:],
    }


def require_offline_mps() -> None:
    if os.environ.get("HF_HUB_OFFLINE") != "1":
        raise RuntimeError("HF_HUB_OFFLINE=1 is required for every measurement run")
    if not torch.backends.mps.is_built() or not torch.backends.mps.is_available():
        raise RuntimeError(
            "MPS is required, but this process reports "
            f"is_built={torch.backends.mps.is_built()}, "
            f"is_available={torch.backends.mps.is_available()}, "
            f"device_count={torch.mps.device_count()}. No CPU substitution was made."
        )
    # Force actual device creation; is_available alone is not sufficient evidence.
    torch.empty(1, device=DEVICE)
    torch.mps.synchronize()


def set_determinism() -> None:
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)


def snapshot_for(spec: dict[str, Any]) -> tuple[Path, str]:
    hub = Path(os.environ.get("HF_HUB_CACHE", Path.home() / ".cache/huggingface/hub"))
    root = hub / spec["cache_dir"]
    if not root.is_dir():
        raise FileNotFoundError(f"offline Hugging Face cache directory is missing: {root}")
    ref = root / "refs/main"
    revision = ref.read_text().strip() if ref.is_file() else ""
    if revision and (root / "snapshots" / revision).is_dir():
        snapshot = root / "snapshots" / revision
    else:
        snapshots = sorted(p for p in (root / "snapshots").iterdir() if p.is_dir())
        if len(snapshots) != 1:
            raise FileNotFoundError(f"could not select one offline snapshot under {root / 'snapshots'}")
        snapshot = snapshots[0]
        revision = snapshot.name
    required = ("config.json",)
    missing = [name for name in required if not (snapshot / name).exists()]
    if missing:
        raise FileNotFoundError(f"offline snapshot {snapshot} is missing {missing}")
    return snapshot, revision


def load_interp(snapshot: Path):
    from interp_engine import load_model

    return load_model(
        str(snapshot),
        backend="eager",
        device=DEVICE,
        dtype=DTYPE,
        model_kwargs={"local_files_only": True},
    )


def load_tlens(snapshot: Path, tl_name: str):
    from transformer_lens import HookedTransformer
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(snapshot, local_files_only=True)
    hf_model = AutoModelForCausalLM.from_pretrained(
        snapshot,
        local_files_only=True,
        dtype=torch.float32,
        attn_implementation="eager",
    )
    model = HookedTransformer.from_pretrained_no_processing(
        tl_name,
        hf_model=hf_model,
        tokenizer=tokenizer,
        device=DEVICE,
        dtype=torch.float32,
        default_prepend_bos=True,
    )
    del hf_model
    gc.collect()
    torch.mps.empty_cache()
    return model


def release(*objects: Any) -> None:
    for obj in objects:
        if obj is not None:
            module = getattr(obj, "hf_model", obj)
            move = getattr(module, "to", None)
            if callable(move):
                try:
                    move("cpu")
                except (AttributeError, RuntimeError, TypeError):
                    pass
    gc.collect()
    if torch.backends.mps.is_available():
        torch.mps.empty_cache()


def tensor_metrics(left: torch.Tensor, right: torch.Tensor) -> dict[str, Any]:
    a = left.detach().float().cpu()
    b = right.detach().float().cpu()
    if tuple(a.shape) != tuple(b.shape):
        return {
            "interp_shape": list(a.shape),
            "transformer_lens_shape": list(b.shape),
            "shape_equal": False,
            "max_abs_diff": None,
            "mean_abs_diff": None,
            "last_token_cosine_similarity": None,
        }
    diff = (a - b).abs()
    av = a[0, -1].flatten()
    bv = b[0, -1].flatten()
    cosine = torch.nn.functional.cosine_similarity(av, bv, dim=0)
    return {
        "interp_shape": list(a.shape),
        "transformer_lens_shape": list(b.shape),
        "shape_equal": True,
        "max_abs_diff": float(diff.max()),
        "mean_abs_diff": float(diff.mean()),
        "last_token_cosine_similarity": float(cosine),
    }


def synchronize() -> None:
    if torch.backends.mps.is_available():
        torch.mps.synchronize()
