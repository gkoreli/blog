import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

export const modelConfig = {
  id: 'Xenova/e5-small-v2', revision: '02af79985278377e65c724a76275707cb0333c70',
  runtime: '@huggingface/transformers@3.8.1', dtype: 'q8', dimensions: 384,
  pooling: 'mean', normalize: true, queryPrefix: 'query: ', documentPrefix: 'passage: ',
  device: 'cpu', intraOpThreads: 2, interOpThreads: 1, maximumTokens: 480, packingTargetTokens: 360,
};

export async function loadEncoder(runtimeDir, modelDir) {
  const requireRuntime = createRequire(join(resolve(runtimeDir), 'package.json'));
  const imported = await import(pathToFileURL(requireRuntime.resolve('@huggingface/transformers')));
  const api = imported.pipeline ? imported : imported.default;
  api.env.allowLocalModels = true; api.env.allowRemoteModels = false;
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network fetch prohibited during local embedding'); };
  let extractor;
  try {
    extractor = await api.pipeline('feature-extraction', resolve(modelDir), {
      local_files_only: true, dtype: modelConfig.dtype, device: modelConfig.device,
      session_options: { intra_op_num_threads: modelConfig.intraOpThreads, inter_op_num_threads: modelConfig.interOpThreads },
    });
  } catch (error) { globalThis.fetch = fetchBefore; throw error; }
  const countTokens = text => extractor.tokenizer(text, { truncation: false, padding: false, add_special_tokens: true }).input_ids.data.length;
  async function embed(texts) {
    for (const text of texts) assert(countTokens(text) <= modelConfig.maximumTokens, 'Input exceeds frozen token ceiling; refusing truncation');
    const result = await extractor(texts, { pooling: modelConfig.pooling, normalize: modelConfig.normalize });
    const rows = result.tolist();
    for (const row of rows) {
      assert.equal(row.length, modelConfig.dimensions);
      assert(row.every(Number.isFinite));
      const norm = Math.sqrt(row.reduce((sum, value) => sum + value * value, 0));
      assert(Math.abs(norm - 1) < 1e-4, `Invalid normalized-vector length: ${norm}`);
    }
    return rows;
  }
  return { countTokens, embed, dispose: async () => { await extractor.dispose(); globalThis.fetch = fetchBefore; } };
}
