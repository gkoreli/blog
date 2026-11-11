// Local design studies. These are deliberately outside the publication pipeline.
const arrow = '<span class="ts-arrow" aria-hidden="true">→</span>';

export function illustration(kind) {
  const drawings = {
    page: `<g transform="translate(30 12) rotate(-7 65 60)"><rect class="ts-art-paper" width="118" height="128" rx="7"/><path class="ts-art-line" d="M16 23h66M16 38h86M16 49h70M16 76h86M16 87h79M16 98h50"/><rect class="ts-art-tint" x="16" y="59" width="86" height="7" rx="2"/></g><g transform="translate(150 32) rotate(6 50 50)"><rect class="ts-art-paper" width="102" height="108" rx="7"/><path class="ts-art-line" d="M38 29h47M38 55h39M38 81h47"/><g class="ts-art-ink"><circle cx="20" cy="29" r="7"/><circle cx="20" cy="55" r="7"/><circle cx="20" cy="81" r="7"/></g><path class="ts-art-check" d="m17 29 2 2 4-4m-6 28 2 2 4-4m-6 28 2 2 4-4"/></g>`,
    robots: `<rect class="ts-art-paper" x="20" y="24" width="108" height="120" rx="7"/><path class="ts-art-line" d="M35 45h67M35 56h46M35 108h68M35 119h53"/><rect class="ts-art-tint" x="35" y="72" width="76" height="17" rx="3"/><path class="ts-art-line" d="M128 81h28V45h29m-29 36v38h29"/><rect class="ts-art-paper" x="186" y="27" width="72" height="36" rx="18"/><rect class="ts-art-paper" x="186" y="101" width="72" height="36" rx="18"/><path class="ts-art-accent" d="m202 45 5 5 9-10M232 40v10m-32 69h15m11 0h14"/>`,
    compare: `<g transform="translate(29 24) rotate(-4 48 57)"><rect class="ts-art-paper" width="93" height="119" rx="6"/><path class="ts-art-line" d="M14 22h59M14 33h48M14 62h64M14 73h58M14 98h47"/><path class="ts-art-removed" d="M14 47h64M14 86h40"/></g><g transform="translate(160 20) rotate(5 48 57)"><rect class="ts-art-paper" width="93" height="119" rx="6"/><path class="ts-art-line" d="M14 22h59M14 33h48M14 62h64M14 73h58M14 98h47"/><path class="ts-art-accent" d="M14 47h64M14 86h64"/></g><path class="ts-art-line" d="M126 83h26m-6-5 6 5-6 5"/>`,
    request: `<rect class="ts-art-paper" x="22" y="45" width="95" height="74" rx="7"/><path class="ts-art-line" d="M22 64h95M35 55h3m7 0h3m7 0h3M35 80h65M35 91h48M35 102h58M118 82h25m-5-5 5 5-5 5"/><g transform="translate(156 20) rotate(5 45 62)"><rect class="ts-art-paper" width="102" height="125" rx="6"/><rect class="ts-art-tint" x="13" y="16" width="76" height="20" rx="3"/><path class="ts-art-line" d="M13 52h76M13 65h52M13 87h76M13 100h60"/><path class="ts-art-accent" d="M21 26h13m8 0h13m8 0h17"/></g>`,
  };
  if (!Object.hasOwn(drawings, kind)) throw new Error(`Unknown illustration: ${kind}`);
  return `<svg class="ts-illustration" viewBox="0 0 280 170" fill="none" aria-hidden="true">${drawings[kind]}</svg>`;
}

const toolData = [
  { id:'page', name:'Page check', question:'Can a client read your page?', description:'Inspect the response, crawler access and page structure. Get the evidence behind the technical score.', short:'See what arrives, what’s readable and what needs attention.', href:'/ai-check', action:'Check a page', meta:'10 shared checks / day', output:'Response · policy · next steps' },
  { id:'robots', name:'Robots playground', question:'What do your rules allow?', description:'Try a crawler and a path against your robots.txt. Find the exact rule behind the decision.', short:'Try a crawler and path. Find the rule that decides.', href:'/tools/robots', action:'Test a policy', meta:'Local · unlimited', output:'Matching group · exact rule' },
  { id:'compare', name:'Report comparison', question:'What changed after the fix?', description:'Open two saved reports to see improvements, regressions and evidence that changed.', short:'Put two reports side by side. See what changed.', href:'/tools/compare', action:'Compare reports', meta:'Local · nothing uploaded', output:'Improvements · regressions · unknowns' },
  { id:'request', name:'Request inspector', question:'What does your request reveal?', description:'Inspect the declarations, network context and signature evidence your own request carries.', short:'Inspect your client’s declarations and request evidence.', href:'/ai-check#ai-check-request-heading', action:'Inspect my request', meta:'Uses the shared allowance', output:'Declarations · context · signatures' },
];

function form(id) {
  return `<form class="ts-check-form" action="https://gkoreli.com/ai-check" method="get" data-preview-form>
    <label for="${id}-url">Your public page URL</label>
    <div class="ts-input-row"><input id="${id}-url" name="url" type="text" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" placeholder="your-site.com/article" required aria-describedby="${id}-help ${id}-status"><button class="ts-primary" type="submit">Check page ${arrow}</button></div>
    <p class="ts-form-help" id="${id}-help">A domain is enough. We’ll add https://.</p>
    <p class="ts-preview-status" id="${id}-status" role="status" hidden></p>
  </form>`;
}

