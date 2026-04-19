import { staticHtml as html } from '@nisli/core/static';

export function FeaturedPost({ title, description, date, slug, promptCount }: {
  title: string;
  description: string;
  date: string;
  slug: string;
  promptCount?: number | undefined;
}) {
  const meta = [date, promptCount ? `${promptCount} prompts` : null].filter(Boolean).join(' · ');
  return html`<a href="/${slug}" class="featured-post">
    <div class="featured-post-wash"></div>
    <div class="featured-post-inner">
      <div class="featured-post-meta">
        <span class="featured-post-badge">Latest</span>
        <span class="featured-post-date">${meta}</span>
      </div>
      <h2 class="featured-post-title">${title}</h2>
      <p class="featured-post-desc">${description}</p>
      <span class="featured-post-cta">Read article <span class="featured-post-arrow">→</span></span>
    </div>
  </a>`;
}
