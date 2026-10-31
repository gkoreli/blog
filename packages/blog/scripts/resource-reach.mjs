import { writeFileSync, openSync, fstatSync, readSync, closeSync, constants, mkdirSync, unlinkSync, rmdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { analyzeResourceReach, renderResourceReach, RESOURCE_REACH_MAX_BYTES } from '../../analytics/src/resource-reach.ts';

const [input, output, extra] = process.argv.slice(2);
try {
  if (!input || !output || extra) throw Error('usage');
  const descriptor = openSync(resolve(input), constants.O_RDONLY | constants.O_NONBLOCK);
  let bytes;
  try {
    if (!fstatSync(descriptor).isFile()) throw Error('regular-file-required');
    const buffer = Buffer.alloc(RESOURCE_REACH_MAX_BYTES + 1); let length = 0;
    while (length < buffer.length) {
      const received = readSync(descriptor, buffer, length, buffer.length - length, null);
      if (received === 0) break; length += received;
    }
    if (length > RESOURCE_REACH_MAX_BYTES) throw Error('input-budget');
    bytes = buffer.subarray(0, length);
  } finally { closeSync(descriptor); }
  const report = analyzeResourceReach(JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)));
  const destination = resolve(output), written = [];
  mkdirSync(destination, { mode: 0o700 });
  try {
    for (const [name, content] of [
      ['report.json', JSON.stringify({ inputSha256: createHash('sha256').update(bytes).digest('hex'), report }, null, 2) + '\n'],
      ['brief.md', renderResourceReach(report)],
    ]) {
      const path = join(destination, name); writeFileSync(path, content, { mode: 0o600, flag: 'wx' }); written.push(path);
    }
  } catch (error) {
    for (const path of written) try { unlinkSync(path); } catch { /* Preserve the original failure. */ }
    try { rmdirSync(destination); } catch { /* Preserve concurrent files. */ }
    throw error;
  }
  console.log(JSON.stringify({ status: 'written', provenance: report.provenance, selectedEvents: report.accounting.selectedEvents, output: destination }));
} catch (error) {
  console.error(error instanceof Error && error.message.startsWith('Resource reach rejected:')
    ? error.message : 'Resource reach command failed: check regular UTF-8 JSON input, schema and new output directory.');
  process.exitCode = 1;
}
