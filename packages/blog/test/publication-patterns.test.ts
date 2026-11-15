import assert from 'node:assert/strict';
import test from 'node:test';
import { postMetaSchema, type Section } from '../src/lib/frontmatter.js';
import { archiveTopics } from '../src/lib/discovery.js';
import { engineeringPage } from '../src/pages/engineering.js';
import { essaysPage } from '../src/pages/essays.js';
import { ossRadarPage } from '../src/pages/oss-radar.js';
import { privacyPage } from '../src/pages/privacy.js';
import { licensePage, LICENSE_CITATION_SENTENCE } from '../src/pages/license.js';
import { projectCatalogue } from '../src/pages/project-catalogue.js';
import { aboutPage } from '../src/pages/about.js';
import { prepareReadingDocument } from '../src/lib/reading-document.js';
import { renderContent } from '../src/lib/ssg.js';

function post(section: Section, slug: string, tags: string[]) {
  return postMetaSchema.parse({ title: slug, slug, date: '2026-11-14', description: `Complete ${slug} description.`, section, tags });
}

test('archives retain every article and make topics independent scoped search destinations', async () => {
  for (const [section, page] of [['engineering', engineeringPage], ['essays', essaysPage], ['oss-radar', ossRadarPage]] as const) {
    const posts = [post(section, 'one', ['shared', 'one']), post(section, 'two', ['shared', 'two'])];
    const [snapshot] = await renderContent([page(posts)]); assert.ok(snapshot);
    const root = document.createElement('section'); root.innerHTML = snapshot;
    const form = root.querySelector('form'); assert.ok(form);
    assert.equal(form.getAttribute('action'), '/search'); assert.equal(form.getAttribute('method'), 'get');
    assert.equal(root.querySelector<HTMLInputElement>('input[name="section"]')?.value, section);
    const articles = root.querySelectorAll('.section-archive-list article'); assert.equal(articles.length, posts.length);
    for (const [index, article] of [...articles].entries()) {
      assert.equal(article.querySelector('a')?.getAttribute('href'), `/${posts[index]?.slug}`);
      assert.equal(article.querySelectorAll('a a').length, 0);
      const topic = article.querySelector('.topic-link'); assert.ok(topic);
      const href = new URL(topic.getAttribute('href') ?? '', 'https://gkoreli.com');
      assert.equal(href.pathname, '/search'); assert.equal(href.searchParams.get('section'), section);
      assert.equal(href.searchParams.get('q'), 'shared');
    }
  }
  assert.deepEqual(archiveTopics([post('engineering', 'one', ['shared', 'shared']), post('engineering', 'two', ['shared'])]), [{ name: 'shared', count: 2 }]);
});

test('privacy overview and contents reach complete native disclosure sections', async () => {
  const [snapshot] = await renderContent([privacyPage()]); assert.ok(snapshot);
  const prepared = prepareReadingDocument(snapshot), root = document.createElement('section'); root.innerHTML = prepared.html;
  assert.equal(root.querySelectorAll('.policy-summary > div').length, 4);
  assert.equal(root.querySelectorAll('h1').length, 1);
  const before = document.createElement('section'); before.innerHTML = snapshot;
  assert.deepEqual([...root.querySelectorAll('p')].map(node => node.textContent), [...before.querySelectorAll('p')].map(node => node.textContent));
  for (const link of root.querySelectorAll<HTMLAnchorElement>('.policy-summary a,[data-reading-contents] a')) assert.ok(root.querySelector(`[id="${decodeURIComponent(link.hash.slice(1))}"]`), link.hash);
});

test('the public license has one citation statement and direct complete-license destinations', async () => {
  const [snapshot] = await renderContent([licensePage()]); assert.ok(snapshot);
  const root = document.createElement('section'); root.innerHTML = snapshot;
  assert.equal(root.querySelectorAll('h1').length, 1);
  assert.equal(snapshot.split(LICENSE_CITATION_SENTENCE).length - 1, 1);
  assert.ok(root.querySelector('a[href="https://creativecommons.org/licenses/by-nc-nd/4.0/"]'));
  assert.ok(root.querySelector('a[href="https://github.com/gkoreli/blog/blob/main/LICENSE-MIT"]'));
  assert.doesNotMatch(root.textContent ?? '', /packages\/|posts\/|prompts\//);
});

test('About keeps complete project descriptions with distinct drawings and destinations', async () => {
  const [snapshot] = await renderContent([aboutPage()]); assert.ok(snapshot);
  const root = document.createElement('section'); root.innerHTML = snapshot;
  const drawings = new Set<string>();
  for (const project of projectCatalogue()) {
    const link = root.querySelector(`a[href="${project.href}"]`); assert.ok(link);
    const row = link.closest('.navigation-choice'); assert.ok(row);
    assert.ok(row.textContent?.includes(project.summary));
    const drawing = row.querySelector('svg'); assert.ok(drawing); drawings.add(drawing.outerHTML);
  }
  assert.equal(drawings.size, projectCatalogue().length);
});
