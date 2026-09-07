import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { createReferralAssessor } from '../../analytics/src/referral-policy.js';
import { ACTIVE_REFERRAL_POLICY } from '../../analytics/src/referral-policy.generated.js';
import {
  revisionSchema, digestSchema, policyVersionSchema, policySpecSchema, sourceManifestSchema,
  sha256, parseSpammerHosts, compileReferralPolicy, renderPolicyModule, policyDifference,
  verifyPolicyCommitment, reportEvidence,
  referralEvidenceSchema,
} from './referral-policy.models.js';

const analyticsRoot = fileURLToPath(new URL('../../analytics/', import.meta.url));
const repoRoot = resolve(analyticsRoot, '../..');
const policiesRoot = join(analyticsRoot, 'policies');
const sourcesRoot = join(analyticsRoot, 'data/referrer-sources/matomo');
const generatedFile = join(analyticsRoot, 'src/referral-policy.generated.ts');

async function loadPolicy(version: string, allowNew = false) {
  policyVersionSchema.parse(version);
  const spec = policySpecSchema.parse(JSON.parse(await readFile(join(policiesRoot, `${version}.json`), 'utf8')));
  if (spec.version !== version) throw new Error('Policy filename/version mismatch');
  const sourceDir = join(sourcesRoot, spec.sourceRevision);
  const source = sourceManifestSchema.parse(JSON.parse(await readFile(join(sourceDir, 'manifest.json'), 'utf8')));
  for (const [name, digest] of Object.entries(source.files)) {
    if (sha256(await readFile(join(sourceDir, name))) !== digest) throw new Error(`Source integrity failure: ${name}`);
  }
  for (const rule of spec.localRules) {
    if (rule.evidence.startsWith('https://')) {
      const reference = new URL(rule.evidence);
      if (reference.username || reference.password) throw new Error('Evidence reference cannot contain credentials');
    } else {
      const path = resolve(repoRoot, rule.evidence);
      if (!path.startsWith(repoRoot + '/') || !(await stat(path)).isFile()) throw new Error('Missing local rule evidence');
    }
  }
  const policy = compileReferralPolicy(spec, source, await readFile(join(sourceDir, 'spammers.txt'), 'utf8'));
  verifyPolicyCommitment(policy, await readCommitment(version), allowNew);
  return policy;
}

async function readCommitment(version: string): Promise<string | undefined> {
  try { return (await readFile(join(policiesRoot, `${version}.sha256`), 'utf8')).trim(); }
  catch (error) { if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error; }
  return undefined;
}

async function pinnedFile(revision: string, filename: string): Promise<string> {
  const response = await fetch(`https://raw.githubusercontent.com/matomo-org/referrer-spam-list/${revision}/${filename}`, {
    signal: AbortSignal.timeout(15000), redirect: 'error',
  });
  if (!response.ok || response.body === null) throw new Error(`Source download failed for ${filename}`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.length;
      if (bytes > 1000000) throw new Error('Source exceeds reviewed size bound');
      chunks.push(chunk.value);
    }
  } finally { await reader.cancel(); }
  return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
}

