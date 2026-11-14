import { createEmbedder, readFloat32, search } from './engine.mjs';

async function load() {
  const responses = await Promise.all(['catalog.json', 'model/query-words.json', 'model/query-words.i8', 'model/query-words.scale.f32'].map(path => fetch(path)));
  for (const response of responses) if (!response.ok) throw new Error('Could not load a search asset');
  const [catalogData, words, bytes, scales] = await Promise.all([responses[0].json(), responses[1].json(), responses[2].arrayBuffer(), responses[3].arrayBuffer()]);
  const embedder = createEmbedder(words, new Int8Array(bytes), readFloat32(scales));
  postMessage({ type: 'ready', posts: catalogData.posts.length, vocabulary: words.length, modelBytes: bytes.byteLength + scales.byteLength + new TextEncoder().encode(JSON.stringify(words)).length });
  self.onmessage = event => {
    const { id, query, mode } = event.data;
    const before = performance.now();
    const result = search(catalogData.posts, embedder, query, mode);
    postMessage({ type: 'result', id, query, mode, elapsedMs: performance.now() - before, ...result });
  };
}
load().catch(error => postMessage({ type: 'error', message: error.message }));
