import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { html } from '@nisli/core';
import { ROOT } from '../src/lib/paths.js';
import { renderContent } from '../src/lib/ssg.js';
import { clientDefines } from '../src/pipeline/client-mode.js';

test('browser builds enable Nisli development audits only in development', async () => {
  // Install the SSG test DOM; each bundle has its own independent Nisli runtime.
  await renderContent([html``]);
  const diagnostics = new Map<boolean, string[]>();
  for (const production of [false, true]) {
    const result = await build({
      stdin: {
        contents: 'import { html } from "@nisli/core"; html`<button @clik=${() => {}}>Test</button>`.mount(document.createElement("div"));',
        resolveDir: ROOT,
      },
      bundle: true,
      write: false,
      minify: true,
      format: 'iife',
      target: 'es2024',
      define: clientDefines(production),
    });
    const output = result.outputFiles[0];
    assert.ok(output);
    const messages: string[] = [];
    const previous = console.error;
    console.error = (message: unknown) => { messages.push(String(message)); };
    try {
      new Function(output.text)();
    } finally {
      console.error = previous;
    }
    diagnostics.set(production, messages);
  }
  assert.ok(diagnostics.get(false)?.some(message => message.includes('[nisli N102]')));
  assert.deepEqual(diagnostics.get(true), []);
});
