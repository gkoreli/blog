import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { z } from 'zod/v4';

const spawnSourceSchema = z.looseObject({
  subagent: z.looseObject({
    thread_spawn: z.looseObject({
      parent_thread_id: z.string(),
      agent_path: z.string().nullable().optional(),
    }),
  }),
});

const sessionMetaSchema = z.looseObject({
  type: z.literal('session_meta'),
  payload: z.looseObject({
    id: z.string(),
    timestamp: z.string(),
    cwd: z.string(),
    source: z.union([z.string(), spawnSourceSchema]),
  }),
});

const usageSchema = z.object({
  input_tokens: z.number().int().nonnegative(),
  cached_input_tokens: z.number().int().nonnegative(),
  cache_write_input_tokens: z.number().int().nonnegative(),
  output_tokens: z.number().int().nonnegative(),
  reasoning_output_tokens: z.number().int().nonnegative(),
  total_tokens: z.number().int().nonnegative(),
});

const tokenEventSchema = z.looseObject({
  timestamp: z.string(),
  type: z.literal('event_msg'),
  payload: z.looseObject({
    type: z.literal('token_count'),
    info: z.object({ total_token_usage: usageSchema }),
  }),
});

interface Args {
  rootThread: string;
  sessionsRoot: string;
  researchDir: string;
  promptsFile: string;
}

interface SessionRecord {
  id: string;
  parentId?: string;
  agentPath: string;
  cwd: string;
  startedAt: string;
  logPath: string;
  logBytes: number;
  usageLine: number | null;
  usageAt: string | null;
  prefixSha256: string | null;
  usage: z.infer<typeof usageSchema> | null;
}

interface CompleteSessionRecord extends SessionRecord {
  usageLine: number;
  usageAt: string;
  prefixSha256: string;
  usage: z.infer<typeof usageSchema>;
}

function usage(): never {
  throw new Error('Usage: tsx scripts/research-footprint.ts --root-thread <id> --research-dir <path> --prompts-file <path> [--sessions-root <path>]');
}

function parseArgs(values: string[]): Args {
  const options = new Map<string, string>();
  for (let i = 0; i < values.length; i += 2) {
    const key = values[i];
    const value = values[i + 1];
    if (!key?.startsWith('--') || !value) usage();
    options.set(key, value);
  }

  const rootThread = options.get('--root-thread');
  const researchDir = options.get('--research-dir');
  const promptsFile = options.get('--prompts-file');
  if (!rootThread || !researchDir || !promptsFile) usage();

  return {
    rootThread,
    researchDir: resolve(researchDir),
    promptsFile: resolve(promptsFile),
    sessionsRoot: resolve(options.get('--sessions-root') ?? join(homedir(), '.codex', 'sessions')),
  };
}

function jsonlFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...jsonlFiles(path));
    if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(path);
  }
  return files.sort();
}

function readSession(logPath: string): SessionRecord | null {
  const raw = readFileSync(logPath, 'utf8');
  const lines = raw.split('\n');
  let meta: z.infer<typeof sessionMetaSchema> | undefined;
  let tokenEvent: z.infer<typeof tokenEventSchema> | undefined;
  let usageLine = 0;
  let prefixEnd = 0;
  let byteOffset = 0;

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

    const metaResult = sessionMetaSchema.safeParse(value);
    // Forked logs may embed an ancestor's session_meta after their own. The first
    // session_meta names the log itself; later metadata belongs to inherited context.
    if (metaResult.success && !meta) meta = metaResult.data;

    const tokenResult = tokenEventSchema.safeParse(value);
    if (tokenResult.success) {
      tokenEvent = tokenResult.data;
      usageLine = index + 1;
      prefixEnd = byteOffset;
    }
  }

  if (!meta) return null;
  const source = meta.payload.source;
  const parentId = typeof source === 'string'
    ? undefined
    : source.subagent.thread_spawn.parent_thread_id;
  const agentPath = typeof source === 'string'
    ? '/root'
    : source.subagent.thread_spawn.agent_path ?? basename(logPath);
  if (!tokenEvent) {
    return {
      id: meta.payload.id,
      parentId,
      agentPath,
      cwd: meta.payload.cwd,
      startedAt: meta.payload.timestamp,
      logPath,
      logBytes: statSync(logPath).size,
      usageLine: null,
      usageAt: null,
      prefixSha256: null,
      usage: null,
    };
  }

  const usageValue = tokenEvent.payload.info.total_token_usage;

  if (usageValue.total_tokens !== usageValue.input_tokens + usageValue.output_tokens) {
    throw new Error(`Token arithmetic failed for session ${meta.payload.id}: total != input + output`);
  }
  if (usageValue.cached_input_tokens > usageValue.input_tokens) {
    throw new Error(`Token arithmetic failed for session ${meta.payload.id}: cached input > input`);
  }
  if (usageValue.reasoning_output_tokens > usageValue.output_tokens) {
    throw new Error(`Token arithmetic failed for session ${meta.payload.id}: reasoning output > output`);
  }

  return {
    id: meta.payload.id,
    parentId,
    agentPath,
    cwd: meta.payload.cwd,
    startedAt: meta.payload.timestamp,
    logPath,
    logBytes: statSync(logPath).size,
    usageLine,
    usageAt: tokenEvent.timestamp,
    prefixSha256: createHash('sha256').update(raw.slice(0, prefixEnd)).digest('hex'),
    usage: usageValue,
  };
}

