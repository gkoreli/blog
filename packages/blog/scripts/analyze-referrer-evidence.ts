/** Offline analysis of the three-panel D1 capture in article-024-hacker-news/referrer-analysis.sql. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { createReferralAssessor, type ReferralPolicy } from '../../analytics/src/referral-policy.js';
import {
  compileReferralPolicy, policySpecSchema, policyVersionSchema, sha256,
  sourceManifestSchema, verifyPolicyCommitment,
} from './referral-policy.models.js';

const count = z.number().int().nonnegative();
const captureSchema = z.object({
  capturedAt: z.string().datetime({ offset: true }),
  httpStatus: z.literal(200),
  response: z.object({
    success: z.literal(true),
    result: z.array(z.object({
      success: z.literal(true),
      meta: z.object({ rows_read: count, rows_written: z.literal(0) }),
      results: z.array(z.object({
        panel: z.enum(['request-groups', 'no-referrer-repeat', 'no-referrer-hours']),
        data: z.string(),
      })).max(10000),
    })).length(1),
  }),
});
const groupSchema = z.object({
  referrerHost: z.string().nullable(), country: z.string().nullable(),
  deviceType: z.string(), asn: count.nullable(), fetchSite: z.string().nullable(),
  fetchUser: z.union([z.literal(0), z.literal(1)]).nullable(),
  representation: z.string().nullable(), readerKind: z.string(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), asnSource: z.string().nullable(),
  views: count.positive(),
});
const repeatSchema = z.object({ viewsPerDailyId: count.positive(), dailyIds: count.positive() });
const hourSchema = z.object({ hour: z.string(), fetchSite: z.string().nullable(), views: count.positive() });
type Group = z.infer<typeof groupSchema>;
type Repeat = z.infer<typeof repeatSchema>;
type Hour = z.infer<typeof hourSchema>;

function sum(rows: readonly { views: number }[]): number {
  return rows.reduce((total, row) => total + row.views, 0);
}

function counts(rows: readonly Group[], key: (row: Group) => string | number | null) {
  const totals = new Map<string | number | null, number>();
  for (const row of rows) {
    const value = key(row);
    totals.set(value, (totals.get(value) ?? 0) + row.views);
  }
  return [...totals].map(([value, views]) => ({ value, views }))
    .sort((a, b) => b.views - a.views || String(a.value).localeCompare(String(b.value)));
}

function describe(rows: readonly Group[]) {
  return {
    views: sum(rows), byDay: counts(rows, row => row.day),
    byFetchSite: counts(rows, row => row.fetchSite),
    byFetchUser: counts(rows, row => row.fetchUser),
    byDevice: counts(rows, row => row.deviceType),
    byRepresentation: counts(rows, row => row.representation),
    byAsnSource: counts(rows, row => row.asnSource),
    countryCount: new Set(rows.flatMap(row => row.country === null ? [] : [row.country])).size,
    networkCount: new Set(rows.flatMap(row => row.asn === null ? [] : [row.asn])).size,
    topCountries: counts(rows, row => row.country).slice(0, 10),
  };
}

/** Produces aggregates only: no unreviewed hostnames, signer URLs, client IDs, or joined request details. */
export function analyzeReferrerEvidence(value: unknown, policy: ReferralPolicy) {
  const capture = captureSchema.parse(value);
  const result = capture.response.result[0];
  if (!result) throw new Error('Missing D1 result');
  const groups: Group[] = [];
  const repeats: Repeat[] = [];
  const hours: Hour[] = [];
  for (const row of result.results) {
    const data: unknown = JSON.parse(row.data);
    switch (row.panel) {
      case 'request-groups': groups.push(groupSchema.parse(data)); break;
      case 'no-referrer-repeat': repeats.push(repeatSchema.parse(data)); break;
      case 'no-referrer-hours': hours.push(hourSchema.parse(data)); break;
    }
  }
  const assess = createReferralAssessor(policy);
  const included = groups.filter(row => assess(row.referrerHost).action === 'include');
  const browsers = included.filter(row => row.readerKind === 'browser');
  const noReferrer = browsers.filter(row => row.referrerHost === null);
  const noReferrerViews = sum(noReferrer);
  if (repeats.reduce((total, row) => total + row.viewsPerDailyId * row.dailyIds, 0) !== noReferrerViews
    || sum(hours) !== noReferrerViews) throw new Error('No-referrer panels do not reconcile');
  const named = browsers.filter(row => assess(row.referrerHost).visibility === 'named');
  const byReferrerCategory = counts(browsers, row => assess(row.referrerHost).visibility);
  if (sum(byReferrerCategory) !== sum(browsers)) throw new Error('Referral categories do not reconcile');
  return {
    formatVersion: 1, capturedAt: capture.capturedAt,
    rowsRead: result.meta.rows_read, rowsWritten: result.meta.rows_written,
    policyVersion: policy.version, policySha256: policy.sha256,
    rawViews: sum(groups), includedViews: sum(included), excludedViews: sum(groups) - sum(included),
    includedByKind: counts(included, row => row.readerKind),
    browser: {
      ...describe(browsers), byReferrerCategory,
      namedReferrers: counts(named, row => row.referrerHost?.replace(/^www\./, '') ?? null),
    },
    noReferrer: {
      ...describe(noReferrer), shareOfBrowserViews: sum(browsers) === 0 ? null : noReferrerViews / sum(browsers),
      dailyIds: repeats.reduce((total, row) => total + row.dailyIds, 0),
      repeatHistogram: repeats.sort((a, b) => a.viewsPerDailyId - b.viewsPerDailyId),
    },
    hn: describe(browsers.filter(row => row.referrerHost?.replace(/^www\./, '') === 'news.ycombinator.com')),
  };
}

