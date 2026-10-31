import { validInput, invalidInput, parityCases } from './data.mjs';

export async function run(makeValidator) {
  const kind = process.env.SCHEMA || 'simple';
  const start = performance.now();
  const validator = makeValidator(kind);
  const first = validator.validate(validInput(kind, 1));
  if (!first.valid) throw new Error('first valid case rejected');
  const firstMs = performance.now() - start;
  if (process.argv.includes('--verify')) {
    const outputs = parityCases(kind).map((input) => {
      const result = validator.validate(input);
      return { valid: result.valid, input, errors: (result.errors || []).map(({ instancePath, keyword, schemaPath, params }) => ({ instancePath, keyword, schemaPath, params })) };
    });
    console.log(JSON.stringify({ engine: validator.engine, outputs }));
    return;
  }
  const mixed = process.env.TRAFFIC === 'mixed';
  const corpus = Array.from({ length: 256 }, (_, i) => mixed && i % 4 === 0 ? invalidInput(kind, i) : validInput(kind, i));
  const iterations = Number(process.env.ITERATIONS || 2000000);
  const warmup = Number(process.env.WARMUP || 200000);
  let warmAccepted = 0;
  for (let i = 0; i < warmup; i++) warmAccepted += validator.validate(corpus[i & 255]).valid ? 1 : 0;
  const loopStart = performance.now();
  let accepted = 0, errors = 0;
  for (let i = 0; i < iterations; i++) {
    const result = validator.validate(corpus[i & 255]);
    accepted += result.valid ? 1 : 0;
    if (mixed && !result.valid) errors += result.errors.length;
  }
  const hotMs = performance.now() - loopStart;
  const expected = mixed ? iterations * 3 / 4 : iterations;
  if (accepted !== expected || warmAccepted !== (mixed ? warmup * 3 / 4 : warmup) || (mixed && errors !== iterations / 4)) throw new Error('validation checksum failed');
  console.log(JSON.stringify({ engine: validator.engine, kind, mixed, iterations, accepted, errors, hot_ms: hotMs, first_ms: firstMs }));
  if (process.env.HOLD_MS) await Bun.sleep(Number(process.env.HOLD_MS));
}
