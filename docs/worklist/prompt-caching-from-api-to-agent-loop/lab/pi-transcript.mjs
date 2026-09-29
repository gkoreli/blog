// Execute upstream Pi's actual TypeScript source with Node 24 native type stripping.
// No provider, tokenizer, KV cache, SDK package, network, or model is involved.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const checkout = resolve(process.argv[2] ?? '/tmp/prompt-cache-harnesses-20260928/pi');
const expectedCommit = 'cb7969d212836b8939001dce159fbd2ed6ad395f';
const commit = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(commit, expectedCommit, 'Fixture requires the audited upstream commit');
const sourcePaths = ['packages/ai/src/utils/transcript.ts', 'packages/ai/src/utils/text.ts'];
assert.equal(execFileSync('git', ['-C', checkout, 'diff', 'HEAD', '--', ...sourcePaths], { encoding: 'utf8' }), '', 'Audited source files must be unmodified');
const source = await import(pathToFileURL(resolve(checkout, sourcePaths[0])).href);
const rendering = await import(pathToFileURL(resolve(checkout, sourcePaths[1])).href);

const originalHead = {
  role: 'system',
  content: 'You are a coding assistant.',
  sections: { output: 'Explain the result in English.' },
  timestamp: 0,
};
const user = { role: 'user', content: 'Explain this function.', timestamp: 1 };
const newSystemUpdate = {
  role: 'system',
  content: '',
  sections: { output: 'Explain the result in Spanish.' },
  timestamp: 2,
};
const baseline = { messages: [originalHead, user] };
const updated = { messages: [...baseline.messages, newSystemUpdate] };
const before = JSON.stringify(updated);
const preserved = source.resolveTranscript(updated, true);
const collapsed = source.resolveTranscript(updated, false);
const unspecified = source.resolveTranscript(updated, undefined);

assert.strictEqual(preserved, updated);
assert.deepEqual(preserved.messages.slice(0, baseline.messages.length), baseline.messages);
assert.strictEqual(preserved.messages[2], newSystemUpdate);
assert.equal(preserved.messages[0].sections.output, 'Explain the result in English.');
assert.deepEqual(collapsed.messages.map(message => message.role), ['system', 'user']);
assert.equal(collapsed.messages[0].sections.output, 'Explain the result in Spanish.');
assert.notDeepEqual(collapsed.messages[0], originalHead);
assert.strictEqual(collapsed.messages[1], user);
assert.deepEqual(unspecified, collapsed);
assert.equal(JSON.stringify(updated), before, 'Dispatch must not mutate the source transcript');
assert.equal(source.getCurrentSystemPrompt(preserved.messages), source.getCurrentSystemPrompt(collapsed.messages));

console.log(JSON.stringify({
  upstreamCommit: commit,
  runtime: process.version,
  passed: true,
  conditions: 'Actual pinned upstream pure functions; synthetic input; no dependencies installed or inference called.',
  baseline,
  supported: { transcript: preserved, renderedHead: rendering.getSystemMessageText(preserved.messages[0]), renderedUpdate: rendering.renderSystemMessageUpdate(preserved.messages[2]) },
  unsupported: { transcript: collapsed, renderedHead: rendering.getSystemMessageText(collapsed.messages[0]) },
  checks: {
    supportedKeepsOriginalPrefix: true,
    unsupportedRewritesHead: true,
    unspecifiedCapabilityAlsoCollapses: true,
    sourceTranscriptUnmodified: true,
    replayedCurrentSystemPromptMatches: true,
  },
  limits: 'Equal replayed current system text is not proof of equivalent model behavior. This tests transcript dispatch, not final provider serialization, cache hits, billed tokens, latency, or correctness.',
}, null, 2));
