"""Small CPU mechanism controls; no data, training, checkpoints or model services."""
import importlib.metadata
import json
import sys
from pathlib import Path

if len(sys.argv) != 3:
    raise SystemExit("Usage: python jax-mechanisms.py /pinned-project /fresh-receipt.json")
project, output = map(Path, sys.argv[1:])
sys.path.insert(0, str(project.resolve()))
import jax
import jax.numpy as jnp
import numpy as np
import deepseek_v3 as model

assert jax.default_backend() == "cpu"
cfg = model.TINY
x = jnp.zeros((1, cfg.d_model)).at[0, 0].set(1)
affinities = jnp.array([0.8, 0.6, 0.4, 0.2])
router = jnp.zeros((cfg.d_model, cfg.n_routed)).at[0].set(jnp.log(affinities / (1 - affinities)))
gate_a, scores_a = model.route(router, jnp.zeros(4), x, cfg)
gate_b, scores_b = model.route(router, jnp.array([0., 0., 1., 1.]), x, cfg)
assert np.allclose(scores_a, scores_b)
assert np.flatnonzero(np.array(gate_a[0])).tolist() == [0, 1]
assert np.flatnonzero(np.array(gate_b[0])).tolist() == [2, 3]
for gates, scores in [(gate_a, scores_a), (gate_b, scores_b)]:
    selected = np.flatnonzero(np.array(gates[0]))
    raw = np.array(scores[0])[selected]
    assert np.allclose(np.array(gates[0])[selected], raw / raw.sum(), atol=1e-6)

params = model.init_mla(cfg, jax.random.PRNGKey(1))
tokens = jax.random.normal(jax.random.PRNGKey(2), (1, 6, cfg.d_model))
cos, sin = model.rope(cfg, jnp.arange(6))
full, _ = model.mla(params, tokens, cos, sin, cfg)
cache = model.init_cache(cfg, 1, 1)[0]
prefill, cache = model.mla(params, tokens[:, :3], cos[:3], sin[:3], cfg, cache, 0)
pieces = [prefill]
for pos in range(3, 6):
    next_output, cache = model.mla(params, tokens[:, pos:pos+1], cos[pos:pos+1], sin[pos:pos+1], cfg, cache, pos)
    pieces.append(next_output)
cached = jnp.concatenate(pieces, axis=1)
maximum_error = float(jnp.max(jnp.abs(full - cached)))
assert maximum_error < 1e-5

contractions = []
einsum = jnp.einsum
def traced_einsum(specification, *operands, **kwargs):
    result = einsum(specification, *operands, **kwargs)
    contractions.append({"operation": specification,
        "operands": [list(value.shape) for value in operands], "output": list(result.shape)})
    return result
jnp.einsum = traced_einsum
try:
    model.moe(model.init_moe(cfg, jax.random.PRNGKey(3)), jnp.zeros(cfg.n_routed), x.reshape(1, 1, -1), cfg)
finally:
    jnp.einsum = einsum
assert any(row["operation"] == "nd,edh->neh" and row["output"][1] == cfg.n_routed for row in contractions)

receipt = {
    "sourceCommit": "6901be60941b98dc654ed542465290db9e8bafa6",
    "versions": {name: importlib.metadata.version(name) for name in ["jax", "jaxlib", "optax", "numpy"]},
    "backend": jax.default_backend(), "randomSeeds": [1, 2, 3],
    "routing": {"rawAffinities": np.array(scores_a).tolist(), "withoutBias": np.array(gate_a).tolist(),
        "withSelectionBias": np.array(gate_b).tolist(), "selectedWeightsUseRawAffinities": True},
    "attention": {"tokens": 6, "prefillTokens": 3, "incrementalSteps": 3,
        "maximumAbsoluteError": maximum_error, "declaredTolerance": 1e-5,
        "cacheShapes": {key: list(value.shape) for key, value in cache.items()},
        "cachedScalarsPerToken": cfg.kv_rank + cfg.d_rope,
        "uncompressedHeadScalarsPerToken": cfg.n_heads * (cfg.d_nope + cfg.d_rope + cfg.d_v)},
    "moeContractions": contractions, "routedExperts": cfg.n_routed, "selectedExpertsPerToken": cfg.top_k,
    "scope": "Authored tiny-tensor controls of the inspected implementation; no training quality or throughput result.",
    "trainingRun": False, "checkpointLoaded": False, "modelServiceCalls": 0,
}
with output.open("x") as destination:
    destination.write(json.dumps(receipt, indent=2) + "\n")
print(json.dumps({"routingControl": True, "cacheMaximumError": maximum_error,
    "allExpertContractionObserved": True, "trainingRun": False}))
