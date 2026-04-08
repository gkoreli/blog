/**
 * responses.ts — Shared response helpers for newsletter handlers.
 *
 * Security decisions applied here (see ADR-0010 §Security):
 *
 * CORS: scoped to gkoreli.com + localhost — never wildcard on mutation endpoints.
 *   Any site could otherwise silently enroll visitors. Turnstile alone is not
 *   sufficient because CORS adds a defense-in-depth layer enforced by the browser.
 *
 * Referrer-Policy: no-referrer on HTML pages — confirm/unsubscribe tokens are in
 *   URL paths. If an email client proxies link clicks, the raw token could appear
 *   in a Referer header. no-referrer prevents any downstream leakage.
 *
 * Cache-Control: no-store — API mutation responses must not be cached.
 *
 * X-Content-Type-Options: nosniff — prevents MIME-sniffing JSON into executable.
 *
 * CSP on HTML pages: no external resources; inline styles/scripts only.
 *   'unsafe-inline' is acceptable because zero user-controlled content is
 *   injected — all dynamic values pass through esc().
 */

const PRODUCTION_ORIGIN = 'https://gkoreli.com';
const LOCAL_RE = /^http:\/\/localhost(:\d+)?$/;

/**
 * Return the request's Origin if allowed, empty string otherwise.
 * Empty string → no CORS header → browser blocks cross-origin reads.
 */
export function allowedOrigin(request: Request): string {
  const origin = request.headers.get('origin') ?? '';
  if (origin === PRODUCTION_ORIGIN || LOCAL_RE.test(origin)) return origin;
  return '';
}

// ── Header sets ───────────────────────────────────────────────────────────────

const JSON_HEADERS: Record<string, string> = {
  'content-type': 'application/json',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

const HTML_HEADERS: Record<string, string> = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy':
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
};

// ── Constructors ──────────────────────────────────────────────────────────────

export function jsonOk(data: Record<string, unknown>, status = 200, origin = ''): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: origin
      ? { ...JSON_HEADERS, 'access-control-allow-origin': origin }
      : JSON_HEADERS,
  });
}

export function jsonError(message: string, status: number, origin = ''): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: origin
      ? { ...JSON_HEADERS, 'access-control-allow-origin': origin }
      : JSON_HEADERS,
  });
}

/** CORS preflight for POST /api/subscribe. 403 for unknown origins. */
export function corsPreflightResponse(origin: string): Response {
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': origin,
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
      'cache-control': 'no-store',
    },
  });
}

/**
 * Self-contained HTML page for post-action landings (confirm / unsubscribe).
 * No external resources. Theme detection via inline script reading localStorage.
 * All dynamic content must be hard-coded strings or pass through esc().
 */
export function htmlPage(title: string, body: string, backHref = '/'): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)} — Goga Koreli</title>
  <script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'))</script>
  <style>
    :root{--bg:#faf8f5;--text:#2d2a24;--muted:#7a7568;--link:#1a6b4e;--border:#ddd8cf}
    [data-theme="dark"]{--bg:#1a1a1a;--text:#e0ddd5;--muted:#9a9589;--link:#6ec9a8;--border:#3a3a3a}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Georgia,'Times New Roman',serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem 1.5rem}
    .card{max-width:480px;width:100%;text-align:center}
    .icon{font-size:2.5rem;margin-bottom:1.5rem}
    h1{font-size:1.5rem;margin-bottom:0.75rem;line-height:1.3}
    p{color:var(--muted);line-height:1.7;margin-bottom:1.5rem}
    a{color:var(--link);text-decoration:none;font-size:0.9rem}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <a href="${esc(backHref)}">← Back to the blog</a>
  </div>
</body>
</html>`;
  return new Response(html, { headers: HTML_HEADERS });
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
