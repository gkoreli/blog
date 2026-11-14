// SPDX-License-Identifier: Apache-2.0
// Source-informed adaptation of GoogleChrome/modern-web-guidance-src @ 596acbc75a330508591b07cd9e198b219341f619.
// Modified for browser model loading and a short-metadata blog search demonstration.
const stopwords = new Set('the a an and or of to in for with on by is are be as it this that from at use using your you can how when which into not'.split(' '));
export const dims = 256;
export function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9-]+/g) ?? []).filter(word => !stopwords.has(word));
}
export function readFloat32(buffer) {
  const view = new DataView(buffer);
  return Float32Array.from({ length: buffer.byteLength / 4 }, (_, i) => view.getFloat32(i * 4, true));
}
export function createEmbedder(words, table, scales) {
  if (table.length !== words.length * dims || scales.length !== words.length) throw new Error('Model shape mismatch');
  const index = new Map(words.map((word, i) => [word, i]));
  function encode(text) {
    const enc = [];
    for (const word of tokenize(text)) {
      if (index.has(word)) enc.push([index.get(word), 1]);
      else if (word.includes('-')) {
        const known = word.split('-').filter(part => index.has(part));
        for (const part of known) enc.push([index.get(part), 1 / known.length]);
      }
    }
    return enc;
  }
  function embed(text) {
    const out = new Float32Array(dims);
    for (const [i, f] of encode(text)) {
      const wt = scales[i] * f;
      const offset = i * dims;
      for (let k = 0; k < dims; k++) out[k] += wt * table[offset + k];
    }
    let squared = 0;
    for (const value of out) squared += value * value;
    const length = Math.sqrt(squared) || 1;
    for (let k = 0; k < dims; k++) out[k] /= length;
    return out;
  }
  return { encode, embed, vocabularySize: words.length, recognized: text => encode(text).map(([i]) => words[i]) };
}
export function dot(a, b) {
  if (a.length !== dims || b.length !== dims) throw new Error('Vector dimension mismatch');
  let sum = 0;
  for (let i = 0; i < dims; i++) sum += a[i] * b[i];
  return sum;
}
export function search(catalog, embedder, query, mode = 'hybrid') {
  const vector = embedder.embed(query);
  const queryTerms = [...new Set(tokenize(query))];
  const hasVector = vector.some(value => value !== 0);
  const scored = catalog.map(post => {
    const terms = new Set(tokenize(post.embeddingText));
    return { ...post, alignment: hasVector ? dot(vector, post.vector) : 0, matchedTerms: queryTerms.filter(term => terms.has(term)) };
  });
  const dense = hasVector ? [...scored].sort((a, b) => b.alignment - a.alignment) : [];
  const lexical = scored.filter(row => row.matchedTerms.length).sort((a, b) => b.matchedTerms.length - a.matchedTerms.length);
  if (mode === 'static') return { rows: dense.slice(0, 5), recognized: embedder.recognized(query) };
  if (mode === 'keyword') return { rows: lexical.slice(0, 5), recognized: embedder.recognized(query) };
  const fusion = new Map();
  for (const ranking of [dense, lexical]) ranking.forEach((row, i) => fusion.set(row.slug, (fusion.get(row.slug) ?? 0) + 1 / (61 + i)));
  return { rows: scored.filter(row => fusion.has(row.slug)).sort((a, b) => fusion.get(b.slug) - fusion.get(a.slug)).slice(0, 5), recognized: embedder.recognized(query) };
}
