import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import { extname, join, resolve } from 'node:path';

// Local diagnostic only: real built page/client, substituted synthetic reports.
const [distPath, fixturePath, mode] = process.argv.slice(2);
assert.ok(distPath && fixturePath && ['before', 'after'].includes(mode),
  'Usage: node packages/blog/scripts/preview-stats-scope.mjs DIST FIXTURES before|after');
const root = resolve(distPath);
assert.ok(statSync(root).isDirectory());
const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8'));
const baseline = 'baf6c2e';
const baselineCss = mode === 'before'
  ? execFileSync('git', ['show', `${baseline}:packages/blog/src/styles/stats.css`]) : null;
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
const probe = `<script>
(() => {
  const log = document.createElement('pre');
  log.id = 'pointer-probe';
  log.setAttribute('aria-label', 'Local synthetic input diagnostic');
  log.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;max-width:100%;font-size:12px';
  document.body.append(log);
  const rows = [];
  const describe = element => element instanceof Element ? {
    tag: element.tagName, id: element.id,
    button: element.closest('button')?.getAttribute('aria-label')
      || element.closest('button')?.textContent?.trim() || null,
  } : null;
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown']) {
    document.addEventListener(type, event => {
      if (!(event.target instanceof Element)
        || !event.target.closest('#stats-scope, .stats-controls')) return;
      const row = { type, trusted: event.isTrusted, target: describe(event.target),
        x: event.clientX ?? null, y: event.clientY ?? null,
        key: ['Enter', ' '].includes(event.key) ? event.key : null,
        button: event.button ?? null, detail: event.detail ?? null,
        width: innerWidth, height: innerHeight };
      queueMicrotask(() => {
        row.defaultPrevented = event.defaultPrevented;
        if (rows.length === 100) rows.shift();
        rows.push(row);
        log.textContent = JSON.stringify(rows);
      });
    }, true);
  }
})();
</script>`;

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  response.setHeader('Cache-Control', 'no-store');
  if (url.pathname === '/api/stats') {
    // This corpus only models these fixed native report selections.
    const kind = url.searchParams.get('kind');
    const traffic = url.searchParams.get('traffic') || 'browser';
    const source = kind === 'ai-assistant' ? fixtures.kindOnly
      : fixtures.afterReports[kind === 'unresolved' ? 'unresolved' : traffic];
    if (!source || (kind && !['ai-assistant', 'unresolved'].includes(kind))
      || url.searchParams.get('path') !== '/audit' || url.searchParams.has('agent')) {
      response.writeHead(400); response.end('Selection outside the synthetic corpus'); return;
    }
    const report = structuredClone(source);
    report.filters.path = '/audit';
    report.filters.agent = null;
    report.filters.kind = kind;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(report)); return;
  }
  if (url.pathname === '/stats.css' && baselineCss) {
    response.setHeader('Content-Type', 'text/css'); response.end(baselineCss); return;
  }
  let file = resolve(root, '.' + url.pathname);
  if (!file.startsWith(root + '/')) { response.writeHead(403); response.end(); return; }
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    let body = readFileSync(file);
    if (extname(file) === '.html') body = Buffer.from(body.toString()
      .replace(/<script\b[^>]*src=["']https?:[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace('</body>', probe + '</body>'));
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(body);
  } catch { response.writeHead(404); response.end('Not found'); }
});
server.listen(0, '127.0.0.1', () => console.log(JSON.stringify({
  port: server.address().port, pid: process.pid, mode, baseline, fixtureOnly: true,
})));
