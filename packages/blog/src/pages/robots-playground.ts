import { html } from '@nisli/core';
import { toolNavigation } from './tool-navigation.js';

export const ROBOTS_EXAMPLE = `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n`;

export function robotsPlaygroundPage() {
  return html`<article class="ai-check tools-workbench tool-app">
    ${toolNavigation('robots')}
    <header class="ai-check-header"><p class="tool-kicker">Policy playground · local and unlimited</p><h1>Robots playground</h1><p class="ai-check-lead">Test a robots.txt against one client and path. See the matching groups, the selected rule, and the reason for the decision.</p></header>
    <robots-workbench>
      <form data-robots-form class="workbench-form" novalidate>
        <div class="workbench-editor-heading"><label for="robots-source">robots.txt content</label><span class="tool-console-meta">Editable sample</span></div><textarea id="robots-source" name="robots" aria-describedby="robots-status" rows="12" maxlength="524288" spellcheck="false" autocapitalize="off" autocorrect="off">${ROBOTS_EXAMPLE}</textarea>
        <div class="workbench-fields"><div><label for="robots-token">Crawler product token</label><input id="robots-token" name="token" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="robots-status" value="OAI-SearchBot" maxlength="128" required list="robots-tokens"><datalist id="robots-tokens"><option value="OAI-SearchBot"></option><option value="ChatGPT-User"></option><option value="GPTBot"></option><option value="Claude-SearchBot"></option><option value="Claude-User"></option><option value="PerplexityBot"></option><option value="Googlebot"></option></datalist></div><div><label for="robots-path">Path to check</label><input id="robots-path" name="path" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="robots-status" value="/guides/agent-access" maxlength="2048" required></div></div>
        <div class="workbench-actions"><button type="submit" disabled>Evaluate rules</button><span class="tool-caption">Runs in your browser. Nothing is uploaded.</span></div>
      </form>
      <p id="robots-status" data-workbench-status role="status" aria-live="polite" aria-atomic="true"></p>
      <div data-workbench-result><section class="workbench-verdict"><span class="tool-kicker">Example policy</span><h2>Allowed for OAI-SearchBot</h2><p>The named group allows <code>/</code>, which matches <code>/guides/agent-access</code>. The separate GPTBot group disallows crawling for that product token.</p><p class="tool-caption">This is the sample above, not a live site check.</p></section></div>
      <noscript><p>The sample policy is explained above. Enable JavaScript to evaluate your own text locally, or <a href="/ai-check">check a published URL</a> using the server form.</p></noscript>
    </robots-workbench>
    <section class="ai-check-method"><h2>From policy text to a decision</h2><ol class="ai-check-chain"><li><strong>Select the client’s groups.</strong><span>Matching named groups are combined. The wildcard group applies when no specific group matches.</span></li><li><strong>Match the requested path.</strong><span>The longest matching Allow or Disallow rule takes priority. Allow wins an equally specific tie.</span></li><li><strong>Read it as a policy.</strong><span>Robots rules tell cooperating clients what you permit. They do not authenticate a bot or prove that a firewall will serve the page.</span></li></ol><p class="ai-check-note"><a href="https://www.rfc-editor.org/rfc/rfc9309.html" target="_blank" rel="noopener">Robots Exclusion Protocol (RFC 9309)</a> · <a href="/ai-check">Test delivery and indexing too</a></p></section>
  </article>`;
}
