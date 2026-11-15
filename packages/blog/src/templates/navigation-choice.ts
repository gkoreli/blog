import { html } from '@nisli/core';

export type NavigationDrawing = 'page' | 'robots' | 'compare' | 'request' | 'code-map' | 'memory' | 'reactivity' | 'publication';
export interface NavigationChoice {
  id: string;
  href: string;
  label: string;
  summary: string;
  meta: string;
  drawing: NavigationDrawing;
}

/** Drawn for thumbnail scale; these decorative marks are not audit results. */
export function navigationDrawing(kind: NavigationDrawing) {
  const drawings = {
    'code-map': () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><rect class="navigation-paper" x="8" y="8" width="28" height="43" rx="3"/><path class="navigation-rule" d="M15 19h13M15 26h9M15 34h13M15 42h8M36 29h11V14h15M47 29v21h15"/><circle class="navigation-paper" cx="74" cy="15" r="10"/><path class="navigation-detail" d="m71 11-4 4 4 4m6-8 4 4-4 4"/><rect class="navigation-paper" x="63" y="40" width="23" height="18" rx="3"/><path class="navigation-detail" d="M69 47h11M69 52h7"/></svg>`,
    memory: () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><rect class="navigation-paper" x="23" y="8" width="52" height="39" rx="3" transform="rotate(8 49 28)"/><rect class="navigation-paper" x="17" y="15" width="52" height="39" rx="3" transform="rotate(-6 43 35)"/><rect class="navigation-paper" x="19" y="22" width="52" height="36" rx="3"/><rect class="navigation-wash" x="25" y="28" width="18" height="5" rx="1"/><path class="navigation-rule" d="M25 39h36M25 46h29M25 52h18"/><circle class="navigation-paper" cx="78" cy="42" r="9"/><path class="navigation-detail" d="M78 36v7h5"/></svg>`,
    reactivity: () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><path class="navigation-rule" d="M24 32h13M59 32h13M48 22V11h24M48 42v12H24"/><circle class="navigation-paper" cx="15" cy="32" r="9"/><rect class="navigation-paper" x="38" y="22" width="20" height="20" rx="4"/><rect class="navigation-paper" x="73" y="22" width="18" height="20" rx="3"/><path class="navigation-detail" d="M11 32h8M15 28v8m29-4 3 3 6-7M77 28h10M77 33h7"/><circle class="navigation-wash" cx="76" cy="11" r="4"/><circle class="navigation-wash" cx="20" cy="54" r="4"/></svg>`,
    publication: () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><rect class="navigation-paper" x="13" y="8" width="65" height="48" rx="3" transform="rotate(-4 45 32)"/><path class="navigation-detail" d="M23 19h37"/><path class="navigation-rule" d="M23 26h44M23 34h18M23 40h18M23 46h18M48 34h19M48 40h19M48 46h12"/><path class="navigation-paper" d="m76 48 7-7 5 5-7 7-8 3z"/></svg>`,
    page: () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><rect class="navigation-paper" x="10" y="7" width="35" height="49" rx="3" transform="rotate(-7 27 32)"/><path class="navigation-rule" d="M19 19h17M18 27h17M17 35h13M16 43h17"/><rect class="navigation-paper" x="53" y="16" width="32" height="38" rx="3" transform="rotate(6 69 35)"/><path class="navigation-detail" d="m59 28 3 3 5-6m-7 15 3 3 5-6"/><path class="navigation-rule" d="m72 28 6 1m-7 12 6 1"/></svg>`,
    robots: () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><rect class="navigation-paper" x="8" y="11" width="31" height="44" rx="3"/><path class="navigation-rule" d="M15 21h17M15 28h14M15 42h17M39 33h12V17h12M51 33v17h12"/><rect class="navigation-wash" x="14" y="33" width="18" height="4" rx="1"/><rect class="navigation-paper" x="65" y="8" width="22" height="18" rx="9"/><rect class="navigation-paper" x="65" y="41" width="22" height="18" rx="9"/><path class="navigation-detail" d="m71 17 3 3 6-7M71 50h10"/></svg>`,
    compare: () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><rect class="navigation-paper" x="9" y="10" width="30" height="46" rx="3" transform="rotate(-6 24 33)"/><rect class="navigation-paper" x="58" y="8" width="30" height="46" rx="3" transform="rotate(6 73 31)"/><path class="navigation-rule" d="M17 21h14M16 28h14M15 43h14M66 20h14M65 27h14M64 42h14"/><path class="navigation-removed" d="M16 35h14"/><path class="navigation-detail" d="M65 34h14"/></svg>`,
    request: () => html`<svg class="navigation-drawing" viewBox="0 0 96 64" fill="none" aria-hidden="true" focusable="false"><rect class="navigation-paper" x="7" y="20" width="32" height="29" rx="3"/><path class="navigation-rule" d="M7 28h32M14 35h17M14 41h12M41 34h11"/><rect class="navigation-paper" x="58" y="9" width="30" height="47" rx="3" transform="rotate(5 73 32)"/><rect class="navigation-wash" x="65" y="17" width="16" height="7" rx="1"/><path class="navigation-rule" d="M65 31h15M65 38h12M64 45h15"/></svg>`,
  };
  return drawings[kind]();
}

export function navigationChoices(choices: readonly NavigationChoice[], options: {
  label: string;
  idPrefix: string;
  layout?: 'tiles' | 'rows';
  headingLevel?: 2 | 3;
}) {
  return html`<nav class="navigation-collection" aria-label=${options.label}>
    <ul class=${`navigation-choices navigation-choices-${options.layout ?? 'tiles'}`}>
      ${choices.map(choice => {
        const id = `${options.idPrefix}-${choice.id}`;
        const external = /^https?:\/\//u.test(choice.href);
        const title = () => html`<a class="navigation-choice-link" href=${choice.href} target=${external ? '_blank' : undefined} rel=${external ? 'noopener' : undefined} aria-describedby=${`${id}-summary ${id}-meta`}>${choice.label}</a>`;
        return html`<li class="navigation-choice"><div class="navigation-choice-heading">
          ${options.headingLevel === 3 ? html`<h3>${title()}</h3>` : html`<h2>${title()}</h2>`}
          <div class="navigation-choice-art">${navigationDrawing(choice.drawing)}</div>
        </div><p class="navigation-choice-summary" id=${`${id}-summary`}>${choice.summary}</p><span class="navigation-choice-meta" id=${`${id}-meta`}>${choice.meta}</span></li>`;
      })}
    </ul>
  </nav>`;
}