function linkedTool(tool, variant) {
  const id = `${variant}-${tool.id}`;
  return `<section class="ts-tool-tile ts-${tool.id}">
    <div class="ts-tile-art">${illustration(tool.id)}</div>
    <div class="ts-tile-copy"><span class="ts-meta">${tool.meta}</span><h2><a class="ts-stretched-link" href="${tool.href}" id="${id}">${tool.name}</a></h2><p>${tool.short}</p><span class="ts-tile-action" aria-hidden="true">${tool.action} ${arrow}</span></div>
  </section>`;
}

const provenance = `<footer class="ts-provenance"><span>From the field notes.</span><a href="/ai-site-check-evidence">The investigation ${arrow}</a><a href="/api/ai-check/schema">JSON API ${arrow}</a><a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Source ${arrow}</a></footer>`;
const intro = (kicker, heading, text, extra='') => `<header class="ts-intro"><div><p class="ts-kicker">${kicker}</p><h1>${heading}</h1><p class="ts-lead">${text}</p></div>${extra}</header>`;

export const concepts = [
  {
    id:'workbench', label:'Workbench',
    content:`<article class="tool-study ts-workbench" aria-label="Workbench tools design">
      ${intro('The publication’s workbench', 'Look closer.<br>Build a more readable web.', 'Small tools for the questions behind a page.', `<div class="ts-intro-art">${illustration('page')}</div>`)}
      <section class="ts-check-surface" aria-labelledby="workbench-heading">
        <div class="ts-surface-heading"><h2 id="workbench-heading">Start with a page.</h2><span class="ts-meta">AI access check</span></div>
        ${form('workbench')}
        <div class="ts-check-bottom"><span class="ts-meta">10 free checks per network / UTC day · No account</span><a href="/ai-check/example#access-report">Or open a saved report ${arrow}</a></div>
      </section>
      <div class="ts-section-heading"><h2>Keep investigating.</h2><span class="ts-meta">Three ways to go deeper</span></div>
      <div class="ts-bench-tools">${toolData.slice(1).map(t=>linkedTool(t,'bench')).join('')}</div>
      <p class="ts-footnote">Page check and request inspection share the daily allowance. Robots and comparison run locally.</p>
      ${provenance}
    </article>`,
  },
  {
    id:'library', label:'Tool library',
    content:`<article class="tool-study ts-library" aria-label="Tool library design">
      ${intro('Field tools / four ways in', 'Small tools.<br>Useful answers.', 'For checking a page, testing a policy and following the evidence.')}
      <div class="ts-library-grid">${toolData.map(t=>linkedTool(t,'library')).join('')}</div>
      <section class="ts-example-invitation"><div class="ts-example-stack" aria-hidden="true"><span></span><span></span></div><div><p class="ts-meta">Curious? Start here.</p><h2><a class="ts-stretched-link" href="/ai-check/example#access-report">Explore a saved report</a></h2><p>See the evidence before checking your own page. No allowance used.</p></div>${arrow}</section>
      <p class="ts-footnote">No account needed. Page checks and request inspection share 10 checks per network address per UTC day.</p>
      ${provenance}
    </article>`,
  },
  {
    id:'guided', label:'Task chooser',
    content:`<article class="tool-study ts-guided" aria-label="Task chooser tools design">
      ${intro('A small kit for the readable web', 'Follow your question.', 'Choose a task. We’ll put the right tool in front of you.')}
      <div class="ts-task-layout">
        <nav class="ts-task-choices" aria-label="Choose a tool">${toolData.map((t,i)=>`<a class="ts-task-choice${i===0?' is-active':''}" href="#guided-${t.id}" data-task="${t.id}"${i===0?' aria-current="true"':''}><span class="ts-choice-mark" aria-hidden="true">${['01','02','03','04'][i]}</span><span>${['Check a page','Test a crawler policy','Compare two reports','Inspect my request'][i]}</span>${arrow}</a>`).join('')}</nav>
        <div class="ts-task-panels">${toolData.map((t,i)=>`<section class="ts-task-panel" id="guided-${t.id}" data-task-panel="${t.id}">
          <div class="ts-panel-art">${illustration(t.id)}<span class="ts-meta">${t.output}</span></div>
          <div class="ts-panel-copy"><span class="ts-meta">${t.name}</span><h2>${t.question}</h2><p>${t.description}</p>${i===0?`${form('guided')}<span class="ts-meta ts-panel-allowance">10 free checks per network / UTC day</span><a class="ts-quiet-link" href="/ai-check/example#access-report">Explore a saved report ${arrow}</a>`:`<a class="ts-primary ts-open-tool" href="${t.href}">${t.action} ${arrow}</a><span class="ts-meta ts-panel-allowance">${t.meta}</span>`}</div>
        </section>`).join('')}</div>
      </div>
      <p class="ts-footnote">No account needed. Local tools keep your inputs in your browser. Page checks and request inspection share the daily allowance.</p>
      ${provenance}
    </article>`,
  },
];

export const tools = toolData;
