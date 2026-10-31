---
title: "OSS Radar #11: Qwenputer Ran My Program Inside Qwen’s Layers"
seoTitle: "Qwenputer Tested: A CPU Compiled into Qwen Model Layers"
alternativeHeadline: "Qwenputer's standalone compiled CPU generated the right execution traces with its reference interpreter disabled; the full chat model still needs a driver"
date: "2026-10-30"
description: "I compiled Qwenputer's standalone CPU, changed a program's inputs, and disabled the reference interpreter during generation. The model still computed the right result."
section: oss-radar
tags: [oss-radar, ai, transformers, testing]
---

# OSS Radar #11: Qwenputer Ran My Program Inside Qwen’s Layers

I disabled Qwenputer’s reference interpreter during generation. Its compiled CPU still multiplied two numbers, saved the result to memory, read it back and printed the right character. Changing the inputs changed the answer. An illegal instruction produced the expected fault.

This was the **standalone CPU built with stock Qwen model layers**, on my Mac’s CPU. I did not run the full pretrained Qwen3.5-4B chat model. The smaller test answers a question behind the [October 22 launch](https://divagr.com/blog/qwenputer): can the added weights actually execute a program?

- Yes, in the model-level cases I ran.
- A compiler constructs those weights. There is no training in this build.
- Computation inside the weights still needs a host to load the program and run the model. The full chat version needs extra coordination too.

## Nobody trained this CPU

[One reader asked whether the extra layers were trained to interpret instructions](https://news.ycombinator.com/item?id=50283291). The build answers that directly: Qwenputer writes the weights that implement the processor.

Its [compiler](https://github.com/divagr18/qwenputer/blob/f07a0b2e38271454c4d455dc2b9bf78d3d399170/experimental/riscv/chipformer/q35/emit.py) turns circuit operations into model tensors. The [standalone builder](https://github.com/divagr18/qwenputer/blob/f07a0b2e38271454c4d455dc2b9bf78d3d399170/experimental/riscv/chipformer/rv/tiny.py) creates a `Qwen3_5ForCausalLM`, zeros its parameters and loads the compiled values. There is no optimizer, training set or attempt to reward the model for learning addition.

The resulting model uses the same kinds of layers as Qwen. It has no pretrained chat capability. That distinction matters: running a designed processor in neural-network layers demonstrates something different from teaching a language model to reason perfectly.

## The model ran the program

I tested source from October 30 with PyTorch 2.15.0 and Transformers 5.22.1. The standalone build produced 12 layers and about 2.1 billion parameters, with their values set by the compiler.

My first program calculated `7 × 9 + 2`, stored the result, cleared the working register and loaded the stored byte back. It printed that byte as a character: `65`, or `A`. The second used `8 × 8 + 2`, which should print `B`.

Before each run, I computed the expected execution trace with the reference interpreter. During model generation, I replaced that interpreter’s `run` and `record` methods with functions that throw an error. I also checked that the guard actually threw when called.

| Program | Expected | Model output | Execution trace |
| --- | --- | --- | --- |
| Multiply, add, store and reload | `A` | `A` | All 13 tokens matched |
| Same program, changed operands | `B` | `B` | All 13 tokens matched |
| Illegal instruction | Fault, then halt | Fault, then halt | All 11 tokens matched |

No guarded reference method ran during generation. The [firmware runner](https://github.com/divagr18/qwenputer/blob/f07a0b2e38271454c4d455dc2b9bf78d3d399170/experimental/riscv/chipformer/rv/firmware.py) loaded the initial program state, then called the model’s greedy `generate()`. Each generated token became the next input. The expected trace checked the result afterwards; it did not feed the next answer into the model.

I also ran the project’s existing sign-extension check. Its internal model values matched the circuit evaluator across 118,800 cells, and its free-running output matched all 44 execution tokens. That is stronger than checking a final character alone, though still a small test.

## Where the memory lives

The processor stores its working memory in the model’s recurrent state. A recurrent layer carries values from one token to the next. Qwenputer configures that update so a write replaces one selected row and a read retrieves it.

The [CPU circuit](https://github.com/divagr18/qwenputer/blob/f07a0b2e38271454c4d455dc2b9bf78d3d399170/experimental/riscv/chipformer/rv/core.py) uses those rows for registers, memory and the program counter. Its token stream records execution: addresses, values and instruction steps.

Python still supplies the tensor runtime and loads the initial state. In this test, it did not interpret each instruction to supply the answer. The arithmetic and state updates ran through the emitted model layers.

## Why the full chat model still needs a driver

The full Qwenputer combines this processor with pretrained Qwen. Its [driver](https://github.com/divagr18/qwenputer/blob/f07a0b2e38271454c4d455dc2b9bf78d3d399170/experimental/riscv/chipformer/rv/chat.py) loads firmware, recognizes when the circuit owns the next token, and keeps processor trace tokens out of Qwen’s language layers. Ordinary text continues through the language model.

The author explicitly [documents that the full model does not yet work through a plain `generate()` call](https://divagr.com/blog/qwenputer#limits-and-whats-next). My standalone test does. These are different execution paths, so passing one does not establish that every model server can run the other.

The full checkpoint’s size, GPU requirements and arithmetic scores remain the author’s measurements. I reproduced the compiled processor’s execution, not that whole evaluation.

## Useful experiment, expensive calculator

The two valid programs took about 18 and 14 seconds on my Mac using reference PyTorch kernels. Each ran once. Those timings explain why I would try this for understanding model internals, rather than choose it for routine arithmetic. They do not measure the author’s optimized GPU path.

[My scripts, versions, hashes and results are public](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10). The practical result is clear: deliberately constructed weights can execute these programs inside ordinary Qwen layers. For adopting the full chat model, I would first require a supported serving path and the same recovery-from-error checks on the intended hardware.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Compiled weights — shows how the builder writes tensors without training. | [Standalone builder](https://github.com/divagr18/qwenputer/blob/f07a0b2e38271454c4d455dc2b9bf78d3d399170/experimental/riscv/chipformer/rv/tiny.py) | Source checked October 30, 2026 |
| Driver — explains program loading and the split between circuit and language tokens. | [RvChat](https://github.com/divagr18/qwenputer/blob/f07a0b2e38271454c4d455dc2b9bf78d3d399170/experimental/riscv/chipformer/rv/chat.py) | Same pinned source |
| Independent model test — preserves changed operands, interpreter guards and fault behavior. | [Runner](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10/repro/qwenputer-model.py), [results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10/results/qwenputer-model.json) | October 30, 2026 |
