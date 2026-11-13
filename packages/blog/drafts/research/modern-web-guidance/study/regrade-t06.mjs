import { grade } from './grade-v2.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const scratch = resolve(process.argv[2]);
const amendment = JSON.parse(readFileSync(join(root, 'amendment-01-inputs.json')));
for (const [file, hash] of Object.entries(amendment.files)) {
  if (createHash('sha256').update(readFileSync(join(root, file))).digest('hex') !== hash) throw new Error(`Amendment input changed: ${file}`);
}
const plan = JSON.parse(readFileSync(join(root, 'plan.json')));
const originals = plan.trials.map(trial => JSON.parse(readFileSync(join(root, 'run-results', trial.artifact + '.json'))));
if (originals.length !== 54) throw new Error('Wait for all 54 generation attempts.');
const reference = join(root, 'controls/reference/T06');
const negative = join(scratch, 'negative-T06'); mkdirSync(negative, { recursive: true });
for (const name of ['index.html', 'style.css']) copyFileSync(join(reference, name), join(negative, name));
writeFileSync(join(negative, 'style.css'), readFileSync(join(negative, 'style.css')) + '\nmain{display:none!important}\n');
writeFileSync(join(negative, 'app.js'), '// Deliberately missing implementation.\n');
const calibration = {
  version: 'v2', capturedAt: new Date().toISOString(),
  positive: await grade('T06', reference),
  negative: await grade('T06', negative),
  starter: await grade('T06', join(root, 'fixtures/T06')),
};
calibration.accepted = calibration.positive.passed === calibration.positive.checkCount && calibration.negative.passed < calibration.negative.checkCount;
writeFileSync(join(root, 'calibration-v2.json'), JSON.stringify(calibration, null, 2) + '\n');
if (!calibration.accepted) throw new Error('Corrected grader calibration failed; no artifact regrade accepted.');
const output = join(root, 'regraded'); mkdirSync(output, { recursive: true });
const affected = originals.filter(row => row.task === 'T06');
if (affected.length !== 9) throw new Error('Expected exactly nine affected artifacts.');
for (const original of affected) {
  const folder = join(root, 'artifacts', original.artifact);
  for (const [file, hash] of Object.entries(original.artifactSha256)) {
    if (createHash('sha256').update(readFileSync(join(folder, file))).digest('hex') !== hash) throw new Error(`Artifact changed: ${original.artifact}/${file}`);
  }
  const result = { artifact: original.artifact, version: 'v2', capturedAt: new Date().toISOString(), originalChecksPassed: original.browserGrade.passed, ...await grade('T06', folder) };
  writeFileSync(join(output, original.artifact + '.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ artifact: original.artifact, original: original.browserGrade.passed, corrected: result.passed, checks: result.checkCount }));
}
