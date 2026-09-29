#!/usr/bin/env python3
"""A deterministic, untrained causal transformer; no dependencies or network.

This illustrates numerical dependencies, not language quality or provider speed.
Run: python3 kv_dependency.py
"""

import copy
import hashlib
import json
import math
import random

WIDTH = 8
LAYERS = 3
VOCAB = 16
SEED = 73


def dot(a, b):
    return sum(x * y for x, y in zip(a, b, strict=True))


def project(matrix, vector):
    return [dot(row, vector) for row in matrix]


def add(a, b):
    return [x + y for x, y in zip(a, b, strict=True)]


def softmax(values):
    exps = [math.exp(x - max(values)) for x in values]
    return [x / sum(exps) for x in exps]


def difference(a, b):
    return max(abs(x - y) for x, y in zip(a, b, strict=True))


class TinyTransformer:
    def __init__(self):
        rng = random.Random(SEED)

        def matrix(rows):
            return [[rng.uniform(-0.6, 0.6) for _ in range(WIDTH)] for _ in range(rows)]

        self.embeddings = matrix(VOCAB)
        self.weights = [[matrix(WIDTH) for _ in range(5)] for _ in range(LAYERS)]
        self.head = matrix(VOCAB)

    def empty_cache(self):
        return [[] for _ in range(LAYERS)]

    def step(self, token, cache):
        position = len(cache[0])
        # Absolute position features make deletion/relocation a separate dependency.
        h = add(self.embeddings[token], [0.2 * math.sin(position / (i + 1)) for i in range(WIDTH)])
        for layer, (wq, wk, wv, wo, wf) in enumerate(self.weights):
            query = project(wq, h)
            key, value = project(wk, h), project(wv, h)
            cache[layer].append((key, value))
            scores = [dot(query, k) / math.sqrt(WIDTH) for k, _ in cache[layer]]
            attention = softmax(scores)
            mixed = [sum(weight * entry[1][i] for weight, entry in zip(attention, cache[layer], strict=True)) for i in range(WIDTH)]
            h = add(h, project(wo, mixed))
            h = add(h, [0.2 * math.tanh(x) for x in project(wf, h)])
        return project(self.head, h)

    def run(self, tokens, cache=None):
        cache = self.empty_cache() if cache is None else cache
        logits = []
        for token in tokens:
            logits = self.step(token, cache)
        return logits, cache


def prefix_length(a, b):
    return next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))


def prefix_hashes(tokens):
    """One-token blocks for illustration, not a claim about server block sizes."""
    parent = "model-v1"
    result = []
    for token in tokens:
        parent = hashlib.sha256(f"{parent}:{token}".encode()).hexdigest()
        result.append(parent)
    return result


def main():
    model = TinyTransformer()
    original = [1, 2, 3, 4, 5, 6, 7]
    replacement = [1, 9, 3, 4, 5, 6, 7]
    query = [8]
    _, old_cache = model.run(original)
    cold, new_cache = model.run(replacement + query)
    prefix = prefix_length(original, replacement)

    # Exact reuse: only retain state before the first changed token.
    reused_cache = [copy.deepcopy(layer[:prefix]) for layer in old_cache]
    reused, _ = model.run(replacement[prefix:] + query, reused_cache)
    assert difference(cold, reused) == 0.0

    # Tempting shortcut: compute the replacement, splice old suffix KVs back in.
    spliced_cache = [copy.deepcopy(layer[:prefix]) for layer in old_cache]
    model.run(replacement[prefix:prefix + 1], spliced_cache)
    for layer, old in zip(spliced_cache, old_cache, strict=True):
        layer.extend(copy.deepcopy(old[prefix + 1:]))
    stale, _ = model.run(query, spliced_cache)
    assert difference(cold, stale) > 1e-6

    # Same untouched token, same position; deeper-layer state still changes.
    suffix_position = 5
    layer_deltas = [max(difference(old_cache[l][suffix_position][0], new_cache[l][suffix_position][0]), difference(old_cache[l][suffix_position][1], new_cache[l][suffix_position][1])) for l in range(LAYERS)]
    assert layer_deltas[0] == 0.0
    assert all(delta > 1e-6 for delta in layer_deltas[1:])

    appended_cold, _ = model.run(original + [10] + query)
    appended_reused, _ = model.run([10] + query, copy.deepcopy(old_cache))
    assert difference(appended_cold, appended_reused) == 0.0

    # A branch can coexist with the old branch; an edit does not erase old state.
    original_cold, _ = model.run(original + query)
    original_revisited, _ = model.run(query, copy.deepcopy(old_cache))
    assert difference(original_cold, original_revisited) == 0.0

    old_hashes, new_hashes = prefix_hashes(original), prefix_hashes(replacement)
    assert old_hashes[0] == new_hashes[0]
    assert all(a != b for a, b in zip(old_hashes[1:], new_hashes[1:], strict=True))

    print(json.dumps({
        "experiment": "synthetic numerical dependency demonstration; no trained model or API",
        "seed": SEED, "layers": LAYERS, "width": WIDTH,
        "original": original, "replacement": replacement, "query": query,
        "unchanged_prefix_tokens": prefix,
        "cold_vs_valid_prefix_reuse_max_logit_delta": difference(cold, reused),
        "cold_vs_stale_suffix_splice_max_logit_delta": difference(cold, stale),
        "unchanged_token_position": suffix_position,
        "kv_delta_by_layer_at_unchanged_token": layer_deltas,
        "append_vs_cold_max_logit_delta": difference(appended_cold, appended_reused),
        "old_branch_revisit_vs_cold_max_logit_delta": difference(original_cold, original_revisited),
        "old_branch_retained": True,
        "dependency_hash_common_prefix_blocks": prefix_length(old_hashes, new_hashes),
        "checks": "passed",
    }, indent=2))


if __name__ == "__main__":
    main()
