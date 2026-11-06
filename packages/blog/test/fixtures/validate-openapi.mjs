import assert from 'node:assert/strict';

// Test-only validator for the exact JSON Schema vocabulary this OpenAPI emits.
// Fail on unsupported keywords rather than silently accepting an unchecked rule.
const supported = new Set(['$ref', 'type', 'anyOf', 'const', 'enum', 'properties', 'required', 'additionalProperties', 'items', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'format', 'description', 'examples']);
export function validateOpenApiValue(document, schema, value, path = '$') {
  for (const key of Object.keys(schema)) assert.ok(supported.has(key), `${path}: unsupported schema keyword ${key}`);
  if (schema.$ref) {
    assert.match(schema.$ref, /^#\/components\/schemas\/[^/]+$/);
    const target = document.components.schemas[schema.$ref.slice('#/components/schemas/'.length)];
    assert.ok(target, `${path}: unresolved reference`);
    return validateOpenApiValue(document, target, value, path);
  }
  if (schema.anyOf) {
    assert.ok(schema.anyOf.some(branch => { try { validateOpenApiValue(document, branch, value, path); return true; } catch { return false; } }), `${path}: no matching anyOf branch`);
  }
  if (Object.hasOwn(schema, 'const')) assert.deepEqual(value, schema.const, `${path}: const`);
  if (schema.enum) assert.ok(schema.enum.some(item => Object.is(item, value)), `${path}: enum`);
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const matches = type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : type === 'integer' ? Number.isInteger(value) : type === 'number' ? typeof value === 'number' && Number.isFinite(value) : typeof value === type;
    assert.ok(types.some(matches), `${path}: type`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined) assert.ok(value >= schema.minimum, `${path}: minimum`);
    if (schema.maximum !== undefined) assert.ok(value <= schema.maximum, `${path}: maximum`);
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined) assert.ok([...value].length >= schema.minLength, `${path}: minLength`);
    if (schema.maxLength !== undefined) assert.ok([...value].length <= schema.maxLength, `${path}: maxLength`);
    if (schema.pattern) assert.match(value, new RegExp(schema.pattern), `${path}: pattern`);
    if (schema.format === 'date-time') assert.ok(/^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)), `${path}: date-time`);
    else if (schema.format === 'date') assert.ok(/^\d{4}-\d\d-\d\d$/.test(value) && Number.isFinite(Date.parse(value)), `${path}: date`);
    else if (schema.format === 'uri') assert.ok(URL.canParse(value), `${path}: uri`);
    else if (schema.format !== undefined) assert.fail(`${path}: unsupported format`);
  }
  if (Array.isArray(value) && schema.items) value.forEach((item, index) => validateOpenApiValue(document, schema.items, item, `${path}[${index}]`));
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) assert.ok(Object.hasOwn(value, key), `${path}.${key}: required`);
    for (const [key, item] of Object.entries(value)) {
      const property = schema.properties?.[key];
      if (property) validateOpenApiValue(document, property, item, `${path}.${key}`);
      else if (schema.additionalProperties === false) assert.fail(`${path}.${key}: additional property`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validateOpenApiValue(document, schema.additionalProperties, item, `${path}.${key}`);
    }
  }
}
