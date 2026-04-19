import { staticHtml as html } from '@nisli/core/static';

export function Masthead() {
  return html`<div class="masthead">
  <nisli-neural-canvas mode="threshold"></nisli-neural-canvas>
  <div class="masthead-fade"></div>
  <div class="masthead-content">
    <div class="pub-dateline">
      <span class="pub-dl-txt">Est. 2026</span>
      <div class="pub-dl-rule"></div>
      <span class="pub-dl-txt">Vol. I</span>
    </div>
    <h1 class="masthead-name">Goga Koreli</h1>
    <p class="masthead-sub">A personal publication — essays, engineering notes, OSS Radar, and Frames.<br>One author, many forms, one sensibility.</p>
    <div class="masthead-pills">
      <a href="https://github.com/gkoreli/backlog-mcp" class="mpill" target="_blank" rel="noopener">backlog-mcp</a>
      <a href="https://www.npmjs.com/package/@nisli/core" class="mpill" target="_blank" rel="noopener">@nisli/core</a>
      <a href="https://github.com/gkoreli/blog" class="mpill" target="_blank" rel="noopener">source ↗</a>
    </div>
  </div>
</div>`;
}
