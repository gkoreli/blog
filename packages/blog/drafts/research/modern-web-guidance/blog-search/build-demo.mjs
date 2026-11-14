import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { createEmbedder, readFloat32 } from './engine.mjs';
import { loadReference } from '../embedding/reference.mjs';
if (process.argv.length !== 5) throw new Error('Usage: node build-demo.mjs /mwg-package /snapshot.json /new/output-dir');
const [packageDir, snapshotPath, output] = process.argv.slice(2).map(value => resolve(value));
const here = dirname(fileURLToPath(import.meta.url));
const gen = join(packageDir, 'skills/modern-web-guidance/gen');
const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
assert(Array.isArray(snapshot.posts) && snapshot.posts.length > 0);
const expected = JSON.parse(readFileSync(join(here, '../embedding/results/package-receipt.json'), 'utf8'));
const hashes = [];
const sha = data => createHash('sha256').update(data).digest('hex');
for (const file of ['query-words.json', 'query-words.i8', 'query-words.scale.f32']) {
  const bytes = readFileSync(join(gen, file)); const digest = sha(bytes);
  assert.equal(digest, expected.files.find(item => item.path === 'skills/modern-web-guidance/gen/' + file)?.sha256);
  hashes.push({ file, sha256: digest, bytes: bytes.byteLength });
}
const words = JSON.parse(readFileSync(join(gen, 'query-words.json'), 'utf8'));
const tableBytes = readFileSync(join(gen, 'query-words.i8'));
const scaleBytes = readFileSync(join(gen, 'query-words.scale.f32'));
const embedder = createEmbedder(words, new Int8Array(tableBytes), readFloat32(Uint8Array.from(scaleBytes).buffer));
const reference = loadReference(gen);
const posts = snapshot.posts.map(post => {
  assert.equal(typeof post.title, 'string'); assert(Array.isArray(post.tags));
  assert(post.url.startsWith('https://gkoreli.com/') && typeof post.slug === 'string');
  const embeddingText = [post.title, ...post.tags].join(' ');
  const vector = [...embedder.embed(embeddingText)];
  assert.deepEqual(vector, [...reference.embed(embeddingText)]);
  return { ...post, embeddingText, vector };
});
for (const query of ['signup form', 'user agent analytics', 'Bun memory', 'not animate dialog', 'qzxwvvunknown']) assert.deepEqual([...embedder.embed(query)], [...reference.embed(query)]);
mkdirSync(output); mkdirSync(join(output, 'model'));
for (const file of ['query-words.json', 'query-words.i8', 'query-words.scale.f32']) copyFileSync(join(gen, file), join(output, 'model', file));
for (const file of ['engine.mjs', 'worker.mjs', 'client.mjs', 'style.css']) copyFileSync(join(here, file), join(output, file));
const noticeFiles = [];
for (const [sourceName, targetName] of [['LICENSE', 'LICENSE.upstream'], ['THIRD_PARTY_NOTICES', 'THIRD_PARTY_NOTICES.upstream']]) {
  const bytes = readFileSync(join(packageDir, sourceName));
  assert.equal(sha(bytes), expected.files.find(item => item.path === sourceName)?.sha256);
  copyFileSync(join(packageDir, sourceName), join(output, targetName));
  noticeFiles.push({ file: targetName, sha256: sha(bytes), bytes: bytes.byteLength });
}
writeFileSync(join(output, 'catalog.json'), JSON.stringify({ representation: 'Experimental static title-and-tags vectors; not teacher document embeddings.', source: snapshot.source, sourceCommit: snapshot.sourceCommit, posts }));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const links = posts.map(post => `<li><a href="${escape(post.url)}">${escape(post.title)}</a></li>`).join('\n');
writeFileSync(join(output, 'index.html'), readFileSync(join(here, 'index.html'), 'utf8').replace('<!--CATALOG_LINKS-->', links));
const receipt = { capturedAt: new Date().toISOString(), posts: posts.length, sourceCommit: snapshot.sourceCommit, sourceSnapshotSha256: sha(readFileSync(snapshotPath)), modelFiles: hashes, upstreamLicense: 'Apache-2.0', noticeFiles, vectorsMatchedReference: posts.length + 5, vectorShape: [posts.length, 256], fullArticleEmbeddingsGenerated: false, modelApiCalls: 0, productionChange: false };
writeFileSync(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ output, ...receipt }));
