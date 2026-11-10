#!/usr/bin/env node
import { openSync, fstatSync, readSync, closeSync, constants } from 'node:fs';
import { createHash } from 'node:crypto';
import { assessUserAgent } from '../../../analytics/src/user-agent-assessment.ts';

const MAX_INPUT_BYTES = 262144;
const [file, extra] = process.argv.slice(2);
try {
  if (!file || extra) throw Error('usage');
  const fd = openSync(file, constants.O_RDONLY | constants.O_NONBLOCK);
  let bytes;
  try {
    if (!fstatSync(fd).isFile()) throw Error('regular-file');
    const buffer = Buffer.alloc(MAX_INPUT_BYTES + 1); let length = 0;
    while (length < buffer.length) {
      const n = readSync(fd, buffer, length, buffer.length - length, null);
      if (n === 0) break;
      length += n;
    }
    if (length > MAX_INPUT_BYTES) throw Error('input-budget');
    bytes = buffer.subarray(0, length);
  } finally { closeSync(fd); }
  const input = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes));
  if (input === null || typeof input !== 'object' || Array.isArray(input)
    || !Object.hasOwn(input, 'userAgent') || input.userAgent !== null && typeof input.userAgent !== 'string'
    || Object.keys(input).some(key => key !== 'userAgent' && key !== 'mobileHint')
    || Object.hasOwn(input, 'mobileHint') && input.mobileHint !== null && typeof input.mobileHint !== 'string') throw Error('schema');
  const report = assessUserAgent(input.userAgent, input.mobileHint ?? null);
  console.log(JSON.stringify({ inputSha256: createHash('sha256').update(bytes).digest('hex'), report }, null, 2));
} catch {
  // Do not echo raw header text, parser exceptions, file contents or private paths.
  console.error('Supply one regular UTF-8 JSON file, at most 262144 bytes: {"userAgent":string|null,"mobileHint"?:string|null}.');
  process.exitCode = 2;
}
