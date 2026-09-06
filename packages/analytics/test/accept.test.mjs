import assert from 'node:assert/strict';
import test from 'node:test';
import { htmlAcceptance } from '../.test-dist/accept.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';

const cases = [
  [null, null], ['', 0], ['text/html', 1], ['TEXT/HTML', 1],
  ['text/*', 1], ['*/*', 1], ['application/json', 0], ['text/html-extra', 0],
  ['text/html;q=0', 0], ['text/html;q=0.000', 0], ['*/*;q=0', 0],
  ['text/html;q=0.001', 1], ['text/html;q=1.000', 1],
  ['text/html;q=0, */*;q=1', 0], ['*/*;q=1, text/html;q=0', 0],
  ['text/*;q=0, */*;q=1', 0], ['text/html;q=0.5, text/*;q=0', 1],
  ['text/html;q=0.5, */*;q=0', 1],
  ['application/json, text/*;q=0.5', 1],
  ['text/html; charset=utf-8', 1], ['text/html; CHARSET="UTF-8"', 1],
  ['text/html;charset=iso-8859-1', 0], ['text/html;profile="other"', 0],
  ['text/html;charset=utf-8;q=0, text/html;q=1', 0],
  ['text/html;charset=iso-8859-1;q=0, text/html;q=1', 1],
  ['text/html;profile="other,text/html"', 0],
  ['text/html;profile="other;text/html"', 0],
  ['text/html;q=', 0], ['text/html;q=NaN', 0], ['text/html;q=1.1', 0],
  ['text/html;q=-1', 0], ['text/html;q=0.1234', 0], ['text/html;q="0.5"', 0],
  ['text/html;q=1;q=0', 0], ['text/html;charset="utf-8', 0],
];

test('HTML evidence respects media ranges, quality, specificity and UTF-8 parameters', () => {
  for (const [accept, expected] of cases) assert.equal(htmlAcceptance(accept), expected, String(accept));
});

test('metadata uses corrected HTML acceptance without converting absent evidence to acceptance', () => {
  for (const [accept, expected] of cases) {
    const headers = new Headers();
    if (accept !== null) headers.set('Accept', accept);
    assert.equal(extractRequestMetadata(new Request('https://calibration.example/', { headers })).acceptsHtml, expected, String(accept));
  }
});
