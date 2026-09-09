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

export type ConfirmationDelivery =
  | { outcome: 'accepted'; providerId: string; providerStatus: number }
  | { outcome: 'failed' | 'unknown'; providerId: null; providerStatus: number | null };

/** Two bounded attempts with the same idempotency key and exact message body. */
export async function sendConfirmationEmail(
  apiKey: string,
  to: string,
  confirmUrl: string,
  optOutUrl: string,
  attemptId: string,
): Promise<ConfirmationDelivery> {
  const body = JSON.stringify({
    from: FROM, to, subject: 'Confirm your blog subscription',
    html: confirmationHtml(confirmUrl, optOutUrl), text: confirmationText(confirmUrl, optOutUrl),
  });
  let last: ConfirmationDelivery = { outcome: 'unknown', providerId: null, providerStatus: null };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
          'Idempotency-Key': `newsletter-confirmation/${attemptId}`,
        },
        body, signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) {
        const data: unknown = await res.json();
        if (typeof data === 'object' && data !== null && 'id' in data
          && typeof data.id === 'string' && data.id.length > 0 && data.id.length <= 128) {
          return { outcome: 'accepted', providerId: data.id, providerStatus: res.status };
        }
        last = { outcome: 'unknown', providerId: null, providerStatus: res.status };
      } else {
        // Provider bodies may contain addresses; retain only the HTTP status.
        last = { outcome: res.status >= 500 || res.status === 409 ? 'unknown' : 'failed',
          providerId: null, providerStatus: res.status };
        await res.body?.cancel();
        if (res.status !== 409 && res.status !== 429 && res.status < 500) return last;
        if (res.status === 429 && attempt === 0) {
          // Respect a short provider reset without exceeding the interactive wait budget.
          // A longer or malformed hint returns the failure; never retry ahead of it.
          const seconds = Number(res.headers.get('retry-after') ?? '1');
          if (!Number.isFinite(seconds) || seconds < 0 || seconds > 3) return last;
          await new Promise<void>(resolve => setTimeout(resolve, Math.max(1, seconds) * 1000));
        }
      }
    } catch {
      last = { outcome: 'unknown', providerId: null, providerStatus: null };
    }
  }
  return last;
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
}

/**
 * Send a newsletter to a batch of subscribers via Resend's batch API.
 * Each email gets personalised List-Unsubscribe headers (RFC 8058).
 *
 * Caller is responsible for chunking to RESEND_BATCH_LIMIT before calling.
 * Returns per-recipient results (resend_id on success, error on failure).
 */
export async function sendNewsletterBatch(
  apiKey: string,
  recipients: NewsletterRecipient[],
  subject: string,
  html: string,
  text: string,
): Promise<BatchSendResult[]> {
  const batch: ResendBatchItem[] = recipients.map(r => {
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

  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batch),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = `Resend batch error ${res.status}: ${body}`;
    // Whole batch failed — return error for every recipient
    return recipients.map(r => ({ email: r.email, resend_id: null, error: err }));
  }

  const json = await res.json<{ data: Array<{ id?: string }> }>();
  return recipients.map((r, i) => ({
    email: r.email,
    resend_id: json.data[i]?.id ?? null,
    error: null,
  }));
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
