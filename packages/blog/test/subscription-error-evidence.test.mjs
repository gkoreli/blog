import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {captureSubscriptionError,parseSubscriptionErrorEvidence} from '../../client-observability/src/subscription-evidence.ts';
import {parseClientErrorPayload} from '../../client-observability/src/schema.ts';
import {defaultRedact} from '../../client-observability/src/redact.ts';
import {recordClientError} from '../../client-observability/src/db.ts';
import {handleClientError} from '../../client-observability/src/server.ts';

const base={type:'interaction_error',component:'subscribe_form',message:'subscribe_widget_error',path:'/fixture',occurredAt:'2026-10-05T12:34:56.000Z'};
const bounded=captureSubscriptionError('verifying',{errorCode:'110100'});

function fixture(t){
  const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
  const migration=name=>sqlite.exec(readFileSync(new URL('../../client-observability/migrations/'+name,import.meta.url),'utf8'));
  migration('0001_create_client_errors.sql');
  const DB={prepare(sql){return{bind(...values){return{async run(){sqlite.prepare(sql).run(...values);return{success:true,meta:{}};}};}};}};
  return{sqlite,DB,migrate:()=>migration('0002_add_subscription_error_evidence.sql')};
}

function serverEvent(payload,id='fixture-event'){
  const parsed=parseClientErrorPayload(payload);assert.ok(parsed);
  return {...parsed,id,ray:null,country:null,colo:null,asOrganization:null};
}

test('provider code capture bounds syntax and preserves unknown numeric codes without a vendor verdict',()=>{
  for(const code of ['110100','200500','999999'])assert.deepEqual(captureSubscriptionError('idle',{errorCode:code}).turnstileError,{state:'bounded-code',code});
  assert.deepEqual(captureSubscriptionError('idle').turnstileError,{state:'not-applicable'});
  assert.deepEqual(captureSubscriptionError('idle',{errorCode:undefined}).turnstileError,{state:'not-provided'});
  for(const code of [null,'','110100\n','１１０１００','private-callback-text',110100,{},'1101000']){
    const evidence=captureSubscriptionError('idle',{errorCode:code});
    assert.deepEqual(evidence.turnstileError,{state:'invalid'});
    assert.ok(!JSON.stringify(evidence).includes('private-callback-text'));
  }
});

test('evidence parsing preserves absence, malformed values, unsupported profiles and unknown phase separately',()=>{
  assert.equal(parseSubscriptionErrorEvidence(undefined),undefined);
  for(const raw of [null,'private',[],{}, {state:'mystery'}])assert.deepEqual(parseSubscriptionErrorEvidence(raw),{state:'invalid'});
  assert.deepEqual(parseSubscriptionErrorEvidence({...bounded,profile:'future-profile',private:'discard'}),{state:'unsupported-profile'});
  assert.deepEqual(parseSubscriptionErrorEvidence({...bounded,phase:'unrecognized'}),{...bounded,phase:'unknown'});
  const cleaned=parseSubscriptionErrorEvidence({...bounded,private:'discard',turnstileError:{state:'bounded-code',code:'arbitrary-private-value'}});
  assert.deepEqual(cleaned,{...bounded,turnstileError:{state:'invalid'}});
  assert.ok(!JSON.stringify(cleaned).includes('private'));
  for(const value of [bounded,{state:'invalid'},{state:'unsupported-profile'}])assert.deepEqual(parseSubscriptionErrorEvidence(parseSubscriptionErrorEvidence(value)),parseSubscriptionErrorEvidence(value));
});

