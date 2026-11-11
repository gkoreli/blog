import type { SiteAuditReport } from '@gkoreli/site-audit/contracts';
import { siteAuditReportHtml } from '../lib/site-audit-report.js';
import type { CheckQuota } from './ai-check-quota.js';
import { failureFeedback } from '../lib/check-feedback.js';

function escape(value: string | number): string {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

export function checkResultHtml(report: SiteAuditReport, quota?: CheckQuota, example = false): string {
  return siteAuditReportHtml(report, { quota, example });
}

export function checkErrorHtml(message: string, status = 503, quota?: CheckQuota): string {
  const feedback = failureFeedback(message, status, quota, 'UTC');
  return `<section role="alert" class="tool-feedback" data-tone="${feedback.tone}"><span class="tool-feedback-icon" aria-hidden="true"><img src="/icons/${feedback.tone === 'error' ? 'close' : 'clock'}.svg" alt="" width="18" height="18"></span><div><strong class="tool-feedback-title">${escape(feedback.title)}</strong><p class="tool-feedback-detail">${escape(feedback.detail)}</p>${feedback.meta ? `<span class="tool-feedback-meta">${escape(feedback.meta)}</span>` : ''}<div class="tool-feedback-actions"><a href="/ai-check/example#access-report">View example report</a><a href="/tools/robots">Try robots playground</a></div></div></section>`;
}
