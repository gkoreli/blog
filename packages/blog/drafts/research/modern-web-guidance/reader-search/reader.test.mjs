import test from 'node:test';
import assert from 'node:assert/strict';
import { focusQuery } from './query.mjs';
import { paragraphLink, uniqueTextOccurrence, escapeHtml } from './navigation.mjs';
import { createReaderIndex } from './ranking.mjs';

test('article-location framing is removed while topic negation and constraints survive', () => {
  assert.equal(focusQuery('In which article did I write about CSS without JavaScript?').focused, 'CSS without JavaScript?');
  assert.equal(focusQuery('Which post covered replacing a serializer but not losing fields?').focused, 'replacing a serializer but not losing fields?');
  assert.equal(focusQuery('why does a signature not prove a person initiated the request?').changed, false);
  assert.equal(focusQuery('Find the post about ').focused, 'Find the post about');
});

test('paragraph links require unique visible text, preserve section fallback and encode directive punctuation', () => {
  const unit = { url: 'https://gkoreli.com/example#section', text: 'A dash-separated phrase, with ampersands & punctuation has a unique destination.' };
  const link = paragraphLink(unit, 'Intro. ' + unit.text + ' Footer.');
  assert.equal(link.label, 'Open paragraph'); assert.ok(link.url.startsWith(unit.url + ':~:text='));
  assert.ok(link.url.includes('%2D')); assert.ok(link.url.includes('%2C')); assert.ok(link.url.includes('%26'));
  assert.equal(paragraphLink(unit, unit.text + ' ' + unit.text).label, 'Open section');
  assert.equal(paragraphLink(unit, 'The page has changed.').verifiedText, null);
});

test('text uniqueness respects case and word boundaries and can avoid altered inline formatting', () => {
  assert.equal(uniqueTextOccurrence('A phrase here. a phrase here.', 'A phrase here.'), false);
  assert.equal(uniqueTextOccurrence('a catapult', 'cat'), false);
  const unit = { url: 'https://gkoreli.com/example', text: 'A linked function has an important consequence for an independent paragraph destination that stays readable.' };
  const live = 'A linked `function` has an important consequence for an independent paragraph destination that stays readable.';
  assert.equal(paragraphLink(unit, live).label, 'Open paragraph');
});

test('grouping shows distinct articles without rewarding repeated pieces of one source block', () => {
  const vector = Array(384).fill(0); vector[0] = 1;
  const units = [
    { id: 'a1', article: 'a', title: 'A', searchText: 'needle', sourceBlocks: ['same'] },
    { id: 'a2', article: 'a', title: 'A', searchText: 'needle', sourceBlocks: ['same'] },
    { id: 'b1', article: 'b', title: 'B', searchText: 'needle', sourceBlocks: ['other'] },
  ];
  const index = createReaderIndex(units, Float32Array.from([...vector, ...vector, ...vector]));
  const groups = index.group([{ id: 'a1', score: 3 }, { id: 'a2', score: 2 }, { id: 'b1', score: 1 }]);
  assert.deepEqual(groups.map(row => row.article), ['a', 'b']); assert.equal(groups[0].matches.length, 1);
  assert.deepEqual(index.missingTerms('needle absent'), ['absent']);
});

test('source text and query values remain inert when rendered in HTML', () => {
  assert.equal(escapeHtml('<script>"x" & \'y\'</script>'), '&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;');
});
