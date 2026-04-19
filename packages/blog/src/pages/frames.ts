import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../lib/frontmatter.js';
import { PageHero } from '../components/index.js';

const PLACEHOLDER_SLOTS = [
  'walk · city · morning', 'light · shadow · window',
  'detail · texture · rust', 'moment · still · café',
  'architecture · angle', 'portrait · candid',
  'nature · macro', 'travel · transit',
];

function FramesPlaceholderArchive() {
  return html`<div class="frames-grid frames-grid--lg">
  ${PLACEHOLDER_SLOTS.map(l => html`<div class="frame-slot"><div class="frame-slot-bg"></div><span class="frame-slot-txt">${l}</span></div>`)}
</div>
<p class="frames-vision">
  "Photography has always been part of how I pay attention. This section will document walks, cities, and moments — images that need more than a caption."
</p>
<p class="frames-caption"><span class="frames-dot"></span>First frame coming soon — currently shooting</p>`;
}

export function framesPage(posts: PostMeta[]) {
  return html`<div class="section-archive" data-section="frames">
  ${PageHero({
    kicker: 'Photography',
    title: SECTION_LABELS['frames'],
    description: SECTION_DESCRIPTIONS['frames'],
    accentColor: 'var(--section-frames)',
    stats: [],
  })}
  <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
  <div class="section-archive-list">
    ${posts.length === 0 ? FramesPlaceholderArchive() : posts.map(p => html`<div class="frames-post-item"><a href="/${p.slug}">${p.title}</a></div>`)}
  </div>
</div>`;
}
