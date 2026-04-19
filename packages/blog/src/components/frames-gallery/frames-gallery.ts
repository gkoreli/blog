import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../../lib/frontmatter.js';

export function FramesGallery({ images }: { images: PostMeta['images'] }) {
  if (!images || images.length === 0) return html``;

  return html`<div class="frames-gallery">
  ${images.map(img => html`<figure class="frames-gallery-item">
    <img src="${img.src}" alt="${img.alt}" class="frames-gallery-img" loading="lazy">
    ${img.caption ? html`<figcaption class="frames-gallery-caption">${img.caption}</figcaption>` : ''}
  </figure>`)}
</div>`;
}
