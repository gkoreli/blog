import { staticHtml as html } from '@nisli/core/static';

// Measurements from the linked 27-request Sonnet run; no simulated timing.
const observations = {
  "summary": [
    {
      "case": "baseline",
      "n": 3,
      "read_tokens": [
        0
      ],
      "write_tokens": [
        7870
      ],
      "ordinary_input_tokens": [
        13
      ],
      "median_first_text_s": 1.27,
      "first_text_range_s": [
        1.155,
        1.423
      ],
      "median_elapsed_s": 1.328,
      "mean_estimated_cost_usd": 0.019921,
      "correct": 3
    },
    {
      "case": "warm_repeat",
      "n": 3,
      "read_tokens": [
        7870
      ],
      "write_tokens": [
        0
      ],
      "ordinary_input_tokens": [
        13
      ],
      "median_first_text_s": 1.214,
      "first_text_range_s": [
        1.143,
        1.297
      ],
      "median_elapsed_s": 1.291,
      "mean_estimated_cost_usd": 0.00182,
      "correct": 3
    },
    {
      "case": "early_edit",
      "n": 3,
      "read_tokens": [
        0
      ],
      "write_tokens": [
        7871
      ],
      "ordinary_input_tokens": [
        13
      ],
      "median_first_text_s": 1.432,
      "first_text_range_s": [
        1.407,
        1.447
      ],
      "median_elapsed_s": 1.433,
      "mean_estimated_cost_usd": 0.0199335,
      "correct": 3
    },
    {
      "case": "early_edit_repeat",
      "n": 3,
      "read_tokens": [
        7871
      ],
      "write_tokens": [
        0
      ],
      "ordinary_input_tokens": [
        13
      ],
      "median_first_text_s": 1.312,
      "first_text_range_s": [
        1.124,
        1.329
      ],
      "median_elapsed_s": 1.347,
      "mean_estimated_cost_usd": 0.0018302000000000001,
      "correct": 3
    },
    {
      "case": "old_branch_revisit",
      "n": 3,
      "read_tokens": [
        7870
      ],
      "write_tokens": [
        0
      ],
      "ordinary_input_tokens": [
        13
      ],
      "median_first_text_s": 1.209,
      "first_text_range_s": [
        1.124,
        1.332
      ],
      "median_elapsed_s": 1.21,
      "mean_estimated_cost_usd": 0.00182,
      "correct": 3
    },
    {
      "case": "middle_edit",
      "n": 3,
      "read_tokens": [
        5371
      ],
      "write_tokens": [
        2499
      ],
      "ordinary_input_tokens": [
        13
      ],
      "median_first_text_s": 1.442,
      "first_text_range_s": [
        1.184,
        1.492
      ],
      "median_elapsed_s": 1.503,
      "mean_estimated_cost_usd": 0.0075677,
      "correct": 3
    },
    {
      "case": "middle_edit_repeat",
      "n": 3,
      "read_tokens": [
        7870
      ],
      "write_tokens": [
        0
      ],
      "ordinary_input_tokens": [
        13
      ],
      "median_first_text_s": 1.304,
      "first_text_range_s": [
        1.128,
        1.379
      ],
      "median_elapsed_s": 1.365,
      "mean_estimated_cost_usd": 0.00182,
      "correct": 3
    },
    {
      "case": "appended_system",
      "n": 3,
      "read_tokens": [
        7870
      ],
      "write_tokens": [
        0
      ],
      "ordinary_input_tokens": [
        46
      ],
      "median_first_text_s": 1.761,
      "first_text_range_s": [
        1.459,
        2.116
      ],
      "median_elapsed_s": 1.859,
      "mean_estimated_cost_usd": 0.002486,
      "correct": 3
    },
    {
      "case": "inline_tool_addition",
      "n": 3,
      "read_tokens": [
        7870
      ],
      "write_tokens": [
        0
      ],
      "ordinary_input_tokens": [
        122
      ],
      "median_first_text_s": 1.289,
      "first_text_range_s": [
        1.218,
        1.369
      ],
      "median_elapsed_s": 1.324,
      "mean_estimated_cost_usd": 0.002038,
      "correct": 3
    }
  ]
};

