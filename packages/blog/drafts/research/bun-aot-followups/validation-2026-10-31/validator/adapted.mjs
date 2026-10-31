import { makeValidator as makeRaw } from './standalone.mjs';
import { schemas } from './data.mjs';
const emptyErrors = Object.freeze([]);

// Schema-specific adapter for these fixtures. It is not a general replacement
// for ata's preprocessing (nested defaults, coercion, custom formats, etc.).
export function makeValidator(kind) {
  const raw = makeRaw(kind);
  const defaults = Object.entries(schemas[kind].properties).filter(([, spec]) => Object.hasOwn(spec, 'default'));
  return {
    engine: 'standalone-with-adapter',
    validate(input) {
      if (defaults.length && input !== null && typeof input === 'object' && !Array.isArray(input)) {
        for (const [key, spec] of defaults) if (input[key] === undefined) input[key] = structuredClone(spec.default);
      }
      const result = raw.validate(input);
      if (result.valid) return { valid: true, data: input, errors: emptyErrors };
      return { valid: false, errors: result.errors.map(({ keyword, instancePath, schemaPath, params, message }) => ({ keyword, instancePath, schemaPath, params, message })) };
    },
  };
}
