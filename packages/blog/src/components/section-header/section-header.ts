import { staticHtml as html } from '@nisli/core/static';

export function SectionHeader({
  label,
  href,
  dotColor,
}: {
  label: string;
  href?: string;
  dotColor?: string;
}) {
  const dot = dotColor ? `style="background:${dotColor}"` : `style="background:var(--gradient-brand)"`;
  return html`<div class="sec-hd">
  <span class="sec-hd-name">
    <span class="sec-hd-dot" ${dot}></span>
    ${label}
  </span>
  <span class="sec-hd-fill"></span>
  ${href ? html`<a href="${href}" class="sec-hd-all">View all →</a>` : ''}
</div>`;
}