const cases = [
  { id: 'early_edit', label: 'Edit the early instruction', short: 'The original system instruction changes.', detail: 'USD → EUR inside the original system block. The edited prefix is written again.', fragment: 'system: Currency policy: EUR.\n        [same reference text]\nuser:   [same record blocks]', limit: 'This is a change to the historical prompt. Its repeated request later hit the newly cached branch.' },
  { id: 'middle_edit', label: 'Replace a record in the middle', short: 'Reuse stops at the saved boundary.', detail: 'RECORD-137 changes in the second record block. The preceding system and first record block remain reusable.', fragment: 'system: [unchanged]                  ▼\nuser:   records 000–099 [unchanged]  ▼\n        records 100–199 [137 edited] ▼', limit: '▼ marks an explicit cache boundary. Even unchanged records before 137 inside the second block are processed again.' },
  { id: 'appended_system', label: 'Append a system update', short: 'New policy, preserved history.', detail: 'Keep the original USD policy; append a system instruction that sets EUR from this point onward.', fragment: 'system: Currency policy: USD. [same text]\nuser:   [same record blocks]         ▼\nsystem: From now on, use EUR.', limit: 'Both expected answer fields passed. This does not prove equivalence to replacing the original instruction. The new suffix itself was not cache-marked.' },
  { id: 'inline_tool_addition', label: 'Add a tool inline', short: 'The definition arrives after the prefix.', detail: 'Append a native tool_addition block. The initial lookup tool and previous text stay unchanged.', fragment: 'tools:  lookup [unchanged]\n        [same system and user]      ▼\nsystem: tool_addition → lookup_extra', limit: 'Request acceptance and reuse were observed. The prompt prohibited tool calls, so tool execution was not tested.' },
  { id: 'old_branch_revisit', label: 'Return to the original branch', short: 'The earlier entry still exists.', detail: 'Send the original USD request after testing the EUR edit. The old branch was still reusable.', fragment: 'A: USD → original records  [cached]\nB: EUR → original records  [cached]\nA: USD → original records  [reused]', limit: 'Observed within the short test window. Residency after expiry, routing changes, or eviction is not established.' },
  { id: 'warm_repeat', label: 'Repeat the same request', short: 'The unchanged control.', detail: 'Repeat the original request without changing instructions, tools, or record content.', fragment: 'request A\nrequest A again → same prefix', limit: 'A matched prefix still needs an eligible, available cache entry. This is not an indefinite retention guarantee.' },
] as const;

export function CacheMeasurements() {
  return html`<figure class="pc-figure pc-measurements" aria-labelledby="pc-measure-title">
    <figcaption class="pc-caption" id="pc-measure-title"><span class="pc-kicker">Observed · Sonnet 5.5 · 3 requests per variant</span><strong>Where the request changed</strong><span>Open a row to see what changed in the request.</span></figcaption>
    <div class="pc-legend"><span><i class="pc-read"></i>Cache read</span><span><i class="pc-write"></i>Cache write</span><span><i class="pc-new"></i>Ordinary input</span></div>
    ${cases.map(item => {
      const result = observations.summary.find(row => row.case === item.id);
      if (!result) throw new Error(`Missing observed case ${item.id}`);
      const reads = result.read_tokens[0] ?? 0;
      const writes = result.write_tokens[0] ?? 0;
      const ordinary = result.ordinary_input_tokens[0] ?? 0;
      const total = reads + writes + ordinary;
      return html`<details class="pc-case">
        <summary><span class="pc-case-heading"><strong>${item.label}</strong><span class="pc-cost">$${result.mean_estimated_cost_usd.toFixed(4)}<small>mean / request</small></span></span>
          <span class="pc-bar" aria-hidden="true"><i class="pc-read" style="width:${reads / total * 100}%"></i><i class="pc-write" style="width:${writes / total * 100}%"></i><i class="pc-new" style="width:${ordinary / total * 100}%"></i></span>
          <span class="pc-case-meta"><span>${reads.toLocaleString('en-US')} read · ${writes.toLocaleString('en-US')} written · ${ordinary} ordinary</span><span class="pc-open-label">Inspect +</span></span>
        </summary>
        <div class="pc-case-body"><p><strong>${item.short}</strong> ${item.detail}</p><pre><code>${item.fragment}</code></pre><p class="pc-limit">${item.limit}</p><p class="pc-timing">First visible text: median ${result.median_first_text_s.toFixed(3)} s; range ${result.first_text_range_s[0]}–${result.first_text_range_s[1]} s. This small, ordered sample does not establish a speedup.</p></div>
      </details>`;
    })}
    <p class="pc-figure-note">Bars show each request’s input composition. Costs include output. Each case ran three times. These are measured costs, not a latency prediction.</p>
  </figure>`;
}