function archivedPolicy(version: string): ReferralPolicy {
  policyVersionSchema.parse(version);
  const policyDirectory = new URL('../../analytics/policies/', import.meta.url);
  const spec = policySpecSchema.parse(JSON.parse(readFileSync(new URL(`${version}.json`, policyDirectory), 'utf8')));
  if (spec.version !== version) throw new Error('Policy version mismatch');
  const sourceDirectory = new URL(`../../analytics/data/referrer-sources/matomo/${spec.sourceRevision}/`, import.meta.url);
  const source = sourceManifestSchema.parse(JSON.parse(readFileSync(new URL('manifest.json', sourceDirectory), 'utf8')));
  const policy = compileReferralPolicy(spec, source, readFileSync(new URL('spammers.txt', sourceDirectory), 'utf8'));
  verifyPolicyCommitment(policy, readFileSync(new URL(`${version}.sha256`, policyDirectory), 'utf8').trim());
  return policy;
}

function main() {
  const { values } = parseArgs({ options: {
    input: { type: 'string' }, query: { type: 'string' }, policy: { type: 'string' }, output: { type: 'string' },
  } });
  if (!values.input || !values.query || !values.policy || !values.output) {
    throw new Error('Required: --input <private capture.json> --query <exact query.sql> --policy <version> --output <new report.json>');
  }
  const input = readFileSync(values.input);
  const query = readFileSync(values.query);
  const summary = analyzeReferrerEvidence(JSON.parse(input.toString()), archivedPolicy(values.policy));
  const report = {
    ...summary,
    query: query.toString(),
    commitments: { captureSha256: sha256(input), querySha256: sha256(query) },
    limits: [
      'The query defines the window and selection; a later capture is not an immutable historical database snapshot.',
      'Browser classification and daily IDs do not establish people, completed reads, or audience accuracy.',
      'No stored referrer merges absent, rejected, and internal referrers. Fetch Metadata supplies separate client claims.',
      'Other reported referrers have retained hostnames that are not approved for public display.',
      'Private capture commitments require the original files to reproduce the counts; hashes do not authenticate Cloudflare.',
    ],
  };
  writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(`Saved aggregate report: ${summary.browser.views} Browser observations; ${summary.noReferrer.views} without a stored referrer. No production request was made.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
