import { tools } from './concepts.mjs';

const arrow = '<span class="nc-arrow" aria-hidden="true">→</span>';
const summaries = {
  page: 'Check access, HTML and page structure.',
  robots: 'Find the rule for a crawler and path.',
  compare: 'See what changed between two reports.',
  request: 'Inspect your request’s declarations.',
};
const allowances = { page:'Shared daily allowance', robots:'Local · unlimited', compare:'Local · no uploads', request:'Shared daily allowance' };

// These drawings are composed at thumbnail scale, rather than shrinking the
// detailed first-round illustrations. Their marks describe structure, not results.
export function smallIllustration(kind) {
  const drawings = {
    page: `<rect class="nc-paper" x="10" y="7" width="35" height="49" rx="3" transform="rotate(-7 27 32)"/><path class="nc-rule" d="M19 19h17M18 27h17M17 35h13M16 43h17"/><rect class="nc-paper" x="53" y="16" width="32" height="38" rx="3" transform="rotate(6 69 35)"/><path class="nc-detail" d="m59 28 3 3 5-6m-7 15 3 3 5-6"/><path class="nc-rule" d="m72 28 6 1m-7 12 6 1"/>`,
    robots: `<rect class="nc-paper" x="8" y="11" width="31" height="44" rx="3"/><path class="nc-rule" d="M15 21h17M15 28h14M15 42h17M39 33h12V17h12M51 33v17h12"/><rect class="nc-wash" x="14" y="33" width="18" height="4" rx="1"/><rect class="nc-paper" x="65" y="8" width="22" height="18" rx="9"/><rect class="nc-paper" x="65" y="41" width="22" height="18" rx="9"/><path class="nc-detail" d="m71 17 3 3 6-7M71 50h10"/>`,
    compare: `<rect class="nc-paper" x="9" y="10" width="30" height="46" rx="3" transform="rotate(-6 24 33)"/><rect class="nc-paper" x="58" y="8" width="30" height="46" rx="3" transform="rotate(6 73 31)"/><path class="nc-rule" d="M17 21h14M16 28h14M15 43h14M66 20h14M65 27h14M64 42h14M42 33h10m-3-3 3 3-3 3"/><path class="nc-removed" d="M16 35h14"/><path class="nc-detail" d="M65 34h14"/>`,
    request: `<rect class="nc-paper" x="7" y="20" width="32" height="29" rx="3"/><path class="nc-rule" d="M7 28h32M14 35h17M14 41h12M41 34h11m-3-3 3 3-3 3"/><rect class="nc-paper" x="58" y="9" width="30" height="47" rx="3" transform="rotate(5 73 32)"/><rect class="nc-wash" x="65" y="17" width="16" height="7" rx="1"/><path class="nc-rule" d="M65 31h15M65 38h12M64 45h15"/>`,
  };
  if (!Object.hasOwn(drawings,kind)) throw new Error(`Unknown drawing: ${kind}`);
  return `<svg class="nc-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true">${drawings[kind]}</svg>`;
}

export function navigationChoice(tool, variant) {
  const id = `${variant}-${tool.id}`;
  return `<li class="nc-choice">
    <div class="nc-choice-heading"><h2><a class="nc-link" href="${tool.href}" aria-describedby="${id}-summary ${id}-meta">${tool.name}</a></h2><div class="nc-art">${smallIllustration(tool.id)}</div></div>
    <p class="nc-summary" id="${id}-summary">${summaries[tool.id]}</p>
    <div class="nc-choice-footer"><span class="nc-meta" id="${id}-meta">${allowances[tool.id]}</span>${arrow}</div>
  </li>`;
}

function page(id, variant) {
  return `<article class="tool-study nc-library nc-${variant}" aria-label="${variant==='tiles'?'Compact tiles':'Illustrated rows'} tools design">
    <header class="nc-intro"><p class="nc-kicker">The publication’s workbench</p><h1>Small tools.<br>Useful answers.</h1><p>Check a page. Test a policy. Follow the evidence.</p></header>
    <ul class="nc-choices" aria-label="Tools">${tools.map(tool=>navigationChoice(tool,id)).join('')}</ul>
    <section class="nc-example"><div class="nc-example-copy"><span class="nc-meta">A good place to start</span><h2><a class="nc-link" href="/ai-check/example#access-report">Explore a saved report</a></h2><p>No page to check? See how the evidence fits together.</p></div>${arrow}</section>
    <p class="nc-footnote">No account needed. Page checks and request inspection share 10 checks per network address per UTC day. The local tools use no allowance.</p>
    <footer class="nc-provenance"><span>From the field notes.</span><a href="/ai-site-check-evidence">Investigation</a><a href="/api/ai-check/schema">JSON API</a><a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Source</a></footer>
  </article>`;
}

export const refinements = [
  {id:'compact-tiles',label:'Compact tiles',content:page('compact','tiles')},
  {id:'illustrated-rows',label:'Illustrated rows',content:page('rows','rows')},
];

export const patternSheet = {
  id:'navigation-patterns',label:'Navigation patterns',
  content:`<article class="tool-study nc-library nc-pattern-sheet" aria-label="Navigation design language study">
    <header class="nc-intro"><p class="nc-kicker">Design language / working study</p><h1>Small, useful invitations.</h1><p>One visual family. Different emphasis for different jobs.</p></header>
    <section class="nc-pattern-group nc-tiles"><p class="nc-meta">Choice / a small set of destinations</p><ul class="nc-choices" aria-label="Compact choices">${tools.slice(0,2).map(t=>navigationChoice(t,'pattern-tile')).join('')}</ul></section>
    <section class="nc-pattern-group nc-rows"><p class="nc-meta">Row / a longer or supporting collection</p><ul class="nc-choices" aria-label="Illustrated rows">${tools.slice(2).map(t=>navigationChoice(t,'pattern-row')).join('')}</ul></section>
    <section class="nc-pattern-group"><p class="nc-meta">Invitation / one featured destination</p><section class="nc-example nc-featured-invitation"><div class="nc-art">${smallIllustration('page')}</div><div class="nc-example-copy"><h2><a class="nc-link" href="/tools">From field notes to working tools.</a></h2><p>Check access, test crawler rules and compare evidence.</p></div>${arrow}</section></section>
  </article>`,
};
