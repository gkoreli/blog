import { feedbackQuota, type CheckFeedback } from '../lib/check-feedback.js';
import { node, object } from './tool-dom.js';

export function quotaLabel(value: unknown): string | null {
  const quota = feedbackQuota(value);
  return quota ? `${quota.remaining} of ${quota.limit} checks remaining` : null;
}
export function showCheckFeedback(status: HTMLElement, feedback: CheckFeedback): void {
  status.dataset['state'] = feedback.tone;
  const card = node('div', undefined, 'tool-feedback'); card.dataset['tone'] = feedback.tone;
  const icon = node('span', undefined, 'tool-feedback-icon'); icon.setAttribute('aria-hidden', 'true');
  const symbol = node('img'); symbol.src = `/icons/${feedback.tone === 'error' ? 'close' : feedback.tone === 'ready' ? 'transparency' : 'clock'}.svg`; symbol.alt = ''; symbol.width = 18; symbol.height = 18; icon.append(symbol);
  const content = node('div'); content.append(node('strong', feedback.title, 'tool-feedback-title'), node('p', feedback.detail, 'tool-feedback-detail'));
  if (feedback.meta) content.append(node('span', feedback.meta, 'tool-feedback-meta'));
  if (feedback.alternatives) {
    const actions = node('div', undefined, 'tool-feedback-actions');
    const example = node('a', 'View example report'); example.href = '/ai-check/example#access-report'; example.setAttribute('data-example-check', '');
    const robots = node('a', 'Try robots playground'); robots.href = '/tools/robots';
    actions.append(example, robots); content.append(actions);
  }
  card.append(icon, content); status.replaceChildren(card);
}
export function errorMessage(value: unknown): string {
  if (object(value) && typeof value['error'] === 'string' && value['error'].length <= 1000) return value['error'];
  if (object(value) && object(value['error']) && typeof value['error']['message'] === 'string' && value['error']['message'].length <= 1000) return value['error']['message'];
  return 'The check could not finish. Please try again.';
}

