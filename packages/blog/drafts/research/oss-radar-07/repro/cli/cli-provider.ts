import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ApiProvider, ProviderResponse } from 'promptfoo';
import { object, parseJson, sha256 } from '../capture/capture-provider.ts';

export type Client = 'codex' | 'claude';

export function cliProvider(client: Client, directory: string): ApiProvider {
  let invoked = false;
  return {
    id: () => `subscription-cli:${client}`,
    async callApi(prompt, context): Promise<ProviderResponse> {
      if (invoked) throw new Error('One CLI invocation per provider; automatic resampling is disabled');
      invoked = true;
      const workdir = join(directory, client, 'workspace');
      await mkdir(workdir, { recursive: true });
      const prefix = join(directory, client);
      const answerPath = join(prefix, 'answer.md');
      const args = client === 'codex'
        ? ['exec', '--ignore-user-config', '--skip-git-repo-check', '--sandbox', 'read-only',
          '-c', 'approval_policy="never"', '-c', 'web_search="live"', '--json',
          '--output-last-message', answerPath, '-C', workdir, '-']
        : ['-p', '--output-format', 'stream-json', '--verbose', '--safe-mode',
          '--tools', 'WebFetch,WebSearch', '--allowedTools', 'WebFetch,WebSearch',
          '--permission-mode', 'dontAsk', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--no-chrome'];
      const env = { ...process.env };
      const excludedEnvironment = ['OPENAI_API_KEY', 'CODEX_API_KEY', 'OPENAI_BASE_URL',
        'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_OAUTH_TOKEN'];
      for (const key of excludedEnvironment) delete env[key];
      const startedAt = new Date().toISOString();
      const identity = { client, startedAt, evaluationId: context?.evaluationId ?? null,
        testCaseId: context?.testCaseId ?? null, traceparent: context?.traceparent ?? null };
      await writeFile(join(prefix, 'prompt.txt'), prompt, { flag: 'wx' });
      await writeFile(join(prefix, 'launch.json'), JSON.stringify({ ...identity, command: client,
        args, workdir, excludedEnvironment, timeoutMs: 420_000, promptSha256: sha256(prompt),
        modelSelection: 'CLI default; no model override', retries: 'No wrapper retries; internal CLI requests are separate',
      }, null, 2) + '\n', { flag: 'wx' });
      process.stdout.write(`Launching ${client} at ${startedAt}\n`);
      const stdoutFile = createWriteStream(join(prefix, 'stdout.jsonl'), { flags: 'wx', mode: 0o600 });
      const stderrFile = createWriteStream(join(prefix, 'stderr.txt'), { flags: 'wx', mode: 0o600 });
      const child = spawn(client, args, { cwd: workdir, env, stdio: ['pipe', 'pipe', 'pipe'] });
      let spawnError: string | null = null;
      let timedOut = false;
      child.stdout.pipe(stdoutFile);
      child.stderr.pipe(stderrFile);
      const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, 420_000);
      child.on('error', error => { spawnError = error.message; });
      child.stdin.on('error', () => { /* Exit state and stderr retain an early CLI failure. */ });
      child.stdin.end(prompt);
      const exit = await new Promise<{ code: number | null; signal: string | null }>(resolve => {
        child.on('close', (code, signal) => resolve({ code, signal }));
      });
      clearTimeout(timeout);
      await Promise.all([stdoutFile, stderrFile].map(stream => stream.writableFinished
        ? Promise.resolve() : new Promise<void>((resolve, reject) => { stream.on('finish', resolve); stream.on('error', reject); })));
      const raw = await readFile(join(prefix, 'stdout.jsonl'), 'utf8');
      const stderr = await readFile(join(prefix, 'stderr.txt'), 'utf8');
      const records = raw.split('\n').filter(Boolean).map(line => {
        try { return parseJson(line); } catch { return { unparsedLine: line }; }
      }).filter(object);
      const result = records.findLast(record => record.type === (client === 'claude' ? 'result' : 'turn.completed'));
      let answer = '';
      if (client === 'codex') {
        try { answer = await readFile(answerPath, 'utf8'); } catch { /* Failed runs need not produce an answer. */ }
      } else if (typeof result?.result === 'string') {
        answer = result.result;
        await writeFile(answerPath, answer, { flag: 'wx' });
      }
      const outcome = exit.code !== 0 || timedOut || spawnError || result?.is_error === true
        ? 'cli-error' : answer ? 'answer' : 'missing-answer';
      const evidence = { ...identity, finishedAt: new Date().toISOString(), exit, timedOut, spawnError, outcome,
        captureOrigin: 'Official CLI stdout JSONL and final answer; not a raw model-service HTTP response',
        stdoutSha256: sha256(raw), stderrSha256: sha256(stderr), answerSha256: sha256(answer),
        promptSha256: sha256(prompt), eventCount: records.length,
        exposedResult: result ?? null,
        citationRepresentation: 'Inspect original answer markers/links and CLI events; no invented API citation array',
        charge: { state: 'Subscription-authenticated CLI; no invoice reconciliation. Any CLI cost is reported usage, not an observed charge.' },
      };
      await writeFile(join(prefix, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });
      process.stdout.write(`Finished ${client}: ${outcome}, ${records.length} CLI events\n`);
      return outcome === 'answer' ? { output: answer, raw, metadata: { evidence } }
        : { error: `${client}: ${outcome}`, raw, metadata: { evidence } };
    },
  };
}
