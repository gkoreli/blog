import { staticHtml as html } from '@nisli/core/static';
import type { PostMeta } from '../src/lib/frontmatter.js';
import { AddressBoardHero } from '../src/templates/components.js';

export const meta: PostMeta = {
  title: 'OSS Radar #06: Same Hook Name, Different Tensor',
  date: '2026-09-02',
  description: 'interp-engine moves Neuronpedia\'s interpretability hooks onto vLLM and checks every point against TransformerLens and nnsight. Without CUDA you get the parity table, not the speed.',
  section: 'oss-radar',
  tags: ['oss-radar', 'interpretability', 'neuronpedia', 'vllm', 'steering'],
  layout: 'immersive',
  featured: false,
  images: [],
  slug: 'oss-radar-06-interp-engine',
};

export function preamble() {
  return AddressBoardHero({
    issueNum: 'Issue 06',
    date: 'September 2026',
    tags: 'open-source · interpretability · inference · steering',
    title: html`<h1>Same Hook Name,<br>Different <em>Tensor</em></h1>`,
    subtitle: 'interp-engine spells the two apart and checks every point against TransformerLens before it serves one.',
    author: 'Goga Koreli',
    readTime: '12 min read',
  });
}

export function article() {
  return html`
<article class="post-content">
  <p>Draft body. Replaced before publication.</p>
</article>`;
}