export function CacheLayers() {
  const rows = [
    { name: 'Harness', verb: 'Chooses the context', control: 'Instructions, messages, tools, and retained history', question: 'Does the next request keep the earlier messages?' },
    { name: 'SDK / adapter', verb: 'Builds the API request', control: 'Turns the harness’s objects into provider fields', question: 'Does the outgoing JSON contain the intended update?' },
    { name: 'Provider API', verb: 'Sets the caching rules', control: 'Allowed boundaries, lifetime, updates, and prices', question: 'Where may this request reuse saved input?' },
    { name: 'Inference engine', verb: 'Finds and uses saved state', control: 'Looks up earlier computations and manages memory', question: 'Is the matching state still available?' },
  ];
  return html`<figure class="pc-figure pc-layers"><figcaption class="pc-caption"><span class="pc-kicker">Follow the request</span><strong>From conversation history to saved computation</strong></figcaption><ol>${rows.map((layer, index) => html`<li><span class="pc-layer-number">0${index + 1}</span><div><h3>${layer.name}</h3><strong>${layer.verb}</strong><p>${layer.control}</p><p class="pc-layer-question">${layer.question}</p></div></li>`)}</ol><p class="pc-figure-note">The harness controls what is sent. The serving system controls what can be reused.</p></figure>`;
}


export function CachePrefill() {
  return html`<figure class="pc-figure pc-prefill" aria-labelledby="pc-prefill-title">
    <figcaption class="pc-caption">
      <span class="pc-kicker">Inference · illustrative token sequence</span>
      <strong id="pc-prefill-title">Build once. Read at every next step.</strong>
      <span>Prefill processes the known input. Decode adds one generated token at a time.</span>
    </figcaption>
    <section class="pc-flow-stage">
      <div class="pc-flow-heading"><span class="pc-step">01</span><h3>Prefill the prompt</h3></div>
      <div class="pc-flow">
        <div class="pc-flow-node"><span class="pc-kicker">Known input</span><strong class="pc-tokens">A B C</strong><p>All three input tokens are available.</p></div>
        <span class="pc-arrow" aria-hidden="true">→</span>
        <div class="pc-flow-node pc-flow-node--compute"><span class="pc-kicker">Model layers</span><strong>Create keys and values</strong><p>Each position can attend to itself and earlier positions.</p></div>
        <span class="pc-arrow" aria-hidden="true">→</span>
        <div class="pc-flow-node"><span class="pc-kicker">First output</span><strong class="pc-tokens">D</strong><p>Scores at C select D. D’s state is built next.</p></div>
      </div>
      <div class="pc-memory"><span class="pc-kicker">Save for reuse</span><strong class="pc-tokens">K/V [ A B C ]</strong><span>Separate keys and values at each attention layer.</span></div>
    </section>
    <section class="pc-flow-stage">
      <div class="pc-flow-heading"><span class="pc-step">02</span><h3>Decode the next token</h3></div>
      <div class="pc-flow">
        <div class="pc-flow-node"><span class="pc-kicker">Next input</span><strong class="pc-tokens">D</strong><p>Feed the selected token back through the model.</p></div>
        <span class="pc-arrow" aria-hidden="true">→</span>
        <div class="pc-flow-node pc-flow-node--compute"><span class="pc-kicker">Model layers</span><strong>Read old state + add D</strong><p>D’s query attends to saved A/B/C and D’s new keys and values.</p></div>
        <span class="pc-arrow" aria-hidden="true">→</span>
        <div class="pc-flow-node"><span class="pc-kicker">Next output</span><strong class="pc-tokens">E</strong><p>New scores select E. Repeat for the next token.</p></div>
      </div>
      <div class="pc-memory"><span class="pc-kicker">Retain and extend</span><strong class="pc-tokens">K/V [ A B C <em>D</em> ]</strong><span>Read the saved prefix; retain the new state alongside it.</span></div>
    </section>
    <p class="pc-figure-note"><strong>A prompt-cache hit skips rebuilding compatible old state.</strong> Reading that state, processing new input, and generating output still take work.</p>
  </figure>`;
}
