import { staticHtml as html } from '@nisli/core/static';

const hashSource = 'https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/vllm/v1/core/kv_cache_utils.py#L650';
const matchSource = 'https://github.com/vllm-project/vllm/blob/28f673957671d8d4c5672c2085b3f22c79c0b0b5/docs/features/automatic_prefix_caching.md';
const experimentSource = 'https://github.com/gkoreli/blog/blob/main/docs/worklist/prompt-caching-from-api-to-agent-loop/research/05-live-anthropic-experiment.md';

/** A worked illustration; the six tokens and two-token checkpoints are invented. */
export function CacheDependencyFigure({ measurementHref = experimentSource }: { measurementHref?: string } = {}) {
  return html`<figure class="pc-figure cache-dependency">
    <figcaption class="pc-caption cd-caption">
      <span class="cd-eyebrow">A worked example · six illustrative tokens</span>
      <strong class="cd-title">What changes when token D changes?</strong>
      <span>Replace D with D′. Keep every other token and its position fixed.</span>
    </figcaption>

    <div class="cd-token-strip" aria-label="Edited sequence: A, B, C, D prime, E, F">
      <span>A<small>same</small></span>
      <span>B<small>same</small></span>
      <span>C<small>same</small></span>
      <span class="cd-edited">D′<small>edit</small></span>
      <span>E<small>same</small></span>
      <span>F<small>same</small></span>
    </div>

    <section class="cd-stage">
      <div class="cd-stage-heading"><span class="cd-number">01</span><h3>An earlier edit can change F’s state</h3></div>
      <p>Follow F through a conventional causal transformer. Its text stays the same; what it reads changes.</p>
      <div class="cd-state-path">
        <div class="cd-state">
          <span class="cd-eyebrow">Entering layer 1</span>
          <strong>F at position 6</strong>
          <p>Same token, same position. Its first-layer key and value can remain the same.</p>
        </div>
        <span class="cd-path-arrow" aria-hidden="true">→</span>
        <div class="cd-state cd-state--attention">
          <span class="cd-eyebrow">Layer 1 attention</span>
          <strong>F reads A B C <em>D′</em> E F</strong>
          <p>The changed earlier token can change the result of this attention calculation.</p>
        </div>
        <span class="cd-path-arrow" aria-hidden="true">→</span>
        <div class="cd-state cd-state--deeper">
          <span class="cd-eyebrow">Entering layer 2</span>
          <strong>F uses the attention result</strong>
          <p>Its deeper keys and values are computed from this contextual state. Old values may no longer be valid.</p>
        </div>
      </div>
      <p class="cd-explanation"><strong>A, B, and C cannot read future token D.</strong> Their state remains valid under this same-length edit. E and F can depend on it, even though their token IDs did not change.</p>
      <details class="cd-detail">
        <summary>What exactly is being reused?</summary>
        <p>At each layer, the model stores keys and values used by attention. In a conventional decoder, layer 1 starts from each token’s own embedding and position; deeper layers start from the previous layer’s contextual result. Reusing the suffix must preserve those dependencies, not merely its text. This assumes unchanged weights, positions, masks, and other relevant settings.</p>
        <a href="https://arxiv.org/abs/1706.03762" target="_blank" rel="noopener noreferrer">Attention Is All You Need, sections 3.1–3.2 ↗</a>
      </details>
    </section>

    <section class="cd-stage">
      <div class="cd-stage-heading"><span class="cd-number">02</span><h3>Block hashes include the earlier prefix</h3></div>
      <p>Suppose this engine groups two tokens per block. The block containing E F includes the preceding block’s identity in its hash.</p>
      <div class="cd-branch-root"><strong>A B</strong><span>Shared prefix · same hash H₁</span></div>
      <div class="cd-branches">
        <div class="cd-branch cd-branch--original">
          <span class="cd-eyebrow">Original branch · reusable if retained</span>
          <div class="cd-block"><strong>C D</strong><code>H₂ = hash(H₁, C D)</code></div>
          <span class="cd-down-arrow" aria-hidden="true">↓</span>
          <div class="cd-block"><strong>E F</strong><code>H₃ = hash(H₂, E F)</code></div>
          <p>The old branch can still be reused if it remains resident.</p>
        </div>
        <div class="cd-branch cd-branch--edited">
          <span class="cd-eyebrow">Edited branch · compute new state</span>
          <div class="cd-block"><strong>C D′</strong><code>H₂′ = hash(H₁, C D′)</code></div>
          <span class="cd-down-arrow" aria-hidden="true">↓</span>
          <div class="cd-block"><strong>E F</strong><code>H₃′ = hash(H₂′, E F)</code></div>
          <p>Same E F tokens; different parent hash. The old suffix is not a match.</p>
        </div>
      </div>
      <p class="cd-explanation">This simplified chain follows <a href="${hashSource}" target="_blank" rel="noopener noreferrer">vLLM’s block-hash implementation ↗</a>, which also includes extra keys. Creating the edited branch does not, by itself, erase the original.</p>
    </section>

    <section class="cd-stage">
      <div class="cd-stage-heading"><span class="cd-number">03</span><h3>Reuse stops at an available checkpoint</h3></div>
      <p>A B C is still mathematically valid. But if the engine can resume only after complete two-token blocks, the available matching checkpoint is after B.</p>
      <div class="cd-checkpoints" aria-label="Block one, A B, reused. Block two, C D prime, recomputed. Block three, E F, recomputed.">
        <div class="cd-checkpoint cd-checkpoint--reuse"><strong>A B</strong><span>Read from cache</span><small>Checkpoint matches</small></div>
        <div class="cd-checkpoint cd-checkpoint--redo"><strong><u>C</u> D′</strong><span>Compute again</span><small>C is unchanged, but shares the changed block</small></div>
        <div class="cd-checkpoint cd-checkpoint--redo"><strong>E F</strong><span>Compute again</span><small>State can depend on D′</small></div>
      </div>
      <p class="cd-explanation"><strong>Unchanged does not always mean reusable at the available boundary.</strong> Actual engines and APIs choose their own checkpoint rules; some support finer matching. <a href="${matchSource}" target="_blank" rel="noopener noreferrer">vLLM’s versioned matching options ↗</a></p>
    </section>

    <div class="cd-measurement-note">
      <strong>The measured request is a separate example.</strong>
      <p>Our Anthropic middle edit read 5,371 tokens and wrote 2,499. Those are API counters for explicit prompt boundaries—not evidence of two-token blocks or Anthropic’s internal hash scheme. <a href="${measurementHref}" target="_blank" rel="noopener noreferrer">See the requests and measurements ↗</a></p>
    </div>
  </figure>`;
}
