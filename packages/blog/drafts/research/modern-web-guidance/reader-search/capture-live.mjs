// Capture public article HTML for inventory, source-text and navigation checks.
// Raw responses stay in a caller-selected local directory outside Git.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

if (process.argv.length !== 4) throw new Error('Usage: node capture-live.mjs /existing-live-posts.json /fresh-local-output');
const [indexFile, output] = process.argv.slice(2).map(value => resolve(value));
const posts = JSON.parse(readFileSync(indexFile, 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
mkdirSync(output); mkdirSync(join(output, 'html'));
const capturedAt = new Date().toISOString(); const results = [];
let next = 0;
async function worker() {
  while (next < posts.length) {
    const post = posts[next++];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)) throw new Error('Unexpected slug');
    const url = new URL('/' + post.slug, 'https://gkoreli.com').href;
    const start = performance.now();
    try {
      const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      writeFileSync(join(output, 'html', post.slug + '.html'), bytes, { flag: 'wx' });
      const receipt = { slug: post.slug, url, finalUrl: response.url, status: response.status, contentType: response.headers.get('content-type'), servedDate: response.headers.get('date'), etag: response.headers.get('etag'), cacheStatus: response.headers.get('cf-cache-status'), bytes: bytes.length, sha256: sha(bytes), elapsedMs: performance.now() - start };
      results.push(receipt);
    } catch (error) { results.push({ slug: post.slug, url, error: error.message, elapsedMs: performance.now() - start }); }
    if (results.length % 12 === 0) console.log(JSON.stringify({ captured: results.length, total: posts.length }));
  }
}
await Promise.all([worker(), worker(), worker()]);
results.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(join(output, 'capture-receipt.json'), JSON.stringify({ capturedAt, indexFileSha256: sha(readFileSync(indexFile)), concurrency: 3, retries: 0, results }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ articles: results.length, successfulHtml: results.filter(row => row.status === 200 && row.contentType?.includes('text/html')).length, failures: results.filter(row => row.status !== 200), output }));
