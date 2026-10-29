import assert from 'node:assert/strict';
import test from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {boundedJsonObjectSql} from '../.test-dist/sql-json.js';

test('bounded SQL JSON retains nulls, JSON types, key order and chunk boundaries',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  const values=[['NULL',null],["'null'",'null'],["json('true')",true],["json('[1,null]')",[1,null]],
   ["json('{\"nested\":null}')",{nested:null}],["'a,b''c'","a,b'c"],['0',0]];
  for(const count of [0,16,17,31,32,44,46,47,91]){
   const fields={},expected={};
   for(let i=0;i<count;i++){const [sql,value]=values[i%values.length];fields['field'+i]=sql;expected['field'+i]=value;}
   const row=db.prepare('SELECT '+boundedJsonObjectSql(fields)+' AS value').get();
   assert.deepEqual(JSON.parse(row.value),expected);assert.deepEqual(Object.keys(JSON.parse(row.value)),Object.keys(expected));
  }
  // Merge Patch is not equivalent: explicit JSON nulls remove object members.
  const row=db.prepare("SELECT json_patch(json_object('a',NULL),json_object('b',NULL)) AS value").get();
  assert.deepEqual(JSON.parse(row.value),{a:null});
 }finally{db.close()}
});

test('bounded SQL JSON rejects keys that would change its flat path or SQL grammar',()=>{
 for(const key of ['nested.value','array[0]',"x' OR 1=1 --",'quoted"key','']){
  assert.throws(()=>boundedJsonObjectSql({[key]:'NULL'}),/flat identifier/);
 }
});
