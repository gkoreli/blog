import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createContext, SourceTextModule } from 'node:vm';
import { Window } from 'happy-dom';

const manifest = JSON.parse(await readFile('output/manifest.json', 'utf8'));
const results = [];
for (const row of manifest) {
  const window = new Window();
  const codes = [];
  window.document.body.innerHTML = '<div id="app"></div>';
  const globals = ['document', 'customElements', 'HTMLElement', 'Element', 'Node', 'Text', 'Comment', 'DocumentFragment', 'HTMLTemplateElement', 'MutationObserver', 'Event', 'EventTarget'];
  const sandbox = Object.fromEntries(globals.map(name => [name, window[name]]));
  Object.assign(sandbox, {
    queueMicrotask,
    setTimeout,
    clearTimeout,
    console: {
      error(...args) {
        codes.push(...Array.from(String(args[0]).matchAll(/\[nisli (N\d+)\]/g), match => match[1]));
      },
      log() {},
      warn() {},
    },
  });
  const context = createContext(sandbox);
  const module = new SourceTextModule(await readFile(`output/${row.name}.js`, 'utf8'), {
    context,
    identifier: `${row.name}.js`,
  });
  await module.link(() => { throw new Error('Unexpected external import'); });
  assert.equal('process' in sandbox, false, 'The test must model a browser, not Node NODE_ENV');
  await module.evaluate();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(codes.includes('N102'), row.expectedN102, `${row.name}: diagnostic behavior`);
  const button = window.document.querySelector('#counter');
  assert.ok(button, `${row.name}: counter mounted`);
  assert.equal(button.textContent, 'Count: 0');
  button.click();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(button.textContent, 'Count: 1', `${row.name}: interactivity preserved`);
  if (row.core === '0.56.0') {
    assert.ok(row.templateAuditMinifiedBytes > 0, `${row.name}: audit module retention`);
    assert.equal(row.containsN102, true, `${row.name}: N102 code retention`);
  }
  results.push({ ...row, observedCodes: codes, counterAfterClick: button.textContent, passed: true });
  await window.happyDOM.close();
}
await writeFile('output/results.json', JSON.stringify({ node: process.version, zlib: process.versions.zlib, platform: process.platform, arch: process.arch, results }, null, 2) + '\n');
console.table(results.map(({ name, observedCodes, counterAfterClick, passed }) => ({ name, codes: observedCodes.join(',') || '(none)', counterAfterClick, passed })));
console.log('All diagnostic, byte-retention, and counter-interaction assertions passed.');