test('browser redaction and server parsing apply the same subscription-only evidence boundary',t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'location');
  Object.defineProperty(globalThis,'location',{configurable:true,value:{origin:'https://example.invalid'}});
  t.after(()=>{if(previous)Object.defineProperty(globalThis,'location',previous);else Reflect.deleteProperty(globalThis,'location');});
  for(const input of [bounded,{...bounded,turnstileError:{state:'bounded-code',code:'private-text'}},{...bounded,profile:'future'}]){
    const raw={...base,subscriptionEvidence:input};
    const redacted=defaultRedact(raw,{path:base.path,occurredAt:base.occurredAt});
    assert.ok(redacted);
    assert.deepEqual(redacted.subscriptionEvidence,parseClientErrorPayload(raw).subscriptionEvidence);
  }
  const padded={...base,component:' subscribe_form ',subscriptionEvidence:bounded};
  assert.deepEqual(defaultRedact(padded,{path:base.path,occurredAt:base.occurredAt}).subscriptionEvidence,bounded);
  assert.deepEqual(parseClientErrorPayload(padded).subscriptionEvidence,bounded);
  for(const patch of [{component:'other_component'},{type:'window_error'}]){
    const raw={...base,...patch,subscriptionEvidence:bounded};
    assert.equal(defaultRedact(raw,{path:base.path,occurredAt:base.occurredAt}).subscriptionEvidence,undefined);
    assert.equal(parseClientErrorPayload(raw).subscriptionEvidence,undefined);
  }
});

test('additive migration preserves legacy rows and new writes keep occurrence separate from ingestion',async t=>{
  const h=fixture(t);
  h.sqlite.prepare("INSERT INTO client_errors(id,type,message,path,component,created_at) VALUES('legacy','interaction_error','subscribe_widget_error','/fixture','subscribe_form','2026-10-01 00:00:00')").run();
  const before=h.sqlite.prepare("SELECT * FROM client_errors WHERE id='legacy'").get();
  h.migrate();
  const after=h.sqlite.prepare("SELECT * FROM client_errors WHERE id='legacy'").get();
  const{occurred_at,subscription_evidence,...oldFields}=after;
  assert.equal(occurred_at,null);assert.equal(subscription_evidence,null);assert.deepEqual(oldFields,{...before});
  await recordClientError(h.DB,serverEvent({...base,subscriptionEvidence:bounded}));
  const row=h.sqlite.prepare("SELECT occurred_at,created_at,subscription_evidence FROM client_errors WHERE id='fixture-event'").get();
  assert.equal(row.occurred_at,base.occurredAt);
  assert.notEqual(row.created_at,base.occurredAt);
  assert.deepEqual(JSON.parse(row.subscription_evidence),bounded);
  await recordClientError(h.DB,serverEvent(base,'older-client'));
  assert.equal(h.sqlite.prepare("SELECT subscription_evidence FROM client_errors WHERE id='older-client'").get().subscription_evidence,null);
});

test('storage rebuilds evidence even for a direct caller instead of persisting an arbitrary object',async t=>{
  const h=fixture(t);h.migrate();
  const event=serverEvent(base);
  event.subscriptionEvidence={...bounded,private:'never-store',turnstileError:{state:'bounded-code',code:'never-store'}};
  await recordClientError(h.DB,event);
  const row=h.sqlite.prepare('SELECT subscription_evidence FROM client_errors').get();
  assert.deepEqual(JSON.parse(row.subscription_evidence),{...bounded,turnstileError:{state:'invalid'}});
  assert.ok(!row.subscription_evidence.includes('never-store'));
});

test('actual ingestion retains bounded evidence, while unsupported or malformed evidence stays explicit',async t=>{
  const h=fixture(t);h.migrate();
  for(const evidence of [bounded,{...bounded,profile:'future'},null]){
    const response=await handleClientError(new Request('https://example.invalid/api/client-error',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...base,subscriptionEvidence:evidence})}),{DB:h.DB});
    assert.equal(response.status,204);
  }
  const rows=h.sqlite.prepare('SELECT occurred_at,subscription_evidence FROM client_errors ORDER BY rowid').all();
  assert.equal(rows.length,3);
  assert.deepEqual(rows.map(row=>JSON.parse(row.subscription_evidence)),[bounded,{state:'unsupported-profile'},{state:'invalid'}]);
  assert.ok(rows.every(row=>row.occurred_at===base.occurredAt));
});
