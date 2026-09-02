import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import {
  Callout,
  CompareTable,
  OssRadarHero,
  PullQuote,
  SectionBreak,
  Sources,
  StatRow,
} from '../src/templates/components.js';

const RESEARCH_URL = 'https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/interp-engine';
const REPO = 'https://github.com/decoderesearch/interp-engine';
const SHA = '74716092e5bad8beca1e27193ec9980a8e9a4e85';
const AT = `${REPO}/blob/${SHA}`;

export const meta: PostMeta = {
  title: 'OSS Radar #06: Same Hook Name, Different Tensor',
  seoTitle: "interp-engine Review: Neuronpedia's Hooks on vLLM",
  alternativeHeadline:
    "interp-engine puts Neuronpedia's interpretability hooks on vLLM and checks every point against TransformerLens",
  date: '2026-09-02',
  description:
    "interp-engine puts Neuronpedia's hooks on vLLM and checks 34 points against TransformerLens and nnsight. Without CUDA you get the parity table, not the speed.",
  section: 'oss-radar',
  tags: ['oss-radar', 'interpretability', 'neuronpedia', 'vllm', 'transformerlens', 'steering'],
  layout: 'immersive',
  featured: false,
  images: [],
  slug: 'oss-radar-06-interp-engine',
};

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #06',
    date: 'September 2026',
    tags: 'open-source · interpretability · inference · steering',
    title: html`<h1>Same Hook Name, Different <em>Tensor</em></h1>`,
    subtitle: 'Two tensors shared one name. interp-engine names them apart and checks the names.',
    author: 'Goga Koreli',
    readTime: '15 min read',
    canvasMode: 'split',
    canvasSeed: 6,
  });
}

