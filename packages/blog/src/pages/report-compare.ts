import { html } from '@nisli/core';
import { toolNavigation } from './tool-navigation.js';

export function reportComparePage() {
  return html`<article class="ai-check tools-workbench tool-app">
    ${toolNavigation('compare')}
    <header class="ai-check-header"><p class="tool-kicker">Report comparison · local and unlimited</p><h1>Compare access reports</h1><p class="ai-check-lead">Compare two saved access reports. Follow changes in scores, checks, crawler policies and delivery evidence.</p></header>
    <report-comparison>
      <div class="comparison-demo" hidden><button type="button" class="tool-quiet-button" data-comparison-example hidden>Load example reports <span aria-hidden="true">↗</span></button><span class="tool-caption">Try an illustrative before & after. No files needed.</span></div>
      <form data-compare-form class="workbench-form">
        <div class="comparison-inputs">${(['before', 'after'] as const).map((side, index) => html`<section class="comparison-input-card"><div class="comparison-input-heading"><span class="tool-number">0${index + 1}</span><label for=${`compare-${side}-file`}>${side === 'before' ? 'Before report' : 'After report'}</label></div><div class="report-file-zone"><span class="report-file-symbol" aria-hidden="true">↑</span><strong data-file-name=${side}>Choose a saved report</strong><span>Drop a JSON file here, or browse</span><input type="file" id=${`compare-${side}-file`} data-report-file=${side} accept="application/json,.json" aria-describedby=${`compare-help compare-${side}-error`}></div><details class="comparison-paste"><summary>Or paste report JSON</summary><label class="sr-only" for=${`compare-${side}`}>${side === 'before' ? 'Before report JSON' : 'After report JSON'}</label><textarea id=${`compare-${side}`} name=${side} aria-describedby=${`compare-help compare-${side}-error`} rows="8" maxlength="1048576" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder='{"report": {…}}'></textarea></details><p id=${`compare-${side}-error`} class="ai-check-field-error" data-report-error=${side} role="alert" hidden></p></section>`)}</div>
        <p id="compare-help" class="tool-caption">Use JSON downloaded from AI Access Check. Reports and file contents stay in this browser. Up to 1 MB per report.</p><button type="submit" disabled>Compare reports</button>
      </form><p id="compare-status" data-workbench-status role="status" aria-live="polite" aria-atomic="true"></p><div data-workbench-result></div>
      <noscript><p>Enable JavaScript to compare files locally. You can still open saved JSON in a text editor and inspect the target, checkedAt, resources and findings. <a href="/ai-check">Run a new server check</a>.</p></noscript>
    </report-comparison>
    <section class="ai-check-method"><h2>Compare like with like</h2><p>Start with the same page and review the assessment times and method versions. A score change is a change in these recorded checks. It does not establish what caused the difference, and two checks can encounter different network or firewall conditions.</p><p class="ai-check-note">This tool recalculates the technical assessment for both reports with the current scoring profile. Original report versions stay visible. No live fetch or daily check is needed.</p></section>
  </article>`;
}
