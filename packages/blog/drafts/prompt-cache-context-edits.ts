import { readFileSync } from 'node:fs';
import { staticHtml as html, raw } from '@nisli/core/static';
import { z } from 'zod/v4';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { initMarkdown, renderMarkdown } from '../src/lib/markdown.js';

const researchRoot = new URL('../../../docs/worklist/prompt-caching-from-api-to-agent-loop/', import.meta.url);
const repositoryRoot = 'https://github.com/gkoreli/blog/blob/main/docs/worklist/prompt-caching-from-api-to-agent-loop/';

export const meta: PostMeta = {
  title: 'Can You Change an Agent’s Context Without Losing Its Prompt Cache?',
  seoTitle: 'LLM Prompt Caching: Context Edits, APIs, and Agent Harnesses',
  description: 'A Sonnet 5.5 experiment and source audits explain which context changes preserve prompt caching, where SDKs and harnesses differ, and what correctness requires.',
  date: '2026-09-28',
  section: 'engineering',
  layout: 'default',
  featured: false,
  slug: 'prompt-cache-context-edits',
  tags: ['prompt-caching', 'llm-inference', 'agent-harnesses', 'context-engineering'],
  images: [],
};

const observations = z.object({
  estimated_total_usd: z.number(),
  summary: z.array(z.object({
    case: z.string(), n: z.number(),
    read_tokens: z.array(z.number()).length(1),
    write_tokens: z.array(z.number()).length(1),
    ordinary_input_tokens: z.array(z.number()).length(1),
    mean_estimated_cost_usd: z.number(),
    median_first_text_s: z.number(),
    first_text_range_s: z.array(z.number()).length(2),
  })),
}).parse(JSON.parse(readFileSync(new URL('lab/anthropic-results.json', researchRoot), 'utf8')));

const cases = [
  { id: 'early_edit', label: 'Edit the early instruction', short: 'The old suffix has a new beginning.', detail: 'USD → EUR inside the original system block. The edited prefix is written again.', fragment: 'system: Currency policy: EUR.\n        [same reference text]\nuser:   [same record blocks]', limit: 'This is a change to the historical prompt. Its repeated request later hit the newly cached branch.' },
  { id: 'middle_edit', label: 'Replace a record in the middle', short: 'Reuse stops at the saved boundary.', detail: 'RECORD-137 changes in the second record block. The preceding system and first record block remain reusable.', fragment: 'system: [unchanged]                  ▼\nuser:   records 000–099 [unchanged]  ▼\n        records 100–199 [137 edited] ▼', limit: '▼ marks an explicit cache boundary. Even unchanged records before 137 inside the second block are processed again.' },
  { id: 'appended_system', label: 'Append a system update', short: 'New policy, preserved history.', detail: 'Keep the original USD policy; append a system instruction that sets EUR from this point onward.', fragment: 'system: Currency policy: USD. [same text]\nuser:   [same record blocks]         ▼\nsystem: From now on, use EUR.', limit: 'Both expected answer fields passed. This does not prove equivalence to replacing the original instruction. The new suffix itself was not cache-marked.' },
  { id: 'inline_tool_addition', label: 'Add a tool inline', short: 'The definition arrives after the prefix.', detail: 'Append a native tool_addition block. The initial lookup tool and previous text stay unchanged.', fragment: 'tools:  lookup [unchanged]\n        [same system and user]      ▼\nsystem: tool_addition → lookup_extra', limit: 'Request acceptance and reuse were observed. The prompt prohibited tool calls, so tool execution was not tested.' },
  { id: 'old_branch_revisit', label: 'Return to the original branch', short: 'The earlier entry still exists.', detail: 'Send the original USD request after testing the EUR edit. The old branch was still reusable.', fragment: 'A: USD → original records  [cached]\nB: EUR → original records  [cached]\nA: USD → original records  [reused]', limit: 'Observed within the short test window. Residency after expiry, routing changes, or eviction is not established.' },
  { id: 'warm_repeat', label: 'Repeat the same request', short: 'The unchanged control.', detail: 'Repeat the original request without changing instructions, tools, or record content.', fragment: 'request A\nrequest A again → same prefix', limit: 'A matched prefix still needs an eligible, available cache entry. This is not an indefinite retention guarantee.' },
] as const;