async function main() {
  const { positionals, values } = parseArgs({ options: {
    revision: { type: 'string' }, sha256: { type: 'string' }, policy: { type: 'string' },
    previous: { type: 'string' }, input: { type: 'string' }, out: { type: 'string' }, url: { type: 'string' },
    check: { type: 'boolean', default: false },
  }, allowPositionals: true, strict: true });
  const command = positionals[0];
  const usage = 'Choose capture, build, assess, or capture-report';
  if (positionals.length !== 1 || !['capture', 'build', 'assess', 'capture-report'].includes(command ?? '')) throw new Error(usage);
  if (command === 'capture') {
    const revision = revisionSchema.parse(values.revision);
    const expected = digestSchema.parse(values.sha256);
    const [raw, readme, composer] = await Promise.all([
      pinnedFile(revision, 'spammers.txt'), pinnedFile(revision, 'README.md'), pinnedFile(revision, 'composer.json'),
    ]);
    if (sha256(raw) !== expected) throw new Error('Pinned source hash mismatch');
    const hosts = parseSpammerHosts(raw);
    z.object({ license: z.literal('CC0-1.0') }).parse(JSON.parse(composer));
    const manifest = sourceManifestSchema.parse({
      provider: 'matomo', repository: 'https://github.com/matomo-org/referrer-spam-list', revision,
      capturedAt: new Date().toISOString(), license: 'CC0-1.0', entryCount: hosts.length,
      files: { 'spammers.txt': sha256(raw), 'README.md': sha256(readme), 'composer.json': sha256(composer) },
    });
    await mkdir(sourcesRoot, { recursive: true });
    const destination = join(sourcesRoot, revision);
    await mkdir(destination); // Immutable archive: refuse overwrite, including partial captures.
    for (const [name, content] of Object.entries({ 'spammers.txt': raw, 'README.md': readme, 'composer.json': composer, 'manifest.json': JSON.stringify(manifest, null, 2) + '\n' })) {
      await writeFile(join(destination, name), content, { flag: 'wx' });
    }
    process.stdout.write(`Archived ${hosts.length} hosts at ${revision}\n`);
    return;
  }
  const policy = await loadPolicy(policyVersionSchema.parse(values.policy ?? ACTIVE_REFERRAL_POLICY.version), command === 'build' && !values.check);
  if (command === 'build') {
    if (values.previous !== undefined) {
      process.stdout.write(JSON.stringify(policyDifference(await loadPolicy(values.previous), policy), null, 2) + '\n');
    }
    const generated = renderPolicyModule(policy);
    const commitmentPath = join(policiesRoot, `${policy.version}.sha256`);
    const commitment = await readCommitment(policy.version);
    if (values.check) {
      if (commitment !== policy.sha256 || await readFile(generatedFile, 'utf8') !== generated) throw new Error('Generated policy/commitment drift');
    } else {
      if (commitment === undefined) await writeFile(commitmentPath, policy.sha256 + '\n', { flag: 'wx' });
      await writeFile(generatedFile, generated);
    }
    process.stdout.write(`${values.check ? 'Verified' : 'Built'} policy ${policy.version} (${policy.sha256})\n`);
    return;
  }
  if (command === 'assess') {
    if (!values.input || !values.out) throw new Error('assess requires private --input and a new --out file');
    const rawInput = await readFile(values.input, 'utf8');
    const input = referralEvidenceSchema.parse(JSON.parse(rawInput));
    const hosts = new Set<string>();
    for (const query of input) for (const row of query.results) if (typeof row.referrer_host === 'string') hosts.add(row.referrer_host);
    const assess = createReferralAssessor(policy);
    const assessments = [...hosts].sort().map(assess);
    await writeFile(values.out, JSON.stringify({ policyVersion: policy.version, policySha256: policy.sha256, source: policy.source, inputSha256: sha256(rawInput), assessedAt: new Date().toISOString(), assessments }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    process.stdout.write(`Assessed ${hosts.size} private hostnames; ${assessments.filter(value => value.action === 'exclude').length} matched exclusions\n`);
    return;
  }
  if (command === 'capture-report') {
    if (!values.url || !values.out) throw new Error('capture-report requires an API --url and a new private --out file');
    const url = new URL(values.url);
    if (url.origin !== 'https://gkoreli.com' || url.pathname !== '/api/stats' || url.username || url.password || url.hash) {
      throw new Error('Expected the production HTTPS stats API URL');
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' });
    if (!response.ok) throw new Error(`Report capture failed: HTTP ${response.status}`);
    const body = await response.text();
    if (Buffer.byteLength(body) > 2000000) throw new Error('Report exceeds capture bound');
    const evidence = reportEvidence(body, url.href, new Date().toISOString(), policy);
    await writeFile(values.out, JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    process.stdout.write(`Captured report using ${policy.version} (${evidence.responseSha256})\n`);
    return;
  }
  throw new Error(usage);
}

await main().catch(error => { process.stderr.write(`${error instanceof Error ? error.message : 'Referral policy command failed'}\n`); process.exitCode = 1; });
