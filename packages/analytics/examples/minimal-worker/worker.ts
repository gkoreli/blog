import { handleOwner, observePageResponse, type Env } from '../../src/index.js';
import { createAnalyticsReportHandler, createD1ReportAdmission, renderAnalyticsReport } from '../../src/reporting.js';
import type { StatsResponse } from '../../src/contracts.js';

const paths: ReadonlySet<string> = new Set(['/', '/notes']);
const reports = createAnalyticsReportHandler<Env>({
  match: request => caches.default.match(request),
  put: (request, response) => caches.default.put(request, response),
}, {
  admission: env => createD1ReportAdmission(env.DB, { maxColdFillsPerDay: 24, maxReportedRowsReadPerDay: 1_000_000 }),
  allowedRanges: ['7d', '30d'],
  onCalculation: event => console.log('analytics.example_report_calculation', event),
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/api/owner') return handleOwner(request, env);
    if (path === '/api/stats' || path === '/stats') {
      const response = await reports(request, env, ctx);
      if (path === '/api/stats' || response.status !== 200) return response;
      const report: StatsResponse = await response.json();
      return new Response(renderAnalyticsReport(report), { headers: {
        'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      } });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (!paths.has(path) && path !== '/notes.md') return new Response('Not Found', { status: 404 });
    const markdown = path === '/notes.md' || request.headers.get('Accept') === 'text/markdown';
    const body = markdown ? '# Example notes\n\nA page served by a minimal Worker.\n'
      : '<!doctype html><html lang="en"><meta charset="utf-8"><title>Analytics example</title><h1>Example notes</h1><p>A page served by a minimal Worker.</p><a href="/notes">Notes</a></html>';
    const response = new Response(request.method === 'HEAD' ? null : body, {
      headers: { 'Content-Type': markdown ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8' },
    });
    observePageResponse(request, response, markdown ? 'markdown' : 'html', env, ctx, {
      publicPagePaths: async () => paths,
    });
    return response;
  },
} satisfies ExportedHandler<Env>;