function hasUsage(session: SessionRecord): session is CompleteSessionRecord {
  return session.usage !== null
    && session.usageLine !== null
    && session.usageAt !== null
    && session.prefixSha256 !== null;
}

function descendants(rootThread: string, sessions: SessionRecord[]): SessionRecord[] {
  const ids = new Set([rootThread]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const session of sessions) {
      if (session.parentId && ids.has(session.parentId) && !ids.has(session.id)) {
        ids.add(session.id);
        changed = true;
      }
    }
  }
  return sessions.filter(session => ids.has(session.id)).sort((a, b) => a.id.localeCompare(b.id));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const sessions = jsonlFiles(args.sessionsRoot)
    .map(readSession)
    .filter(record => record !== null);
  const ids = new Set<string>();
  for (const session of sessions) {
    if (ids.has(session.id)) throw new Error(`Duplicate session id ${session.id}`);
    ids.add(session.id);
  }

  const includedRecords = descendants(args.rootThread, sessions);
  if (!includedRecords.some(session => session.id === args.rootThread)) {
    throw new Error(`Root thread ${args.rootThread} was not found under ${args.sessionsRoot}`);
  }
  const missingUsage = includedRecords.filter(session => !hasUsage(session));
  if (missingUsage.length) {
    throw new Error(`Included sessions missing cumulative token_count events: ${missingUsage.map(session => session.id).join(', ')}`);
  }
  const included = includedRecords.filter(hasUsage);

  const totals = included.reduce((sum, session) => ({
    inputTokens: sum.inputTokens + session.usage.input_tokens,
    cachedInputTokens: sum.cachedInputTokens + session.usage.cached_input_tokens,
    cacheWriteInputTokens: sum.cacheWriteInputTokens + session.usage.cache_write_input_tokens,
    outputTokens: sum.outputTokens + session.usage.output_tokens,
    reasoningOutputTokens: sum.reasoningOutputTokens + session.usage.reasoning_output_tokens,
    totalTokens: sum.totalTokens + session.usage.total_tokens,
  }), {
    inputTokens: 0,
    cachedInputTokens: 0,
    cacheWriteInputTokens: 0,
    outputTokens: 0,
    reasoningOutputTokens: 0,
    totalTokens: 0,
  });

  const root = included.find(session => session.id === args.rootThread);
  if (!root) throw new Error(`Root thread ${args.rootThread} disappeared during aggregation`);
  const measuredAt = included.reduce((latest, session) =>
    new Date(session.usageAt) > new Date(latest) ? session.usageAt : latest,
  root.usageAt);
  const wallClockMinutes = Math.ceil((new Date(measuredAt).getTime() - new Date(root.startedAt).getTime()) / 60_000);
  const promptsRaw = readFileSync(args.promptsFile, 'utf8');
  const promptCount = promptsRaw.split(/^---$/m).map(part => part.trim()).filter(Boolean).length;
  const artifactCount = readdirSync(args.researchDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md')).length;
  const repositoryRoot = execFileSync('git', ['-C', args.researchDir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const researchPathspec = relative(repositoryRoot, args.researchDir);
  const committedArtifactCount = execFileSync('git', ['-C', repositoryRoot, 'ls-tree', '-r', '--name-only', 'HEAD', '--', researchPathspec], { encoding: 'utf8' })
    .split('\n')
    .filter(path => path.endsWith('.md')).length;

  const result = {
    rulesVersion: 1,
    rootThread: args.rootThread,
    startedAt: root.startedAt,
    measuredAt,
    wallClockMinutes,
    sessionCount: included.length,
    promptCount,
    artifactCount,
    committedArtifactCount,
    uncommittedArtifactCount: artifactCount - committedArtifactCount,
    totals: {
      ...totals,
      nonCachedInputTokens: totals.inputTokens - totals.cachedInputTokens,
    },
    sessions: included.map(session => ({
      id: session.id,
      parentId: session.parentId ?? null,
      agentPath: session.agentPath,
      cwd: session.cwd,
      log: relative(args.sessionsRoot, session.logPath),
      logBytes: session.logBytes,
      usageRecordLine: session.usageLine,
      usageAt: session.usageAt,
      prefixSha256: session.prefixSha256,
      usage: session.usage,
    })),
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
