import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLIENT_REGISTRY, CLIENT_REGISTRY_SOURCES, KNOWN_CLIENT_NAMES,
  KNOWN_CLIENT_PRODUCTS, clientDefinition, clientReaderKind,
  clientTrafficClass, clientDeclarationsFromProducts,
} from '../.test-dist/client-registry.js';
import { userAgentProducts } from '../.test-dist/user-agent-products.js';
import { VENDOR_IP_SOURCES } from '../.test-dist/vendor-ip-sources.js';
import { VENDOR_SIGNATURE_METHODS } from '../.test-dist/vendor-signatures.js';
import { DIRECTORY_PUBLICATIONS } from '../.test-dist/directory-publication.js';

function declarations(userAgent) {
  return clientDeclarationsFromProducts(new Set(userAgentProducts(userAgent).map(product => product.name)));
}

test('current registry has unique canonical names and case-insensitive exact product aliases', () => {
  const names = new Set(), aliases = new Set();
  for (const definition of CLIENT_REGISTRY) {
    assert.ok(!names.has(definition.name), `duplicate name ${definition.name}`);
    names.add(definition.name);
    assert.ok(definition.products.length > 0);
    assert.ok(CLIENT_REGISTRY_SOURCES[definition.source]);
    assert.equal(clientDefinition(definition.name), definition);
    for (const product of definition.products) {
      assert.ok(!aliases.has(product.toLowerCase()), `duplicate alias ${product}`);
      aliases.add(product.toLowerCase());
      for (const claim of [product, product.toUpperCase(), `${product}/1.0`, `Mozilla/5.0 (compatible; ${product}/1.0; +https://example.test/)`]) {
        assert.deepEqual(declarations(claim), { candidates: [definition.name], matchedProducts: [product] });
      }
    }
  }
  assert.deepEqual([...KNOWN_CLIENT_NAMES].sort(), [...names].sort());
  assert.equal(KNOWN_CLIENT_PRODUCTS.size, aliases.size);
  assert.equal(clientDefinition('not-a-client'), null);
  assert.equal(clientReaderKind('not-a-client'), null);
  assert.equal(clientTrafficClass('not-a-client'), null);
});

