import build from 'fast-json-stringify';
import { writeFileSync } from 'node:fs';
import { responseSchema } from './database.mjs';

// The emitted function is an ordinary source module when Bun compiles the app.
writeFileSync('serializer.cjs', build(responseSchema, { mode: 'standalone' }));
