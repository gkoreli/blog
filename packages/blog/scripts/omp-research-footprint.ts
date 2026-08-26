import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
import { z } from 'zod/v4';

interface Args {
  rootLog: string;
  researchDir: string;
  promptsFile: string;
  artifactsFile: string;
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
  usage: TokenUsage;
}

const nonNegativeInteger = z.number().int().nonnegative();
const ompSessionSchema = z.looseObject({
  type: z.literal('session'),
  id: z.string(),
  timestamp: z.string(),
  cwd: z.string(),
});
const ompAssistantUsageSchema = z.looseObject({
  type: z.literal('message'),
  timestamp: z.string(),
  message: z.looseObject({
    role: z.literal('assistant'),
    usage: z.object({
      input: nonNegativeInteger,
      output: nonNegativeInteger,
      cacheRead: nonNegativeInteger.default(0),
      cacheWrite: nonNegativeInteger.default(0),
      totalTokens: nonNegativeInteger,
      reasoningTokens: nonNegativeInteger.default(0),
    }),
  }),
});

function usage(): never {
  throw new Error('Usage: tsx scripts/omp-research-footprint.ts --root-log <path> --research-dir <path> --prompts-file <path> --artifacts-file <path>');
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
  if (!rootLog || !researchDir || !promptsFile || !artifactsFile) usage();

  return {
    rootLog: resolve(rootLog),
    researchDir: resolve(researchDir),
    promptsFile: resolve(promptsFile),
    artifactsFile: resolve(artifactsFile),
  };
}


function emptyUsage(): TokenUsage {
  return {
    inputTokens: 0,
    nonCachedInputTokens: 0,
    cachedInputTokens: 0,
    cacheWriteInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens: 0,
  };
}

function addUsage(sum: TokenUsage, usage: TokenUsage): TokenUsage {
  return {
    inputTokens: sum.inputTokens + usage.inputTokens,
    nonCachedInputTokens: sum.nonCachedInputTokens + usage.nonCachedInputTokens,
    cachedInputTokens: sum.cachedInputTokens + usage.cachedInputTokens,
    cacheWriteInputTokens: sum.cacheWriteInputTokens + usage.cacheWriteInputTokens,
    outputTokens: sum.outputTokens + usage.outputTokens,
    reasoningOutputTokens: sum.reasoningOutputTokens + usage.reasoningOutputTokens,
    totalTokens: sum.totalTokens + usage.totalTokens,
  };
}

function parseResponseUsage(value: unknown): TokenUsage | null {
  const result = ompAssistantUsageSchema.safeParse(value);
  if (!result.success) return null;
  const raw = result.data.message.usage;

  const nonCachedInputTokens = raw.input;
  const cachedInputTokens = raw.cacheRead;
  const cacheWriteInputTokens = raw.cacheWrite;
  const outputTokens = raw.output;
  const reasoningOutputTokens = raw.reasoningTokens;
  const totalTokens = raw.totalTokens;
  const inputTokens = nonCachedInputTokens + cachedInputTokens + cacheWriteInputTokens;

  if (totalTokens !== inputTokens + outputTokens) {
    throw new Error(`OMP token arithmetic failed: ${totalTokens} != ${inputTokens} + ${outputTokens}`);
  }
  if (reasoningOutputTokens > outputTokens) {
    throw new Error('OMP token arithmetic failed: reasoning output > output');
  }

  return {
    inputTokens,
    nonCachedInputTokens,
    cachedInputTokens,
    cacheWriteInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens,
  };
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
  let responseCount = 0;
  let usageTotal = emptyUsage();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const lineWithEnding = index < lines.length - 1 ? `${line}\n` : line;
    byteOffset += Buffer.byteLength(lineWithEnding);
    if (!line.trim()) continue;

    let value: unknown;
    try {
      value = JSON.parse(line);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSONL at ${logPath}:${index + 1}: ${message}`);
    }

    const sessionResult = ompSessionSchema.safeParse(value);
    if (sessionResult.success && !sessionId) {
      sessionId = sessionResult.data.id;
      startedAt = sessionResult.data.timestamp;
      cwd = sessionResult.data.cwd;
    }

    const responseUsage = parseResponseUsage(value);
    if (responseUsage) {
      usageTotal = addUsage(usageTotal, responseUsage);
      responseCount += 1;
      usageLine = index + 1;
      prefixEnd = byteOffset;
      const timestampResult = ompAssistantUsageSchema.safeParse(value);
      if (!timestampResult.success) throw new Error(`Assistant usage record lacks timestamp at ${logPath}:${index + 1}`);
      usageAt = timestampResult.data.timestamp;
    }
  }

  if (!sessionId || !startedAt || !cwd) throw new Error(`No OMP session metadata in ${logPath}`);
  if (!usageAt || responseCount === 0) throw new Error(`No assistant usage records in ${logPath}`);

  return {
    id: sessionId,
    ...(parentId ? { parentId } : {}),
    agentPath: parentId ? basename(logPath, '.jsonl') : '/root',
    cwd,
    startedAt,
    logPath,
    logBytes: statSync(logPath).size,
    usageLine,
    usageAt,
    prefixSha256: createHash('sha256').update(raw.slice(0, prefixEnd)).digest('hex'),
    responseCount,
    usage: usageTotal,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const root = readSession(args.rootLog);
  const agentDirectory = args.rootLog.replace(/\.jsonl$/, '');
  const agentLogs = readdirSync(agentDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.jsonl'))
    .map(entry => resolve(agentDirectory, entry.name))
    .sort();
  const sessions = [root, ...agentLogs.map(path => readSession(path, root.id))];

  const ids = new Set<string>();
  for (const session of sessions) {
    if (ids.has(session.id)) throw new Error(`Duplicate OMP session id ${session.id}`);
    ids.add(session.id);
  }

  const totals = sessions.reduce((sum, session) => addUsage(sum, session.usage), emptyUsage());
  const measuredAt = sessions.reduce((latest, session) =>
    new Date(session.usageAt) > new Date(latest) ? session.usageAt : latest,
  root.usageAt);
  const wallClockMinutes = Math.ceil((new Date(measuredAt).getTime() - new Date(root.startedAt).getTime()) / 60_000);
  const promptsRaw = readFileSync(args.promptsFile, 'utf8');
  const promptCount = promptsRaw.split(/^---$/m).map(part => part.trim()).filter(Boolean).length;
  const artifactPaths = readFileSync(args.artifactsFile, 'utf8')
    .split('\n')
    .map(path => path.trim())
    .filter(path => path && !path.startsWith('#'));
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
    format: 'omp-per-response-v1',
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
    trustBoundary: 'OMP assistant-message usage is per response. Each response usage record is normalized so cached/cache-write input is a subset of public input, then summed exactly once per included root or child log. Private logs are not committed; prefix hashes commit to the measured private bytes.',
    sessions: sessions.map(session => ({
      id: session.id,
      parentId: session.parentId ?? null,
      agentPath: session.agentPath,
      startedAt: session.startedAt,
      cwd: session.cwd,
      log: relative(dirname(args.rootLog), session.logPath),
      logBytes: session.logBytes,
      responseCount: session.responseCount,
      usageLine: session.usageLine,
      usageAt: session.usageAt,
      prefixSha256: session.prefixSha256,
      usage: session.usage,
    })),
    artifacts: artifactPaths,
    researchDirectory: relative(repositoryRoot, args.researchDir),
    promptsFile: relative(repositoryRoot, args.promptsFile),
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
