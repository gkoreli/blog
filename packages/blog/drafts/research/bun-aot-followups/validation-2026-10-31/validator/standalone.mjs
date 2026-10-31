import { validate as simple } from './generated/simple.mjs';
import { validate as nested } from './generated/nested.mjs';
import { validate as defaults } from './generated/defaults.mjs';
const validators = { simple, nested, defaults };
export function makeValidator(kind) { return { validate: validators[kind], engine: 'standalone' }; }
