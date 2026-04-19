import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta, Section } from '../../lib/frontmatter.js';
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '../../lib/frontmatter.js';
import { PageHero } from '../page-hero/page-hero.js';
import { LitItem } from '../lit-item/lit-item.js';
import { OSSRadarCard } from '../oss-radar-card/oss-radar-card.js';

const SECTION_KIKERS: Record<Section, string> = {
  essays: 'Personal Publication',
  engineering: 'Personal Publication',
  'oss-radar': 'Serialized Publication',
  frames: 'Photography',
};

const SECTION_ACCENT: Record<Section, string> = {
  essays: 'var(--section-essays)',
  engineering: 'var(--section-engineering)',
  'oss-radar': 'var(--section-oss-radar)',
  frames: 'var(--section-frames)',
};

const CANVAS_MODE: Partial<Record<Section, 'flow' | 'threshold'>> = {
  engineering: 'flow',
  'oss-radar': 'threshold',
};

function CanvasBanner({ section }: { section: Section }) {
  const mode = CANVAS_MODE[section];
  if (!mode) return html``;
  const accent = SECTION_ACCENT[section];
  return html`<div class="sec-canvas-banner" style="--sec-accent:${accent}">
  <nisli-neural-canvas mode="${mode}"></nisli-neural-canvas>
</div>`;
}

function FramesPlaceholderArchive() {
  const slots = [
    'walk · city · morning', 'light · shadow · window',
    'detail · texture · rust', 'moment · still · café',
    'architecture · angle', 'portrait · candid',
    'nature · macro', 'travel · transit',
  ];
  return html`<div class="frames-grid frames-grid--lg">
  ${slots.map(l => html`<div class="frame-slot"><div class="frame-slot-bg"></div><span class="frame-slot-txt">${l}</span></div>`)}
</div>
<p class="frames-vision">
  "Photography has always been part of how I pay attention. This section will document walks, cities, and moments — images that need more than a caption."
</p>
<p class="frames-caption"><span class="frames-dot"></span>First frame coming soon — currently shooting</p>`;
}

export function SectionArchive({ section, posts }: { section: Section; posts: PostMeta[] }) {
  const accent = SECTION_ACCENT[section];
  const totalPrompts = section === 'engineering'
    ? posts.reduce((s, p) => s + (p.promptCount ?? 0), 0)
    : 0;

  const stats = [];
  if (section === 'engineering') {
    stats.push({ value: String(posts.length), label: 'Articles' });
    if (totalPrompts > 0) stats.push({ value: `${totalPrompts}+`, label: 'Prompts logged' });
  } else if (section === 'oss-radar') {
    stats.push({ value: String(posts.length), label: 'Issues' });
    if (posts.length > 0) {
      const m = posts[0]!.slug.match(/oss-radar-(\d+)/);
      if (m) stats.push({ value: `#${m[1]}`, label: 'Latest' });
    }
  } else if (section === 'essays') {
    stats.push({ value: String(posts.length), label: 'Published' });
  }

  return html`<div class="section-archive" data-section="${section}">
  ${CanvasBanner({ section })}
  ${PageHero({
    kicker: SECTION_KIKERS[section],
    title: SECTION_LABELS[section],
    description: SECTION_DESCRIPTIONS[section],
    accentColor: accent,
    stats,
  })}
  <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
  <div class="section-archive-list">
    ${posts.length === 0
      ? (section === 'frames'
          ? FramesPlaceholderArchive()
          : html`<p class="section-archive-empty">Nothing published yet — check back soon.</p>`)
      : section === 'oss-radar'
        ? (() => {
            const [latest, ...rest] = posts;
            return html`<div class="rdr-group-label">Latest issue</div>
            ${latest ? OSSRadarCard({ post: latest }) : ''}
            ${rest.length > 0 ? html`<div class="rdr-group-label rdr-group-label--archive">Archive</div>
            ${rest.map(p => OSSRadarCard({ post: p }))}` : ''}`;
          })()
        : posts.map(p => LitItem({ post: p, accentColor: accent }))}
  </div>
</div>`;
}
