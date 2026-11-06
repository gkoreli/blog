import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeTraffic, KNOWN_CLIENT_PRODUCTS, userAgentProductNames } from '../.test-dist/classify.js';
import { claimsFetchMetadataBrowser, classifyReaderKind } from '../.test-dist/readerkind.js';
import { extractRequestMetadata } from '../.test-dist/metadata.js';
import { userAgentClaimText, userAgentProducts } from '../.test-dist/user-agent-products.js';

const desktop = 'Mozilla/5.0 AppleWebKit/537.36 Chrome/150.0 Safari/537.36';
const cubot = 'Mozilla/5.0 (Linux; Android 6.0; CUBOT MAX) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36';
function kind(ua, headers = {}, asn = 64512) {
  const request = new Request('https://publication.example/article', { headers: { 'User-Agent': ua, Accept: 'text/html', 'Accept-Language': 'en', ...headers } });
  return classifyReaderKind({ ...extractRequestMetadata(request), ...analyzeTraffic(ua), asn, observationSource: 'edge', signature: { status: 'absent' } });
}

test('shared lexical products preserve exact named-token boundaries, versions and aliases', () => {
  assert.deepEqual(userAgentProducts('Mozilla/5.0 (compatible; GPTBot/1.0; +https://example.test/robot)'), [
    { name: 'mozilla', version: '5.0' }, { name: 'compatible', version: null }, { name: 'gptbot', version: '1.0' },
  ]);
  for (const token of KNOWN_CLIENT_PRODUCTS) {
    const before = analyzeTraffic(`${token}/1.0`);
    for (const ua of [token, token.toLowerCase(), `Mozilla/5.0 (compatible; ${token}/1.0; +https://example.test/)`]) {
      assert.deepEqual(analyzeTraffic(ua).declarations.candidates, before.declarations.candidates, ua);
    }
    for (const ua of [`Not${token}/1.0`, `${token}Impostor/1.0`, `https://example.test/${token}/1.0`, `${token}/1.0/extra`]) {
      assert.equal(analyzeTraffic(ua).agentName, null, ua);
    }
  }
  assert.deepEqual([...userAgentProductNames('Chrome/150.0 Chromium/150.0 chrome/150.0')], ['chrome', 'chromium']);
});

