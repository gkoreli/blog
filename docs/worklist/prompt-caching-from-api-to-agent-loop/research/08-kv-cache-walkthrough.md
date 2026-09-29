# What the model keeps when it caches a prompt

A cache hit saves the work of **building** part of a model's working memory. The model still has to **use** that memory to answer the next question. Keeping those two operations separate explains why a long cached prompt can be cheap to submit and still take time to answer.

This walkthrough follows the Llama implementation in vLLM, then the block managers in vLLM and SGLang. It explains one common design: a causal transformer with per-layer key/value state. Other architectures store different state. All code links use the revisions recorded in [the source manifest](../sources.lock.json), inspected September 28, 2026 in Los Angeles. The arithmetic below is illustrative; it does not describe Sonnet, GPT, or Gemini internals.

## Text becomes token IDs, then vectors

An API message is a structured object with a role and content. Before the language model receives it, the serving software turns that structure into the model's expected input. A **chat template** supplies the model-specific formatting: message boundaries, role markers, and tool descriptions where the template supports them. A **tokenizer** converts the resulting text into integer IDs from a vocabulary. A token can represent a word, part of a word, punctuation, or another fragment; it is not a fixed number of characters.

For a concrete entry point, vLLM's [`safe_apply_chat_template`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/renderers/hf.py#L778) passes the conversation, tools, template and tokenization option to the tokenizer. This is why comparing only the visible system-prompt string can miss a cache-breaking change. Tool ordering or role conversion can change what reaches the model. Conversely, an HTTP field that never affects model input need not change its mathematical state, though a provider may still use that field to separate caches.

The token ID is an index. The model looks up a learned row of numbers for it: its **embedding vector**. A vector is simply an ordered list of numbers, usually much longer than the small examples we draw on paper. The initial vector for a token is then transformed repeatedly as the model processes its context. vLLM's [`embed_input_ids`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/model_executor/models/llama.py#L403) performs the lookup, and the [`forward` loop](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/model_executor/models/llama.py#L406) passes the result through the model's layers.

A **layer** is one stage of learned transformations. Its input is the preceding stage's output. In this implementation, a layer normalizes the numbers, performs attention, and applies a feed-forward network. Residual connections carry information around these transformations. The important cache consequence is that a later layer receives a token representation already influenced by earlier attention. [Llama decoder layer](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/model_executor/models/llama.py#L313)

## Query, key and value are three uses of a token's current vector

At an attention layer, learned matrix multiplications turn each token's current representation into three vectors:

- **Query, Q:** used to calculate how strongly this position attends to permitted positions.
- **Key, K:** compared with queries to calculate those attention weights.
- **Value, V:** the information mixed together using those weights.

The simplified calculation for one attention head is:

```text
scores  = query · permitted_keys / sqrt(head_dimension)
weights = softmax(scores)
result  = weighted_sum(permitted_values, weights)
```

