import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

if (process.argv.length !== 3) throw new Error('Usage: node download-model.mjs /fresh-model-directory');
const output = resolve(process.argv[2]);
const freeze = JSON.parse(readFileSync(new URL('./input-freeze.json', import.meta.url), 'utf8'));
mkdirSync(output);
for (const [file, expected] of Object.entries(freeze.modelFiles)) {
  const url = `https://huggingface.co/${freeze.model.id}/resolve/${freeze.model.revision}/${file}`;
  const response = await fetch(url); if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== expected.bytes || createHash('sha256').update(bytes).digest('hex') !== expected.sha256) throw new Error('Model hash mismatch: ' + file);
  const path = join(output, file); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, bytes, { flag: 'wx' });
  console.log(JSON.stringify({ file, bytes: bytes.length, verified: true }));
}
console.log(JSON.stringify({ model: freeze.model.id, revision: freeze.model.revision, output }));
