/**
 * email.ts — Resend email delivery + HTML templates.
 *
 * Resend docs: https://resend.com/docs/api-reference/emails/send-email
 * D1 is the source of truth; Resend is the delivery pipe only.
 * Swap the delivery layer here without touching any other module.
 */

const FROM = 'Goga Koreli <newsletter@gkoreli.com>';

/** Send a double opt-in confirmation email. */
export async function sendConfirmationEmail(
  apiKey: string,
  to: string,
  confirmUrl: string,
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: 'One click to confirm your subscription',
      html: confirmationHtml(confirmUrl),
      text: confirmationText(confirmUrl),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

function confirmationHtml(confirmUrl: string): string {
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

    <h1 style="margin:0 0 1rem;font-size:1.4rem;font-weight:700;line-height:1.3;">One click to confirm</h1>

    <p style="margin:0 0 0.75rem;line-height:1.7;color:#4a4740;">
      You asked to be notified when something new lands on the blog.
      Click below to confirm — then you're done.
    </p>
    <p style="margin:0 0 2rem;line-height:1.7;color:#4a4740;">
      You'll only hear from me when I write something worth your inbox.
    </p>

    <a href="${confirmUrl}"
       style="display:inline-block;padding:0.75rem 1.75rem;background:#1a6b4e;color:#fff;text-decoration:none;border-radius:6px;font-size:0.95rem;font-family:Georgia,serif;">
      Confirm subscription →
    </a>

    <hr style="margin:2.5rem 0;border:none;border-top:1px solid #ddd8cf;">

    <p style="margin:0;font-size:0.75rem;line-height:1.6;color:#9a9585;">
      If you didn't request this, ignore the email. No account was created and you won't receive anything else.
    </p>
  </div>
</body>
</html>`;
}

function confirmationText(confirmUrl: string): string {
  return `gkoreli.com

One click to confirm

You asked to be notified when something new lands on the blog. Click below to confirm — then you're done. You'll only hear from me when I write something worth your inbox.

Confirm subscription: ${confirmUrl}

---
If you didn't request this, ignore the email. No account was created.`;
}