function measurements() {
  return html`<figure class="pc-measurements" aria-labelledby="pc-measure-title">
    <figcaption id="pc-measure-title"><span class="pc-kicker">Observed · Sonnet 5.5 · 3 requests per variant</span><strong>Same task. Different places to change it.</strong><span>Open a row to inspect the request change and its evidence limits.</span></figcaption>
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
    <p class="pc-figure-note">Bars show each request’s input composition. Costs include output. All values come from the retained measurements; all interactions work without JavaScript.</p>
  </figure>`;
}

function layers() {
  const rows = [
    { name: 'Harness', verb: 'Represents the change', control: 'History · instruction versions · tools · compaction', question: 'Append an update, or rewrite an earlier message?' },
    { name: 'SDK / adapter', verb: 'Builds the wire request', control: 'Roles · schemas · feature options · usage conversion', question: 'Did the operation survive serialization?' },
    { name: 'Provider API', verb: 'Defines eligible reuse', control: 'Boundaries · lifetime · update protocol · billing', question: 'Can this model and endpoint express it?' },
    { name: 'Inference engine', verb: 'Reuses compatible state', control: 'Attention · prefix index · residency · execution', question: 'Is the state valid, present, and reachable?' },
  ];
  return html`<figure class="pc-layers"><figcaption><span class="pc-kicker">Follow the request</span><strong>Four decisions before a cache hit</strong></figcaption><ol>${rows.map((layer, index) => html`<li><span class="pc-layer-number">0${index + 1}</span><div><h3>${layer.name}</h3><strong>${layer.verb}</strong><p>${layer.control}</p><p class="pc-layer-question">${layer.question}</p></div></li>`)}</ol><p class="pc-figure-note">A valid prefix can still miss. A high hit rate can still produce the wrong answer.</p></figure>`;
}

function replaceFigure(content: string, name: string, replacement: string): string {
  const start = `<!-- cache:${name}:start -->`;
  const end = `<!-- cache:${name}:end -->`;
  const startAt = content.indexOf(start);
  const endAt = content.indexOf(end);
  if (startAt < 0 || endAt < startAt || content.indexOf(start, startAt + 1) >= 0) {
    throw new Error(`Missing or ambiguous visual slot: ${name}`);
  }
  return content.slice(0, startAt) + replacement + content.slice(endAt + end.length);
}

// The reviewable Markdown is the prose source; this module owns the article layout.
// Both drafts/ and posts/ have the same depth, so publication does not change paths.
let prose = readFileSync(new URL('article-draft.md', researchRoot), 'utf8')
  .replace(/^# .*\n\nWorking draft[^\n]*\n\n/, '')
  .replace(/\]\((?!https?:|#|\/)([^)]+)\)/g, (_match: string, path: string) => `](${new URL(path, repositoryRoot).href})`);
await initMarkdown();
prose = await renderMarkdown(prose);
prose = replaceFigure(prose, 'layers', layers().toString());
prose = replaceFigure(prose, 'measurements', measurements().toString());
prose = replaceFigure(prose, 'dependencies', html`<figure class="pc-dependencies">${raw(readFileSync(new URL('assets/cache-dependencies.svg', researchRoot), 'utf8'))}<figcaption>Same-length edit, fixed positions, conventional causal attention. Deeper-layer dependencies prevent general suffix transplantation; an old exact branch can still remain reusable.</figcaption></figure>`.toString());
const css = readFileSync(new URL('./prompt-cache-context-edits.css', import.meta.url), 'utf8');

export function article() {
  return html`<style>${raw(css)}</style><article class="post-content pc-article">
    <header class="pc-header"><p class="pc-kicker">Engineering field notes · Working draft</p><h1>${meta.title}</h1><p class="pc-deck">One context edit. Four layers. A cache hit that means what you think it means.</p><p class="pc-byline">Goga Koreli <span>·</span> September 28, 2026 <span>·</span> Co-written with AI</p>
      <div class="pc-evidence-strip"><div><strong>27</strong><span>live requests</span></div><div><strong>7,870</strong><span>tokens reused after an update</span></div><div><strong>$${observations.estimated_total_usd.toFixed(2)}</strong><span>estimated API spend</span></div></div>
    </header>
    ${raw(prose)}
    <aside class="pc-draft-note">Research draft. The live experiment is a narrow synthetic check; the source audits have separate evidence limits. <a href="${repositoryRoot}README.md" target="_blank" rel="noopener">Read the worklist, code, and measurements.</a></aside>
  </article>`;
}
