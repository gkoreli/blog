import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {KNOWN_AGENT_NAMES} from '../../analytics/.test-dist/classify.js';
import {agentReaderKind} from '../../analytics/.test-dist/readerkind.js';
import {VENDOR_IP_SOURCES} from '../../analytics/.test-dist/vendor-ip-sources.js';
import {VENDOR_SIGNATURE_METHODS} from '../../analytics/.test-dist/vendor-signatures.js';
import {DIRECTORY_PUBLICATIONS} from '../../analytics/.test-dist/directory-publication.js';
import {PUBLIC_SIGNERS} from '../../analytics/.test-dist/signers.js';
import {CLASSIFIER_VERSION,COLLECTION_VERSION,VERIFIER_PROFILE_VERSION} from '../../analytics/.test-dist/versions.js';
const [output]=process.argv.slice(2);assert.ok(output,'Provide a new catalogue-audit output');
const names=[...KNOWN_AGENT_NAMES].sort();assert.equal(new Set(names).size,names.length);
for(const method of [...VENDOR_IP_SOURCES,...VENDOR_SIGNATURE_METHODS,...DIRECTORY_PUBLICATIONS]){
 assert.ok(method.declarations.length>0);for(const name of method.declarations)assert.ok(KNOWN_AGENT_NAMES.has(name),'Method references unknown declaration');
}
assert.equal(new Set(VENDOR_IP_SOURCES.map(s=>s.id)).size,VENDOR_IP_SOURCES.length);
const rows=names.map(name=>{
 const ip=VENDOR_IP_SOURCES.filter(s=>s.declarations.includes(name)),signed=VENDOR_SIGNATURE_METHODS.filter(s=>s.declarations.includes(name)),directories=DIRECTORY_PUBLICATIONS.filter(s=>s.declarations.includes(name));
 return {name,declaredRole:agentReaderKind(name),roleBasis:'declaration-catalogue',ipMethods:ip.map(s=>({source:s.id,documentation:s.documentation,feed:s.url})),documentedSigningMethods:signed.map(s=>({vendor:s.vendor,origin:s.origin,sources:s.sources})),reviewedDirectoryPublishers:directories.map(s=>({origin:s.origin,source:s.source})),methodCoverage:ip.length&&signed.length?'ip-and-signing':ip.length?'ip-only':signed.length?'signing-only':'no-configured-per-declaration-method'};
});
const count=f=>rows.filter(f).length;
const sources=['classify.ts','readerkind.ts','vendor-ip-sources.ts','vendor-signatures.ts','directory-publication.ts','signers.ts','classification-evidence.ts','client-form.ts','calibration-evaluation.ts','versions.ts'];
const result={checkedAt:new Date().toISOString(),method:'Static source catalogue coverage, not request counts, feed freshness, vendor authenticity or detection accuracy. Reviewed directory publication and public display approvals are separate from per-client documented methods.',profiles:{collection:COLLECTION_VERSION,classifier:CLASSIFIER_VERSION,verifier:VERIFIER_PROFILE_VERSION},counts:{recognizedDeclarations:rows.length,ipFeedSources:VENDOR_IP_SOURCES.length,declarationsWithConfiguredIpMethod:count(r=>r.ipMethods.length>0),documentedSigningOrigins:VENDOR_SIGNATURE_METHODS.length,declarationsWithDocumentedSigningMethod:count(r=>r.documentedSigningMethods.length>0),declarationsWithAnyConfiguredPerDeclarationMethod:count(r=>r.ipMethods.length+r.documentedSigningMethods.length>0),declarationsWithoutConfiguredPerDeclarationMethod:count(r=>r.ipMethods.length+r.documentedSigningMethods.length===0),reviewedDirectoryOrigins:DIRECTORY_PUBLICATIONS.length,declarationsWithReviewedDirectoryPublisher:count(r=>r.reviewedDirectoryPublishers.length>0),publicDisplayApprovals:PUBLIC_SIGNERS.length},sourceSha256:Object.fromEntries(sources.map(name=>[name,createHash('sha256').update(readFileSync('packages/analytics/src/'+name)).digest('hex')])),rows,productionRequests:0,d1Statements:0,externalRequests:0,limits:['A missing configured method is not proof the vendor publishes no method.','Method counts concern declarations, not independent vendors, requests or people.','Reviewed directories and display approvals do not create per-client signing promises.','Generic key verification can work outside these vendor maps; it does not establish a reviewed operator.','Documented roles do not establish request trigger, unique action or readership.']};
assert.equal(result.counts.declarationsWithAnyConfiguredPerDeclarationMethod+result.counts.declarationsWithoutConfiguredPerDeclarationMethod,rows.length);
writeFileSync(output,JSON.stringify(result,null,2)+'\n',{mode:0o600,flag:'wx'});console.log(JSON.stringify(result.counts));
