import { staticHtml as html, raw } from '@nisli/core/static';
import type { PostMeta, PromptsData } from '../lib/frontmatter.js';

export function promptsPage(meta: PostMeta, prompts: PromptsData) {
  const footprint = meta.researchFootprint;
  return html`<article>
  <header class="post-header">
    <a href="/${meta.slug}" class="prompts-back">← Back to article</a>
    <h1>Thoughts by human, co-written by AI</h1>
    <p class="prompts-subtitle">${prompts.count} prompt${prompts.count === 1 ? '' : 's'} that shaped
      <a href="/${meta.slug}">"${meta.title}"</a></p>
  </header>
  <div class="post-content">
    <p class="prompts-intro">These are the raw, unedited notes I wrote while shaping this article.
    They are closer to a brain dump than a prompt library: my thinking, philosophy, corrections,
    and direction. The ideas are mine. AI helped turn them into a smoother, more readable essay.</p>
    ${footprint ? html`
    <section class="research-footprint" id="research-footprint" aria-labelledby="research-footprint-title">
      <div class="research-footprint-heading">
        <h2 id="research-footprint-title">Research footprint</h2>
        <a href="${footprint.provenanceUrl}" target="_blank" rel="noopener">Open the evidence artifacts ↗</a>
      </div>
      <div class="research-footprint-stats">
        <div><strong>${prompts.count}</strong><span>human prompts</span></div>
        <div><strong>${footprint.sessions}</strong><span>Codex sessions</span></div>
        <div><strong>${footprint.artifacts}</strong><span>committed artifacts</span></div>
        <div><strong>${compactTokenCount(footprint.totalTokens)}</strong><span>tokens processed</span></div>
      </div>
      <p>This article was researched over ${formatMinutes(footprint.wallClockMinutes)} of wall-clock collaboration, from
      <time datetime="${footprint.startedAt}">${formatTimestamp(footprint.startedAt)}</time> to
      <time datetime="${footprint.measuredAt}">${formatTimestamp(footprint.measuredAt)}</time>. The measured token total includes
      ${compactTokenCount(footprint.inputTokens)} input tokens (${compactTokenCount(footprint.cachedInputTokens)} served from cache)
      and ${compactTokenCount(footprint.outputTokens)} output tokens. Reasoning tokens (${compactTokenCount(footprint.reasoningOutputTokens)})
      are a subset of output, not an additional charge.</p>
      <p class="research-footprint-note">This is a provenance measure, not a quality score, cost estimate, or environmental-impact estimate.
      Token counts come from the Codex session logs for the main article session and its research agents. The committed artifacts let readers inspect what all that computation produced.</p>
    </section>` : ''}
    ${prompts.prompts.map((p, i) => html`
    <div class="prompt-block">
      <div class="prompt-label">Prompt ${i + 1}</div>
      <div class="prompt-text">${raw(escapeHtml(p))}</div>
    </div>`)}
  </div>
</article>`;
}

function compactTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining} minutes`;
  if (!remaining) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours}h ${remaining}m`;
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

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
