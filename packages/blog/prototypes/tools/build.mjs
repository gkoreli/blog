import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { concepts } from './concepts.mjs';
import { refinements, patternSheet } from './refinements.mjs';

const source = import.meta.dirname;
const dist = resolve(source, '../../dist');
const output = join(dist, '_design/tools');
const files = ['concepts.css', 'navigation-choices.css', 'concepts.js', 'lab.css', 'lab.js'];
const revision = createHash('sha256');
for (const file of files) revision.update(await readFile(join(source, file)));
const version = revision.digest('hex').slice(0,12);
const mainVersion = createHash('sha256').update(await readFile(join(dist,'main.css'))).digest('hex').slice(0,12);
const baseline = (await readFile(join(dist,'tools/index.html'),'utf8')).replace('href="/main.css"',`href="/main.css?study=${mainVersion}"`);
const article = /<article class="tools-page[\s\S]*?<\/article>/g;
if ([...baseline.matchAll(article)].length !== 1) throw new Error('Build the blog before generating the tools studies.');
await mkdir(output,{recursive:true});
for (const file of files) await copyFile(join(source,file),join(output,file));
await writeFile(join(output,'index.html'),(await readFile(join(source,'lab.html'),'utf8')).replaceAll('__VERSION__',version));
for (const concept of [...concepts,...refinements,patternSheet]) {
  const directory = join(output,concept.id);
  await mkdir(directory,{recursive:true});
  await writeFile(join(directory,'index.html'),baseline
    .replace(article,()=>concept.content)
    .replace(/<title>[\s\S]*?<\/title>/,`<title>${concept.label} — Tools design study</title>`)
    .replace('</head>',`<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/_design/tools/concepts.css?v=${version}"><link rel="stylesheet" href="/_design/tools/navigation-choices.css?v=${version}"><style>.layout{align-content:start}</style></head>`)
    .replace('</body>',`<script type="module" src="/_design/tools/concepts.js?v=${version}"></script></body>`));
}
console.log('Tools prototypes generated at /_design/tools/');
