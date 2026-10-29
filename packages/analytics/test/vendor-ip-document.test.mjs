import assert from 'node:assert/strict';
import test from 'node:test';
import {normalizeAmazonIpDocument} from '../.test-dist/vendor-ip-document.js';
import {parseVendorIpFeed} from '../.test-dist/vendor-ip.js';
import {analyzeTraffic} from '../.test-dist/classify.js';
import {classifyReaderKind} from '../.test-dist/readerkind.js';

test('Amazon host lists and search prefixes normalize only their documented shapes',()=>{
 const hosts=normalizeAmazonIpDocument({creationTime:'2026-09-08T05:24:10.610952+00:00',prefixes:[{ipv4Prefix:'3.81.245.78'}]},'amazon-hosts-html');
 const parsed=parseVendorIpFeed(hosts);assert.ok(parsed);assert.equal(parsed.prefixes[0][1],32);assert.equal(parsed.publisherVersion,'2026-09-08T05:24:10.610952Z');
 const search=parseVendorIpFeed(normalizeAmazonIpDocument({prefixes:[{ip_prefix:'3.82.67.224/32'},{ip_prefix:'2600:1f00::/32'}]},'amazon-prefixes-html'));
 assert.ok(search);assert.equal(search.prefixes.length,2);
 assert.equal(parseVendorIpFeed({prefixes:[{ipv4Prefix:'3.81.245.78'}]}),null,'ordinary JSON feeds still require CIDRs');
});

test('source adapters never skip malformed entries or turn broad/private/ambiguous input into listed prefixes',()=>{
 for(const [format,entries] of [
  ['amazon-hosts-html',[{ipv4Prefix:'3.81.245.78/32'}]],['amazon-hosts-html',[{ipv4Prefix:'03.81.245.78'}]],
  ['amazon-hosts-html',[{ipv4Prefix:'10.0.0.1'}]],['amazon-hosts-html',[{ipv4Prefix:'3.81.245.78',extra:'private-canary'}]],
  ['amazon-hosts-html',[{ip_prefix:'3.81.245.78/32'}]],['amazon-prefixes-html',[{ip_prefix:'3.81.245.78'}]],
  ['amazon-prefixes-html',[{ip_prefix:'3.81.245.78/24'}]],['amazon-prefixes-html',[{ip_prefix:'3.81.245.0/0'}]],
  ['amazon-prefixes-html',[{ip_prefix:'3.81.245.0/24'},{ip_prefix:'private-canary'}]],
 ]) assert.equal(parseVendorIpFeed(normalizeAmazonIpDocument({prefixes:entries},format)),null);
 assert.equal(normalizeAmazonIpDocument({prefixes:Array.from({length:4097},()=>({ipv4Prefix:'3.81.245.78'}))},'amazon-hosts-html'),null);
});

test('documented Meta advertising client has an exact other-bot claim and retains conflicting roles',()=>{
 const analysis=analyzeTraffic('meta-externalads/1.1');assert.equal(analysis.agentName,'Meta-ExternalAds');assert.equal(analysis.trafficClass,'bot');
 assert.equal(classifyReaderKind({...analysis,userAgent:'meta-externalads/1.1',observationSource:'edge',asn:null,signature:{status:'absent'}}).kind,'other-bot');
 assert.equal(classifyReaderKind({...analysis,userAgent:'meta-externalads/1.1',observationSource:'edge',asn:null,signature:{status:'verified',agent:'https://fixture.example'}}).kind,'other-bot','a signature must not replace the declared advertising role');
 for(const ua of ['fake-meta-externalads/1.1','https://example.test/meta-externalads/1.1','meta-externalads/'])assert.equal(analyzeTraffic(ua).agentName,null);
 const conflict=analyzeTraffic('meta-externalads/1.1 ExaSearchBot/1.0');assert.equal(conflict.declarations.status,'multiple');assert.equal(conflict.agentName,null);
 assert.equal(classifyReaderKind({...conflict,userAgent:'meta-externalads/1.1 ExaSearchBot/1.0',observationSource:'edge',asn:null,signature:{status:'absent'}}).kind,'unresolved');
});
