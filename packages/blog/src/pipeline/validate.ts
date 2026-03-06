import { discoverPosts } from '../lib/fs.js';
import { validatePosts } from '../lib/frontmatter.js';

const results = validatePosts(discoverPosts());
const invalid = results.filter(r => !r.valid);

for (const r of invalid) console.error(`❌ ${r.errors}`);

if (invalid.length) {
  console.error(`\n${invalid.length} post(s) have invalid frontmatter.`);
  console.error('Expected format at top of .md file:\n');
  console.error('---');
  console.error('title: "Your Post Title"');
  console.error('date: 2026-03-05');
  console.error('description: "A short description"');
  console.error('tags: [tag1, tag2]');
  console.error('---');
  process.exit(1);
}

console.log(`✅ All ${results.length} post(s) valid.`);
