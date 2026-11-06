import assert from 'node:assert/strict';
import test from 'node:test';
import {homeMarkdown} from '../src/templates/home-markdown.ts';

test('homepage Markdown preserves the featured selection and ordered article inventory',()=>{
 const posts=[{slug:'latest',title:'Latest [case]',description:'Current *evidence*',featured:false},{slug:'featured',title:'Featured',description:'Owned result',featured:true},{slug:'older',title:'Older',description:'Earlier result',featured:false}];
 const result=homeMarkdown(posts);
 assert.ok(result.includes('## Featured\n\n- [Featured](/featured)'));
 assert.ok(result.indexOf('(/latest)')<result.indexOf('(/older)'));
 assert.equal(result.split('(/featured)').length,2);
 assert.ok(result.includes('Latest \\[case\\]'));
 assert.ok(result.includes('[Free engineering tools](/tools)'));
 assert.match(homeMarkdown([]),/## Latest/);
});
