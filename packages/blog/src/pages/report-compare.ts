import { html } from '@nisli/core';

export function reportComparePage() {
  return html`<article class="ai-check tools-workbench post-content">
    <header class="ai-check-header"><a class="tool-back" href="/tools">← All tools</a><p class="tool-kicker">Report comparison · local and unlimited</p><h1>See what changed<br>after the fix.</h1><p class="ai-check-lead">Compare two saved access reports. Follow changes in scores, checks, crawler policies and delivery evidence.</p></header>
    <report-comparison>
      <form data-compare-form class="workbench-form">
        <div class="comparison-inputs"><div><label for="compare-before-file">Before report</label><input type="file" id="compare-before-file" data-report-file="before" accept="application/json,.json" aria-describedby="compare-help"><label class="tool-caption" for="compare-before">Or paste JSON</label><textarea id="compare-before" name="before" rows="8" maxlength="1048576" spellcheck="false" placeholder='{"report": {…}}'></textarea></div><div><label for="compare-after-file">After report</label><input type="file" id="compare-after-file" data-report-file="after" accept="application/json,.json" aria-describedby="compare-help"><label class="tool-caption" for="compare-after">Or paste JSON</label><textarea id="compare-after" name="after" rows="8" maxlength="1048576" spellcheck="false" placeholder='{"report": {…}}'></textarea></div></div>
        <p id="compare-help" class="tool-caption">Use JSON downloaded from AI Access Check. Reports and file contents stay in this browser. Up to 1 MB per report.</p><button type="submit" disabled>Compare reports</button>
      </form><p data-workbench-status role="status" aria-live="polite" aria-atomic="true"></p><div data-workbench-result></div>
      <noscript><p>Enable JavaScript to compare files locally. You can still open saved JSON in a text editor and inspect the target, checkedAt, resources and findings. <a href="/ai-check">Run a new server check</a>.</p></noscript>
    </report-comparison>
    <section class="ai-check-method"><h2>Compare like with like</h2><p>Start with the same page and review the assessment times and method versions. A score change is a change in these recorded checks. It does not establish what caused the difference, and two checks can encounter different network or firewall conditions.</p><p class="ai-check-note">This tool recalculates the technical assessment for both reports with the current scoring profile. Original report versions stay visible. No live fetch or daily check is needed.</p></section>
  </article>`;
}