export function article() {
  return html`
<article class="post-content">
  <p class="post-lede">
    If you have ever read a Gemma model's insides through TransformerLens and asked for <code>hook_mlp_out</code>,
    there is a fair chance you read the wrong tensor and nothing told you. I measured it this week on my Mac: the
    wrong tensor is 87% similar to the right one, close enough to pass a glance and far enough to turn a trained
    lens into noise. Neuronpedia shipped that exact mistake in production.
    <a href="${REPO}" target="_blank" rel="noopener">interp-engine</a>, their new engine, is the fix: every tap gets
    one name, and every name is checked against the other tools. The rule you can apply today: on any model with a
    norm after the sublayer, ask for the contribution point, never the raw output, unless you mean it.
  </p>

  <p>
    The reason a wrong number survives is that nothing crashes. A model is a stack of layers with places between
    them where you can tap the numbers passing through. Interpretability work is largely reading those taps and
    training small lenses, called sparse autoencoders, to turn them into features a person can name. A lens is
    trained on one tap. Feed it the tap next door and it returns something with the right shape and the wrong
    meaning, and every chart downstream renders it with a straight face. Which tap a name points to depends on the
    model family, so code that was correct on Llama silently reads the wrong tap on Gemma.
  </p>

  <p>
    That is what happened at <a href="https://www.neuronpedia.org" target="_blank" rel="noopener">Neuronpedia</a>,
    the site where much of the field browses model internals. Its old server translated a TransformerLens hook name
    into the raw output for gemma-2-2b and fed it to a Gemma Scope lens trained on the normed one. The lens's own
    error said so, 9.8 where 0.26 was expected, with 8 active features instead of 85, but nobody was reading that
    number. The endpoint returned zeros and a whole lens went dark on the very text its dashboards were built from.
    The maintainers tell the story in the <a href="${AT}/docs/ENGINE_HOOK_MAPPINGS.md" target="_blank" rel="noopener">hook-mapping
    guide</a>, and then they built the engine. I read its code and ran it on my laptop. The correctness holds. The
    advertised speed needs a datacenter GPU.
  </p>

  ${StatRow({
    items: [
      { value: '2 → 1', label: html`tensors that shared one name, now named apart` },
      { value: '0.87', label: html`how close the wrong tensor looks to the right one on my Mac; close enough to fool a lens` },
      { value: '5e-4', label: html`largest disagreement between interp-engine and TransformerLens where the names match` },
    ],
  })}

  <h2>A wrong tensor with the right name</h2>

  <p>
    A Gemma-2 block is a sandwich. Each sublayer has a norm before it and a second norm after it, and only the
    normed output is added to the residual stream. TransformerLens's block-level <code>hook_mlp_out</code> fires
    after that second norm; the source comment says it does so "so hook_attn_out captures that which is added." On
    a Llama-shaped block there is no second norm, so the raw MLP output and the residual contribution are the same
    tensor and the name is safe. On Gemma they are two tensors, and the name picks one of them without telling you.
  </p>

  <p>
    interp-engine's answer is to spell both. <code>mlp_out</code> is the raw module output. <code>mlp_out_post</code>
    is what gets added. On families without a post-sublayer norm the second aliases the first, so asking for the
    contribution point is safe everywhere. The architecture facts detect the norm structurally, on a real block.
    Checking whether the model is called Gemma would not do: Gemma-1 has none of these norms and VaultGemma
    removes them.
  </p>

  ${CompareTable({
    headers: ['Point on a Gemma-2 block', 'What it is', 'TransformerLens', 'nnsight / nnterp'],
    rows: [
      ['resid_pre', 'block input', 'blocks.4.hook_resid_pre', 'layers_input[4]'],
      ['attn_out', 'raw attention output', 'blocks.4.attn.hook_out (v3 bridge)', 'attentions_output[4]'],
      ['attn_out_post', 'after the post-attention norm; what is added', 'blocks.4.hook_attn_out', '—'],
      ['resid_mid', 'after the attention add', 'blocks.4.hook_resid_mid', 'no accessor'],
      ['mlp_out', 'raw MLP output', 'blocks.4.mlp.hook_out (v3 bridge)', 'mlps_output[4]'],
      ['mlp_out_post', 'after the post-MLP norm; what is added', 'blocks.4.hook_mlp_out', '—'],
      ['resid_post', 'block output', 'blocks.4.hook_resid_post', 'layers_output[4]'],
    ],
    highlightRows: [4, 5],
  })}

  <p>
    The two highlighted rows are the trap. TransformerLens and nnterp default to different sides of the norm, both
    call their choice the MLP output, and the mapping between them is model-dependent. interp-engine ships a mapper
    that translates hook names in both directions and refuses names that have no faithful equivalent, such as a
    norm's <code>hook_normalized</code>, which TransformerLens fires between the scale and the gain and which no
    Hugging Face module ever outputs.
  </p>

  <h2>One address, three engines</h2>

  <p>
    The eager backend is plain Hugging Face. <code>load_model</code> loads the checkpoint, the point registry turns
    <code>Address("mlp_out_post", 4)</code> into a module, a tensor side and an optional transform, and
    <code>run_with_cache</code> installs ordinary PyTorch hooks around one forward pass. Nothing about this path
    needs a GPU. It is the same trick every interpretability library uses, with a fixed vocabulary on top and tests
    that reconstruct the sandwich equations to make sure raw and post outputs stay distinct.
  </p>

  <p>
    vLLM is where the engineering is. A hook fires while a CUDA graph is being recorded and never again during
    replay, so the hooked backend runs vLLM with <code>enforce_eager=True</code> and prefix caching off, or salted
    per request when a steer would poison a cached prefix. That keeps every point reachable and gives up most of
    what vLLM is for: gemma-2-2b decodes at 31.5 tokens per second hooked against 30.9 eager. The static backend
    goes the other way. It wraps the modules before graph capture so that a <code>copy_</code> into a capture buffer
    and an <code>add_</code> from a steering buffer are recorded into the graph and replayed with it. A self-test
    writes a sentinel and checks it survives replay. The price is that you declare the taps at load time, hold extra
    VRAM for the buffers, and lose most of the batch window, from 16,384 tokens to 1,024.
  </p>

  ${CompareTable({
    headers: ['gemma-2-2b on a B200, bf16', 'HF eager', 'hooked vLLM', 'static vLLM', 'vanilla vLLM'],
    rows: [
      ['decode, one stream (tok/s)', '30.9', '31.5', '214', '354'],
      ['decode, eight requests (aggregate tok/s)', '30.1', '226', '1,238', '1,733'],
      ['capture one middle point (ms)', '34.9', '85.3', '90.2', '—'],
      ['generate 32 tokens with capture (ms)', '1,132', '1,051', '185', '—'],
      ['logit lens, top 10 (ms)', '3.3', '202', '202', '205'],
    ],
    highlightRows: [1],
  })}

  <p>
    Read the headline against that table. The launch post says "over 40x the throughput vs HF transformers." The
    41× is the eight-request aggregate on the static backend, where eager serializes requests that vLLM batches. One
    stream is 6.9×. Static capture still costs vLLM 40% of its own decode speed, and a single capture or a logit lens
    is slower through vLLM than through eager, because the tensor has to cross a worker boundary. The benchmark is
    one B200, bf16, interp-engine 1.2.0 on vLLM 0.26, run on August 19. The audited release is 1.5.1 and now
    requires vLLM 0.28.
  </p>

  <h2>What a green cell means</h2>

  <p>
    The part of the repository I would keep if the engine vanished is the validator. It runs each model through
    eager, hooked vLLM, static vLLM, TransformerLens 2 and 3, and nnsight, and commits a per-point comparison. The
    thresholds are the fine print. A raw Hugging Face pair passes at a maximum absolute error of 0.002 and cosine
    similarity of 0.9999. A pair involving TransformerLens or a fused kernel passes at cosine 0.99 and relative
    error 0.5, falls to a warning below that, and fails only when shapes differ or cosine drops under 0.5. Layers
    are sampled at the first, middle and last block, plus three-quarter depth. Twenty-seven of the 34 points are
    compared; <code>resid_pre</code>, <code>mlp_in</code>, <code>attn_probs</code> and four others are not.
  </p>

  <p>
    gemma-2-2b is green across the board, and the detail file shows what green tolerates. The vLLM column is bf16
    against an fp32 reference. Whole-tensor cosines sit above 0.997; the worst single token on
    <code>final_norm</code> sits at 0.961. gpt2 is fp32 everywhere and differs nowhere. DeepSeek-V4-Flash fails on
    both vLLM backends at its last layer, with <code>mlp_out</code> at cosine 0.235, and because no other engine
    runs that model the table cannot say which side is wrong. Gemma-4 12B and 26B carry warnings on vLLM that the
    bug registry does not explain, while 31B passes.
  </p>

  ${Callout({
    label: 'Coverage',
    body: html`<p>
      The validator README says "50+ models." The committed table has 35 rows and the same page counts 31 verified
      architectures with 46 unaudited. Ordinary CI scores those committed files without loading weights, runs gpt2
      parity on CPU, two sub-billion models, and one L4 job with real vLLM. The full cross-engine sweep is a manual
      workflow on self-hosted hardware, so a green cell carries the engine and vLLM version it was made with, not
      today's.
    </p>`,
  })}

  <h2>Whose layer is this</h2>

  <p>
    On August 21, Neuronpedia's repository took a
    <a href="https://github.com/hijohnnylin/neuronpedia/commit/17bc39171bf11c68bf5bf52013b11afe8e8b1f81" target="_blank" rel="noopener">1,119-file
    commit</a> whose message reads "Migrated inference, autointerp and graph services to new engine." The inference
    README now says the engine "replaced the previous TransformerLens + nnsight stack," and the graph service depends
    on interp-engine with no TransformerLens in its manifest. In January the same site said nnsight powered its
    backends. That is the maintainer thesis in one move: interpretability at production scale runs inside a serving
    engine, and the semantic layer that names the points belongs to whoever runs it.
  </p>

  <p>
    The skeptic's case is that this is Neuronpedia's hosting convenience and researchers will keep their tools. It
    has evidence. Nothing differentiates through vLLM; the worker runs under inference mode and its kernels have no
    backward. The vLLM worker exposes a closed list of remote calls, so an arbitrary patching function cannot cross
    into it, though the eager backend does accept callables and dotted module paths. TransformerLens is not
    retreating: version 3.8.1 shipped the day after the launch post, and its TransformerBridge now wraps native
    Hugging Face models where version 2 reimplemented them. nnsight 0.7.0 ships its own vLLM server. The incumbents are
    converging on the same design from the other side.
  </p>

  <p>
    I read the field as segmenting rather than switching. interp-engine wants repeatable, concurrent, product-facing
    inference. TransformerLens wants the research surface. nnsight wants programmable traces and remote execution.
    The contest that is left is over who names the points, and that is why the validator is the durable piece. It
    already records a real production failure, six execution paths, and version-pinned diffs. Whether it becomes a
    standard other engines score against is speculative; no outside project uses its vocabulary yet, and the
    repository had zero issues and zero pull requests from anyone else when I checked.
  </p>

  <p>
    The maintenance picture is thin in the way a two-week-old project is thin. Thirty-one commits since August 20,
    one human author, thirteen commits co-signed by the Cursor agent, seven releases in twelve days. The vLLM
    integration monkeypatches the worker's <code>load_model</code>, reaches into private model-runner attributes,
    and pins nothing above its floor. The README says Gemma 4 needs transformers 5.14.1; the Gemma-4 validator cell
    ran on 5.16.1. Pin the engine, vLLM, transformers and torch together, and replay your own parity before you
    move any of them.
  </p>

  <h2>What runs on my Mac</h2>

  <p>
    I care about this engine because I run the workload it serves. My research harness extracts contrastive
    activation vectors from gemma-2-2b through TransformerLens 3.5.1 on Apple Silicon and injects them at
    <code>resid_post</code> to measure how many directions a frozen model can hold at once. Every number I have
    depends on reading the tensor I think I am reading. So the question I could answer on a laptop was the one the
    validator answers on a B200: does the eager backend agree with the tool I already trust, and does the trap show
    up when I pair the names naively?
  </p>

  <p>
    Two things surprised me before a single forward pass. First, automatic device selection would have put
    gemma-2-2b on the CPU. The checkpoint is bf16-native and the engine treats MPS as unsafe for bf16 weights, so
    unless you ask for the device and a dtype explicitly you get a correct, slow run and no warning about speed. I
    asked for MPS and fp32. Second, TransformerLens greets that same device with a warning that "MPS backend may
    produce silently incorrect results" on the PyTorch I have. Two tools, two different opinions about my machine,
    and no third party to break the tie except the numbers.
  </p>

  <p>
    The numbers broke the tie. I captured four points at five layers on both models with one 29-token prompt, both
    engines in fp32 on MPS, TransformerLens loaded without weight folding so the tensors are comparable. Where the
    names mean the same tensor, the two engines agree to floating-point noise: the largest absolute difference across
    twenty gemma-2-2b comparisons is 5.3e-4, at the last layer's <code>resid_post</code>.
    Then I paired the names the way Neuronpedia's old server did, raw <code>mlp_out</code> against
    <code>blocks.N.hook_mlp_out</code>, and the same run reproduced the trap.
  </p>

  ${CompareTable({
    headers: ['Last-token cosine', 'gemma-2-2b L0', 'L13', 'L25', 'gpt2, every layer'],
    rows: [
      ['mlp_out_post ↔ hook_mlp_out (matched)', '0.99999', '1.00000', '1.00000', '1.00000'],
      ['mlp_out ↔ hook_mlp_out (naive)', '0.874', '0.803', '0.895', '1.00000'],
      ['attn_out_post ↔ hook_attn_out (matched)', '1.00000', '0.99999', '1.00000', '1.00000'],
      ['attn_out ↔ hook_attn_out (naive)', '0.829', '0.712', '0.791', '1.00000'],
    ],
    highlightRows: [1, 3],
  })}

  <p>
    A cosine of 0.87 is the dangerous kind of wrong. It is far from random, it has the right shape, and an SAE
    trained on the other tensor will encode it into something that looks like sparse features. On gpt2 the same
    naive pairing is exact, which is why code that was tested on gpt2 carries the bug to Gemma without noticing.
    The maximum absolute difference on the naive gemma rows runs from 15 to 272; on the matched rows it never
    passes 0.001.
  </p>

  <p>
    Steering held too. I built a contrastive vector the way my harness does, six sentiment pairs, mean difference at
    the final token of <code>resid_post</code>, layer 13 on gemma-2-2b and layer 6 on gpt2, and injected it at four
    times its own norm from the last prompt token onward. interp-engine's <code>steer</code> takes that mask as a
    list of excluded prompt positions and applies the delta to every generated token; a hand-written TransformerLens
    hook did the same arithmetic. Next-token logits differed by at most 7.7e-5 with the same argmax, and twenty greedy
    tokens came out identical on both models. At that strength the text is already degenerate, which is the point:
    the two engines agree even where the model has stopped making sense.
  </p>

  <p>
    Speed on a laptop is the part the benchmark cannot tell you, so I measured it: a 128-token prompt, 64 greedy
    tokens, fp32 on MPS, one warm-up and three timed runs, capturing <code>resid_post</code> at one layer throughout.
    The two engines capture differently. interp-engine generates and then runs one extra forward over the finished
    sequence to collect the point; TransformerLens hooks each position during cached decoding. The numbers are
    medians in tokens per second, with the sampled peak of Metal driver memory beside them.
  </p>

  ${CompareTable({
    headers: ['MPS, fp32, 128 + 64 tokens', 'plain transformers, no hooks', 'interp-engine eager + capture', 'TransformerLens + caching hook'],
    rows: [
      ['gemma-2-2b (tok/s)', '7.6', '6.2', '1.9'],
      ['gemma-2-2b peak driver memory', '11.1 GB', '12.4 GB', '17.0 GB'],
      ['gpt2 (tok/s)', '57.8', '85.9', '39.6'],
    ],
  })}

  <p>
    Nobody gets the B200 story here, and nobody should expect to. What the table does say is that the eager backend
    costs almost nothing over bare transformers on the model I use, and that my current harness is the slow one. On
    gpt2 interp-engine's own decode loop beats <code>generate</code> outright. On gemma-2-2b it gives back a fifth
    of the speed for the recapture pass and stays 4.6 gigabytes under TransformerLens on a machine with 24.
  </p>

  <p>
    What changed in my harness is small and specific. My vectors come from <code>resid_post</code>, which is the
    one name every engine agrees on, so the trap was not in my extraction. It is waiting in the next phase, where I
    move from raw directions to a Gemma Scope SAE basis and the SAE's declared hook is exactly the kind of name that
    means two tensors. I now translate every hook string through the mapper before I trust it, and I keep the
    naive-pairing check in the test suite as a tripwire.
  </p>

  <h2>Who should use it</h2>

  <p>
    Try it now if you serve capture or residual steering to many concurrent callers on Linux with a CUDA card, you
    can fix the taps you need, and you can pin the whole stack and replay parity before upgrades. The verified
    configurations are Qwen3-4B on an A40 and a B200. Try the eager backend now if you consume block-level hook
    names from someone else's SAE, transcoder or lens and want a mapper that refuses to guess.
  </p>

  <p>
    Wait if you expected the speedup on a Mac, a free Colab, or a consumer GPU; nothing is verified there. Wait if
    your work needs gradients through the model, arbitrary patching inside the fast path, head-level tensors on more
    than one GPU, neuron-basis points on a sparse MoE, or exact parity on DeepSeek-V4-Flash or Gemma-4 12B and 26B.
  </p>

  <p>
    Two results would change this verdict. A fp16 eager run on Apple Silicon across every applicable point at four
    layers and three prompt lengths, passing at mean cosine 0.9999 and max absolute error 0.002 with identical
    greedy tokens, would move Mac users from "unverified" to "supported." A Qwen3-4B static run on one RTX 4090 at
    8,192 context, holding at least 5× one-stream and 20× aggregate over eager with no cross-request contamination,
    would make the headline relevant to hardware researchers own.
  </p>

  ${PullQuote({
    content: html`<p>A hook name is a promise about a tensor. This engine is the first one I have used that writes the promise down and checks it.</p>`,
  })}

  <p>
    interp-engine earns a place in a CUDA serving stack today and a place in any harness that consumes hook names,
    and it does not yet earn the speed story on the hardware most researchers have. This is the third issue in a
    row where the interesting move happens inside a runtime: <a href="/oss-radar-04-the-agent-multiplexer-is-becoming-a-runtime">Herdr</a>
    turned a terminal multiplexer into one, <a href="/oss-radar-05-bun-1-4">Bun 1.4</a> pulled package jobs into
    one, and here a serving engine becomes the bench interpretability has to run on. The next issue stays there:
    DFlash 2, a block-diffusion drafter for speculative decoding that also only started to matter once it landed
    inside vLLM and llama.cpp, and that I can run on this Mac through MLX.
  </p>

  ${SectionBreak()}

  ${Sources({
    items: [
      {
        claim: 'interp-engine repository at the audited commit, Apache-2.0, 34 points, benchmark table',
        why: 'Every code claim in this issue is pinned to this commit; the README carries the throughput table the headline is read against.',
        ref: 'decoderesearch/interp-engine @ 7471609',
        url: `${AT}/README.md`,
      },
      {
        claim: 'Launch post: "34 standardized hook points," "over 40x the throughput vs HF transformers," "this is the v1"',
        why: 'The maintainers’ own framing, quoted so the reader can judge the headline against the benchmark rows.',
        ref: 'Neuronpedia blog, 2026-08-31',
        url: 'https://www.neuronpedia.org/blog/interp-engine',
      },
      {
        claim: 'Neuronpedia served gemmascope-mlp-16k off the raw MLP output; FVU 9.8 against 0.26; L0 8 against 85; the TransformerLens naming collision',
        why: 'The production failure that motivates the engine and the mapping rules, told by the people who made the mistake.',
        ref: 'ENGINE_HOOK_MAPPINGS.md',
        url: `${AT}/docs/ENGINE_HOOK_MAPPINGS.md`,
      },
      {
        claim: 'Which of the 34 points each backend serves; the six unreachable on vLLM; attention matrices by recompute',
        why: 'Defines the contract the "34 points" claim actually makes.',
        ref: 'SUPPORTED_POINTS.md',
        url: `${AT}/docs/SUPPORTED_POINTS.md`,
      },
      {
        claim: 'TransformerLens applies Gemma-2’s post-sublayer norm before hook_attn_out and hook_mlp_out',
        why: 'The source comment that explains why the block-level name is the contribution, not the raw output.',
        ref: 'transformer_block.py, TransformerLens 3.5.1',
        url: 'https://github.com/TransformerLensOrg/TransformerLens/blob/v3.5.1/transformer_lens/components/transformer_block.py',
      },
      {
        claim: 'Validator tolerances: 0.002 / 0.9999 for raw HF pairs, cosine 0.99 and relative error 0.5 otherwise; sampled layers; 27 compared points',
        why: 'What a green cell means is decided here, not in the summary table.',
        ref: 'validator/comparison/spec.py',
        url: `${AT}/validator/comparison/spec.py`,
      },
      {
        claim: 'gemma-2-2b cross-engine result: vLLM bf16 38 agree, TransformerLens 2 and 3 36 agree, nnsight 32 agree; worst-token cosine 0.961',
        why: 'The committed evidence behind the green cell for the model I use.',
        ref: 'gemma-2-2b result details',
        url: `${AT}/validator/comparison/results/google/gemma-2-2b/0_result_details.md`,
      },
      {
        claim: 'DeepSeek-V4-Flash fails both vLLM backends at layer 42 with mlp_out cosine 0.235',
        why: 'The clearest exception to any blanket correctness claim.',
        ref: 'DeepSeek-V4-Flash result details',
        url: `${AT}/validator/comparison/results/deepseek-ai/DeepSeek-V4-Flash-0731/0_result_details.md`,
      },
      {
        claim: 'Full benchmark report: B200, bf16, interp-engine 1.2.0, vLLM 0.26, 2026-08-19; capture, steering and lens latencies',
        why: 'The environment and the slower-than-eager capture and lens rows that the README table omits.',
        ref: 'benchmarks/results-latest.md',
        url: `${AT}/benchmarks/results-latest.md`,
      },
      {
        claim: 'Hooked vLLM defaults to enforce_eager and no prefix caching; static taps recorded into CUDA graphs; batch window 16,384 to 1,024',
        why: 'The mechanism and the price of each backend.',
        ref: 'PERFORMANCE.md',
        url: `${AT}/docs/PERFORMANCE.md`,
      },
      {
        claim: 'Neuronpedia migrated inference, autointerp and graph services to interp-engine in one 1,119-file commit on 2026-08-21',
        why: 'The first production deployment and the reversal from the nnsight stack announced in January.',
        ref: 'hijohnnylin/neuronpedia @ 17bc391',
        url: 'https://github.com/hijohnnylin/neuronpedia/commit/17bc39171bf11c68bf5bf52013b11afe8e8b1f81',
      },
      {
        claim: 'Neuronpedia inference README: the engine "replaced the previous TransformerLens + nnsight stack"',
        why: 'Confirms the outcome of the migration in the maintainers’ own words; live main, not pinned.',
        ref: 'apps/inference/README.md',
        url: 'https://github.com/hijohnnylin/neuronpedia/blob/main/apps/inference/README.md',
      },
      {
        claim: 'TransformerLens 3.8.1 released 2026-09-01 after weekly August releases',
        why: 'Kills the story that the incumbent is dormant.',
        ref: 'transformer-lens on PyPI',
        url: 'https://pypi.org/project/transformer-lens/',
      },
      {
        claim: 'nnsight 0.7.0 adds a vLLM-backed server with the same trace interface',
        why: 'The rival converging on the serving-engine design from the research side.',
        ref: 'nnsight releases',
        url: 'https://github.com/ndif-team/nnsight/releases',
      },
      {
        claim: 'Verified GPU fits: Qwen3-4B on A40 and B200; no passing consumer-GPU row',
        why: 'Where the speed claim has been demonstrated and where it has not.',
        ref: 'gpu-sizer/VERIFIED.md',
        url: `${AT}/gpu-sizer/VERIFIED.md`,
      },
      {
        claim: 'MPS device selection: bf16-native checkpoints fall back to CPU unless fp16 is requested',
        why: 'The default that would have silently moved my run off the GPU.',
        ref: 'interp_engine/select.py',
        url: `${AT}/interp_engine/select.py`,
      },
      {
        claim: 'Reproduction scripts, JSON results and environment for the Apple Silicon parity, steering and throughput runs',
        why: 'Every number in the laptop section comes from these files; rerun them to check me.',
        ref: 'Research artifacts',
        url: RESEARCH_URL,
      },
    ],
  })}
</article>
`;
}
