/**
 * responses.ts — Shared response helpers for newsletter handlers.
 *
 * Centralises JSON and HTML response construction so handlers stay focused on logic.
 */

const CORS = { 'access-control-allow-origin': '*' } as const;

export function jsonOk(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

/** Returns a minimal, self-contained HTML page for post-action landing (confirm / unsubscribe). */
export function htmlPage(title: string, heading: string, body: string, backHref = '/'): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} — Goga Koreli</title>
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
    <a href="${escHtml(backHref)}">← Back to the blog</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
