import assert from 'node:assert/strict';
import test from 'node:test';
import { negotiateRepresentation } from '../src/worker/negotiate.ts';

test('Markdown wins only when explicitly preferred over HTML', () => {
  assert.equal(negotiateRepresentation('text/markdown'), 'markdown');
  assert.equal(negotiateRepresentation('text/markdown, text/html;q=0.9'), 'markdown');
  assert.equal(negotiateRepresentation('text/markdown;q=0.8, text/html'), 'html');
  assert.equal(negotiateRepresentation('text/markdown, text/html'), 'html');
  assert.equal(negotiateRepresentation('text/markdown;q=0, */*'), 'html');
  assert.equal(negotiateRepresentation('*/*'), 'html');
  assert.equal(negotiateRepresentation(null), 'html');
});

test('citation media types negotiate only when preferred over HTML', () => {
  assert.equal(
    negotiateRepresentation('application/vnd.citationstyles.csl+json'),
    'csl-json',
  );
  assert.equal(negotiateRepresentation('application/x-bibtex'), 'bibtex');
  assert.equal(
    negotiateRepresentation('application/vnd.citationstyles.csl+json;q=0.8, text/html;q=0.9'),
    'html',
  );
  assert.equal(
    negotiateRepresentation('text/markdown;q=0.8, application/x-bibtex;q=0.9'),
    'bibtex',
  );
});

test('Accept parsing is case-insensitive and uses the highest duplicate quality', () => {
  assert.equal(
    negotiateRepresentation('TEXT/MARKDOWN; charset=utf-8; q="0.5", text/markdown;q=1, text/html;q=0.9'),
    'markdown',
  );
  assert.equal(negotiateRepresentation('text/markdown;q=wat, text/html;q=0.1'), 'html');
});
