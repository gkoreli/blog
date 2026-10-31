import { validInput, invalidInput } from './data.mjs';
const { makeValidator } = USE_ADAPTED ? await import('./adapted.mjs') : await import('./runtime.mjs');
const kind = process.env.SCHEMA || 'simple';
const mixed = process.env.TRAFFIC === 'mixed';
const validator = makeValidator(kind);
const corpus = Array.from({ length: 256 }, (_, i) => mixed && i % 4 === 0 ? invalidInput(kind, i) : validInput(kind, i));
const iterations = Number(process.env.ITERATIONS || 1000000);
const warmup = Number(process.env.WARMUP || 200000);
function consume(count) {
  let accepted = 0, checksum = 0;
  for (let i = 0; i < count; i++) {
    const result = validator.validate(corpus[i & 255]);
    if (result.valid) { accepted++; checksum += result.data.id; }
    else {
      const errors = result.errors;
      checksum += errors.length;
      for (const error of errors) checksum += error.instancePath.length;
    }
  }
  return { accepted, checksum };
}
const warm = consume(warmup);
const start = performance.now();
const result = consume(iterations);
const hotMs = performance.now() - start;
console.log(JSON.stringify({ engine: validator.engine, kind, mixed, iterations, warm, ...result, hot_ms: hotMs }));
