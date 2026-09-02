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
const MANIFEST_URL = 'https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/interp-engine/research-footprint.json';
const FOOTPRINT_NOTE_URL = 'https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/interp-engine/13-research-footprint.md';
const REPO = 'https://github.com/decoderesearch/interp-engine';
const SHA = '74716092e5bad8beca1e27193ec9980a8e9a4e85';
const AT = `${REPO}/blob/${SHA}`;

const researchFootprint = {
  sessions: 14,
  artifacts: 11,
  totalTokens: 135_582_362,
  inputTokens: 135_031_648,
  cachedInputTokens: 130_725_478,
  outputTokens: 550_714,
  reasoningOutputTokens: 109_660,
  wallClockMinutes: 143,
  startedAt: '2026-09-02T03:42:21.704Z',
  measuredAt: '2026-09-02T06:05:20.659Z',
  provenanceUrl: RESEARCH_URL,
};

function compactTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/Los_Angeles',
  }).format(new Date(value));
}

export const meta: PostMeta = {
  title: "OSS Radar #06: interp-engine, Neuronpedia's New Interpretability Engine, Tested on a Mac",
  seoTitle: "interp-engine Review: Neuronpedia's Interpretability Engine",
  alternativeHeadline:
    'Same hook name, different tensor: interp-engine names canonical taps once and records cross-engine checks for 27 point types',
  date: '2026-09-02',
  description:
    "interp-engine, Neuronpedia's new interpretability engine, names 34 hook points once and compares 27 across engines. I audited the code and ran it on a Mac.",
  section: 'oss-radar',
  tags: ['oss-radar', 'interpretability', 'neuronpedia', 'vllm', 'transformerlens', 'steering'],
  layout: 'immersive',
  featured: false,
  images: [],
  slug: 'oss-radar-06-interp-engine',
  researchFootprint,
};

export function preamble() {
  return OssRadarHero({
    issueNum: 'Issue #06',
    date: 'September 2026',
    tags: 'open-source · interpretability · inference · steering',
    title: html`<h1>interp-engine, Neuronpedia's New Interpretability Engine, <em>Tested on a Mac</em></h1>`,
    subtitle: 'Two tensors shared one hook name. The new engine names them apart and checks the names; I checked it on Apple Silicon.',
    author: 'Goga Koreli',
    readTime: '17 min read',
    canvasMode: 'split',
    canvasSeed: 6,
    footprint: {
      label: `${researchFootprint.wallClockMinutes} min · ${researchFootprint.sessions} sessions · ${researchFootprint.artifacts} artifacts · ${compactTokenCount(researchFootprint.totalTokens)} measured tokens`,
      url: RESEARCH_URL,
    },
  });
}