test('URL substrings, device model words and malformed product versions do not declare automation', () => {
  for (const ua of [cubot, `${desktop} (Android 8.0.0; CUBOT_P20)`, `${desktop} (Android 6.0; CUBOT-MAX)`,
    `${desktop} (+https://example.test/robot)`, `${desktop} (+https://crawler.example/selenium)`,
    `${desktop} Phantom/ios/24.3.0.16061`, `${desktop} Phantom/android/24.4.0.15916`,
    `${desktop} NotLighthouse/1.0`, `${desktop} CustomBot/1.0/extra`, `${desktop} SomecrawlerModel`,
    `${desktop} MyWgetDevice/1.0`, `${desktop} ResearchSpiderDevice/1.0`]) {
    assert.equal(analyzeTraffic(ua).trafficClass, 'browser', ua);
    assert.equal(analyzeTraffic(ua).agentName, null, ua);
  }
  assert.deepEqual(kind(`${desktop} (+https://example.test/robot)`), { kind: 'unresolved', reason: 'fetch-metadata-absent' });
  assert.deepEqual(kind(cubot), { kind: 'unresolved', reason: 'fetch-metadata-support-unknown' });
  const navigation = { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': 'none' };
  assert.equal(kind(cubot, navigation).kind, 'browser', 'browser signals are a rule match, not operator authentication');
  assert.deepEqual(kind(cubot, navigation, null), { kind: 'unresolved', reason: 'network-evidence-missing' });
});

test('contiguous absolute URI spans exclude semicolon/query/fragment/userinfo product lookalikes', () => {
  for (const token of KNOWN_CLIENT_PRODUCTS) {
    for (const uri of [`https://example.test/;${token}/1.0`, `HTTPS://example.test/?a=1;${token}/1.0#tail`,
      `https://example.test/#fragment;${token}/1.0`, `https://user;${token}/1.0:password@example.test/`,
      `mailto:reader@example.test;${token}/1.0`, `custom+v1.example:opaque;${token}/1.0`,
      `https://example.test/(section);${token}/1.0`]) {
      for (const ua of [uri, `Mozilla/5.0 (+${uri})`]) {
        const result = analyzeTraffic(ua);
        assert.equal(result.agentName, null, ua);
        assert.deepEqual(result.declarations.candidates, [], ua);
        assert.equal(result.trafficClass, 'browser', 'a URI cannot supply a named or generic software declaration');
      }
    }
  }
  for (const ua of ['https://example.test/path;UnknownBot/1.0', 'https://example.test/?q=1;curl/8.0',
    'https://example.test/#fragment;UnknownCrawler', 'mailto:reader@example.test;UnknownSpider',
    String.raw`Mozilla/5.0 (+https://example.test/\);UnknownBot/1.0)`]) {
    assert.equal(analyzeTraffic(ua).trafficClass, 'browser', ua);
  }
  for (const ua of ['GPTBot/1.0https://example.test/', 'UnknownBot/1.0https://example.test/']) {
    assert.equal(analyzeTraffic(ua).agentName, null);
    assert.equal(analyzeTraffic(ua).trafficClass, 'browser', 'masking inside an invalid token must not create a declaration boundary');
  }
});

test('URI masking preserves real separated products and makes its comment-boundary policy explicit', () => {
  for (const ua of ['Googlebot/2.1; +https://example.test/;GPTBot/1.0',
    'https://example.test/;GPTBot/1.0 Googlebot/2.1', 'https://example.test/;GPTBot/1.0\tGooglebot/2.1',
    'Mozilla/5.0 (+https://example.test/(section);GPTBot/1.0);Googlebot/2.1',
    'Mozilla/5.0 (Googlebot/2.1; +https://example.test/;GPTBot/1.0)']) {
    assert.deepEqual(analyzeTraffic(ua).declarations.candidates, ['Googlebot'], ua);
  }
  assert.equal(analyzeTraffic('Device/1.0;GPTBot/1.0').agentName, 'GPTBot', 'ordinary semicolon-separated declarations remain supported');
  assert.equal(analyzeTraffic('(https://example.test/);GPTBot/1.0').agentName, 'GPTBot', 'unmatched URI close-parenthesis ends the UA comment span');
  const raw = 'Mozilla/5.0 (+https://example.test/;GPTBot/1.0) Googlebot/2.1';
  assert.equal(userAgentClaimText(raw).length, raw.length);
  assert.equal(userAgentClaimText(userAgentClaimText(raw)), userAgentClaimText(raw), 'all consumers can reuse the same sanitized claim text');
});

test('bare generic products retain lexical evidence while phone/wallet exceptions cannot mask other products', () => {
  for (const ua of ['bot', 'Spider', 'crawler', 'crawl', 'Slurp', 'Scrapy', 'headless', 'PhantomJS', 'selenium', 'Wget',
    'python-requests', 'Go-http-client', 'UptimeRobot', 'Lighthouse', 'Chrome-Lighthouse', 'curl/8.0', 'libcurl/7.22.0',
    'FixtureBot/1.0', 'custom-crawler/1.0', 'UnknownSpider/2.0', 'coccocbot-web/1.0', 'DuckDuckBot-Https/1.1',
    'UnknownBot', 'CustomCrawler', 'ResearchSpider', 'Googlebot-News', 'CUBOT/1.0',
    `${cubot} UnknownBot/1.0`, `${cubot} UnknownBot`, `${desktop} Phantom/ios/24.3.0.16061 UnknownBot`]) {
    const result = analyzeTraffic(ua);
    assert.equal(result.trafficClass, 'bot', ua);
    assert.equal(result.agentName, null, ua);
    assert.deepEqual(kind(ua), { kind: 'other-bot', reason: 'generic-bot' }, ua);
  }
  for (const ua of ['CUBOT', 'CUBOT MAX', 'Phantom']) {
    assert.equal(analyzeTraffic(ua).trafficClass, 'browser', ua);
    assert.equal(kind(ua).kind, 'unresolved', 'no declaration is not a browser/human verdict');
  }
  assert.equal(analyzeTraffic(`${cubot} GPTBot/1.0`).agentName, 'GPTBot', 'device exceptions must not mask explicit declarations');
  assert.equal(kind(`${cubot} GPTBot/1.0`).kind, 'ai-crawler');
});

test('long adversarial inputs preserve late declarations under explicit size controls', () => {
  // Sizes are explicit local controls, not observed traffic or a supported
  // unlimited header budget. No wall-clock threshold makes CI timing a claim.
  const prefix = 'DeviceModel/1.0 '.repeat(8192);
  const url = 'https://example.test/' + 'bot/'.repeat(32768);
  const malformed = 'Unrecognized/' + '/'.repeat(131072);
  for (const input of [prefix, url, malformed]) {
    assert.equal(analyzeTraffic(input).trafficClass, 'browser');
    const result = analyzeTraffic(`${input} GPTBot/1.0`);
    assert.equal(result.agentName, 'GPTBot');
    assert.deepEqual(result.declarations.candidates, ['GPTBot']);
  }
  assert.equal(claimsFetchMetadataBrowser(`${prefix} Chromium/150.0`), true);
  assert.equal(claimsFetchMetadataBrowser(`${prefix} Chrome/75.0 Chromium/150.0`), false);
  const longUri = 'https://example.test/;' + 'UnknownBot/1.0;'.repeat(8192);
  assert.equal(analyzeTraffic(longUri).trafficClass, 'browser');
  assert.equal(analyzeTraffic(`${longUri} GPTBot/1.0`).agentName, 'GPTBot');
  assert.equal(analyzeTraffic('a+'.repeat(65536)).trafficClass, 'browser', 'long scheme-like input without a colon must terminate');
});

test('normalized desktop product claims share support thresholds without accepting embedded or malformed claims', () => {
  for (const ua of ['Chrome/76.0', 'chrome/150.0', 'Chromium/150.0', 'CHROMIUM/150.0', 'Firefox/90.0',
    'firefox/150.0', 'AppleWebKit/605.1 Version/16.4 Safari/605.1']) {
    assert.equal(claimsFetchMetadataBrowser(ua), true, ua);
    assert.deepEqual(kind(ua), { kind: 'unresolved', reason: 'fetch-metadata-absent' }, ua);
  }
  for (const ua of ['Chrome/75.0', 'Firefox/89.0', 'Chrome/150bogus', 'Chrome/999999', 'Chrome/150.0/extra',
    'NotChrome/150.0', 'https://example.test/Chrome/150.0', 'Chrome', 'AppleWebKit/605.1 Version/16.3 Safari/605.1']) {
    assert.equal(claimsFetchMetadataBrowser(ua), false, ua);
  }
  for (const ua of ['Chrome/75.0 Chrome/150.0', 'Chrome/150.0 Chrome/75.0', 'Chrome/150.0 Chromium/75.0']) {
    assert.equal(claimsFetchMetadataBrowser(ua), false, 'conflicting version claims must not choose a favorable product');
  }
});

test('incompatible Firefox and Chromium shell declarations abstain without masking named client roles', () => {
  const navigation = { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': 'none' };
  for (const firefox of ['Firefox/89.0', 'Firefox/150.0', 'FxiOS/150.0', 'firefox/invalid']) {
    for (const chromium of ['Chrome/75.0', 'Chromium/150.0', 'CriOS/150.0', 'Edg/150.0', 'EdgA/150.0', 'EdgiOS/150.0', 'OPR/120.0']) {
      for (const ua of [`${firefox} ${chromium}`, `${chromium} ${firefox}`]) {
        assert.equal(analyzeTraffic(ua).declarations.browserFamily, 'unrecognized', ua);
        assert.equal(claimsFetchMetadataBrowser(ua), false, ua);
        assert.deepEqual(kind(ua, navigation), { kind: 'unresolved', reason: 'unrecognized-browser-claim' }, ua);
        assert.equal(kind(`${ua} GPTBot/1.0`, navigation).kind, 'ai-crawler', 'separate named role evidence survives browser ambiguity');
      }
    }
  }
  for (const ua of ['Chrome/150.0 Safari/537.36', 'Chrome/150.0 Edg/150.0 Safari/537.36',
    'Chrome/150.0 OPR/120.0 Safari/537.36', 'Chrome/150.0 Edg/150.0 OPR/120.0 Safari/537.36',
    'Chrome/150.0 NotFirefox/150.0', 'Chrome/150.0 (+https://example.test/;Firefox/150.0)']) {
    assert.equal(analyzeTraffic(ua).declarations.browserFamily, 'chromium', ua);
    assert.equal(claimsFetchMetadataBrowser(ua), true, ua);
  }
  assert.equal(claimsFetchMetadataBrowser('Firefox/150.0 (+https://example.test/;Chrome/75.0)'), true);
  assert.equal(claimsFetchMetadataBrowser('(iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1 FxiOS/150.0 CriOS/150.0'), false, 'iOS capability cannot select between conflicting browser-shell claims');
});

test('iOS browser shells follow the declared WebKit OS rather than a desktop browser threshold', () => {
  for (const shell of ['CriOS/150.0', 'FxiOS/150.0', 'Version/17.0 Mobile/15E148 Safari/604.1']) {
    for (const [os, expected] of [['16_3', false], ['16_4', true], ['17_0', true]]) {
      const ua = `Mozilla/5.0 (iPhone; CPU iPhone OS ${os} like Mac OS X) AppleWebKit/605.1.15 ${shell}`;
      assert.equal(claimsFetchMetadataBrowser(ua), expected, ua);
    }
  }
  for (const ua of ['CriOS/150.0', 'FxiOS/150.0', 'CriOS/150.0 Chrome/150.0', 'Version/17.0 Safari/605.1']) {
    assert.equal(claimsFetchMetadataBrowser(ua), false, 'missing engine/platform context remains unknown');
  }
  for (const ua of ['(iPhone OS 16_3; iPhone OS 17_0)', '(iPhone OS 17_0; iPhone OS 16_3)']) {
    assert.equal(claimsFetchMetadataBrowser(`${ua} AppleWebKit/605.1 CriOS/150.0`), false, 'conflicting OS claims cannot select a favorable capability');
  }
  for (const [base, expected] of [['Chrome/75.0 AppleWebKit/605.1', false], ['Chrome/150.0 AppleWebKit/605.1', true]]) {
    for (const uri of ['https://example.test/iPhone OS 17_0', 'https://example.test/iPhone OS 16_3',
      'https://example.test/;iPhone OS 17_0', 'https://example.test/;iPhone OS 16_3']) {
      assert.equal(claimsFetchMetadataBrowser(`${base} (+${uri})`), expected, 'an OS phrase cannot borrow its first word from a masked URI');
    }
  }
});

test('registry software roles precede browser/network shape without changing signature or operator evidence', () => {
  const navigation = { 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Site': 'none' };
  for (const token of ['python-httpx/0.28.1', 'axios/1.13.1', 'node-fetch']) {
    const name = token.split('/')[0];
    for (const ua of [token, `${desktop} ${token}`]) {
      assert.equal(analyzeTraffic(ua).agentName, name);
      assert.deepEqual(kind(ua, navigation, 16509), { kind: 'http-client', reason: name });
    }
  }
  assert.deepEqual(kind('Checkly/1.0', navigation), { kind: 'other-bot', reason: 'Checkly' });
  assert.equal(analyzeTraffic(`${desktop} (Checkly, https://checklyhq.com)`).agentName, null, 'no invented comma alias for the browser marker');
});
