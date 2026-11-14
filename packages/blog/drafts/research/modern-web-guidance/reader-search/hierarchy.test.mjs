import test from 'node:test';
import assert from 'node:assert/strict';
import { rankHierarchy } from './hierarchy.mjs';

test('paragraph ranking cannot replace or reorder the passage-selected article candidates', () => {
  const lists = { keyword: [], semantic: [], hybrid: [] }; const timing = {};
  const passage = { rankings: () => ({ lists, timing }), group: () => [{ article: 'a', title: 'A', score: 3 }, { article: 'b', title: 'B', score: 2 }] };
  const block = { rankings: () => ({ lists, timing }), group: () => [{ article: 'wrong', matches: [{ id: 'unrelated' }] }, { article: 'b', matches: [{ id: 'b-paragraph' }] }, { article: 'a', matches: [{ id: 'a-paragraph' }] }], missingTerms: () => [] };
  const result = rankHierarchy(passage, block, 'topic', []);
  assert.deepEqual(result.articles.map(row => row.article), ['a', 'b']);
  assert.deepEqual(result.articles.map(row => row.matches[0].id), ['a-paragraph', 'b-paragraph']);
});

test('a missing paragraph match leaves its article available without inventing a paragraph', () => {
  const lists = { keyword: [], semantic: [], hybrid: [] }; const timing = {};
  const passage = { rankings: () => ({ lists, timing }), group: () => [{ article: 'a', title: 'A', score: 3 }] };
  const block = { rankings: () => ({ lists, timing }), group: () => [], missingTerms: () => ['unseen'] };
  const result = rankHierarchy(passage, block, 'unseen', []);
  assert.deepEqual(result.articles[0].matches, []); assert.deepEqual(result.missingLiteralTerms, ['unseen']);
});
