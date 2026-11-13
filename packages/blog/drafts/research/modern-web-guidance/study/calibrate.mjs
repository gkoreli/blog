import { grade } from './grade.mjs';
import { readFileSync, mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const scratch = resolve(process.argv[2]);
const selected = process.argv[3]?.split(',');
const previous = existsSync(join(root, 'calibration.json')) ? 'calibration.json' : 'calibration-initial.json';
const results = selected ? JSON.parse(readFileSync(join(root, previous))).results.filter(row => !selected.includes(row.task)) : [];
for (const task of JSON.parse(readFileSync(join(root, 'tasks.json'))).filter(row => !selected || selected.includes(row.id))) {
  const positive = await grade(task.id, join(root, 'controls/reference', task.id));
  const negativeDir = join(scratch, task.id); mkdirSync(negativeDir, { recursive: true });
  for (const file of ['index.html', 'style.css']) copyFileSync(join(root, 'controls/reference', task.id, file), join(negativeDir, file));
  writeFileSync(join(negativeDir, 'app.js'), '// Deliberately missing implementation.\n');
  writeFileSync(join(negativeDir, 'style.css'), readFileSync(join(negativeDir, 'style.css'), 'utf8') + '\nmain{display:none!important}\n');
  const negative = await grade(task.id, negativeDir);
  const starter = await grade(task.id, join(root, 'fixtures', task.id));
  results.push({ task: task.id, positive, negative, starter });
  console.log(JSON.stringify({ task: task.id, positive: `${positive.passed}/${positive.checkCount}`, negative: `${negative.passed}/${negative.checkCount}`, starter: `${starter.passed}/${starter.checkCount}` }));
}
const accepted = results.every(row => row.positive.passed === row.positive.checkCount && row.negative.passed < row.negative.checkCount)
  && results.find(row => row.task === 'T02').starter.passed === results.find(row => row.task === 'T02').starter.checkCount;
writeFileSync(join(root, 'calibration.json'), JSON.stringify({ accepted, capturedAt: new Date().toISOString(), results }, null, 2) + '\n');
if (!accepted) process.exitCode = 1;
