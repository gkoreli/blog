import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { z } from 'zod/v4';

/**
 * Research footprint for a Claude Code session tree.
 *
 * Claude Code writes one JSONL per session at
 *   ~/.claude/projects/<project>/<sessionId>.jsonl
 * and one per spawned subagent at
 *   ~/.claude/projects/<project>/<sessionId>/subagents/agent-<id>.jsonl
 *
 * Every assistant API message is written as several JSONL records (one per
 * content block, sharing `message.id` and `requestId`), and each record repeats
 * the message's cumulative `usage`. The rule here: one usage per distinct
 * `message.id`, taken from the last record that carries it. Input is
 * normalized as input_tokens + cache_read_input_tokens + cache_creation_input_tokens,
 * so cached input is a subset of public input; reasoning output is
 * output_tokens_details.thinking_tokens and is a subset of output.
 */

interface Args {
  rootLog: string;
  researchDir: string;
  promptsFile: string;
  artifactsFile: string;
  outputFile: string | undefined;
}

interface TokenUsage {
  inputTokens: number;
  nonCachedInputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
}

interface SessionRecord {
  id: string;
  parentId?: string;
  agentPath: string;
  cwd: string;
  startedAt: string;
  logPath: string;
  logBytes: number;
  usageLine: number;
  usageAt: string;
  prefixSha256: string;
  responseCount: number;
  recordCount: number;
  usage: TokenUsage;
}

const nonNegativeInteger = z.number().int().nonnegative();
const timestampedSchema = z.looseObject({
  timestamp: z.string(),
  sessionId: z.string().optional(),
  cwd: z.string().optional(),
});
const assistantSchema = z.looseObject({
  type: z.literal('assistant'),
  timestamp: z.string(),
  message: z.looseObject({
    id: z.string(),
    role: z.literal('assistant'),
    usage: z.looseObject({
      input_tokens: nonNegativeInteger,
      output_tokens: nonNegativeInteger,
      cache_read_input_tokens: nonNegativeInteger.default(0),
      cache_creation_input_tokens: nonNegativeInteger.default(0),
      output_tokens_details: z.looseObject({ thinking_tokens: nonNegativeInteger.default(0) }).optional(),
    }),
  }),
});

function usage(): never {
  throw new Error('Usage: tsx scripts/claude-research-footprint.ts --root-log <path> --research-dir <path> --prompts-file <path> --artifacts-file <path> [--output <path>]');
}

function parseArgs(values: string[]): Args {
  const options = new Map<string, string>();
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || !value) usage();
    options.set(key, value);
  }
  const rootLog = options.get('--root-log');
  const researchDir = options.get('--research-dir');
  const promptsFile = options.get('--prompts-file');
  const artifactsFile = options.get('--artifacts-file');
  const outputFile = options.get('--output');
  if (!rootLog || !researchDir || !promptsFile || !artifactsFile) usage();
  return {
    rootLog: resolve(rootLog),
    researchDir: resolve(researchDir),
    promptsFile: resolve(promptsFile),
    artifactsFile: resolve(artifactsFile),
    outputFile: outputFile ? resolve(outputFile) : undefined,
  };
}

function emptyUsage(): TokenUsage {
  return { inputTokens: 0, nonCachedInputTokens: 0, cachedInputTokens: 0, cacheWriteInputTokens: 0, outputTokens: 0, reasoningOutputTokens: 0, totalTokens: 0 };
}

function addUsage(sum: TokenUsage, value: TokenUsage): TokenUsage {
  return {
    inputTokens: sum.inputTokens + value.inputTokens,
    nonCachedInputTokens: sum.nonCachedInputTokens + value.nonCachedInputTokens,
    cachedInputTokens: sum.cachedInputTokens + value.cachedInputTokens,
    cacheWriteInputTokens: sum.cacheWriteInputTokens + value.cacheWriteInputTokens,
    outputTokens: sum.outputTokens + value.outputTokens,
    reasoningOutputTokens: sum.reasoningOutputTokens + value.reasoningOutputTokens,
    totalTokens: sum.totalTokens + value.totalTokens,
  };
}

function normalize(raw: z.infer<typeof assistantSchema>['message']['usage']): TokenUsage {
  const nonCachedInputTokens = raw.input_tokens;
  const cachedInputTokens = raw.cache_read_input_tokens;
  const cacheWriteInputTokens = raw.cache_creation_input_tokens;
  const outputTokens = raw.output_tokens;
  const reasoningOutputTokens = raw.output_tokens_details?.thinking_tokens ?? 0;
  const inputTokens = nonCachedInputTokens + cachedInputTokens + cacheWriteInputTokens;
  if (reasoningOutputTokens > outputTokens) throw new Error('Claude token arithmetic failed: reasoning output > output');
  return { inputTokens, nonCachedInputTokens, cachedInputTokens, cacheWriteInputTokens, outputTokens, reasoningOutputTokens, totalTokens: inputTokens + outputTokens };
}

