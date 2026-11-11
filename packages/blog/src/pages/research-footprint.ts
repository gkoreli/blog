import { html } from '@nisli/core';
import type { PostMeta } from '../lib/frontmatter.js';

export function researchFootprint(meta: PostMeta) {
  const footprint = meta.researchFootprint;
  if (!footprint) return '';
  return html`
    <section class="research-footprint" id="research-footprint" aria-labelledby="research-footprint-title">
      <div class="research-footprint-heading">
        <h2 id="research-footprint-title">Research footprint</h2>
        <a href="${footprint.provenanceUrl}" target="_blank" rel="noopener">Open the evidence artifacts ↗</a>
      </div>
      <div class="research-footprint-stats">
        <div><strong>${footprint.sessions}</strong><span>agent sessions</span></div>
        <div><strong>${footprint.artifacts}</strong><span>committed artifacts</span></div>
        <div><strong>${compactTokenCount(footprint.totalTokens)}</strong><span>tokens processed</span></div>
      </div>
      ${footprint.scope ? html`<p>${footprint.scope}</p>` : ''}
      <p>The included sessions span ${formatMinutes(footprint.wallClockMinutes)} of elapsed wall-clock time, from
      <time datetime="${footprint.startedAt}">${formatTimestamp(footprint.startedAt)}</time> to
      <time datetime="${footprint.measuredAt}">${formatTimestamp(footprint.measuredAt)}</time>. The measured token total includes
      ${compactTokenCount(footprint.inputTokens)} input tokens (${compactTokenCount(footprint.cachedInputTokens)} served from cache)
      and ${compactTokenCount(footprint.outputTokens)} output tokens. Reasoning tokens (${compactTokenCount(footprint.reasoningOutputTokens)})
      are already included in output. Elapsed time includes gaps between sessions and does not measure human hands-on work.</p>
      <p class="research-footprint-note">This is a provenance measure, not a quality score, cost estimate, or environmental-impact estimate.
      Token counts come from the private agent sessions identified in the public manifest, which records the log format, included session IDs, selected usage boundaries, and SHA-256 prefix commitments. The author can audit the totals against those logs; readers cannot independently reconstruct them without the private logs. The committed artifacts show the resulting work.</p>
    </section>`;
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
