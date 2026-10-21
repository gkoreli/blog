import type { TemplateResult } from '@nisli/core';
import { postMetaSchema } from './frontmatter.js';

function isTemplateResult(value: unknown): value is TemplateResult {
  return typeof value === 'object' && value !== null
    && '__templateResult' in value && value.__templateResult === true
    && 'mount' in value && typeof value.mount === 'function'
    && 'dispose' in value && typeof value.dispose === 'function';
}

function templateExport(value: unknown, name: string): () => TemplateResult {
  if (typeof value !== 'function') throw new Error(`${name} must export a template function`);
  return () => {
    const result: unknown = value();
    if (!isTemplateResult(result)) throw new Error(`${name} must return a Nisli template`);
    return result;
  };
}

export function parsePostModule(value: unknown, file: string) {
  if (typeof value !== 'object' || value === null || !('meta' in value) || !('article' in value)) {
    throw new Error(`Invalid TypeScript post module: ${file}`);
  }
  return {
    meta: postMetaSchema.parse(value.meta),
    article: templateExport(value.article, `${file}: article`),
    ...('preamble' in value && value.preamble !== undefined
      ? { preamble: templateExport(value.preamble, `${file}: preamble`) }
      : {}),
  };
}
