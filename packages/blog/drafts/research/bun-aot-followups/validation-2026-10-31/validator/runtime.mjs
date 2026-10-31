import { Validator } from 'ata-validator';
import { schemas } from './data.mjs';
export function makeValidator(kind) {
  const requested = process.env.ENGINE;
  const validator = new Validator(schemas[kind], { richErrors: false, useDefaults: kind === 'defaults', ...(requested ? { engine: requested } : {}) });
  return { validate: (value) => validator.validate(value), engine: validator.engine() };
}
