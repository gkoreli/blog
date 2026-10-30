import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {subscriptionDiagnosticControl,validateControlReadback,validateControlCleanup} from '../scripts/subscription-diagnostic-control.mjs';

test('diagnostic control cleanup needs one exact owned marker and refuses ambiguous or adjacent rows',t=>{
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 for(const name of ['0001_create_client_errors.sql','0002_add_subscription_error_evidence.sql','0003_add_processing_evidence.sql'])db.exec(readFileSync(new URL('../../client-observability/migrations/'+name,import.meta.url),'utf8'));
 const control=subscriptionDiagnosticControl('a'.repeat(32),'2026-10-29T12:00:00.000Z');
 const read=()=>db.prepare(control.readSql).all().map(row=>({...row}));
 const cleanup=()=>db.prepare(control.cleanupSql).all().map(row=>({...row}));
 const insert=(id,patch={})=>{const row={id,type:'interaction_error',component:'subscribe_form',path:'/owner',message:control.message,occurred_at:control.payload.occurredAt,subscription_evidence:JSON.stringify(control.evidence),...patch};const names=Object.keys(row);db.prepare(`INSERT INTO client_errors(${names.join(',')})VALUES(${names.map(()=>'?').join(',')})`).run(...Object.values(row));};
 assert.equal(validateControlReadback(read(),control).state,'absent');assert.deepEqual(cleanup(),[]);
 insert('owned');
 for(const [id,patch]of [['prefix',{message:control.message+'x'}],['path',{path:'/other'}],['component',{component:'other'}],['type',{type:'window_error'}]])insert(id,patch);
 assert.equal(validateControlReadback(read(),control).state,'matched');
 assert.equal(validateControlCleanup(cleanup()).removedRows,1);
 assert.equal(validateControlReadback(read(),control).state,'absent');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM client_errors').get().n,4);
 insert('missing-metadata',{occurred_at:null,subscription_evidence:null});
 assert.throws(()=>validateControlReadback(read(),control));
 validateControlCleanup(cleanup());
 insert('duplicate-one');insert('duplicate-two');
 assert.throws(()=>validateControlReadback(read(),control));assert.deepEqual(cleanup(),[]);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM client_errors').get().n,6);
 for(const reference of ['bad','a'.repeat(33),'a'.repeat(32)+'\n',"a'"+'a'.repeat(30)]){assert.throws(()=>subscriptionDiagnosticControl(reference,control.payload.occurredAt));}
 assert.throws(()=>subscriptionDiagnosticControl('a'.repeat(32),'2026-02-30T00:00:00.000Z'));
 assert.throws(()=>validateControlCleanup([]));
});
