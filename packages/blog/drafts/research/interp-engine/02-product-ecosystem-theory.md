# OSS Radar research report: `interp-engine`

Research cutoff: **2026-09-01**. Repository baseline: **`74716092e5bad8beca1e27193ec9980a8e9a4e85`**.

Evidence labels:

- **Code-inspected** — read in the supplied clone at the baseline SHA.
- **Reproduced** — directly checked in the clone or shell.
- **Reported** — stated by maintainers or another cited source; not independently reproduced.
- **Proposed** — analysis or inference from sourced facts.

## 1. Maintainer thesis

### The thesis in plain words

**Proposed:** Interpretability infrastructure should stop being a collection of model-specific research hooks and become a stable inference layer. A caller should name a conceptual location such as `resid_post.10`, then use the same interface across Hugging Face models, eager execution, and a serving engine.

The README’s compact claim is:

> “fast, standardized … and easy to use and debug.”

It also says the engine “powers all of Neuronpedia’s inference.” [README.md:16](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md#L16)

**Reported, unresolved source limitation:** The launch article is Johnny Lin’s August 31, 2026 [`interp-engine` post](https://www.neuronpedia.org/blog/interp-engine). Its body was not available through the text index or direct text fetch at the September 1 cutoff. I therefore cannot supply a verified verbatim quotation from it without fabricating one. The editor should reacquire the launch page before publication. The README quotation above is verified and appears to carry the launch thesis.

### What the shipped product does now

**Code-inspected:** `interp-engine` currently provides:

- A model loader with eager, hooked-vLLM, static-vLLM, and generation-only vLLM modes. [README.md:43-60](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md#L43-L60)
- A shared API for activation capture, generation, residual decoding, attention reconstruction, logit/Jacobian-lens work, and steering. The integration guide says the engine-owned tier “captures, steers, generates and decodes on either backend.” [docs/AGENT_INTEGRATION.md:98-110](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/AGENT_INTEGRATION.md#L98-L110)
- Thirty-four canonical activation addresses on eager and 28 on vLLM. Two vLLM points are reconstructed because fused attention never materializes the matrices. [docs/SUPPORTED_POINTS.md:3-21](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/SUPPORTED_POINTS.md#L3-L21)
- Translation from TransformerLens and nnterp/NNsight names, with refusals where names do not mean the same tensor. [docs/AGENT_INTEGRATION.md:137-165](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/AGENT_INTEGRATION.md#L137-L165)
- An eager backend that attaches hooks to the real Transformers forward rather than implementing another model forward. [docs/COMPATIBILITY.md:3-7](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/COMPATIBILITY.md#L3-L7)

It is Apache-2.0. [LICENSE:2-4](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/LICENSE#L2-L4)

### Why this design

| Choice | Maintainer rationale | Constraint exposed by the design |
|---|---|---|
| vLLM is the default | **Code-inspected:** vLLM supplies continuous batching, paged attention, and fused kernels. The benchmark thesis is throughput under concurrent interpretability traffic, not merely faster single prompts. [docs/PERFORMANCE.md:8-15](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/PERFORMANCE.md#L8-L15) | Hooked vLLM defaults to `enforce_eager=True`, losing CUDA graphs and compile. Maintainers report a 4–11× decode penalty. Static taps recover much of it but freeze the observable locations at load time. |
| 34 canonical points | **Code-inspected:** A fixed semantic vocabulary prevents architecture names and framework names from silently changing the requested tensor. [docs/SUPPORTED_POINTS.md:3-10](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/SUPPORTED_POINTS.md#L3-L10) | Six points are unavailable under vLLM because fusion or vLLM’s logit path removes the needed boundary. [docs/SUPPORTED_POINTS.md:23-38](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/SUPPORTED_POINTS.md#L23-L38) |
| Validator | **Code-inspected:** It compares point values against raw-HF eager execution and records per-point cosine, diffs, versions, commands, and waivers. [validator/README.md:64-73](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/README.md#L64-L73) | Validation is expensive and coverage is not universal: 31 architectures were verified, 59 resolved structurally, and 46 remained unaudited at baseline. [validator/README.md:90-113](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/README.md#L90-L113) |
| `gpu-sizer` | **Code-inspected:** It predicts which GPU and backend configuration fit before weights are downloaded, using model config and safetensors headers. [gpu-sizer/README.md:3-12](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/gpu-sizer/README.md#L3-L12) | Arithmetic estimates need hardware verification. Its records explicitly distinguish measured from fitted configurations. [gpu-sizer/README.md:35-39](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/gpu-sizer/README.md#L35-L39) |

### The layer they want to own

**Proposed:** Decode is trying to own the layer between model execution and interpretability applications:

```text
HF checkpoint / vLLM worker
        ↓
canonical points + capture + steering + capability rules
        ↓
Neuronpedia inference, graphs, J-lens, NLA and future applications
```

The strongest evidence is the recommended “Tier 2”: let `interp-engine` own the model. Tier 1 exists for operators who must retain their own vLLM construction. [docs/AGENT_INTEGRATION.md:94-130](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/AGENT_INTEGRATION.md#L94-L130)

That is more ambitious than a hook library but less than a full hosted product. Today it is an execution and semantic compatibility layer.

## 2. Neuronpedia and Decode Research context

### What Neuronpedia is

**Reported:** Neuronpedia describes itself as:

> “an open source interpretability platform.”

It hosts exploration, visualization, steering, APIs, activations, explanations, and metadata. Its homepage reports five-plus terabytes of data and more than 50 million latents or vectors. [Neuronpedia homepage](https://www.neuronpedia.org/)

It began in summer 2023 as a GPT-2 neuron reference. It pivoted in early 2024 toward infrastructure for researchers. Neuronpedia was open-sourced on **March 31, 2025**, including the application and more than four terabytes of public datasets. The announcement says:

> “Neuronpedia’s role is to accelerate understanding of AI models.”

[Neuronpedia is Now Open Source](https://www.neuronpedia.org/blog/neuronpedia-is-now-open-source)

### Decode Research and public support

**Reported:** Decode says it builds interpretability tooling, infrastructure, and a platform. Its listed projects include Neuronpedia, SAELens, `circuit-tracer`, and SAEDashboard. It is led by Johnny Lin and is currently described as “a project of Players Philanthropy Fund, Inc.” [Decode Research](https://www.decoderesearch.org/)

Neuronpedia publicly lists support from Decode Research, Open Philanthropy, the Long Term Future Fund, AISTOF, Anthropic, Manifund, and others. It identifies Lin as an ex-Apple engineer. [Neuronpedia platform page](https://www.neuronpedia.org/index)

No funding amounts or equity relationships were found. An older January 2025 privacy page says Decode was fiscally sponsored by Ashgro Inc.; that conflicts with Decode’s current Players Philanthropy Fund wording and should be treated as stale or organizationally changed. [Neuronpedia privacy page](https://www.neuronpedia.org/privacy)

### What the service terms mean

| Service | Plain meaning | Evidence |
|---|---|---|
| Activations | Numeric intermediate states produced while a model processes tokens. They are the data read at the engine’s named points. | Neuronpedia calls them “huge arrays of numbers” inside a running model. [NLA launch](https://www.neuronpedia.org/blog/nlas) |
| Steering | Change an activation during the forward pass, then observe whether model output changes. This tests causal influence rather than correlation alone. | Neuronpedia’s product page describes steering as modifying behavior with latents or custom vectors. [Neuronpedia index](https://www.neuronpedia.org/index) |
| Circuit tracing | Build an attribution graph connecting internal features that contributed to a model’s next-token computation. Users can prune, inspect, save, upload, and steer graph nodes. | The 2025 launch calls graphs “a way to visualize and trace the internal reasoning of a model.” [Circuit Tracer launch](https://www.neuronpedia.org/blog/circuit-tracer) |
| Jacobian Lens | A fitted readout intended to expose representations available for verbal report—a proposed model “workspace” or J-space. | Neuronpedia hosted 12 models and offered prefitted lenses for 36 in July 2026. [Jacobian Lens post](https://www.neuronpedia.org/blog/jacobian-lens); see also the [Gurnee et al. paper](https://transformer-circuits.pub/2026/workspace/index.html) |
| NLA | A pair of models: an Activation Verbalizer maps activations to text; an Activation Reconstructor maps text back to activation space for scoring. | [NLA launch](https://www.neuronpedia.org/blog/nlas). Neuronpedia explicitly warns that NLAs can confabulate. |
| Graph steering | Intervene on a graph node or grouped “supernode” and regenerate, testing whether the attributed feature has the predicted causal effect. | [Circuit tracing and steering update](https://www.neuronpedia.org/blog/interp-orgs-assemble) |

### August 2026 migration evidence

I found one atomic backend rewrite, not separate clean commits for each service.

| Date and change | Evidence |
|---|---|
| **2026-08-21 — `17bc39171bf11c68bf5bf52013b11afe8e8b1f81`** | **Reported:** Commit title: “Rewrite backend services, generate cross-server APIs, relicense to Apache-2.0.” Its message says: **“interp-engine: Migrated inference, autointerp and graph services to new engine.”** The change touched 1,119 files. [Commit `17bc391`](https://github.com/hijohnnylin/neuronpedia/commit/17bc39171bf11c68bf5bf52013b11afe8e8b1f81) The file history dates it to August 21. [Inference README history](https://github.com/hijohnnylin/neuronpedia/commits/main/apps/inference/README.md) |
| Post-rewrite inference state | **Reported:** The current inference README says the engine **“replaced the previous TransformerLens + nnsight stack.”** It also documents automatic vLLM/eager selection. [Neuronpedia inference README](https://github.com/hijohnnylin/neuronpedia/blob/main/apps/inference/README.md#L224-L231) |
| Post-rewrite graph state | **Reported:** The graph application directly depends on `interp-engine==1.3.3`, and its Circuit Tracer extra requests `circuit-tracer[interp-engine]`. No `transformer-lens` dependency appears. [Graph `pyproject.toml`](https://github.com/hijohnnylin/neuronpedia/blob/main/apps/graph/pyproject.toml) |
| Post-rewrite NLA state | **Reported:** The current NLA README says its CUDA verbalizer runs on the engine-owned vLLM backend. Its reconstructor and source model remain plain Transformers because they are single-forward encoders. [NLA README](https://github.com/hijohnnylin/neuronpedia/blob/main/apps/nla/README.md#L221-L227) |

**Important attribution limit:** The commit message names inference, autointerp, and graph—not NLA. The same rewrite contains the NLA service’s new vLLM verbalizer files, while the current NLA documentation confirms the resulting engine ownership. That supports the migration outcome but not a quotation saying “inference, graph, and NLA.”

I did not find a second August PR or commit specifically titled “remove TransformerLens from graph-steering endpoints.” The defensible account is that this was an effect of `17bc391`: the graph service moved to the new engine, and its post-state dependency file contains `interp-engine` but no hard TransformerLens dependency.

This was a real reversal. In January 2026, Neuronpedia publicly said NNsight powered several inference backends and the generalized Circuit Tracer. [January 2026 ecosystem update](https://www.neuronpedia.org/blog/assistant-axis)

## 3. Ecosystem map

| Role | Product or layer | Evidence |
|---|---|---|
| **Replaces** | Hand-written Hugging Face hooks and decode loops | **Code-inspected:** The migration guide maps raw `AutoModelForCausalLM`, manual vLLM construction, custom decode loops, TransformerLens hooks, and NNsight traces to engine calls. [docs/AGENT_INTEGRATION.md:137-152](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/AGENT_INTEGRATION.md#L137-L152) HF itself now offers output-recording decorators, but these collect declared outputs rather than supply interp-engine’s cross-architecture vocabulary, steering, or serving contract. [HF output tracing](https://huggingface.co/docs/transformers/main/model_output_tracing) |
| **Replaces—inside Neuronpedia** | TransformerLens + NNsight inference stack | **Reported:** Neuronpedia’s current inference documentation says exactly this. [Inference README](https://github.com/hijohnnylin/neuronpedia/blob/main/apps/inference/README.md#L224-L231) This is not evidence that it replaces either project for the wider research community. |
| **Wraps** | Hugging Face Transformers | **Code-inspected:** Eager mode attaches hooks to native Transformers modules and reports their computation. It does not supply its own forward pass. [docs/COMPATIBILITY.md:3-7](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/COMPATIBILITY.md#L3-L7) |
| **Wraps / extends** | vLLM | **Code-inspected:** It adds canonical capture, per-request steering, payload transport, attention reconstruction, and static taps to vLLM’s worker path. vLLM supplies batching, paged KV memory, kernels, parallelism, and serving. [vLLM project](https://github.com/vllm-project/vllm); [docs/PERFORMANCE.md:8-26](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/PERFORMANCE.md#L8-L26) |
| **Rival / partial replacement** | TransformerLens 2 `HookedTransformer` | **Reported:** TL2 reimplemented architectures and offered arbitrary hooks, caching, editing, gradients, and research conveniences. `interp-engine` offers broader serving integration but not the same arbitrary research surface. |
| **Rival with convergent design** | TransformerLens 3 `TransformerBridge` | **Reported:** TL3 now wraps native HF models rather than reimplementing their forwards. It retains caches, patching, weight access, and compatibility aliases. [`TransformerLens` migration guide](https://transformerlensorg.github.io/TransformerLens/content/migrating_to_v3.html) This independently validates the “native model plus semantic adapter” design, while competing for the standardized-hook layer. |
| **Rival / possible complement** | NNsight, nnterp, and NDIF | **Reported:** NNsight offers arbitrary Python trace programs, activation edits, gradients, and local or remote execution. Its 0.7.0 release added a vLLM-backed HTTP server with the same trace interface. [NNsight 0.7.0 release](https://github.com/ndif-team/nnsight/releases) nnterp provides standardized accessors over NNsight. [nnterp](https://github.com/ndif-team/nnterp) NDIF is NNsight’s remote execution backend. [NDIF repository](https://github.com/ndif-team/ndif) |
| **Extends / consumes** | SAELens | **Reported:** SAELens trains, loads, encodes, and analyzes sparse autoencoders. It can consume activations from any PyTorch framework. [SAELens](https://github.com/decoderesearch/SAELens) Neuronpedia optionally preloads its SAEs while interp-engine supplies the model execution and capture layer. |
| **Alternative intervention layer** | pyvene | **Reported:** pyvene provides serializable, composable interventions over arbitrary PyTorch models, including neuron sets and generation steps. It has greater intervention generality but no equivalent vLLM serving or cross-engine validator claim. [pyvene](https://stanfordnlp.github.io/pyvene/) |
| **Relies on** | Torch, Transformers, vLLM and upstream checkpoint structure | **Code-inspected:** The base package depends on Torch, Transformers, einops, and NumPy; vLLM is optional and heavy. [pyproject.toml:22-27,44-50](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/pyproject.toml#L22-L27) The installed Transformers version is part of the numerical result. |
| **May enter** | SGLang backend | **Code-inspected / Proposed:** The validator retains an SGLang adapter, but the comparison is paused because its environment no longer starts. [validator/README.md:134-141](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/README.md#L134-L141) SGLang remains an active high-throughput serving framework; it should not be described as dormant. [SGLang repository](https://github.com/sgl-project/sglang) Runtime support is speculative. |
| **May enter** | Cross-engine point standard and conformance layer | **Proposed:** The canonical vocabulary, translation tables, stored comparison artifacts, and refusal rules could become useful independently of the runtime. No independent standards body or external adoption was found. |

### Current release health of major alternatives

**Reported:** TransformerLens is active. PyPI shows **3.8.1 released September 1, 2026**, after 3.8.0 on August 24 and 3.7.0–3.7.3 on August 7, 11, 15, and 19. It should not be called dormant. [TransformerLens PyPI](https://pypi.org/project/transformer-lens/)

The current project recommends TransformerBridge and says it supports 15,000-plus checkpoints across 140-plus architecture families. Legacy `HookedTransformer.from_pretrained` is deprecated, not abandoned without a successor. [TransformerLens PyPI description](https://pypi.org/project/transformer-lens/); [v3 migration guide](https://transformerlensorg.github.io/TransformerLens/content/migrating_to_v3.html)

**Reported:** NNsight’s current PyPI release is **0.7.0 from May 5, 2026**. Its release added lazy hooks and `nnsight-serve`, a vLLM-backed single-model server. [NNsight PyPI](https://pypi.org/project/nnsight/); [release notes](https://github.com/ndif-team/nnsight/releases)

These releases materially strengthen the rival theory: the incumbents are adapting to native-HF and serving-engine execution rather than standing still.

## 4. Theory map

| Theory | Whose view | Evidence for | Evidence against | Direction state | What would disprove it |
|---|---|---|---|---|---|
| **Interpretability at production scale must run inside a serving engine.** | Maintainer thesis | **Code-inspected:** vLLM concurrency produces the large reported gain: on B200, eight concurrent Llama-3.1-8B requests rise from 32 aggregate tok/s eager to 419 hooked-vLLM and 1,536 static-vLLM. [README.md:79-99](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md#L79-L99) **Reported:** NNsight independently moved into vLLM serving in 0.7.0. | Hook visibility conflicts with serving optimization. Hooked mode sacrifices graphs and compile; static mode only serves declared points. vLLM cannot differentiate through its forward because it runs under inference mode. [docs/GRADIENTS.md:121-142](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/GRADIENTS.md#L121-L142) | **Stated and shipped**, with an optimization frontier still open. | Production users consistently choose separate eager research jobs; serving integration fails to support the interventions they require; or throughput advantages disappear under realistic capture traffic. |
| **This is mainly Neuronpedia hosting convenience; researchers will retain TransformerLens or NNsight for gradients, patching and arbitrary hooks.** | Skeptical view | TL3 keeps arbitrary caches, patching, weight access, and compatibility behavior. NNsight keeps arbitrary Python trace expressions and remote execution. vLLM interp cannot backpropagate through the forward. TransformerLens is releasing weekly, not retreating. | The engine’s eager backend does support all 34 points and forward gradients. [docs/GRADIENTS.md:17-35](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/GRADIENTS.md#L17-L35) Neuronpedia removed a real TL+NNsight deployment stack, and the package exposes a standalone API rather than only internal service code. | **Enabled as a stable niche**, but “hosting convenience only” is not established. | Independent researchers adopt it for experiments unrelated to Neuronpedia, or it gains general patching/gradient workflows without giving up the serving path. |
| **The validator is the durable contribution; the engine is replaceable.** | Ecosystem view | The validator records semantics, versions, per-point diffs, reproductions, known gaps, and bugs across six execution paths. It has already documented a real Neuronpedia mapping error where plausible activations produced an SAE FVU of 9.8 instead of 0.26. [docs/ENGINE_HOOK_MAPPINGS.md:58-72](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/ENGINE_HOOK_MAPPINGS.md#L58-L72) That knowledge can outlast one runtime. | The validator’s canonical semantics, reference adapters, and success criteria are coupled to interp-engine’s own point registry. It is not currently an independent benchmark or governed standard. | **Enabled; standard status is speculative.** | The validator stops catching real semantic failures, cannot track new architectures, or remains unused outside engine development. Conversely, independent conformance adoption would strongly confirm the theory. |

### Assessment

**Proposed:** The evidence does not support a simple “interp-engine beats research tools” story. The stronger interpretation is market segmentation:

- `interp-engine` optimizes for repeatable, concurrent, product-facing inference.
- TransformerLens optimizes for familiar mechanistic-interpretability research APIs and model access.
- NNsight optimizes for programmable intervention traces and remote execution.
- The boundaries are converging because TL3 now wraps native HF and NNsight now runs inside vLLM.

The competitive question is therefore who defines the semantic interface over model internals, not who first added PyTorch hooks.

## 5. Direction: the best two future paths

### Path A: Interpretability serving control plane

**State: Enabled; final product is Speculative.**

```text
Shipped part
per-request capture + steering on vLLM; static and generation-only modes
    ↓
New action
Neuronpedia routes inference, graph and NLA workloads through engine capabilities
    ↓
Missing rule/component
multi-service scheduling, authentication, deployment policy, distributed-point
semantics, cost accounting and a stable external service protocol
    ↓
Possible product
a self-hosted or managed interpretability inference plane
```

Evidence:

- **Stated:** Tier 2 lets the engine own the model. [docs/AGENT_INTEGRATION.md:98-106](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/AGENT_INTEGRATION.md#L98-L106)
- **In progress:** Neuronpedia’s inference server exposes backend and endpoint support through `/v1/capabilities` and describes routing static-point pods according to declared capabilities. [Neuronpedia inference README](https://github.com/hijohnnylin/neuronpedia/blob/main/apps/inference/README.md#L226-L246)
- **Enabled:** The runtime already supports the core action—concurrent capture and steering.
- **Speculative:** No hosted interp-engine service, billing layer, or general multi-tenant control plane was announced.

### Path B: Canonical point ABI and conformance suite

**State: Enabled; independent standard is Speculative.**

```text
Shipped part
34 canonical points + model-aware mappers + stored validator artifacts
    ↓
New action
score each backend and architecture against the same point meanings
    ↓
Missing rule/component
versioned external specification, neutral governance, contributor certification,
stable submission format and adoption outside Decode
    ↓
Possible product
a conformance test for interpretability runtimes and model-serving backends
```

Evidence:

- **Stated:** The visualizer at [interp-engine.org](https://interp-engine.org) is a cross-architecture point “cheat sheet.” [README.md:28-32](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md#L28-L32)
- **Enabled:** Results are one JSON artifact per checkpoint/backend pair, from which reports are rendered. [validator/README.md:117-125](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/README.md#L117-L125)
- **In progress:** The suite already distinguishes HookedTransformer v2, TransformerBridge v3, NNsight/nnterp, vLLM modes, and a paused SGLang adapter.
- **Speculative:** There is no evidence yet that other projects accept its vocabulary as a neutral ABI.

## 6. Control, costs and adoption surfaces

### Who gains control

**Proposed:**

- Decode controls the canonical point names, capability rules, mapping tables, validation criteria, and Neuronpedia’s default inference runtime.
- Neuronpedia application developers gain one backend-neutral contract instead of carrying TransformerLens, NNsight, and per-model hook logic.
- Operators retain an escape hatch through Tier 1, where their own vLLM engine remains in charge.
- Upstream power remains substantial: Transformers determines the native forward and module structure; vLLM determines fused boundaries, kernels, distributed layouts, and graph behavior.

### Who pays

**Reported, not reproduced:** The published benchmarks were measured on an NVIDIA B200 with bf16, a 512-token prompt, and 128 generated tokens. Static taps show very large throughput gains, especially with eight concurrent requests. [README.md:79-99](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md#L79-L99)

The tables omit purchase, rental, energy, and engineering costs. They are throughput measurements, not a cost-of-ownership study.

**Code-inspected:** Operators pay for:

- Model weights and KV cache.
- Static-tap buffers and CUDA graph pools.
- Captured tensors crossing worker boundaries.
- Optional resident SAE collections.
- Additional cards for tensor parallelism.
- The performance loss when dynamic hooks require eager vLLM execution.

A measured A40 example attributes 7.5 GiB to weights, 3 GiB to graph storage, and 2.8 GiB to tap buffers. [gpu-sizer/README.md:41-56](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/gpu-sizer/README.md#L41-L56)

### Who supplies data and compute

- **Reported:** Hugging Face hosts many of the model, SAE, transcoder, Jacobian-lens, and NLA checkpoints.
- **Reported:** Research groups such as Anthropic, Google DeepMind, OpenMOSS, EleutherAI, Goodfire, and independent contributors supply techniques, weights, graphs, features, and explanations surfaced through Neuronpedia. [Neuronpedia homepage](https://www.neuronpedia.org/)
- **Reported:** Decode operates Neuronpedia’s public platform and API capacity.
- **Reported:** NDIF supplies an alternative remote-compute route for NNsight workloads. [NDIF](https://ndif.us/)
- **Proposed:** Self-hosters supply their own GPUs and assume compatibility risk across Transformers, vLLM, drivers, quantizers, and checkpoints.

### Adoption surfaces

| Surface | Adoption job |
|---|---|
| [interp-engine.org](https://interp-engine.org) | Makes the 34-point vocabulary browsable and connects architecture diagrams to runnable snippets. |
| `gpu-sizer` | Converts “will this fit?” into a pre-download configuration decision. Its arithmetic is also importable as a library. [gpu-sizer/README.md:23-30](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/gpu-sizer/README.md#L23-L30) |
| Colab notebooks | Separate eager, dynamic-vLLM, and static-vLLM templates reduce installation and GPU setup friction. The visualizer generates public GitHub-to-Colab links for each variant. [visualizer-web/lib/colab.ts:4-16,34-46](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/visualizer-web/lib/colab.ts#L4-L16) |
| Neuronpedia itself | The strongest adoption channel: users exercise the engine indirectly through activations, steering, graphs, lenses, and NLA requests. |
| Agent-oriented documentation | The README explicitly suggests prompting an agent to “use interp-engine.” [README.md:63-65](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md#L63-L65) This positions documentation quality as part of distribution. |

## 7. Outside field report

**Reported absence:** I found no verifiable first-hand report from someone outside Decode Research who had installed or used `interp-engine` by **2026-09-01**.

Searches covered:

- GitHub issues, repositories, and code indexed with the package or repository name.
- Web posts and reviews mentioning `pip install interp-engine`.
- References outside Neuronpedia, Decode, and the engine repository.
- Alternative interpretability projects that mention Neuronpedia.

The repository search result still showed **zero issues and zero pull requests** at the check time. [interp-engine repository result](https://github.com/decoderesearch/interp-engine)

This absence is unsurprising: the public announcement was one day old. It means there is no external usability, correctness, or deployment evidence yet. Neuronpedia is the first production deployment, but it is maintained by the same organization and is not an independent field report.

## Sources and why they matter

- [interp-engine README at baseline](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/README.md) — the maintainers’ shortest statement of product, benchmark, validation, documentation, and sizing claims.
- [Integration guide at baseline](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/AGENT_INTEGRATION.md) — shows which existing workflows the engine intends to absorb and where it refuses parity.
- [Supported points at baseline](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/SUPPORTED_POINTS.md) — defines the actual 34-point contract and the vLLM gaps.
- [Performance design at baseline](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/PERFORMANCE.md) — exposes the central correctness-versus-throughput trade.
- [Validator README at baseline](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/validator/README.md) — supplies coverage, engine differences, artifact structure, and limits.
- [Hook mapping guide at baseline](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/docs/ENGINE_HOOK_MAPPINGS.md) — documents why names are a correctness problem and records a concrete Neuronpedia failure.
- [gpu-sizer README at baseline](https://github.com/decoderesearch/interp-engine/blob/74716092e5bad8beca1e27193ec9980a8e9a4e85/gpu-sizer/README.md) — shows how deployment planning is being pulled into the product boundary.
- [Launch article URL](https://www.neuronpedia.org/blog/interp-engine) — primary announcement location, although its body was unavailable to the text tools at cutoff.
- [Neuronpedia open-source announcement](https://www.neuronpedia.org/blog/neuronpedia-is-now-open-source) — dates the open-source transition and states the platform’s purpose.
- [Decode Research](https://www.decoderesearch.org/) — defines Decode’s projects, organizational approach, leadership, and current fiscal affiliation.
- [Neuronpedia backend rewrite commit](https://github.com/hijohnnylin/neuronpedia/commit/17bc39171bf11c68bf5bf52013b11afe8e8b1f81) — primary historical evidence for the August engine migration.
- [Neuronpedia inference README](https://github.com/hijohnnylin/neuronpedia/blob/main/apps/inference/README.md) — primary evidence that the prior TL+NNsight stack was removed.
- [Neuronpedia NLA README](https://github.com/hijohnnylin/neuronpedia/blob/main/apps/nla/README.md) — separates the vLLM verbalizer from the plain-Transformers reconstructor and source models.
- [TransformerLens PyPI](https://pypi.org/project/transformer-lens/) — establishes its current release and August 2026 cadence.
- [TransformerLens 3 migration guide](https://transformerlensorg.github.io/TransformerLens/content/migrating_to_v3.html) — explains the native-HF TransformerBridge architecture and remaining research surface.
- [NNsight releases](https://github.com/ndif-team/nnsight/releases) — establishes the vLLM-serving rival and current feature direction.
- [SAELens](https://github.com/decoderesearch/SAELens) — separates SAE training and encoding from model execution.
- [vLLM](https://github.com/vllm-project/vllm) — defines the serving substrate whose throughput and constraints shape interp-engine.
- [SGLang](https://github.com/sgl-project/sglang) — establishes an active alternative serving engine and a possible future backend.
- [pyvene](https://stanfordnlp.github.io/pyvene/) — represents the general intervention-library theory.
- [NLA launch](https://www.neuronpedia.org/blog/nlas), [Jacobian Lens post](https://www.neuronpedia.org/blog/jacobian-lens), and [Circuit Tracer launch](https://www.neuronpedia.org/blog/circuit-tracer) — define the services now sitting above the inference layer.

## Uncertainty and unresolved risks

- The launch post body could not be retrieved. Its exact wording must be checked before quoting it in the article.
- The August Neuronpedia migration is a 1,119-file atomic rewrite. It makes fine-grained attribution difficult.
- No separate commit specifically documenting the graph-steering TransformerLens removal was found. The claim rests on the rewrite message and dependency post-state.
- Maintainer benchmarks were not reproduced. Hardware cost, variance, warm-up, capture volume, and output-quality parity need independent measurement.
- The validator is extensive but maintainer-owned. It is not independent certification.
- “Resolves” does not mean numerically verified. Forty-six architectures remained unaudited at baseline.
- Static taps trade semantic flexibility for speed and VRAM. Real traffic may not match the declared-point assumption.
- vLLM forward gradients are structurally unavailable. Researchers needing arbitrary patching, weight inspection, or differentiable model forwards still have reasons to use eager, TransformerLens, NNsight, or pyvene.
- Transformers and vLLM have uncapped upper versions in the package. That improves day-one compatibility but transfers breakage risk to continuing validation.
- Neuronpedia and interp-engine share maintainers. Neuronpedia proves internal product utility, not outside adoption.
- Decode’s current Players Philanthropy Fund wording and Neuronpedia’s older Ashgro privacy wording should be reconciled before describing fiscal sponsorship definitively.

**Reproduced:** The supplied clone was at the requested SHA, `74716092e5bad8beca1e27193ec9980a8e9a4e85`, and no files were modified during this research.

**Model and effort:** `gpt-5.6-sol`, high reasoning effort.