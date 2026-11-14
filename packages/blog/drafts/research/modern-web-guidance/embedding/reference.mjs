// Source-informed reference for the published MWG formats, not a new trained model.
// Inspected original: GoogleChrome/modern-web-guidance-src, MIT, commit 596acbc75a330508591b07cd9e198b219341f619.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ignored = new Set('the a an and or of to in for with on by is are be as it this that from at use using your you can how when which into not'.split(' '));
export const dimensions = 256;

export function tokens(text) {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9-]+/g) ?? []).filter(word => !ignored.has(word));
}

function floats(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Float32Array.from({ length: bytes.byteLength / 4 }, (_, i) => view.getFloat32(i * 4, true));
}

export function loadReference(gen) {
  const words = JSON.parse(readFileSync(join(gen, 'query-words.json'), 'utf8'));
  const index = new Map(words.map((word, i) => [word, i]));
  const bytes = readFileSync(join(gen, 'query-words.i8'));
  const table = new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const scales = floats(readFileSync(join(gen, 'query-words.scale.f32')));
  if (table.length !== words.length * dimensions || scales.length !== words.length) throw new Error('Invalid table dimensions');

  function encode(text) {
    const encoded = [];
    for (const token of tokens(text)) {
      if (index.has(token)) encoded.push([index.get(token), 1]);
      else if (token.includes('-')) {
        const known = token.split('-').filter(part => index.has(part));
        for (const part of known) encoded.push([index.get(part), 1 / known.length]);
      }
    }
    return encoded;
  }

  function embed(text, permutation) {
    const output = new Float32Array(dimensions);
    for (const [word, fraction] of encode(text)) {
      const row = permutation ? permutation[word] : word;
      const weight = scales[row] * fraction;
      for (let coordinate = 0; coordinate < dimensions; coordinate++) {
        output[coordinate] += weight * table[row * dimensions + coordinate];
      }
    }
    let squareSum = 0;
    for (const value of output) squareSum += value * value;
    const length = Math.sqrt(squareSum) || 1;
    for (let coordinate = 0; coordinate < dimensions; coordinate++) output[coordinate] /= length;
    return output;
  }

  return { words, table, scales, encode, embed };
}

export function permutation(length, seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const rows = Array.from({ length }, (_, i) => i);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

export function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function rankDense(query, chunks) {
  const best = new Map();
  for (const chunk of chunks) {
    if (!chunk.vector.length) continue;
    const score = dot(query, chunk.vector);
    if (!best.has(chunk.id) || score > best.get(chunk.id)) best.set(chunk.id, score);
  }
  return [...best].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
}

export function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}
