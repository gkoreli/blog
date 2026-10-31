import { writeFileSync, mkdirSync } from 'node:fs';
import { Validator } from 'ata-validator';
import { toStandaloneModule } from 'ata-validator/aot';
import { schemas } from './data.mjs';
mkdirSync('generated', { recursive: true });
for (const [name, schema] of Object.entries(schemas)) {
  writeFileSync(`generated/${name}.mjs`, toStandaloneModule(new Validator(schema, { richErrors: false, useDefaults: name === 'defaults' }), { format: 'esm' }));
}
