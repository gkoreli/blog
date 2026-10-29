import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { vendorSignatureEvidence } from '../.test-dist/vendor-signatures.js';
import { directoryPublicationEvidence } from '../.test-dist/directory-publication.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';
import { queryStats } from '../.test-dist/stats.js';

const bot = 'https://shapbot.parallel.ai';
const user = 'https://shap-user.parallel.ai';

test('Parallel signing methods bind exact declarations to distinct documented origins', () => {
  for (const [name,origin,other] of [['ShapBot',bot,user],['Shap-User',user,bot]]) {
    const result = {status:'verified',agent:origin,evidence:{covered:{userAgent:false}}};
    const evidence = vendorSignatureEvidence([name],result);
    assert.equal(evidence.profile,'2026-10-29.1');
    assert.equal(evidence.status,'matching-origin');assert.equal(evidence.documentedDeclarationCount,1);
    assert.equal(evidence.matchingDeclarationCount,1);assert.equal(evidence.userAgentCovered,false);
    assert.equal(directoryPublicationEvidence([name],result).status,'matching-publisher');
    for (const agent of [other,origin+'/',origin+'.evil.example','https://fixture.example']) {
      assert.equal(vendorSignatureEvidence([name],{...result,agent}).status,'different-origin');
      assert.equal(directoryPublicationEvidence([name],{...result,agent}).status,'different-publisher');
    }
    for (const signature of [{status:'absent'},{status:'unverified',reason:'signature-invalid'},{status:'unverified',reason:'directory-unavailable'}]) {
      assert.equal(vendorSignatureEvidence([name],signature).status,'not-verified');
      assert.equal(directoryPublicationEvidence([name],signature).status,'not-verified');
    }
    assert.equal(vendorSignatureEvidence([name],result,true).status,'test-injected');
    assert.equal(directoryPublicationEvidence([name],result,true).status,'test-injected');
  }
});

test('same-vendor conflicting origins and partially documented declarations remain explicit', () => {
  for (const names of [['ShapBot','Shap-User'],['Shap-User','ShapBot']]) {
    for (const agent of [bot,user,'https://fixture.example']) {
      const result={status:'verified',agent};
      const e=vendorSignatureEvidence(names,result);
      assert.equal(e.status,'conflicting-origins');assert.equal(e.expectedOriginCount,2);
      assert.equal(e.matchingDeclarationCount,agent==='https://fixture.example'?0:1);
      assert.equal(e.differentOriginDeclarationCount,agent==='https://fixture.example'?2:1);
      assert.equal(directoryPublicationEvidence(names,result).status,'conflicting-publishers');
    }
    assert.equal(vendorSignatureEvidence(names,{status:'absent'}).status,'conflicting-origins');
  }
  const result={status:'verified',agent:bot};
  assert.equal(vendorSignatureEvidence(['ShapBot','GPTBot'],result).unmappedDeclarationCount,1);
  assert.equal(directoryPublicationEvidence(['ShapBot','GPTBot'],result).status,'partial-mapping');
});

test('report accepts all dated method profiles without reinterpreting old Parallel evidence', async () => {
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
  const insert=sqlite.prepare("INSERT INTO page_observations(path,daily_client_id,traffic_class,device_type,is_owner,reader_kind,reader_reason,signature_status,signature_evidence,observed_at) VALUES('/article','00000000000000000000000000000000','ai','desktop',0,'ai-search','declared-client',NULL,?,'2026-10-29 15:00:00')");
  const modern=verificationEvidence(new Request('https://publication.example'),{status:'absent'},false,['ShapBot']);
  const prior=structuredClone(modern);prior.vendor={...prior.vendor,profile:'2026-10-28.1',status:'not-configured',documentedDeclarationCount:0,unmappedDeclarationCount:1,expectedOriginCount:0};
  prior.directoryPublication={...prior.directoryPublication,profile:'2026-10-28.1',reviewedOn:'2026-10-28',status:'not-configured',configuredDeclarationCount:0,unmappedDeclarationCount:1};
  const legacy=structuredClone(prior);legacy.vendor.profile='2026-10-27.1';
  legacy.directoryPublication.profile='2026-10-27.1';legacy.directoryPublication.reviewedOn='2026-10-27';
  for(const evidence of [modern,prior,legacy])insert.run(JSON.stringify(evidence));
  const invalid=structuredClone(modern);invalid.vendor.profile='future';insert.run(JSON.stringify(invalid));
  const malformed=structuredClone(modern);malformed.vendor.expectedOriginCount=0;insert.run(JSON.stringify(malformed));
  const DB={prepare:sql=>({bind:(...values)=>({all:()=>({results:sqlite.prepare(sql).all(...values)})})}),batch:async statements=>statements.map(s=>s.all())};
  const report=await queryStats(DB,{range:'7d',traffic:'all'},new Date('2026-10-29T16:00:00Z'));
  assert.equal(report.totals.views,5);assert.equal(report.verification.vendorCheckRecognizedViews,3);
  assert.equal(report.verification.vendorCheckUnrecognizedViews,2);assert.equal(report.verification.vendorNotVerifiedViews,1);
  assert.equal(report.verification.vendorUnmappedDeclarationViews,2);
  assert.equal(report.byDirectoryPublication.find(r=>r.basis==='not-configured').views,2);
  assert.equal(report.byDirectoryPublication.find(r=>r.basis==='not-verified').views,3);
  assert.deepEqual(JSON.parse(sqlite.prepare('SELECT signature_evidence FROM page_observations WHERE id=2').get().signature_evidence),prior);
});
