// Run with the repository's Node 24 + tsx loader. Reads metadata; never renders or builds the site.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
if (process.argv.length !== 4) throw new Error('Usage: node --import tsx snapshot-posts.mjs /repo /new/snapshot.json');
const [repo, output] = process.argv.slice(2).map(value => resolve(value));
const { parsePost } = await import(pathToFileURL(join(repo, 'packages/blog/src/lib/frontmatter.ts')));
const { parsePostModule } = await import(pathToFileURL(join(repo, 'packages/blog/src/lib/post-module.ts')));
const directory = join(repo, 'packages/blog/posts');
const posts = []; const sourceFiles = [];
for (const file of readdirSync(directory).filter(name => /\.(md|ts)$/.test(name)).sort()) {
  const path = join(directory, file);
  const meta = file.endsWith('.md') ? parsePost(path).meta : parsePostModule(await import(pathToFileURL(path)), path).meta;
  posts.push({ slug: meta.slug, title: meta.title, date: meta.date, tags: meta.tags, description: meta.description, url: new URL('/' + meta.slug, 'https://gkoreli.com').href });
  sourceFiles.push({ file, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') });
}
const snapshot = { capturedAt: new Date().toISOString(), source: 'Local posts/ metadata via existing Markdown and TypeScript validators; not a current-production capture.', sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), posts, sourceFiles };
writeFileSync(output, JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ count: posts.length, sourceCommit: snapshot.sourceCommit, output }));