Here `·` means dot products: multiply corresponding numbers and add them. `softmax` turns the scores into nonnegative weights that sum to one. The model does this for multiple **heads**, separate sets of these vectors that can compute different mixtures. These are learned numerical operations; a key is not a searchable word and a value is not a stored answer. The original [Transformer attention equations](https://arxiv.org/abs/1706.03762) define this calculation.

For decoder self-attention, the causal rule allows a position to attend to itself and permitted earlier positions, not future ones. The first prompt token cannot use the last prompt token. The last prompt token can use earlier prompt information.

The useful five-line reading exercise is [`LlamaAttention.forward`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/model_executor/models/llama.py#L224). It computes the combined projections, splits Q/K/V, applies rotary position encoding to Q and K, calls attention, and projects the result back into the representation passed onward. **Rotary position encoding**, or RoPE, changes Q/K using their positions so attention can account for relative order.

A later token needs earlier keys and values to perform this calculation. It does not need earlier queries: those belonged to the earlier positions' own calculations. That is why the ordinary persistent attention state is called the **KV cache**. Engines may retain additional information for other features, but K and V are the recurring attention inputs discussed here.

## Prefill processes known input; decode extends it

Suppose a prompt has token IDs A, B and C. These letters are labels for already-tokenized input, not claims about how a particular tokenizer splits words.

During **prefill**, all three input tokens are known. The engine processes them through the model, building each layer's K/V state. It can perform substantial work across positions in parallel while enforcing the causal attention rule. Long inputs may be scheduled in chunks, so prefill need not be one uninterrupted GPU operation.

The final prompt position produces scores over the vocabulary, called **logits**. Selecting or sampling from those scores produces the first output token, D. On the next ordinary decoding step, the model processes D, adds D's K/V at each layer, and uses the existing A/B/C state to predict E. It keeps repeating this process. The generated token's K/V is created when that token is fed through the model; sampling its ID alone does not create its state.

![Prefill builds per-layer K/V for known prompt tokens; decode reads that state while adding new tokens](../assets/prefill-decode.svg)

The KV cache first saves work **within a single generation**: predicting E does not require rebuilding A/B/C. **Prefix caching across requests** adds a lifetime and lookup policy. The service retains compatible state after one request so another request can begin with it.

For example, a first agent call generates a tool call. The harness executes the tool and sends a second request with the previous history followed by the result. If the model's serialized prefix remains the same and the state is available, the second request can reuse that prefix. It still has to process the new tool result and produce the next answer. A local conversation file gives the harness text to resend; it does not itself contain the server's KV tensors.

There is also a small edge at a complete hit. The inspected [`KVCacheManager.get_computed_blocks`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_manager.py#L264) leaves at least the final input token for recomputation to obtain logits. KV state alone is not the final vocabulary-score vector. Alignment constraints can make that recomputed tail larger than one token.

## What a hit still has to do

Consider a question following 8,000 cached tokens. The service can skip rebuilding the cached tokens' representations, but the question still needs to attend to them. During generation, new queries also use the retained keys and values. In vLLM's FlashAttention backend, the [attention call](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/attention/backends/flash_attn.py#L1450) takes the new query along with `key_cache`, `value_cache` and a block table. A separate [cache-update path](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/attention/backends/flash_attn.py#L1520) writes newly computed K/V into their slots.

For ordinary dense full attention, increasing the retained context increases the state each new query can use. Caching avoids its repeated construction; it does not make that attention disappear. Model weights must still be used for new tokens, and new output tokens still require computation. Sliding-window and other attention designs change how much past state is accessed.

The service also spends time accepting and preparing the request, scheduling it alongside other work, locating the cache and possibly loading it. If the API requires the whole history in the request body, a cache hit does not remove that upload. These costs explain why a hit ratio alone cannot predict response time. In our [small live run](05-live-anthropic-experiment.md), the appended-system case reused input but had a higher median time to first visible text than the early-edit case. That observation is not a general speed comparison.

## A numerical memory estimate

Keys and values occupy memory at each attention layer. For uniform layers with equal K/V head dimensions and dense, uncompressed state:

```text
KV bytes = tokens × layers × KV heads × head dimension × 2 × bytes per element
                                                            ↑
                                                       key and value
```

**Grouped-query attention**, or GQA, lets multiple query heads share each K/V head. If a model has 32 query heads and 8 KV heads, use **8** in the memory formula. Query-head count affects attention work, but it is not the number of retained K/V heads. vLLM's [`LlamaAttention` initialization](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/model_executor/models/llama.py#L144) keeps these counts separate.

Take an illustrative model with 32 layers, 8 KV heads, 128 numbers per head and 2-byte elements:

```text
bytes per token = 32 × 8 × 128 × 2 × 2
                = 131,072 bytes = 128 KiB

8,192 tokens   = 1 GiB
32,768 tokens  = 4 GiB
131,072 tokens = 16 GiB
```

This is KV payload only: no model weights, temporary activations, cache metadata, allocation padding or duplicate copies. It assumes one retained K/V state per token per layer. Quantized state, unequal dimensions, windowed layers, compressed attention state and hybrid models require different arithmetic. Across multiple GPUs, heads may be partitioned or replicated; dividing the total by the GPU count is not always correct.

The formula is visible in [`AttentionSpec`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/kv_cache_interface.py#L482): each state occupies `(head_size + head_size_v) × dtype_bytes`, multiplied by stored states and head slots. It also explicitly allows padding and alternative packed representations. The [`num_states` calculation](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/kv_cache_interface.py#L204) explains why token count and stored-state count need not always agree.

This memory cost makes cache sharing valuable. Ten requests with the same 8,192-token prefix can point to compatible shared blocks instead of each owning a separate copy of that prefix. Each request still needs its own divergent tail and its own attention computation. Sharing storage does not mean they receive the same answer.

## Blocks let the server share and reclaim memory

Rather than reserve one giant contiguous array per request, the engine divides cache storage into **blocks** or **pages**. A request's **block table** maps positions in its sequence to physical storage blocks. Several requests can refer to the same compatible prefix blocks; newly divergent text uses other blocks.

vLLM's [`BlockPool.touch`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/block_pool.py#L755) increases a block's reference count when another request uses it. A reference count tracks active users. [`free_blocks`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/block_pool.py#L776) decreases the count when a request releases blocks. Reaching zero makes the block available for reuse by the allocator; it does not necessarily discard the cached entry immediately.

Later, [`get_new_blocks`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/block_pool.py#L668) can take that storage for new work and remove its old cache metadata. That is **eviction**: useful old state is displaced to make room. An unchanged prompt can therefore miss even though the earlier request finished successfully. No prompt edit is required.

SGLang represents matching histories as a tree. Its [`evict`](https://github.com/sgl-project/sglang/blob/2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf/python/sglang/srt/mem_cache/radix_cache.py#L553) selects eligible leaves according to an eviction policy, frees their storage, and can then make their parent eligible. Active paths are protected through reference tracking. Neither implementation gives every historical branch unlimited lifetime.

## Cache identity includes more than visible text

To reuse a state, the service needs to establish that it belongs to the intended computation. The requirements can be enforced by separate serving instances, namespaces, configuration constraints or cache-key fields. They need not all be spelled out in one hash.

| Difference | Why it matters |
|---|---|
| Model weights or adapter | Changes the transformations that produced K/V. A LoRA adapter is an additional learned weight adjustment. |
| Token IDs or earlier prefix | Changes inputs or the attention history encoded in deeper layers. |
| Positions or attention configuration | Changes which positions interact and how their relationships are represented. |
| Image, audio or direct embeddings | Identical text placeholders can hide different non-text input vectors. |
| Storage dtype/layout or GPU partition | Can change representation or compatibility when moving stored tensors. |
| Tenant namespace or cache salt | Can intentionally prevent sharing even when the mathematical input agrees. A salt is an extra identity value, not an instruction to the model. |

In vLLM, [`generate_block_hash_extra_keys`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_utils.py#L611) adds relevant LoRA, multimodal, direct-embedding and salt information. [`hash_block_tokens`](https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_utils.py#L650) includes the preceding block hash and current IDs. Position in this ordinary prefix chain follows from the preceding sequence; this function does not independently list every model setting.

SGLang's [`RadixKey._check_compatible`](https://github.com/sgl-project/sglang/blob/2ff52e3ceb0bcfdc8ba1dd0367b39ce0370bbfaf/python/sglang/srt/mem_cache/radix_cache.py#L165) checks namespace and salt compatibility before matching. LMCache's [`CacheEngineKey`](https://github.com/LMCache/LMCache/blob/1d8716508371ab5c95de0d963160e1e64de467ef/lmcache/utils.py#L389) includes model name, partition information, chunk hash, dtype and tags. These are concrete examples, not proof that every relevant compatibility condition is handled by every backend.

## Offloading and routing determine whether useful state is reachable

**Offloading** moves cache data out of scarce GPU memory, for example into CPU memory or storage. It can preserve state that would otherwise be evicted. Reusing it later requires a path to load compatible tensors back for computation.

LMCache's current multiprocess [secondary-storage documentation](https://github.com/LMCache/LMCache/blob/1d8716508371ab5c95de0d963160e1e64de467ef/docs/source/mp/l2_storage/index.rst) describes a fast tier, usually CPU memory, and a persistent tier. Its lookup can find a miss in the fast tier, locate data in the persistent tier, and load it before retrieval. A stored hit can therefore have a different latency from a GPU-resident hit. Loading bytes takes time; whether it beats recomputation depends on cache size, bandwidth, overlap with other work and model compute cost. No transfer-speed measurement was made here.

There is a timing tradeoff on writes too. LMCache's [lazy-offload design](https://github.com/LMCache/LMCache/blob/1d8716508371ab5c95de0d963160e1e64de467ef/docs/source/mp/lazy_offload.rst) can delay storing GPU state. Before storing later, it checks that the blocks still contain the expected hashes. If those blocks have already been reused, it skips the stale store rather than pretending the old state is present. The later request may have to recompute.

**Routing** chooses which worker handles a request. A perfect textual match is insufficient if the selected worker has neither the needed state nor a way to fetch it. Keeping related requests on one worker can improve locality; shared storage or cache-aware routing can broaden reuse. The reverse constraint also matters: sending everything to one warm worker can create a queue. This is a systems tradeoff, not evidence that any particular hosted provider uses these exact policies.

For a harness author, the important distinction is between **eligible** state, **retained** state, and **reachable** state. Stable request construction addresses the first. The engine and provider determine the latter two. Provider read/write counters show the reported outcome; they do not expose every internal cause of a miss.

Continue with [context edits and repair](01-inference-and-cache-repair.md), [provider contracts](02-provider-contracts.md), or [the live experiment](05-live-anthropic-experiment.md). Return to [the worklist](../README.md).
