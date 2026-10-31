// Schemas adapted from ata-validator's pinned bench_aot_vs_ajv.mjs (MIT).
export const schemas = {
  simple: {
    type: 'object', properties: { id: { type: 'integer', minimum: 1 }, name: { type: 'string', minLength: 1 } },
    required: ['id', 'name'],
  },
  nested: {
    type: 'object', properties: {
      id: { type: 'integer', minimum: 1 },
      status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
      user: { type: 'object', properties: {
        firstName: { type: 'string', minLength: 1 }, lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' }, age: { type: 'integer', minimum: 0, maximum: 150 },
      }, required: ['firstName', 'lastName', 'email'] },
      items: { type: 'array', items: { type: 'object', properties: {
        sku: { type: 'string', minLength: 1 }, quantity: { type: 'integer', minimum: 1 }, price: { type: 'number', minimum: 0 },
      }, required: ['sku', 'quantity', 'price'] }, minItems: 1 },
    }, required: ['id', 'status', 'user', 'items'],
  },
  defaults: {
    type: 'object', properties: { id: { type: 'integer' }, enabled: { type: 'boolean', default: true } },
    required: ['id'], additionalProperties: false,
  },
};

export function validInput(kind, i) {
  if (kind === 'simple') return { id: i + 1, name: `user-${i}` };
  if (kind === 'defaults') return { id: i + 1 };
  return {
    id: i + 1, status: ['active', 'inactive', 'pending'][i % 3],
    user: { firstName: `name-${i}`, lastName: 'Smith', email: `u${i}@example.com`, age: i % 151 },
    items: Array.from({ length: 1 + i % 4 }, (_, j) => ({ sku: `sku-${i}-${j}`, quantity: j + 1, price: i / 10 })),
  };
}

export function invalidInput(kind, i) {
  const value = validInput(kind, i);
  if (kind === 'simple' || kind === 'defaults') value.id = 'invalid';
  else value.items[0].quantity = 0;
  return value;
}

export function parityCases(kind) {
  const good = validInput(kind, 1);
  return [good, invalidInput(kind, 2), null, [], {}, { ...good, id: 0 },
    { ...good, id: '3' }, { ...good, extra: 'extra' }, ...Array.from({ length: 32 }, (_, i) => i % 4 ? validInput(kind, i) : invalidInput(kind, i))];
}
