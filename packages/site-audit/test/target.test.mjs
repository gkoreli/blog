import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTarget, TargetValidationError } from '../.test-dist/target.js';

test('public domains and paths get HTTPS without requiring a typed scheme', () => {
  for (const [input, expected] of [
    ['reddit.com', 'https://reddit.com/'],
    ['www.reddit.com/r/webdev', 'https://www.reddit.com/r/webdev'],
    ['HTTPS://Reddit.COM/r/webdev', 'https://reddit.com/r/webdev'],
    ['reddit.com:443/r/webdev', 'https://reddit.com/r/webdev'],
    ['bücher.de/über-uns', 'https://xn--bcher-kva.de/%C3%BCber-uns'],
    ['reddit.com/a%20page', 'https://reddit.com/a%20page'],
    ['reddit.com/a%3Fb%23c', 'https://reddit.com/a%3Fb%23c'],
    ['reddit.com/path/https://another.site', 'https://reddit.com/path/https://another.site'],
  ]) {
    const target = normalizeTarget(input).href;
    assert.equal(target, expected, input);
    assert.equal(normalizeTarget(target).href, target, input);
  }
});

test('target validation explains the actual rejected input category without echoing it', () => {
  for (const [input, reason, message] of [
    ['', 'empty', /Enter a public page/],
    ['   ', 'empty', /Enter a public page/],
    [' reddit.com', 'invalid-characters', /Remove spaces/],
    ['reddit.com\n', 'invalid-characters', /line breaks/],
    ['reddit.com/a page', 'invalid-characters', /Encode spaces/],
    ['reddit.com\\@127.0.0.1', 'invalid-characters', /backslashes/],
    ['https://', 'invalid-url', /complete HTTPS URL/],
    ['https:reddit.com', 'invalid-url', /complete HTTPS URL/],
    ['http://reddit.com', 'protocol', /Use an HTTPS page/],
    ['ftp://reddit.com', 'protocol', /Use an HTTPS page/],
    ['javascript:alert(1)', 'protocol', /Use an HTTPS page/],
    ['mailto:reader@reddit.com', 'protocol', /Use an HTTPS page/],
    ['https://secret-user:secret-password@reddit.com', 'credentials', /Remove the username and password/],
    ['https://reddit.com/?secret-token=private', 'query', /Remove the query string/],
    ['https://reddit.com/?', 'query', /Remove the query string/],
    ['https://reddit.com/#private-fragment', 'fragment', /Remove the page fragment/],
    ['https://reddit.com/#', 'fragment', /Remove the page fragment/],
    ['https://reddit.com/#?', 'fragment', /Remove the page fragment/],
    ['reddit.com:8443', 'port', /Remove the custom port/],
    ['https://127.0.0.1', 'public-host', /public domain name/],
    ['https://[::1]', 'public-host', /public domain name/],
    ['localhost', 'public-host', /Local addresses and IP addresses/],
    ['foo.internal', 'public-host', /Local addresses and IP addresses/],
    ['reddit.com.', 'public-host', /public domain name/],
  ]) {
    assert.throws(() => normalizeTarget(input), error => {
      assert.ok(error instanceof TargetValidationError, input);
      assert.equal(error.reason, reason, input);
      assert.match(error.message, message);
      assert.doesNotMatch(error.message, /secret-user|secret-password|secret-token|private-fragment/);
      return true;
    });
  }
});

test('URL length is bounded after input acquisition without truncating the destination', () => {
  const base = 'https://reddit.com/';
  const maximum = base + 'a'.repeat(2048 - base.length);
  assert.equal(normalizeTarget(maximum).href, maximum);
  assert.throws(() => normalizeTarget(maximum + 'a'), error => error instanceof TargetValidationError && error.reason === 'too-long');
});

test('Unicode and bare-domain expansion cannot produce a canonical URL rejected on resubmission', () => {
  const base = 'https://bücher.de/';
  const available = 2048 - new URL(base).href.length;
  const encodedWidth = encodeURIComponent('界').length;
  const maximum = base + '界'.repeat(Math.floor(available / encodedWidth)) + 'a'.repeat(available % encodedWidth);
  assert.ok(maximum.length < 2048);
  const target = normalizeTarget(maximum).href;
  assert.equal(target.length, 2048);
  assert.equal(normalizeTarget(target).href, target);

  const expansion = maximum + '界';
  assert.ok(expansion.length < 2048);
  assert.throws(() => normalizeTarget(expansion), error => error instanceof TargetValidationError && error.reason === 'too-long');
  const bareBase = 'reddit.com/';
  const bareMaximum = bareBase + 'a'.repeat(2048 - bareBase.length);
  assert.equal(bareMaximum.length, 2048);
  assert.throws(() => normalizeTarget(bareMaximum), error => error instanceof TargetValidationError && error.reason === 'too-long');
});

test('the shared domain remains strict about surrounding whitespace for API callers', () => {
  for (const input of [' reddit.com', 'reddit.com ', '\thttps://reddit.com/', 'https://reddit.com/\r\n']) {
    assert.throws(() => normalizeTarget(input), error => error instanceof TargetValidationError && error.reason === 'invalid-characters');
  }
});