function readSession(logPath: string, parentId?: string): SessionRecord {
  const raw = readFileSync(logPath, 'utf8');
  const lines = raw.split('\n');
  let sessionId: string | undefined;
  let startedAt: string | undefined;
  let cwd: string | undefined;
  let usageAt: string | undefined;
  let usageLine = 0;
  let prefixEnd = 0;
  let byteOffset = 0;
  let recordCount = 0;
  const perMessage = new Map<string, TokenUsage>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    byteOffset += Buffer.byteLength(index < lines.length - 1 ? `${line}\n` : line);
    if (!line.trim()) continue;
    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSONL at ${logPath}:${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const stamped = timestampedSchema.safeParse(value);
    if (stamped.success) {
      if (!startedAt) startedAt = stamped.data.timestamp;
      if (!sessionId && stamped.data.sessionId) sessionId = stamped.data.sessionId;
      if (!cwd && stamped.data.cwd) cwd = stamped.data.cwd;
    }
    const assistant = assistantSchema.safeParse(value);
    if (!assistant.success) continue;
    perMessage.set(assistant.data.message.id, normalize(assistant.data.message.usage));
    recordCount += 1;
    usageLine = index + 1;
    prefixEnd = byteOffset;
    usageAt = assistant.data.timestamp;
  }

  if (!sessionId || !startedAt || !cwd) throw new Error(`No Claude Code session metadata in ${logPath}`);
  if (!usageAt || perMessage.size === 0) throw new Error(`No assistant usage records in ${logPath}`);

  let total = emptyUsage();
  for (const value of perMessage.values()) total = addUsage(total, value);

  return {
    id: parentId ? basename(logPath, '.jsonl') : sessionId,
    ...(parentId ? { parentId } : {}),
    agentPath: parentId ? basename(logPath, '.jsonl') : '/root',
    cwd,
    startedAt,
    logPath,
    logBytes: statSync(logPath).size,
    usageLine,
    usageAt,
    prefixSha256: createHash('sha256').update(raw.slice(0, prefixEnd)).digest('hex'),
    responseCount: perMessage.size,
    recordCount,
    usage: total,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const root = readSession(args.rootLog);
  const agentDirectory = resolve(args.rootLog.replace(/\.jsonl$/, ''), 'subagents');
  const agentLogs = existsSync(agentDirectory)
    ? readdirSync(agentDirectory, { withFileTypes: true })
      .filter(entry => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map(entry => resolve(agentDirectory, entry.name))
      .sort()
    : [];
  const sessions = [root, ...agentLogs.map(path => readSession(path, root.id))];

  const totals = sessions.reduce((sum, session) => addUsage(sum, session.usage), emptyUsage());
  const measuredAt = sessions.reduce((latest, session) => (new Date(session.usageAt) > new Date(latest) ? session.usageAt : latest), root.usageAt);
  const wallClockMinutes = Math.ceil((new Date(measuredAt).getTime() - new Date(root.startedAt).getTime()) / 60_000);
  const promptCount = readFileSync(args.promptsFile, 'utf8').split(/^---$/m).map(part => part.trim()).filter(Boolean).length;
  const artifactPaths = readFileSync(args.artifactsFile, 'utf8').split('\n').map(path => path.trim()).filter(path => path && !path.startsWith('#'));
  const repositoryRoot = execFileSync('git', ['-C', args.researchDir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const committedArtifacts = artifactPaths.filter(path => {
    try {
      execFileSync('git', ['-C', repositoryRoot, 'cat-file', '-e', `HEAD:${path}`], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });

  const result = {
    rulesVersion: 1,
    format: 'claude-code-per-message-v1',
    rootSession: root.id,
    startedAt: root.startedAt,
    measuredAt,
    wallClockMinutes,
    sessionCount: sessions.length,
    promptCount,
    artifactCount: artifactPaths.length,
    committedArtifactCount: committedArtifacts.length,
    uncommittedArtifactCount: artifactPaths.length - committedArtifacts.length,
    totals,
    trustBoundary: 'Claude Code writes each assistant API message as several JSONL records sharing message.id, each repeating the message usage. One usage is counted per distinct message.id (last record wins), normalized so cached and cache-write input are a subset of public input, then summed once per included root or subagent log. Private logs are not committed; prefix hashes commit to the measured private bytes.',
    sessions: sessions.map(session => ({
      id: session.id,
      parentId: session.parentId ?? null,
      agentPath: session.agentPath,
      startedAt: session.startedAt,
      cwd: session.cwd,
      log: relative(dirname(args.rootLog), session.logPath),
      logBytes: session.logBytes,
      responseCount: session.responseCount,
      recordCount: session.recordCount,
      usageLine: session.usageLine,
      usageAt: session.usageAt,
      prefixSha256: session.prefixSha256,
      usage: session.usage,
    })),
    artifacts: artifactPaths,
    researchDirectory: relative(repositoryRoot, args.researchDir),
    promptsFile: relative(repositoryRoot, args.promptsFile),
  };

  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (args.outputFile) {
    writeFileSync(args.outputFile, serialized);
    console.log(`Wrote Claude Code research footprint to ${args.outputFile}`);
  } else {
    console.log(serialized);
  }
}

main();
