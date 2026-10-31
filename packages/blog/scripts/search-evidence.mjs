import { writeFileSync, openSync, fstatSync, readSync, closeSync, constants, mkdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { analyzeSearchEvidence, renderSearchEvidence, SEARCH_EVIDENCE_MAX_BYTES } from '../../analytics/src/search-evidence.ts';

const [input, output, extra] = process.argv.slice(2);
try {
  if (!input || !output || extra) throw Error('usage');
  const demo = input === '--demo', source = demo ? new URL('./examples/search-evidence.demo.json', import.meta.url) : resolve(input);
  // A saved size alone does not bound a growing file. Nonblocking open also
  // lets us reject FIFOs/devices by descriptor without waiting for their data.
  const descriptor = openSync(source, constants.O_RDONLY | constants.O_NONBLOCK);
  let bytes;
  try {
    const sourceStat = fstatSync(descriptor);
    if (!sourceStat.isFile() || sourceStat.size > SEARCH_EVIDENCE_MAX_BYTES) throw Error('input-budget');
    const buffer = Buffer.alloc(SEARCH_EVIDENCE_MAX_BYTES + 1); let length = 0;
    while (length < buffer.length) {
      const received = readSync(descriptor, buffer, length, buffer.length - length, null);
      if (received === 0) break; length += received;
    }
    if (length > SEARCH_EVIDENCE_MAX_BYTES) throw Error('input-budget');
    bytes = buffer.subarray(0, length);
  } finally { closeSync(descriptor); }
  // Retain a BOM for JSON.parse to reject, rather than silently normalizing it.
  const analysis = analyzeSearchEvidence(JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)));
  const destination = resolve(output), written = [];
  mkdirSync(destination, { mode: 0o700 }); // Existing files/directories/symlinks are never overwritten.
  try {
    const files = [
      ['report.json', JSON.stringify({ inputSha256: createHash('sha256').update(bytes).digest('hex'), analysis }, null, 2) + '\n'],
      ['brief.md', renderSearchEvidence(analysis)],
      ...(demo ? [['evidence.json', bytes]] : []),
    ];
    for (const [name, content] of files) { const path = join(destination, name); writeFileSync(path, content, { mode: 0o600, flag: 'wx' }); written.push(path); }
  } catch (error) {
    for (const path of written) try { unlinkSync(path); } catch { /* Preserve failure; never remove unrelated paths. */ }
    try { rmdirSync(destination); } catch { /* A concurrent file is not ours to remove. */ }
    throw error;
  }
  console.log(JSON.stringify({ status: 'written', provenance: analysis.provenance, savedRows: analysis.scope.returnedRows, output: destination }));
} catch (error) {
  const message = error instanceof Error && error.message.startsWith('Search evidence rejected:') ? error.message : 'Search evidence command failed: check paths, schema and output-directory uniqueness.';
  console.error(message); process.exitCode = 1;
}
