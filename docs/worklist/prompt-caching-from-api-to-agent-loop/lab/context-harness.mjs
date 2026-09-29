// Run pinned upstream context functions; no inference, package install or network.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { extname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const piRoot = realpathSync(resolve(process.argv[2] ?? '/tmp/prompt-cache-harnesses-20260928/pi'));
const ompRoot = realpathSync(resolve(process.argv[3] ?? '/tmp/prompt-cache-harnesses-20260928/omp'));
const piCommit = 'cb7969d212836b8939001dce159fbd2ed6ad395f';
const ompCommit = 'd1932a6ff85613dde1160b87a73ddcdc3beb01f6';
function checkSource(root, commit, files) {
  assert.equal(execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), commit);
  assert.equal(execFileSync('git', ['-C', root, 'diff', 'HEAD', '--', ...files], { encoding: 'utf8' }), '');
}
checkSource(piRoot, piCommit, ['packages/agent/src/harness/session/context.ts', 'packages/agent/src/harness/messages.ts']);
checkSource(ompRoot, ompCommit, ['packages/agent/src/compaction/shake.ts', 'packages/agent/src/compaction/message-cache.ts', 'packages/agent/src/compaction/tool-protection.ts']);

// OMP's source uses extensionless relative imports. Resolve those imports to the
// same unmodified .ts files; this hook changes module resolution, not functions.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.startsWith(pathToFileURL(ompRoot + '/').href)
        && (specifier.startsWith('./') || specifier.startsWith('../')) && !extname(specifier)) {
      const target = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(target))) return nextResolve(target.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const pi = await import(pathToFileURL(resolve(piRoot, 'packages/agent/src/harness/session/context.ts')).href);
const piMessages = await import(pathToFileURL(resolve(piRoot, 'packages/agent/src/harness/messages.ts')).href);
const shake = await import(pathToFileURL(resolve(ompRoot, 'packages/agent/src/compaction/shake.ts')).href);
const messageCache = await import(pathToFileURL(resolve(ompRoot, 'packages/agent/src/compaction/message-cache.ts')).href);

function entry(id, message) {
  return { id, parentId: null, seq: 0, timestamp: 0, type: 'message', message };
}
const oldTool = entry('old-output', { role: 'toolResult', toolCallId: 'call-old', toolName: 'read', content: [{ type: 'text', text: 'Release flag is enabled. Raw log detail.' }], isError: false, timestamp: 0 });
const recentUser = { role: 'user', content: 'Now check the release.', timestamp: 1 };
const suppliedSummary = 'The earlier tool output said the release flag is enabled.';
const checkpoint = { id: 'checkpoint', parentId: 'old-output', seq: 1, timestamp: 2, type: 'compaction', summary: suppliedSummary, retainedTail: [recentUser], tokensBefore: 1234, fromHook: false };
const after = entry('new-request', { role: 'user', content: 'What did the earlier tool establish?', timestamp: 3 });
const history = [oldTool, checkpoint, after];
const projected = await pi.buildSessionContext(history, undefined, {});
const projectedWithoutOriginal = await pi.buildSessionContext([checkpoint, after], undefined, {});
assert.deepEqual(projected.map(message => message.role), ['compactionSummary', 'user', 'user']);
assert.deepEqual(projected, projectedWithoutOriginal);
assert.equal(projected[0].summary, suppliedSummary);
assert(!projected.some(message => message.role === 'toolResult'));
assert.equal(history.length, 3, 'Projection does not delete stored entries');
const modelMessages = piMessages.convertToLlm(projected);
assert(JSON.stringify(modelMessages).includes('release flag is enabled'));

const originalText = 'Release flag is enabled. ' + 'trace line without new facts. '.repeat(24);
const image = { type: 'image', mimeType: 'image/png', data: 'synthetic-image-not-decoded' };
const oldCall = entry('old-call', { role: 'assistant', content: [{ type: 'toolCall', id: 'call-old', name: 'read', arguments: { path: 'release.log' } }], timestamp: 0 });
const removable = entry('old-result', { role: 'toolResult', toolCallId: 'call-old', toolName: 'read', content: [{ type: 'text', text: originalText }, image, { type: 'text', text: 'Second text block.' }], isError: false, timestamp: 0 });
const derivedFact = entry('derived', { role: 'assistant', content: [{ type: 'text', text: 'The release flag is enabled, according to the log.' }], timestamp: 0 });
const skill = entry('skill-result', { role: 'toolResult', toolCallId: 'skill-call', toolName: 'skill', content: [{ type: 'text', text: 'Keep these instructions. '.repeat(20) }], timestamp: 0 });
const liveUser = entry('recent-user', { role: 'user', content: 'Check the current state. '.repeat(20), timestamp: 0 });
const newest = entry('new-result', { role: 'toolResult', toolCallId: 'new-call', toolName: 'read', content: [{ type: 'text', text: 'Current output must stay in view. '.repeat(10) }], timestamp: 0 });
const entries = [oldCall, removable, derivedFact, skill, liveUser, newest];
// Deliberately deterministic estimator, not a provider tokenizer. This isolates
// region selection, mutation and invalidation from model-specific token counts.
const countTokens = input => Math.ceil((Array.isArray(input) ? input.join('\n') : input).length / 4);
const tokenizer = { countTokens, countMessage: message => countTokens(JSON.stringify(message)) };
const config = { protectTokens: 40, minSavings: 0, protectedTools: ['skill'], fenceMinTokens: 400 };
const regions = shake.collectShakeRegions(entries, tokenizer, config);
assert.deepEqual(regions.map(region => region.entry.id), ['old-result']);
const boundaryRegions = shake.collectShakeRegions(entries, tokenizer, { ...config, keepBoundaryId: 'derived' });
assert.deepEqual(boundaryRegions, [], 'Already summarized-away source is skipped');
const before = structuredClone(entries);
const oldVersion = messageCache.messageEstimateVersion(removable.message);
let invalidations = 0;
const unregister = messageCache.registerMessageCacheInvalidator(message => {
  assert.strictEqual(message, removable.message);
  invalidations++;
});
// No artifact is written by this pure layer; use an honest fixture placeholder.
const replacement = '[Earlier tool text removed by the local fixture]';
shake.applyShakeRegions(regions.map(region => ({ region, replacement })));
unregister();
assert.deepEqual(removable.message.content, [{ type: 'text', text: replacement }, image]);
assert.equal(messageCache.messageEstimateVersion(removable.message), oldVersion + 1);
assert.equal(invalidations, 1);
assert.equal(typeof removable.message.prunedAt, 'number');
assert.deepEqual(entries[0], before[0], 'Tool call remains');
assert.deepEqual(entries[2], before[2], 'Derived assistant statement remains');
assert.deepEqual(entries[3], before[3], 'Protected skill remains');
assert.deepEqual(entries[5], before[5], 'Recent result remains');
assert.deepEqual(shake.collectShakeRegions(entries, tokenizer, config), [], 'Already pruned result is skipped');

console.log(JSON.stringify({
  runtime: process.version,
  upstream: { pi: piCommit, omp: ompCommit },
  passed: true,
  pi: {
    scope: 'Pi agent-library session projection; not the coding-agent CLI session-manager path.',
    persistedEntryIds: history.map(item => item.id),
    projectedRoles: projected.map(message => message.role),
    projectedSummary: projected[0].summary,
    modelMessages,
    originalRemovedFromActiveContext: true,
    removingOriginalDoesNotEraseDerivedSummary: true,
    suppliedSummary: true,
  },
  omp: {
    scope: 'Actual pure shake selection/mutation; caller persistence, artifact storage, model and provider not executed.',
    estimator: 'ceil(characters / 4); supplied fixture estimator, not upstream tokenization',
    config,
    selectedIds: regions.map(region => region.entry.id),
    keepBoundarySkipsOlderResult: true,
    beforeToolContent: before[1].message.content,
    afterToolContent: removable.message.content,
    retainedDerivedStatement: derivedFact.message.content,
    preservedToolCall: true,
    preservedNonTextContent: true,
    protectedSkillUnchanged: true,
    recentToolResultUnchanged: true,
    localEstimateVersion: messageCache.messageEstimateVersion(removable.message),
    localConversionInvalidationCallbacks: invalidations,
  },
  limits: 'No provider KV cache or billing measurement. No summary generated by a model. Content removal is not proof of erasure of derived facts or better task quality.',
}, null, 2));
