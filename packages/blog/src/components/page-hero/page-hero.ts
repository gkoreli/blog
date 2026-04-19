import { staticHtml as html } from '@nisli/core/static';

export interface PageHeroStat {
  value: string;
  label: string;
}

export function PageHero({
  kicker,
  title,
  description,
  accentColor,
  stats = [],
}: {
  kicker: string;
  title: string;
  description: string;
  accentColor: string;
  stats?: PageHeroStat[];
}) {
  return html`<div class="page-hero">
  <div class="page-hero-accent-rule" style="background:${accentColor}"></div>
  <div class="page-hero-kicker" style="color:${accentColor}">${kicker}</div>
  <h1 class="page-hero-title">${title}</h1>
  <p class="page-hero-desc">${description}</p>
  ${stats.length > 0 ? html`<div class="page-hero-stats">
    ${stats.map(s => html`<div>
      <div class="stat-n" style="color:${accentColor}">${s.value}</div>
      <div class="stat-l">${s.label}</div>
    </div>`)}
  </div>` : ''}
</div>`;
}