test('registry preserves all original declared roles, including intentional generic exceptions', () => {
  // Frozen role/coarse-class compatibility from source18606bd, independent of
  // the new registry. Roles remain declaration claims, not authentication.
  const baseline = [
    ['ai', 'ai-assistant', ['Shap-User', 'ExaUser', 'ChatGPT-User', 'Claude-User', 'Claude-Agent', 'Perplexity-User', 'Meta-ExternalFetcher', 'MistralAI-User', 'DuckAssistBot', 'Amzn-User', 'Google-Agent', 'Google-GeminiNotebook']],
    ['ai', 'ai-search', ['ShapBot', 'ExaSearchBot', 'OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'MistralAI-Index', 'Amzn-SearchBot', 'Meta-WebIndexer', 'Applebot']],
    ['ai', 'ai-crawler', ['GPTBot', 'ClaudeBot', 'MistralAI-Training', 'Meta-ExternalAgent', 'Amazonbot', 'CCBot', 'Google-CloudVertexBot', 'Bytespider', 'PetalBot', 'Cohere-AI']],
    ['ai', 'other-bot', ['Claude-Web']],
    ['bot', 'search-crawler', ['Googlebot', 'Bingbot', 'DuckDuckBot', 'YandexBot', 'Baiduspider']],
    ['bot', 'seo-crawler', ['AhrefsBot', 'AhrefsSiteAudit']],
    ['bot', 'preview-or-feed', ['FacebookBot', 'LinkedInBot', 'Slackbot-LinkExpanding', 'Slack-ImgProxy']],
    ['bot', 'headless-browser', ['HeadlessChrome', 'Cypress', 'Lightpanda']],
    ['bot', 'other-bot', ['GoogleOther', 'Meta-ExternalAds', 'OAI-AdsBot', 'Google-Extended', 'Applebot-Extended', 'Slackbot']],
  ];
  for (const [trafficClass, readerKind, names] of baseline) {
    for (const name of names) {
      assert.equal(clientTrafficClass(name), trafficClass, name);
      assert.equal(clientReaderKind(name), readerKind, name);
    }
  }
  for (const [alias, name] of [
    ['Googlebot-Image', 'Googlebot'], ['Googlebot-Video', 'Googlebot'],
    ['GoogleOther-Image', 'GoogleOther'], ['GoogleOther-Video', 'GoogleOther'],
    ['facebookexternalhit', 'FacebookBot'], ['Facebot', 'FacebookBot'],
  ]) assert.deepEqual(declarations(`${alias}/1.0`).candidates, [name]);
});

test('all candidates survive reordered and compatible or conflicting multiple declarations', () => {
  assert.deepEqual(declarations('ChatGPT-User/1.0 ExaUser/1.0').candidates, ['ChatGPT-User', 'ExaUser']);
  assert.deepEqual(declarations('GPTBot/1.0 AI2Bot/1.0 ChatGPT-User/1.0'), declarations('ChatGPT-User/1.0 AI2Bot/1.0 GPTBot/1.0'));
  assert.deepEqual(declarations('Googlebot/2.1 Googlebot-Image/1.0'), {
    candidates: ['Googlebot'], matchedProducts: ['Googlebot', 'Googlebot-Image'],
  });
  assert.deepEqual(declarations('SemrushBot/7~bl SemrushBot-SI/1.0'), {
    candidates: ['SemrushBot'], matchedProducts: ['SemrushBot', 'SemrushBot-SI'],
  });
});

test('new first-party declarations add useful roles without invented suffixes or AI identities', () => {
  for (const [claim, name, kind] of [
    ['Mozilla/5.0 (compatible) AI2Bot (+https://www.allenai.org/crawler)', 'AI2Bot', 'ai-crawler'],
    ['Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)', 'SemrushBot', 'seo-crawler'],
    ['SiteAuditBot/1.0', 'SiteAuditBot', 'seo-crawler'],
    ['MJ12bot/v1.4.8', 'MJ12bot', 'seo-crawler'],
    ['DotBot/1.1', 'DotBot', 'seo-crawler'],
    ['python-httpx/0.28.1', 'python-httpx', 'http-client'],
    ['axios/1.8.0', 'axios', 'http-client'],
    ['node-fetch', 'node-fetch', 'http-client'],
    ['Checkly/1.0 (https://www.checklyhq.com)', 'Checkly', 'other-bot'],
  ]) {
    assert.deepEqual(declarations(claim).candidates, [name]);
    assert.equal(clientReaderKind(name), kind);
    const definition = clientDefinition(name);
    assert.ok(definition);
    assert.equal(CLIENT_REGISTRY_SOURCES[definition.source].checkedOn, '2026-11-06');
  }
  for (const claim of [
    'NotAI2Bot/1.0', 'AI2Bot-Dolma/1.0', 'AI2Bot-DeepResearchEval/1.0',
    'SemrushBot-Invented/1.0', 'Manus-User/1.0',
    'Mozilla/5.0 (+https://example.test/SemrushBot)',
    'Mozilla/5.0 (Checkly, https://www.checklyhq.com)',
  ]) assert.deepEqual(declarations(claim).candidates, [], claim);
});

test('every configured current verification membership references a registered declaration', () => {
  // Domains remain distinct: publication of a key directory does not establish
  // a per-client signing promise, and neither is a published-IP method.
  for (const [namespace, entries] of [
    ['ip', VENDOR_IP_SOURCES], ['documented-signing', VENDOR_SIGNATURE_METHODS],
    ['directory-publication', DIRECTORY_PUBLICATIONS],
  ]) {
    for (const entry of entries) {
      for (const name of entry.declarations) assert.ok(clientDefinition(name), `${namespace}: ${name}`);
    }
  }
  assert.ok(DIRECTORY_PUBLICATIONS.some(entry => entry.declarations.includes('AhrefsBot')));
  assert.ok(!VENDOR_SIGNATURE_METHODS.some(entry => entry.declarations.includes('AhrefsBot')));
  assert.ok(!VENDOR_IP_SOURCES.some(entry => entry.declarations.includes('AI2Bot')));
});

test('public registry mutation cannot alter the role and alias lookup used by classification', () => {
  const first=CLIENT_REGISTRY[0],before=clientReaderKind(first.name),count=CLIENT_REGISTRY.length;
  assert.throws(()=>{first.readerKind='browser'},TypeError);
  assert.throws(()=>first.products.push('InjectedClient'),TypeError);
  assert.throws(()=>CLIENT_REGISTRY.push({...first,name:'InjectedClient'}),TypeError);
  assert.equal(clientReaderKind(first.name),before);assert.equal(CLIENT_REGISTRY.length,count);
  assert.deepEqual(declarations('InjectedClient/1.0').candidates,[]);
});
