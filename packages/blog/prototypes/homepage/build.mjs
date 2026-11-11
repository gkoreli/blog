import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { concepts } from './concepts.mjs';

const source = import.meta.dirname;
const dist = resolve(source, '../../dist');
const lab = join(dist, '_design/homepage');
const cssRevision = createHash('sha256').update(await readFile(join(dist, 'main.css'))).digest('hex').slice(0, 12);
const baseline = (await readFile(join(dist, 'index.html'), 'utf8')).replace('href="/main.css"', `href="/main.css?study=${cssRevision}"`);
const previewTheme = `<script>{const theme=new URLSearchParams(location.search).get('theme');if(theme==='dark'||theme==='light')document.documentElement.dataset.theme=theme;}</script>`;
const strip = /<section class="home-tools-(?:strip|invitation)"[\s\S]*?<\/section>/g;
if ([...baseline.matchAll(strip)].length !== 1) throw new Error('Expected exactly one homepage tools invitation. Build the blog first.');
await mkdir(lab, { recursive: true });
for (const file of ['concepts.css', 'concepts.js', 'lab.css', 'lab.js']) await copyFile(join(source, file), join(lab, file));
await copyFile(join(source, 'lab.html'), join(lab, 'index.html'));
for (const concept of concepts) {
  const directory = join(lab, concept.id);
  await mkdir(directory, { recursive: true });
  const output = baseline
    .replace(strip, (current) => concept.id === 'field-kit' && current.includes('home-tools-invitation') ? current : concept.content)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${concept.label} — Homepage study</title>`)
    .replace('</head>', `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/_design/homepage/concepts.css">${previewTheme}</head>`)
    .replace('</body>', '<script type="module" src="/_design/homepage/concepts.js"></script></body>');
  await writeFile(join(directory, 'index.html'), output);
}
const invitation = baseline.match(strip)?.[0];
if (invitation?.includes('home-tools-invitation')) {
  const previous = await readFile(join(source, 'previous-inline.html'), 'utf8');
  await copyFile(join(source, 'previous-inline.css'), join(lab, 'previous-inline.css'));
  const reviewDirectory = join(lab, 'refinements');
  await mkdir(reviewDirectory, { recursive: true });
  await copyFile(join(source, 'refinements.html'), join(reviewDirectory, 'index.html'));
  for (const id of ['compact-invitation', 'inline-invitation']) {
    const directory = join(lab, id);
    await mkdir(directory, { recursive: true });
    const content = id === 'inline-invitation' ? previous : previous.replace(' study-previous-tools-invitation-inline', '');
    const output = baseline.replace(strip, () => content)
      .replace('</head>', `<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/_design/homepage/previous-inline.css">${previewTheme}</head>`)
      .replace('</body>', '<script type="module" src="/_design/homepage/concepts.js"></script></body>');
    await writeFile(join(directory, 'index.html'), output);
  }
  const currentDirectory = join(lab, 'current-inline');
  await mkdir(currentDirectory, { recursive: true });
  await writeFile(join(currentDirectory, 'index.html'), baseline
    .replace('</head>', `<meta name="robots" content="noindex,nofollow">${previewTheme}</head>`)
    .replace('</body>', '<script type="module" src="/_design/homepage/concepts.js"></script></body>'));
}
console.log('Design lab: /_design/homepage/');
console.log('Three isolated studies generated from the actual built homepage.');
