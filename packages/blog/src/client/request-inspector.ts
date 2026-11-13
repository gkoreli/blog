import { failureFeedback } from '../lib/check-feedback.js';
import { requestContextPresentation } from '../lib/request-context-presentation.js';
import { errorMessage, quotaLabel, showCheckFeedback } from './check-feedback.js';
import { node, definition, rawEvidence, object } from './tool-dom.js';

function at(value: unknown, ...keys: string[]): unknown {
  let current = value;
  for (const key of keys) { if (!object(current)) return undefined; current = current[key]; }
  return current;
}
function display(value: unknown): string {
  if (value === null || value === undefined) return 'Unavailable';
  if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ') || 'None observed';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
export function renderRequestEvidence(value: Record<string, unknown>): HTMLElement {
  const section = node('section', undefined, 'request-evidence-report'); section.append(node('h2', 'Evidence from this request'));
  const context = requestContextPresentation(at(value, 'context', 'referrerState'), at(value, 'context', 'fetchSite'), at(value, 'evidence', 'referrerContext'));
  section.append(node('h3', 'Referrer and navigation context'), definition([
    ['Reported source', context.referrer],
    ['Site relationship claim', context.site],
    ['Context check', context.consistency],
    ['Navigation-shaped', display(at(value, 'evidence', 'navigationShaped'))],
    ['Activation claim', display(at(value, 'evidence', 'activation'))],
  ]), node('p', context.meaning, 'ai-check-note'));
  if (context.review !== null) section.append(node('p', context.review, 'ai-check-note'));
  section.append(node('p', 'Navigation and activation headers are request signals. They do not identify a person or authenticate a referring site.', 'ai-check-note'), node('h3', 'Declarations and verification'));
  section.append(definition([
    ['Request category', display(at(value, 'classification', 'readerKind'))],
    ['Classification reason', display(at(value, 'classification', 'reason'))],
    ['Declared client names', display(at(value, 'evidence', 'declarations', 'candidates'))],
    ['Declaration agreement', display(at(value, 'evidence', 'categoryAgreement'))],
    ['Browser-family claim', display(at(value, 'evidence', 'declarations', 'browserFamily'))],
    ['Client-form markers', display(at(value, 'clientForm', 'form'))],
    ['Network list evidence', display(at(value, 'evidence', 'network'))],
    ['Network ASN', display(at(value, 'network', 'asn'))],
    ['Published-IP-feed results', display(at(value, 'network', 'vendorNetwork', 'summary'))],
    ['Local signature outcome', display(at(value, 'signature', 'localOutcome'))],
    ['Verified signer display', display(at(value, 'signature', 'signer'))],
    ['Cloudflare category', display(at(value, 'signature', 'native', 'category', 'value'))],
    ['Cloudflare verified bot', display(at(value, 'signature', 'native', 'verifiedBot'))],
    ['Cloudflare signed agent', display(at(value, 'signature', 'native', 'signedAgent'))],
  ]));
  const limits = at(value, 'limits');
  if (Array.isArray(limits)) { const list = node('ul', undefined, 'ai-check-limits'); for (const limit of limits) if (typeof limit === 'string') list.append(node('li', limit)); section.append(list); }
  section.append(rawEvidence(value, 'Complete request evidence, signature coverage and method versions'));
  return section;
}
export class RequestEvidenceCheck extends HTMLElement {
  private readonly onClick = (): void => { void this.inspect(); };
  connectedCallback(): void { const button = this.querySelector('[data-request-check]'); if (button instanceof HTMLButtonElement) { button.hidden = false; button.addEventListener('click', this.onClick); } }
  disconnectedCallback(): void { this.querySelector('[data-request-check]')?.removeEventListener('click', this.onClick); }
  private async inspect(): Promise<void> {
    const button = this.querySelector('[data-request-check]'), status = this.querySelector('[data-request-status]'), results = this.querySelector('[data-request-results]');
    if (!(button instanceof HTMLButtonElement) || !(status instanceof HTMLElement) || !(results instanceof HTMLElement)) return;
    button.disabled = true; showCheckFeedback(status, { tone: 'loading', title: 'Inspecting your request', detail: 'Reading the request evidence received by this service…' });
    try {
      const response = await fetch('/api/request-check', { headers: { Accept: 'application/json' }, redirect: 'error' });
      const value: unknown = await response.json();
      if (!response.ok) { showCheckFeedback(status, failureFeedback(errorMessage(value), response.status, object(value) ? value['quota'] : null)); return; }
      if (!object(value) || !object(value['request'])) throw new Error('Request evidence unavailable');
      results.replaceChildren(renderRequestEvidence(value['request']));
      showCheckFeedback(status, { tone: 'ready', title: 'Request evidence ready', detail: 'Client declarations and verification are shown below.', meta: quotaLabel(value['quota']) ?? '' });
    } catch { showCheckFeedback(status, failureFeedback('This request could not be inspected. Try the JSON link below.', 503, null)); }
    finally { button.disabled = false; }
  }
}

if (!customElements.get('request-evidence-check')) customElements.define('request-evidence-check', RequestEvidenceCheck);
