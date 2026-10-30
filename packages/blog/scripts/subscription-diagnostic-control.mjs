import assert from 'node:assert/strict';
import {captureSubscriptionError} from '../../client-observability/src/subscription-evidence.ts';

/** Build statements only. Running or archiving a production control needs a separate frozen plan. */
export function subscriptionDiagnosticControl(reference,occurredAt){
  assert.ok(typeof reference==='string'&&reference.length===32&&/^[0-9a-f]{32}$/.test(reference));
  assert.ok(typeof occurredAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(occurredAt));
  assert.equal(new Date(occurredAt).toISOString(),occurredAt);
  const message='subscribe_diagnostic_control:'+reference;
  const evidence=captureSubscriptionError('idle',{errorCode:'200500'});
  const payload={type:'interaction_error',component:'subscribe_form',message,path:'/owner',occurredAt,
    subscriptionEvidence:{...evidence,extra:'discarded-control-detail'}};
  const targets=`WITH targets AS MATERIALIZED (
 SELECT id,occurred_at,created_at,subscription_evidence
 FROM client_errors INDEXED BY idx_client_errors_path
 WHERE path='/owner' AND component='subscribe_form' AND type='interaction_error'
 AND message='${message}' LIMIT 2
)`;
  const readSql=targets+` SELECT COUNT(*) AS matches,MIN(occurred_at) AS occurredAt,
 MIN(created_at) AS ingestedAt,MIN(subscription_evidence) AS evidence FROM targets;\n`;
  // Clean up an owned marker even when metadata is wrong or absent. Never select by prefix,
  // and never delete either candidate when the marker has become ambiguous.
  const cleanupSql=targets+` DELETE FROM client_errors
 WHERE id=(SELECT CASE WHEN COUNT(*)=1 THEN MIN(id) ELSE NULL END FROM targets)
 RETURNING 1 AS removed;\n`;
  const headers={'content-type':'application/json',origin:'https://gkoreli.com'};
  return{reference,message,payload,evidence,headers,readSql,cleanupSql};
}

export function validateControlReadback(rows,control){
  assert.ok(Array.isArray(rows)&&rows.length===1);
  const row=rows[0];assert.ok(row!==null&&typeof row==='object'&&!Array.isArray(row));
  assert.deepEqual(Object.keys(row).sort(),['matches','occurredAt','ingestedAt','evidence'].sort());
  assert.ok(row.matches===0||row.matches===1,'Missing or ambiguous controlled-record identity');
  if(row.matches===0){
    assert.equal(row.occurredAt,null);assert.equal(row.ingestedAt,null);assert.equal(row.evidence,null);
    return{state:'absent',rows:0};
  }
  assert.equal(row.occurredAt,control.payload.occurredAt);
  assert.ok(typeof row.ingestedAt==='string'&&/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.ingestedAt));
  assert.equal(new Date(row.ingestedAt.replace(' ','T')+'Z').toISOString().slice(0,19).replace('T',' '),row.ingestedAt);
  assert.ok(typeof row.evidence==='string'&&row.evidence.length<=512);
  assert.deepEqual(JSON.parse(row.evidence),control.evidence);
  return{state:'matched',rows:1,occurredAt:row.occurredAt,ingestedAt:row.ingestedAt,evidence:control.evidence};
}

export function validateControlCleanup(rows){
  assert.deepEqual(rows,[{removed:1}]);
  return{removedRows:1};
}
