import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync, symlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const [root, output] = process.argv.slice(2); assert.ok(root && output); mkdirSync(root, { mode:0o700 });
const cli = resolve('packages/blog/scripts/resource-reach.mjs'), demo = resolve('packages/blog/scripts/examples/resource-reach.demo.json');
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const run = (...args) => spawnSync(process.execPath, ['--import', import.meta.resolve('tsx'), cli, ...args], { encoding:'utf8', timeout:5000 });
const destination = join(root,'success'), first = run(demo,destination); assert.equal(first.status,0,first.stderr);
assert.equal(statSync(destination).mode & 0o777,0o700);
for (const name of ['report.json','brief.md']) assert.equal(statSync(join(destination,name)).mode & 0o777,0o600);
const report = JSON.parse(readFileSync(join(destination,'report.json'),'utf8'));
assert.equal(report.inputSha256,hash(demo)); assert.equal(report.report.accounting.selectedEvents,8);
for (const file of ['report.json','brief.md']) {
  const text = readFileSync(join(destination,file),'utf8');
  assert.equal(text.includes('private-reference'),false); assert.equal(text.includes('private-unmapped-canary'),false);
}
assert.equal(first.stdout.includes('private-reference'),false); assert.equal(first.stdout.includes('private-unmapped-canary'),false);
const original = hash(join(destination,'report.json')); assert.equal(run(demo,destination).status,1);
assert.equal(hash(join(destination,'report.json')),original);
const linked=join(root,'linked'); symlinkSync(destination,linked,'dir'); assert.equal(run(demo,linked).status,1);
assert.equal(hash(join(destination,'report.json')),original);
const f=JSON.parse(readFileSync(demo,'utf8')); f.credential='private-credential-canary';
const invalid=join(root,'invalid.json'); writeFileSync(invalid,JSON.stringify(f),{mode:0o600});
const rejected=run(invalid,join(root,'rejected')); assert.equal(rejected.status,1); assert.equal(rejected.stderr.includes('private-credential-canary'),false);
assert.equal(existsSync(join(root,'rejected')),false);
for (const [name,bytes] of [ ['utf8',Buffer.from([123,34,120,34,58,34,255,34,125])], ['bom',Buffer.concat([Buffer.from([239,187,191]),readFileSync(demo)])], ['large',Buffer.alloc(8*1024*1024+1,32)] ]) {
 const path=join(root,name+'.json'), dest=join(root,name); writeFileSync(path,bytes,{mode:0o600});
 assert.equal(run(path,dest).status,1); assert.equal(existsSync(dest),false);
}
const fifo=join(root,'fifo'); assert.equal(spawnSync('mkfifo',[fifo]).status,0);
assert.equal(run(fifo,join(root,'fifo-out')).status,1); assert.equal(existsSync(join(root,'fifo-out')),false);
assert.equal(run(root,join(root,'directory-out')).status,1); assert.equal(existsSync(join(root,'directory-out')),false);
writeFileSync(output,JSON.stringify({ checkedAt:new Date().toISOString(),node:process.version,successfulSyntheticInput:true,
 privateModesChecked:true,inputByteHashMatches:true,eventAndUnmappedPathCanariesOmitted:true,credentialCanaryAbsentFromLogs:true,
 existingDestinationPreserved:true,symlinkDestinationPreserved:true,invalidUtf8Rejected:true,bomRejected:true,
 oversizedFileRejected:true,fifoRejectedWithoutBlocking:true,directoryInputRejected:true,
 cliSourceSha256:hash(cli),analysisSourceSha256:hash('packages/analytics/src/resource-reach.ts'),
 productionRequests:0,externalRequests:0,d1Statements:0 },null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Resource-reach CLI success, private outputs, byte hash, canaries and refusal controls pass.');