export function article() {
  return html`
<article class="post-content">
  <p class="post-lede">
    On August 31 the team behind <a href="https://www.neuronpedia.org" target="_blank" rel="noopener">Neuronpedia</a>,
    the open-source interpretability platform, announced the engine it had already moved into production after
    serving the wrong tensor from a Gemma model for a while with no alarm.
    <a href="${REPO}" target="_blank" rel="noopener">interp-engine</a> (Apache-2.0) gives each measurement point
    inside a model one name across model families and records cross-engine checks for 27 of its 34 point types;
    each model and engine covers a subset. I audited the code and ran it on a laptop, the first outside run I could
    find: where the names match, it agreed with TransformerLens to 5.3e-4; the advertised speed was measured on a
    datacenter GPU. Read this if you have ever
    trusted a hook name. You will learn how a wrong tensor passes for a right one, what "checked" tolerates, which
    hardware gets the speed, and the one rule that prevents the mistake today.
  </p>

  <ul>
    <li>
      <strong>The mistake is easy to make, and I measured it.</strong> On gemma-2-2b, the raw MLP output and the tensor
      TransformerLens calls <code>hook_mlp_out</code> agree at cosine 0.87: wrong, and plausible. On gpt2 they are
      identical, which is how code tested on one model carries the bug to the other.
    </li>
    <li>
      <strong>Where the names match, the engines agree.</strong> On my Mac, interp-engine and TransformerLens differ
      by at most 5.3e-4 across twenty comparisons, and a steering vector pushed through either produces the same twenty
      tokens.
    </li>
    <li>
      <strong>"Over 40x" is eight concurrent requests on a datacenter GPU with fixed taps.</strong> One stream is
      6.9×. My gemma-2-2b laptop run got no speedup, and left to its defaults the engine would have run it on my CPU.
    </li>
    <li>
      <strong>A green cell has a tolerance.</strong> Against TransformerLens it means cosine 0.99 and relative error
      0.5. The committed table has 35 models, not the "50+" the README says, and DeepSeek-V4-Flash fails.
    </li>
    <li>
      <strong>The validator will outlast the engine.</strong> Neuronpedia moved three services onto interp-engine in
      one commit; TransformerLens now wraps native Hugging Face models and nnsight now serves traces through vLLM;
      the project's distinctive piece is the cross-engine comparison.
    </li>
    <li>
      <strong>The rule:</strong> on any model with a norm after the sublayer, ask for the contribution point, never
      the raw output, unless you mean it.
    </li>
  </ul>

  <p>
    The reason a wrong number survives is that nothing crashes. A model is a stack of layers with places between
    them where you can tap the numbers passing through. One common workflow reads a tap and trains a small model on
    it, a sparse autoencoder, that turns those numbers into features a person can name. The autoencoder learns one
    tap. Feed it the tap next door and it returns something with the right shape and the wrong meaning, and the
    charts downstream still look valid. Which tap a name points to depends on the model family, so code that was
    correct on Llama reads the wrong tap on Gemma without a warning.
  </p>

  <p>
    That is what happened at Neuronpedia. Its old server translated a TransformerLens hook name into the raw
    output for gemma-2-2b and fed it to a Gemma Scope autoencoder trained on the normed one. The autoencoder's own
    reconstruction error said so, 9.8 where 0.26 was expected, with 8 active features instead of 85. The endpoint returned zeros and the autoencoder produced no features on the very text
    its dashboards were built from. The engine that replaced that server documents the failure in its
    <a href="${AT}/docs/ENGINE_HOOK_MAPPINGS.md" target="_blank" rel="noopener">hook-mapping guide</a>.
  </p>

  ${StatRow({
    items: [
      { value: '2 → 1', label: html`tensors that shared one name, now named apart` },
      { value: '0.87', label: html`cosine between the wrong tensor and the right one on my Mac; close enough to look right` },
      { value: '5.3e-4', label: html`largest disagreement between interp-engine and TransformerLens where the names match` },
    ],
  })}

  <h2>A wrong tensor with the right name</h2>

  <p>
    The mistake is possible because Gemma's blocks are built differently from Llama's, and one tool's name hides
    the difference. A Gemma-2 block normalizes both before and after each sublayer, what the code calls a sandwich norm,
    and only the normed output is added to the residual stream. TransformerLens applies that second norm before both
    of its block-level hooks; its attention comment reads: <code>We do it before the hook so hook_attn_out captures
    "that which is added to the residual stream"</code>, and the MLP path follows the same order. On a Llama-shaped
    block there is no second norm, so the raw MLP output and the residual contribution are the same
    tensor and the name is safe. On Gemma they are two tensors, and the name picks one of them without telling you.
  </p>

  <p>
    interp-engine's answer is to name both. <code>mlp_out</code> is the raw module output. <code>mlp_out_post</code>
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
    The two highlighted rows are where the mistake happens. TransformerLens and nnterp default to different sides of the norm, both
    call their choice the MLP output, and the mapping between them is model-dependent. interp-engine ships a mapper
    that translates hook names in both directions and refuses names that have no faithful equivalent, such as a
    norm's <code>hook_normalized</code>, which TransformerLens fires between the scale and the gain and which no
    Hugging Face module ever outputs. A name is not a tensor. Use the model-aware mapper when you can, and when you
    cannot, ask for the contribution point.
  </p>

  <h2>One address, three engines</h2>

  <p>
    The next two sections are for people who will run the thing; the rest of the article does not depend on them.
    The same request can run three ways, and only the static path delivers the advertised single-stream gain.
  </p>

  <p>
    The eager backend is plain Hugging Face. <code>load_model</code> loads the checkpoint, the point registry turns
    <code>Address("mlp_out_post", 4)</code> into a module, a tensor side and an optional transform, and
    <code>run_with_cache</code> installs ordinary PyTorch hooks around one forward pass. Nothing about this path
    needs a GPU. It is a conventional hook-based capture path, with a fixed vocabulary on top and tests
    that reconstruct the sandwich equations to make sure raw and post outputs stay distinct.
  </p>

  <p>
    vLLM is where the engineering is. A hook fires while a CUDA graph is being recorded and never again during
    replay, so the hooked backend runs vLLM with <code>enforce_eager=True</code>. Prefix caching stays on; capture
    and steering requests get a unique cache salt so a steered prefix is never reused, while plain generation shares
    prefixes as usual. That keeps 28 of the 34 points reachable and gives up the single-stream gain: gemma-2-2b
    decodes at 31.5 tokens per second hooked against 30.9 eager, though batching still lifts eight requests to 226
    aggregate against 30.1. The static backend makes the opposite trade. It wraps the modules before graph capture, so
    graph capture records a <code>copy_</code> into a capture buffer and an <code>add_</code> from a steering buffer
    and replays them with the graph. A self-test writes a sentinel and checks it survives replay. The price is that you declare the taps at load time, hold extra
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
    The launch post says "Over 40x the throughput vs HF transformers." The 41× is the eight-request aggregate on the static backend, where eager serializes requests that vLLM batches. One
    stream is 6.9×. Static capture still costs vLLM 40% of its own decode speed, and a single capture or a logit lens
    is slower through vLLM than through eager, because the tensor has to cross a worker boundary. The benchmark is
    one B200, bf16, interp-engine 1.2.0 on vLLM 0.26.0, run on August 19. The audited release is 1.5.1 and now
    requires vLLM 0.28.0. The eager path runs on CPU, MPS or CUDA; the published speed evidence applies to datacenter
    CUDA with taps you declare up front.
  </p>

  <h2>What a green cell means</h2>

  <p>
    The part of the repository I would keep if the engine vanished is the validator. It is also where "checked
    against the other tools" turns from a slogan into a number with a tolerance. It runs each model through
    six engine paths, eager, hooked vLLM, static vLLM, TransformerLens 2 and 3, and nnsight, records the point-engine
    pairs each path supports, and leaves unsupported and unasked cells explicit. The thresholds decide what a green cell means. A raw Hugging Face pair passes at a maximum absolute error of 0.002 and cosine
    similarity of 0.9999. A pair involving TransformerLens or a fused kernel normally passes at cosine 0.99 and
    relative error 0.5, and named checkpoint waivers can lower the cosine gate. A tolerance miss becomes a warning. A
    missing signal, a shape mismatch, or cosine below 0.5 is a failure. The validator samples the first, middle and
    last layers, adds three-quarter depth for trunks with at least 16 layers, and may add an early attending layer
    for hybrid trunks. It compares 27 of the 34 points; seven,
    including <code>resid_pre</code> and <code>attn_probs</code>, are excluded.
  </p>

  <p>
    Every stored cell for gemma-2-2b is green, and the detail file shows what green tolerates. The vLLM column is bf16
    against an fp32 reference. Whole-tensor cosines sit above 0.997; the worst single token on
    <code>final_norm</code> sits at 0.961. gpt2 is fp32 everywhere and differs nowhere. DeepSeek-V4-Flash fails on
    both vLLM backends at its last layer, with <code>mlp_out</code> near cosine 0.235, and because no other engine
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

  <p>
    Read green as "within tolerance, on that engine and that vLLM, on that day." It is useful evidence, and it is
    still not a certificate. For the model you care about, rerun the comparison before you trust a
    point.
  </p>

  <h2>Whose layer is this</h2>

  <p>
    Back to the plain-language question: does this change who owns the way we look inside models? On August 21, Neuronpedia's repository took a
    <a href="https://github.com/hijohnnylin/neuronpedia/commit/17bc39171bf11c68bf5bf52013b11afe8e8b1f81" target="_blank" rel="noopener">1,119-file
    commit</a> whose message reads "interp-engine: Migrated inference, autointerp and graph services to new engine."
    The inference
    README now says the engine "replaced the previous TransformerLens + nnsight stack," and the graph service depends
    on interp-engine with no TransformerLens in its manifest. In January the same site said nnsight powered several
    of its inference backends. That is the maintainer thesis in one move: interpretability at production scale runs inside a serving
    engine, and the semantic layer that names the points belongs to whoever runs it.
  </p>

  <p>
    The skeptic's case is that this is Neuronpedia's hosting convenience and researchers will keep their tools. It
    has evidence. Nothing differentiates through vLLM; the worker runs under inference mode and its kernels have no
    backward. The vLLM worker exposes a closed list of remote calls, so an arbitrary patching function cannot cross
    into it, though the eager backend does accept callables and dotted module paths. TransformerLens is not
    retreating: version 3.8.1 shipped the day after the launch post, and its TransformerBridge now wraps native
    Hugging Face models where the legacy HookedTransformer path used its own model implementations. nnsight 0.7.0
    ships its own vLLM server. Both are moving toward the design interp-engine started from.
  </p>

  <p>
    I read the field as segmenting rather than switching: interp-engine is built for repeatable, concurrent,
    product-facing inference, while TransformerLens keeps the research surface and nnsight keeps programmable traces
    and remote execution. The contest that is left is over who names the points, and that is why the validator is the durable piece. It
    already records a real production failure, six execution paths, and version-pinned diffs. Whether it becomes a
    standard other engines score against is speculative; no outside project uses its vocabulary yet, and when I
    checked on September 1 the repository had no issues and no pull requests from anyone but the maintainer and
    Dependabot.
  </p>

  <p>
    The maintenance picture is two weeks old. Thirty-one commits since August 20, one human author under two git
    identities, thirteen commits with Cursor co-author trailers, seven release tags in twelve days. The vLLM
    integration monkeypatches the worker's <code>load_model</code>, reaches into private model-runner attributes,
    and pins nothing above its floor. The README says Gemma 4 needs transformers 5.14.1; the Gemma-4 validator cell
    ran on 5.16.1. Pin the engine, vLLM, transformers and torch together, and replay your own parity before you
    move any of them. The layer is contested and young; the comparison table is the part worth keeping whatever
    happens to the engine. It is also the third issue in a row where the important change happens inside a
    runtime, after <a href="/oss-radar-04-the-agent-multiplexer-is-becoming-a-runtime">Herdr</a> and
    <a href="/oss-radar-05-bun-1-4">Bun 1.4</a>.
  </p>

  <h2>What runs on my Mac</h2>

  <p>
    I care about this engine because I run the workload it serves. My research harness extracts contrastive
    activation vectors from gemma-2-2b through TransformerLens 3.5.1 on Apple Silicon and injects them at
    <code>resid_post</code> to measure how many directions a frozen model can hold at once. Every number I have
    depends on reading the tensor I think I am reading. So the question I could answer on a laptop was the one the
    validator answers on a B200: does the eager backend agree with the tool I already trust, and does the mistake
    show up when I pair the names naively?
  </p>

  <p>
    Automatic device selection would have put
    gemma-2-2b on the CPU. The checkpoint is bf16-native and the engine treats MPS as unsafe for bf16 weights, so
    unless you ask for the device and a dtype explicitly you get a correct, slow run and no warning about speed. I
    asked for MPS and fp32. TransformerLens prints a warning for that same device: "MPS backend may
    produce silently incorrect results" on the PyTorch I have. The two tools disagree about my machine, and only
    the numbers can settle it.
  </p>

  <p>
    The numbers broke the tie. I captured four points at five layers on both models with one 29-token prompt, both
    engines in fp32 on MPS, TransformerLens loaded without weight folding so the tensors are comparable. Where the
    names mean the same tensor, the two engines agree to floating-point noise: the largest absolute difference across
    twenty gemma-2-2b comparisons is 5.3e-4, at the last layer's <code>resid_post</code>.
    Then I paired the names the way Neuronpedia's old server did, raw <code>mlp_out</code> against
    <code>blocks.N.hook_mlp_out</code>, and the same run reproduced the mistake.
  </p>

  ${CompareTable({
    headers: ['Last-token cosine', 'gemma-2-2b L0', 'L13', 'L25', 'gpt2, every layer'],
    rows: [
      ['mlp_out_post ↔ hook_mlp_out (matched)', '1.00000', '1.00000', '1.00000', '1.00000'],
      ['mlp_out ↔ hook_mlp_out (naive)', '0.874', '0.803', '0.895', '1.00000'],
      ['attn_out_post ↔ hook_attn_out (matched)', '1.00000', '1.00000', '1.00000', '1.00000'],
      ['attn_out ↔ hook_attn_out (naive)', '0.829', '0.712', '0.791', '1.00000'],
    ],
    highlightRows: [1, 3],
  })}

  <p>
    A cosine of 0.87 is the kind of wrong that goes unnoticed: far from random, with the right shape, and nothing
    downstream refuses it. On gpt2 the same
    naive pairing is exact, which is why code that was tested on gpt2 carries the bug to Gemma without noticing.
    The maximum absolute difference on the naive gemma rows runs from 15 to 272; on the matched rows it never
    passes 0.001.
  </p>

  <p>
    Steering held too. I built a contrastive vector the way my harness does, six sentiment pairs, mean difference at
    the final token of <code>resid_post</code>, layer 13 on gemma-2-2b and layer 6 on gpt2, and injected it at four
    times the vector from the last prompt token onward. interp-engine's <code>steer</code> takes that mask as a
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
    Nobody gets the B200 story here, and nobody should expect to. On gemma-2-2b, interp-engine's generate-then-recapture
    path is 19% slower than bare transformers and 3.3× faster than this TransformerLens per-position caching loop,
    while staying 4.5 gigabytes under it on a machine with 24 GiB. Those are two capture strategies doing different
    work, not a ranking of engines. On gpt2 interp-engine's own decode loop beats <code>generate</code> outright.
  </p>

  <p>
    What changed in my harness is small and specific. My vectors come from <code>resid_post</code>, which is the
    one name every engine agrees on, so the mistake was not in my extraction. It is waiting in the next phase, where I
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
    Wait if you expected the speedup on a Mac, a free Colab, or a consumer GPU; no vLLM or static result is verified
    there. Wait if your research needs the fast path to do what eager does: gradients through the model, arbitrary
    patching, head-level tensors across GPUs, or neuron-basis points on a sparse MoE. Wait if you need exact parity
    on the architectures the table flags, DeepSeek-V4-Flash and Gemma-4 12B and 26B.
  </p>

  <p>
    Two results would change this verdict. Comparing interp-engine eager against same-dtype plain-transformers hooks
    on this Apple M5 at fp16, with at least eight prompts of 64, 512 and 2,048 tokens, every applicable point at
    layers 0, 13, 19 and 25, and 32-token greedy generation, passing at exact shapes, mean cosine 0.9999, max absolute
    error 0.002, no token below cosine 0.99 and identical greedy tokens, would verify that configuration. A bf16 Qwen3-4B comparison on one RTX 4090 with the same pinned
    stack, 8,192-token context, prompts, generation length and acceptance check in eager and static modes, holding at
    least 5× one-stream and 20× eight-request aggregate throughput with no cross-request contamination, would make
    the headline relevant to hardware that researchers own.
  </p>

  ${PullQuote({
    content: html`<p>A hook name is a claim about which tensor you get. This engine is the first one I have used that writes the claim down and checks it.</p>`,
  })}

  <p>
    interp-engine belongs in a CUDA serving stack today and in any harness that consumes hook names, and it does not
    yet justify the speed claim on the hardware most researchers have.
  </p>

  ${SectionBreak()}

  ${Sources({
    items: [
      {
        claim: 'interp-engine repository at the audited commit, Apache-2.0, 34 points, benchmark table',
        why: 'Every interp-engine code claim in this issue is pinned to this commit; the README carries the throughput table the headline is read against.',
        ref: 'decoderesearch/interp-engine @ 7471609',
        url: `${AT}/README.md`,
      },
      {
        claim: 'Launch post: "34 standardized hook points across all architectures" and "Over 40x the throughput vs HF transformers"',
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
        why: 'The source comment that explains why the block-level name means the residual contribution.',
        ref: 'transformer_block.py, TransformerLens 3.5.1',
        url: 'https://github.com/TransformerLensOrg/TransformerLens/blob/4ba2187b182faf964225c6eb9076c858cada0672/transformer_lens/components/transformer_block.py',
      },
      {
        claim: 'TransformerLens 3’s TransformerBridge wraps native Hugging Face models; the legacy HookedTransformer path used its own implementations',
        why: 'Sources the claim that the incumbent is converging on the native-model design.',
        ref: 'TransformerLens v3 migration guide',
        url: 'https://transformerlensorg.github.io/TransformerLens/content/migrating_to_v3.html',
      },
      {
        claim: 'Validator coverage: "50+ models" in the README against 35 committed rows, 31 verified architectures and 46 unaudited; ordinary CI scores committed files',
        why: 'The coverage numbers behind the Coverage note come from this page and the workflow files beside it.',
        ref: 'validator/README.md',
        url: `${AT}/validator/README.md`,
      },
      {
        claim: 'Validator tolerances: 0.002 / 0.9999 for raw HF pairs, cosine 0.99 and relative error 0.5 otherwise; sampled layers; 27 compared points',
        why: 'Defines the tolerances that decide what a green cell means.',
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
        claim: 'DeepSeek-V4-Flash fails both vLLM backends at layer 42 with mlp_out cosine 0.235 hooked and 0.236 static',
        why: 'The clearest exception to any blanket correctness claim.',
        ref: 'DeepSeek-V4-Flash result details',
        url: `${AT}/validator/comparison/results/deepseek-ai/DeepSeek-V4-Flash-0731/0_result_details.md`,
      },
      {
        claim: 'Full benchmark report: B200, bf16, interp-engine 1.2.0, vLLM 0.26.0, 2026-08-19; capture, steering and lens latencies',
        why: 'The environment and the slower-than-eager capture and lens rows that the README table omits.',
        ref: 'benchmarks/results-latest.md',
        url: `${AT}/benchmarks/results-latest.md`,
      },
      {
        claim: 'Hooked vLLM runs enforce_eager with prefix caching on and per-request cache salts; static taps recorded into CUDA graphs; batch window 16,384 to 1,024',
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
        why: 'Confirms the outcome of the migration in the maintainers’ own words, pinned to the migration commit.',
        ref: 'apps/inference/README.md @ 17bc391',
        url: 'https://github.com/hijohnnylin/neuronpedia/blob/17bc39171bf11c68bf5bf52013b11afe8e8b1f81/apps/inference/README.md',
      },
      {
        claim: 'TransformerLens 3.8.1 released 2026-09-01 after weekly August releases',
        why: 'Shows TransformerLens was releasing weekly during the launch window.',
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
        claim: 'Verified vLLM and static fits: Qwen3-4B on A40 and B200; an eager fit on an RTX 5090; no passing consumer-GPU vLLM or static row',
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
      {
        claim: 'No gradients through vLLM; eager supports through-forward gradients; the vLLM worker exposes a closed set of remote calls',
        why: 'Sources the limits that put gradient and patching work on the eager backend.',
        ref: 'docs/GRADIENTS.md',
        url: `${AT}/docs/GRADIENTS.md`,
      },
    ],
  })}

  <section class="research-footprint" id="research-footprint" aria-labelledby="research-footprint-title">
    <div class="research-footprint-heading">
      <h2 id="research-footprint-title">Research footprint</h2>
      <a href="${RESEARCH_URL}" target="_blank" rel="noopener">Open the evidence artifacts ↗</a>
    </div>
    <div class="research-footprint-stats">
      <div><strong>${researchFootprint.wallClockMinutes} min</strong><span>wall-clock window</span></div>
      <div><strong>${researchFootprint.sessions}</strong><span>measured agent sessions</span></div>
      <div><strong>${researchFootprint.artifacts}</strong><span>committed Markdown artifacts</span></div>
      <div><strong>${compactTokenCount(researchFootprint.totalTokens)}</strong><span>tokens processed</span></div>
    </div>
    <p>
      This issue was researched in a different shape from the last one. A Claude Code session held the editorial
      thread, ran five short search agents, and launched eight independent Codex workers: a source audit, a product
      and ecosystem theory, an adversarial adoption review, the Apple Silicon reproduction harness, two revisions of
      the preamble, the canvas animation, and a fact-check. The reproduction itself ran from the editor's shell
      because the Codex sandbox hides the Metal device. The measured window runs from
      <time datetime="${researchFootprint.startedAt}">${formatTimestamp(researchFootprint.startedAt)}</time> to
      <time datetime="${researchFootprint.measuredAt}">${formatTimestamp(researchFootprint.measuredAt)}</time>, the
      freeze point; the second fact-check and the edits after it fall outside the total.
    </p>
    <p>
      The ${formatCount(researchFootprint.totalTokens)} total equals ${formatCount(researchFootprint.inputTokens)} input
      plus ${formatCount(researchFootprint.outputTokens)} output tokens. Of the input, ${formatCount(researchFootprint.cachedInputTokens)}
      came from cache and ${formatCount(researchFootprint.inputTokens - researchFootprint.cachedInputTokens)} did not.
      Reasoning output (${formatCount(researchFootprint.reasoningOutputTokens)}) is a subset of output; the Claude
      transcripts do not expose reasoning separately, so that figure covers the Codex sessions only. Cumulative
      accounting counts the full context presented on every response, including cache hits, which is why the total
      is large. This OSS Radar issue has no public raw-prompt transcript; its prompt count is zero by publication rule.
    </p>
    <p>
      The <a href="${MANIFEST_URL}" target="_blank" rel="noopener">frozen manifest</a> records each root thread, its
      sessions and epochs, log-prefix hashes, artifact counts, and timing; the
      <a href="${FOOTPRINT_NOTE_URL}" target="_blank" rel="noopener">methodology note</a> explains how eight Codex
      roots and one Claude transcript were joined and what was excluded, including the worker that produced the
      manifest. No Codex counter reset occurred in this issue's sessions.
    </p>
    <p class="research-footprint-note">
      This is provenance, not a quality score, bill, or environmental estimate. Wall-clock time is not hands-on time.
      The private session logs are not published; the prefix commitments make the record auditable by the author but
      do not let a reader independently reconstruct the totals.
    </p>
  </section>
</article>
`;
}
