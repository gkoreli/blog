import assert from 'node:assert/strict';
import test from 'node:test';
import { assessUserAgent } from '../.test-dist/user-agent-assessment.js';
import { extractRequestEvidence } from '../.test-dist/request-evidence.js';
import { analyzeTraffic } from '../.test-dist/classify.js';

const evidence = ua => extractRequestEvidence(new Request('https://fixture.example/', { headers: { 'User-Agent': ua } }), new Response('page'));
const cases = [
  ['Chrome/150.0 Edg/150.0 OPR/120.0 Safari/537.36', 'browser'],
  ['Mozilla/5.0 (Linux; Android 14; Windows NT 10.0) Chrome/150.0', 'platform'],
  ['Mozilla/5.0 (Windows NT 10.0; Windows NT 11.0) Chrome/150.0', 'platform'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 16_3; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Version/17.0 Safari/604.1', 'platform'],
];

test('abstains instead of selecting a browser vendor or OS version from contradictory claims', () => {
  for (const [ua, field] of cases) {
    const report = assessUserAgent(ua);
    const diagnostic = evidence(ua);
    assert.equal(report[field].family, 'unknown', ua);
    assert.equal(report[field].major, null, ua);
    assert.equal(report[field].state, 'conflicting', ua);
    assert.equal(field === 'browser' ? diagnostic.browserFamily : diagnostic.osFamily, 'unknown', ua);
    assert.equal(field === 'browser' ? diagnostic.browserMajor : diagnostic.osMajor, null, ua);
  }
  const first = assessUserAgent('(CPU iPhone OS 16_3; CPU iPhone OS 17_0)');
  const reversed = assessUserAgent('(CPU iPhone OS 17_0; CPU iPhone OS 16_3)');
  assert.deepEqual(first.platform, reversed.platform);
  assert.deepEqual(assessUserAgent('Chrome/150.0 Edg/150.0 OPR/120.0').browser,
    assessUserAgent('OPR/120.0 Chrome/150.0 Edg/150.0').browser);
});

test('retains normal compatibility products and separates a browser name from its reported engine family', () => {
  for (const [ua, browser] of [['Chrome/150.0 Safari/537.36', 'chromium'],
    ['Chrome/150.0 Edg/150.0 Safari/537.36', 'edge'], ['Chrome/150.0 OPR/120.0 Safari/537.36', 'opera']]) {
    assert.equal(assessUserAgent(ua).browser.family, browser);
    assert.equal(evidence(ua).browserFamily, browser);
  }
  for (const [ua, family] of [['(Linux; Android 14) Chrome/150.0', 'android'],
    ['(X11; CrOS x86_64 14541.0.0) Chrome/150.0', 'chromeos'], ['(X11; Linux x86_64) Chrome/150.0', 'linux']]) {
    assert.equal(assessUserAgent(ua).platform.family, family);
  }
  assert.equal(assessUserAgent('(Windows NT 10.0; Windows NT 10.0) Chrome/150.0').platform.major, 10);
  assert.equal(assessUserAgent('(Android 14) Chrome/150.0').platform.minor, null, 'absence of a reported minor version remains absent');
  assert.deepEqual(assessUserAgent('(Android 14; Android 14.0)').platform,
    assessUserAgent('(Android 14.0; Android 14)').platform, 'compatible partial versions do not depend on order');
  assert.equal(assessUserAgent('(Windows NT 99999.0) Chrome/150.0').platform.major, null);
  assert.equal(assessUserAgent('(Windows NT nope) Chrome/150.0').platform.state, 'version-unresolved');
  assert.equal(assessUserAgent('(Windows NT 10.0; Windows NT nope) Chrome/150.0').platform.state, 'conflicting');
  assert.equal(assessUserAgent('Chrome/99.0').browser.major, 99);
  assert.equal(assessUserAgent('Chrome/100.0').browser.major, 100);
  assert.equal(assessUserAgent('Chrome/1000.0').browser.major, 1000);
});

test('flags reported compatibility versions without recovering hidden hardware or OS versions', () => {
  for (const ua of [
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/150.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.0.0',
  ]) {
    const report = assessUserAgent(ua);
    assert.ok(report.cautions.includes('matches-frozen-platform-pattern'), ua);
    assert.equal(report.authentication, 'not-performed');
    assert.ok(report.cautions.includes('form-is-not-hardware'));
    assert.equal('actualOsVersion' in report.platform, false);
  }
  const desktop = assessUserAgent('Mozilla/5.0 (X11; Linux x86_64) Chrome/150.0.0.0 Safari/537.36', '?0');
  assert.equal(desktop.form.form, 'non-mobile-preference');
  assert.equal('legacyCompatibility' in desktop.form, false);
  assert.equal('device' in desktop, false);
});

test('frozen-pattern cautions require the complete documented version rather than a nearby or partial claim', () => {
  const frozen = ua => assessUserAgent(ua).cautions.includes('matches-frozen-platform-pattern');
  for (const ua of ['(Mac OS X 10.15) Firefox/145.0', '(Mac OS X 10_15_6) Version/26.0 Safari/605.1',
    '(Mac OS X 10_15_70) Chrome/150.0', '(Windows NT 10.1) Chrome/150.0', '(Windows NT 10.0.1) Chrome/150.0',
    '(Android 10; K-Touch) Chrome/150.0',
    '(CPU iPhone OS 18_6_1) AppleWebKit/605.1 Version/26.0 Safari/604.1',
    'Chrome/150.0 (+https://example.test/Mac OS X 10_15_7)']) assert.equal(frozen(ua), false, ua);
  assert.equal(frozen('(Mac OS X 10.15.7) Firefox/145.0'), true);
  assert.equal(assessUserAgent('(Mac OS X 10.15)').platform.minor, 15, 'the partial reported version is preserved');
  assert.equal(assessUserAgent(null).profile, 'user-agent-claims/2026-11-10.2');
});

test('missing, empty and spoofed headers stay supplied claims, not verified clients', () => {
  assert.equal(assessUserAgent(null).sourceState, 'missing');
  assert.equal(assessUserAgent('').sourceState, 'empty');
  assert.equal(assessUserAgent('  ').sourceState, 'empty');
  assert.equal(assessUserAgent('\u00a0').sourceState, 'present', 'HTTP whitespace is SP/HTAB, not every Unicode whitespace character');
  assert.equal(assessUserAgent('unknown-client').sourceState, 'present');
  for (const ua of ['GPTBot/1.0', 'Googlebot/2.1']) assert.equal(assessUserAgent(ua).authentication, 'not-performed');
  assert.ok(assessUserAgent('Google-Extended/1.0').cautions.includes('policy-token-is-not-request-identity'));
  assert.ok(assessUserAgent('Chrome/150.0', 'true').cautions.includes('unsupported-mobile-hint'));
  const nbsp = new Headers({ 'Sec-CH-UA-Mobile': '\u00a0?1\u00a0' }).get('Sec-CH-UA-Mobile');
  assert.equal(assessUserAgent('Chrome/150.0', nbsp).form.mobileHint, 'unsupported');
  assert.equal(assessUserAgent('Chrome/150.0', ' \t?1\t ').form.mobileHint, 'mobile');
  assert.equal(assessUserAgent(null).automationDeclaration, false); // Not a human label.
});

test('keeps URI lookalikes and private values out of the closed assessment', () => {
  const report = assessUserAgent('Mozilla/5.0 (+https://private.example/;GPTBot/1.0) reader@private.example secret=value Chrome/150.0');
  assert.deepEqual(report.declarations.candidates, []);
  assert.doesNotMatch(JSON.stringify(report), /private\.example|secret=value/);
  assert.equal(assessUserAgent('Chrome/150.0 (+https://example.test/Android 14)').platform.family, 'unknown');
});

test('new diagnostic normalization leaves collection classifications unchanged for the audited counterexamples', () => {
  for (const [ua] of cases) {
    const before = analyzeTraffic(ua);
    const report = assessUserAgent(ua);
    assert.deepEqual(report.declarations, before.declarations);
    assert.equal(report.automationDeclaration, before.trafficClass !== 'browser');
    assert.equal(evidence(ua).version, '2026-11-10.1');
  }
});
