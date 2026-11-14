import { html } from '@nisli/core';

/** Native GET works without scripting; the same form upgrades into local, worker-backed search. */
export function searchSurface(id: string) {
  return html`<div data-search-surface=${id}>
      <form action="/search" method="get" class="search-form" role="search">
        <label for=${id + '-query'}>Search articles and passages</label>
        <div class="search-input-row"><input id=${id + '-query'} name="q" type="search" maxlength="512" autocomplete="off" placeholder="An open source project about emojis…"><button type="submit">Search</button></div>
        <div class="search-controls" hidden data-search-enhanced>
          <label>Search by <select name="mode"><option value="words">Words</option><option value="related">Related ideas</option></select></label>
          <label>Section <select name="section"><option value="">Everything</option><option value="engineering">Engineering</option><option value="oss-radar">OSS Radar</option><option value="essays">Essays</option></select></label>
        </div>
      </form>
      <p class="search-model-note" hidden>Related ideas uses a local model. Enabling it downloads model files and the passage index; your browser may cache them. Words remains available.</p>
      <button type="button" class="search-enable" hidden>Enable related search · about 54 MB</button>
      <p class="search-status" role="status" aria-live="polite">Search the full text of published articles. Results link directly to source passages.</p>
      <div class="search-results" id=${id + '-results'}><!--search-results--></div>
    </div>`;
}

export function searchPage() {
  return html`<section class="search-page tool-app">
    <p class="search-eyebrow">The publication, paragraph by paragraph</p>
    <h1>Find something you read.</h1>
    <p>Search a project name, a detail, or a topic you half remember.</p>
    ${searchSurface('page')}
    <p class="search-footnote">Results are passages to inspect, including related material. They do not confirm that a remembered topic appears here. Interactive queries run in your browser. Submitting the plain search form sends its query in the URL to this site.</p>
  </section>`;
}
