import { providerAttempt, readProviderJson, validProviderId } from './provider-response.js';

/**
 * email.ts — Resend email delivery + HTML templates.
 *
 * Resend docs: https://resend.com/docs/api-reference/emails/send-email
 * D1 is the source of truth; Resend is the delivery pipe only.
 * Swap the delivery layer here without touching any other module.
 *
 * Two email classes — different compliance obligations:
 *
 *   Transactional  sendConfirmationEmail()   — double opt-in confirmation
 *                  No List-Unsubscribe header required (not marketing).
 *
 *   Subscribed     sendNewsletterBatch()      — newsletter / post alerts
 *                  Requires List-Unsubscribe + List-Unsubscribe-Post headers
 *                  (Google sender guidelines for bulk / subscribed mail).
 *                  Each email gets a personalised unsubscribe URL built from
 *                  the subscriber's raw unsubscribe_token.
 */

const FROM = 'Goga Koreli <newsletter@gkoreli.com>';
const BASE_URL = 'https://gkoreli.com';

/** Max recipients per Resend batch API call. */
export const RESEND_BATCH_LIMIT = 100;

type ConfirmationDeliveryOutcome =
  | { outcome: 'accepted'; providerId: string; providerStatus: number }
  | { outcome: 'failed' | 'unknown'; providerId: null; providerStatus: number | null };

export interface ConfirmationDeliveryDiagnostics {
  attempts: number;
  elapsedMs: number;
  retryReason: 'none' | 'network' | 'timeout' | 'server' | 'idempotency' | 'rate-limit' | 'invalid-response';
  stopReason: 'accepted' | 'http-rejected' | 'retry-exhausted' | 'rate-wait-too-long' | 'rate-wait-invalid' | 'redirect-rejected';
}

export type ConfirmationDelivery = ConfirmationDeliveryOutcome & { diagnostics: ConfirmationDeliveryDiagnostics };

function transportFailure(error: unknown): 'timeout' | 'network' {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    ? 'timeout' : 'network';
}

/** Two bounded attempts with the same idempotency key and exact message body. */
export async function sendConfirmationEmail(
  apiKey: string,
  to: string,
  confirmUrl: string,
  optOutUrl: string,
  attemptId: string,
): Promise<ConfirmationDelivery> {
  const startedAt = performance.now();
  const diagnostics: ConfirmationDeliveryDiagnostics = {
    attempts: 0, elapsedMs: 0, retryReason: 'none', stopReason: 'retry-exhausted',
  };
  const finish = (result: ConfirmationDeliveryOutcome, stopReason: ConfirmationDeliveryDiagnostics['stopReason']): ConfirmationDelivery => ({
    ...result,
    diagnostics: { ...diagnostics, stopReason, elapsedMs: Math.max(0, Math.floor(performance.now() - startedAt)) },
  });
  const body = JSON.stringify({
    from: FROM, to, subject: 'Confirm your blog subscription',
    html: confirmationHtml(confirmUrl, optOutUrl), text: confirmationText(confirmUrl, optOutUrl),
  });
  let last: ConfirmationDeliveryOutcome = { outcome: 'unknown', providerId: null, providerStatus: null };
  // A later rejected retry does not prove an earlier ambiguous call sent nothing.
  // Only a valid accepted response can resolve that uncertainty for this operation.
  let acceptanceUncertain = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    diagnostics.attempts = attempt + 1;
    let providerStatus: number | null = null;
    let retryReason: ConfirmationDeliveryDiagnostics['retryReason'] = 'network';
    try {
      const budget = providerAttempt(8_000);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
          'Idempotency-Key': `newsletter-confirmation/${attemptId}`,
        },
        // Workers does not support redirect:error. Inspect manual responses instead.
        body, signal: budget.signal, redirect: 'manual',
      });
      providerStatus = res.status;
      if (res.status >= 300 && res.status < 400) {
        void res.body?.cancel().catch(() => {});
        return finish({ outcome: 'unknown', providerId: null, providerStatus }, 'redirect-rejected');
      }
      if (res.ok) {
        const parsed = await readProviderJson(res, { ...budget, maxBytes: 16 * 1024 });
        const data = parsed.ok ? parsed.value : undefined;
        if (typeof data === 'object' && data !== null && 'id' in data && validProviderId(data.id)) {
          return finish({ outcome: 'accepted', providerId: data.id, providerStatus: res.status }, 'accepted');
        }
        retryReason = !parsed.ok && parsed.reason === 'timeout' ? 'timeout' : 'invalid-response';
        acceptanceUncertain = true;
        last = { outcome: 'unknown', providerId: null, providerStatus: res.status };
      } else {
        // Provider bodies may contain addresses; retain only the HTTP status.
        acceptanceUncertain ||= res.status >= 500 || res.status === 409 || res.status === 408;
        last = { outcome: acceptanceUncertain ? 'unknown' : 'failed',
          providerId: null, providerStatus: res.status };
        // Cleanup must not extend the interactive response budget.
        void res.body?.cancel().catch(() => {});
        if (res.status !== 409 && res.status !== 429 && res.status < 500) return finish(last, 'http-rejected');
        retryReason = res.status === 409 ? 'idempotency' : res.status === 429 ? 'rate-limit' : 'server';
        if (res.status === 429 && attempt === 0) {
          // Respect a short provider reset without exceeding the interactive wait budget.
          // A longer or malformed hint returns the failure; never retry ahead of it.
          const hint = res.headers.get('retry-after') ?? '1';
          if (!/^\d+$/.test(hint)) return finish(last, 'rate-wait-invalid');
          const seconds = Number(hint);
          if (!Number.isSafeInteger(seconds)) return finish(last, 'rate-wait-invalid');
          if (seconds > 3) return finish(last, 'rate-wait-too-long');
          await new Promise<void>(resolve => setTimeout(resolve, Math.max(1, seconds) * 1000));
        }
      }
    } catch (error) {
      acceptanceUncertain = true;
      last = { outcome: 'unknown', providerId: null, providerStatus };
      retryReason = transportFailure(error);
    }
    if (attempt === 0) diagnostics.retryReason = retryReason;
  }
  return finish(last, 'retry-exhausted');
}

