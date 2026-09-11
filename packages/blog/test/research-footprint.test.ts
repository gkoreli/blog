import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { z } from 'zod/v4';

test('mixed-session accounting includes recursive descendants once and dates the last usage, not the later freeze', () => {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'blog-footprint-')));
  try {
    const sessions = join(dir, 'sessions');
    const research = join(dir, 'research');
    mkdirSync(sessions);
    mkdirSync(research);
    writeFileSync(join(research, 'evidence.md'), '# Evidence\n');
    writeFileSync(join(dir, 'prompts.md'), 'one\n---\ntwo\n');
    execFileSync('git', ['init', '-q', dir]);
    execFileSync('git', ['-C', dir, 'add', '.']);
    execFileSync('git', ['-C', dir, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test',
      '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Fixture']);

    const usage = (input: number, output: number, timestamp = '2026-09-01T00:10:00.000Z') => ({
      type: 'event_msg', timestamp, payload: { type: 'token_count', info: { total_token_usage: {
        input_tokens: input, cached_input_tokens: Math.floor(input / 2), cache_write_input_tokens: 0,
        output_tokens: output, reasoning_output_tokens: 0, total_tokens: input + output,
      } } },
    });
    const codex = (id: string, parent: string | null, events: ReturnType<typeof usage>[],
      rootSource: 'exec' | { subagent: { other: 'guardian' } } = 'exec') => {
      const source = parent ? { subagent: { thread_spawn: { parent_thread_id: parent, agent_path: `/root/${id}` } } } : rootSource;
      const meta = { type: 'session_meta', payload: { id, timestamp: '2026-09-01T00:00:00.000Z', cwd: dir, source } };
      writeFileSync(join(sessions, `${id}.jsonl`), [meta, ...events].map(value => JSON.stringify(value)).join('\n') + '\n');
    };
    codex('root', null, [usage(100, 20), usage(200, 40), usage(40, 10)]);
    codex('child', 'root', [usage(70, 10)]);
    codex('grandchild', 'child', [usage(80, 20)]);
    codex('independent', null, [usage(50, 10)]);
    codex('unrelated', null, [usage(10_000, 100)]);
    const guardianSource = { subagent: { other: 'guardian' as const } };
    codex('guardian', null, [usage(30, 5), usage(60, 10)], guardianSource);
    codex('unselected-guardian', null, [usage(20_000, 200)], guardianSource);
    codex('guardian-without-usage', null, [], guardianSource);

    const claudePath = join(dir, 'claude.jsonl');
    const response = { type: 'assistant', timestamp: '2026-09-01T00:15:15.000Z', sessionId: 'claude', cwd: dir,
      message: { id: 'api-response', role: 'assistant', usage: { input_tokens: 5, cache_read_input_tokens: 30,
        cache_creation_input_tokens: 10, output_tokens: 12, output_tokens_details: { thinking_tokens: 4 } } } };
    writeFileSync(claudePath, [response, response].map(value => JSON.stringify(value)).join('\n') + '\n');
    const cliArgs = ['--import', 'tsx',
      fileURLToPath(new URL('../scripts/research-footprint.ts', import.meta.url)),
      '--sessions-root', sessions, '--research-dir', research, '--prompts-file', join(dir, 'prompts.md'),
    ];
    const stdout = execFileSync(process.execPath, [...cliArgs,
      '--root-thread', 'root', '--root-thread', 'independent', '--root-thread', 'guardian',
      '--claude-transcript', claudePath,
    ], { encoding: 'utf8' });
    const result = z.object({
      rulesVersion: z.number(), measuredAt: z.string(), frozenAt: z.string(), wallClockMinutes: z.number(),
      sessionCount: z.number(), promptCount: z.number(), artifactCount: z.number(), committedArtifactCount: z.number(),
      totals: z.object({ totalTokens: z.number(), reasoningOutputTokens: z.number() }),
      sessions: z.array(z.object({ id: z.string(), sourceId: z.string(), parentId: z.string().nullable(),
        agentPath: z.string(), usageEpochCount: z.number() })),
    }).parse(JSON.parse(stdout));
    assert.equal(result.rulesVersion, 4);
    assert.equal(result.measuredAt, response.timestamp);
    assert.ok(Date.parse(result.frozenAt) > Date.parse(result.measuredAt));
    assert.equal(result.wallClockMinutes, 16);
    assert.equal(result.sessionCount, 6);
    assert.equal(result.promptCount, 2);
    assert.equal(result.artifactCount, 1);
    assert.equal(result.committedArtifactCount, 1);
    assert.equal(result.totals.totalTokens, 657);
    assert.equal(result.totals.reasoningOutputTokens, 4);
    assert.equal(result.sessions.find(session => session.id === 'root')?.usageEpochCount, 2);
    assert.ok(result.sessions.some(session => session.id === 'grandchild'));
    assert.ok(!result.sessions.some(session => session.id === 'unrelated'));
    assert.deepEqual(result.sessions.filter(session => session.id === 'guardian'), [{
      id: 'guardian', sourceId: 'guardian', parentId: null, agentPath: '/guardian', usageEpochCount: 1,
    }]);
    assert.ok(!result.sessions.some(session => session.id === 'unselected-guardian'));
    assert.ok(!result.sessions.some(session => session.id === 'guardian-without-usage'));

    const missingUsage = spawnSync(process.execPath, [...cliArgs,
      '--root-thread', 'guardian-without-usage',
    ], { encoding: 'utf8' });
    assert.equal(missingUsage.status, 1);
    assert.match(missingUsage.stderr, /Included sessions missing cumulative token_count events: guardian-without-usage/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
