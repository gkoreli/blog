import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { classifyTraffic } from '../../../../analytics/src/classify.ts';

// Public maintainer examples, checked October 25, 2026 Pacific.
// This probe makes no network call and creates no page observation.
const cases = [
  {
    name: 'ExaSearchBot', source: 'https://crawler.exa.ai/',
    userAgent: 'Mozilla/5.0 (compatible; ExaSearchBot/1.0; +https://crawler.exa.ai/)',
  },
  {
    name: 'ExaUser', source: 'https://crawler.exa.ai/exauser',
    userAgent: 'Mozilla/5.0 (compatible; ExaUser/1.0; +https://crawler.exa.ai/exauser)',
  },
  {
    name: 'AhrefsBot', source: 'https://ahrefs.com/robot',
    userAgent: 'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  },
  {
    name: 'AhrefsSiteAudit', source: 'https://ahrefs.com/robot',
    userAgent: 'Mozilla/5.0 (compatible; AhrefsSiteAudit/6.1; +http://ahrefs.com/robot/site-audit)',
  },
] as const;

const sourcePath = fileURLToPath(new URL('../../../../analytics/src/classify.ts', import.meta.url));
console.log(JSON.stringify({
  capturedAt: new Date().toISOString(),
  runtime: process.version,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  classifierSha256: createHash('sha256').update(readFileSync(sourcePath)).digest('hex'),
  probeSha256: createHash('sha256').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex'),
  networkCalls: 0,
  productionObservations: 0,
  results: cases.map(input => ({ ...input, result: classifyTraffic(input.userAgent) })),
  limit: 'Known supplied inputs test the local matcher; they do not reconstruct historical User-Agents or validate vendor identity.',
}, null, 2));