function confirmationHtml(confirmUrl: string, optOutUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirm your subscription</title>
</head>
<body style="margin:0;padding:40px 20px;background:#faf8f5;font-family:Georgia,'Times New Roman',serif;color:#2d2a24;">
  <div style="max-width:520px;margin:0 auto;">
    <p style="margin:0 0 2rem;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:#7a7568;">gkoreli.com</p>

    <h1 style="margin:0 0 1rem;font-size:1.4rem;font-weight:700;line-height:1.3;">Confirm your subscription</h1>

    <p style="margin:0 0 0.75rem;line-height:1.7;color:#4a4740;">
      You asked to be notified when something new lands on the blog.
      Open the link below, then confirm on the blog.
    </p>
    <p style="margin:0 0 2rem;line-height:1.7;color:#4a4740;">
      You'll only hear from me when I write something worth your inbox.
    </p>

    <a href="${esc(confirmUrl)}"
       style="display:inline-block;padding:0.75rem 1.75rem;background:#1a6b4e;color:#fff;text-decoration:none;border-radius:6px;font-size:0.95rem;font-family:Georgia,serif;">
      Confirm subscription →
    </a>

    <hr style="margin:2.5rem 0;border:none;border-top:1px solid #ddd8cf;">

    <p style="margin:0;font-size:0.75rem;line-height:1.6;color:#9a9585;">
      If you didn't request this, you haven't been subscribed. You can
      <a href="${esc(optOutUrl)}">block further confirmation requests</a> for this address.
    </p>
  </div>
</body>
</html>`;
}

function confirmationText(confirmUrl: string, optOutUrl: string): string {
  return `gkoreli.com

Confirm your subscription

You asked to be notified when something new lands on the blog. Open the link below, then confirm on the blog. You'll only hear from me when I write something worth your inbox.

Confirm subscription: ${confirmUrl}

---
If you didn't request this, you haven't been subscribed.
Block further confirmation requests: ${optOutUrl}`;
}

// ── Newsletter (subscribed-content) emails ────────────────────────────────────

export interface NewsletterRecipient {
  email: string;
  /** Raw unsubscribe token — included verbatim in footer URL. */
  unsubscribeToken: string;
}

export interface ResendBatchItem {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

export interface BatchSendResult {
  email: string;
  resend_id: string | null;
  error: string | null;
  outcome: 'accepted' | 'failed' | 'unknown';
}

type BatchProviderError = 'invalid_batch_size' | 'invalid_idempotency_key'
  | 'provider_redirect' | 'provider_rejected' | 'provider_unavailable'
  | 'provider_network' | 'provider_timeout' | 'provider_response_too_large'
  | 'provider_response_unreadable' | 'provider_response_invalid';

const MAX_BATCH_RESPONSE_BYTES = 64 * 1024;

function batchProviderIds(value: unknown, count: number): string[] | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)
    || !('data' in value) || !Array.isArray(value.data) || value.data.length !== count) return null;
  const rows: unknown[] = value.data;
  const ids: string[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null || Array.isArray(row) || !('id' in row)
      || !validProviderId(row.id)) return null;
    ids.push(row.id);
  }
  return new Set(ids).size === ids.length ? ids : null;
}

/**
 * Send a newsletter to a batch of subscribers via Resend's batch API.
 * Each email gets personalised List-Unsubscribe headers (RFC 8058).
 *
 * Caller is responsible for chunking to RESEND_BATCH_LIMIT before calling.
 * Acceptance requires a complete, ordered provider receipt. The caller owns
 * durable admission; this adapter never retries an uncertain campaign batch.
 */
export async function sendNewsletterBatch(
  apiKey: string,
  recipients: NewsletterRecipient[],
  subject: string,
  html: string,
  text: string,
  idempotencyKey?: string,
): Promise<BatchSendResult[]> {
  // Bind receipts to the audience actually used to construct this request.
  const audience = recipients.map(recipient => ({ ...recipient }));
  const fail = (outcome: 'failed' | 'unknown', error: BatchProviderError): BatchSendResult[] => audience.map(recipient => ({
    email: recipient.email, resend_id: null, error, outcome,
  }));
  if (audience.length === 0) return [];
  if (audience.length > RESEND_BATCH_LIMIT) return fail('failed', 'invalid_batch_size');
  if (idempotencyKey !== undefined && !/^[\x21-\x7e]{1,256}$/.test(idempotencyKey)) {
    return fail('failed', 'invalid_idempotency_key');
  }
  const batch: ResendBatchItem[] = audience.map(r => {
    const unsubUrl = `${BASE_URL}/api/unsubscribe/${r.unsubscribeToken}`;
    return {
      from: FROM,
      to: r.email,
      subject,
      html: appendUnsubFooterHtml(html, unsubUrl),
      text: appendUnsubFooterText(text, unsubUrl),
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    };
  });

  try {
    const budget = providerAttempt(8_000);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
        ...(idempotencyKey !== undefined && { 'Idempotency-Key': idempotencyKey }),
      },
      body: JSON.stringify(batch), signal: budget.signal, redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      void res.body?.cancel().catch(() => {});
      return fail('unknown', 'provider_redirect');
    }
    if (!res.ok) {
      void res.body?.cancel().catch(() => {});
      return res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 409
        ? fail('failed', 'provider_rejected') : fail('unknown', 'provider_unavailable');
    }
    const parsed = await readProviderJson(res, { ...budget, maxBytes: MAX_BATCH_RESPONSE_BYTES });
    if (!parsed.ok) {
      const error: BatchProviderError = parsed.reason === 'timeout' ? 'provider_timeout'
        : parsed.reason === 'too-large' ? 'provider_response_too_large'
        : parsed.reason === 'unreadable' ? 'provider_response_unreadable' : 'provider_response_invalid';
      return fail('unknown', error);
    }
    const ids = batchProviderIds(parsed.value, audience.length);
    if (!ids) return fail('unknown', 'provider_response_invalid');
    return audience.map((recipient, index): BatchSendResult => {
      const id = ids[index];
      return id
        ? { email: recipient.email, resend_id: id, error: null, outcome: 'accepted' }
        : { email: recipient.email, resend_id: null, error: 'provider_response_invalid', outcome: 'unknown' };
    });
  } catch (error) {
    return fail('unknown', transportFailure(error) === 'timeout' ? 'provider_timeout' : 'provider_network');
  }
}

/** Append plain-text unsubscribe footer. */
function appendUnsubFooterText(text: string, unsubUrl: string): string {
  return `${text}\n\n---\nYou're receiving this because you subscribed at gkoreli.com.\nUnsubscribe: ${unsubUrl}`;
}

/** Append HTML unsubscribe footer before </body>. Falls back to appending at end. */
function appendUnsubFooterHtml(html: string, unsubUrl: string): string {
  const footer = `<p style="margin:2rem 0 0;font-size:0.75rem;color:#9a9585;border-top:1px solid #ddd8cf;padding-top:1rem;">
    You're receiving this because you subscribed at <a href="https://gkoreli.com" style="color:#9a9585;">gkoreli.com</a>.
    <a href="${esc(unsubUrl)}" style="color:#9a9585;">Unsubscribe</a>
  </p>`;
  const idx = html.lastIndexOf('</body>');
  return idx !== -1
    ? html.slice(0, idx) + footer + html.slice(idx)
    : html + footer;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
