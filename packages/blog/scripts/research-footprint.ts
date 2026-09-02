/**
 * Research-footprint rules version 3.
 *
 * Version 2 measured one Codex root and its recursive descendants, splitting
 * cumulative token counters into monotonic epochs. Version 3 keeps that logic,
 * accepts repeated Codex roots, and can also include repeated Claude Code
 * transcripts. Claude usage is per API message, so repeated log entries with
 * the same message id are counted once and never use Codex epoch logic.
 * Top-level measuredAt is the freeze time; each source and session retains its
 * last private usage-record timestamp and prefix commitment. A matching legacy
 * version-1/2 manifest pins its recorded Codex session lines so an old one-root
 * invocation remains reproducible even if that root log later continued. Hashes
 * use byte offsets against the raw log buffer, so each commitment ends at the
 * recorded JSONL line even when earlier records contain multibyte text.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { z } from 'zod/v4';

const nonNegativeInteger = z.number().int().nonnegative();

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
  input_tokens: nonNegativeInteger,
  cached_input_tokens: nonNegativeInteger,
  cache_write_input_tokens: nonNegativeInteger,
  output_tokens: nonNegativeInteger,
  reasoning_output_tokens: nonNegativeInteger,
  total_tokens: nonNegativeInteger,
});

const tokenEventSchema = z.looseObject({
  timestamp: z.string(),
  type: z.literal('event_msg'),
  payload: z.looseObject({
    type: z.literal('token_count'),
    info: z.object({ total_token_usage: usageSchema }),
  }),
});

const claudeRecordSchema = z.looseObject({
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
  session_id: z.string().optional(),
  cwd: z.string().optional(),
  agentId: z.string().optional(),
});

const claudeAssistantUsageSchema = z.looseObject({
  type: z.literal('assistant'),
  timestamp: z.string(),
  sessionId: z.string().optional(),
  session_id: z.string().optional(),
  cwd: z.string().optional(),
  agentId: z.string().optional(),
  message: z.looseObject({
    id: z.string(),
    role: z.literal('assistant'),
    usage: z.looseObject({
      input_tokens: nonNegativeInteger,
      cache_read_input_tokens: nonNegativeInteger.default(0),
      cache_creation_input_tokens: nonNegativeInteger.default(0),
      output_tokens: nonNegativeInteger,
    }),
  }),
});

const legacyManifestSchema = z.object({
  rulesVersion: z.number().int().max(2),
  rootThread: z.string(),
  sessions: z.array(z.object({
    id: z.string(),
    usageRecordLine: z.number().int().positive(),
  })),
});

interface Args {
  rootThreads: string[];
  claudeTranscripts: string[];
  sessionsRoot: string;
  researchDir: string;
  promptsFile: string;
}

interface TokenTotals {
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
  nonCachedInputTokens: number;
}

interface UsageEpoch {
  endLine: number;
  endAt: string;
  prefixSha256: string;
  usage: z.infer<typeof usageSchema>;
}

interface CodexSessionRecord {
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
  usageEpochs: UsageEpoch[];
}

interface CompleteCodexSessionRecord extends CodexSessionRecord {
  usageLine: number;
  usageAt: string;
  prefixSha256: string;
  usage: z.infer<typeof usageSchema>;
}

interface ClaudeSessionRecord {
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
  duplicateUsageRecordCount: number;
  usage: z.infer<typeof usageSchema>;
}

interface CodexSourceRecord {
  kind: 'codex';
  id: string;
  path: null;
  sessions: CompleteCodexSessionRecord[];
  startedAt: string;
  usageAt: string;
  totals: TokenTotals;
}

interface ClaudeSourceRecord {
  kind: 'claude';
  id: string;
  path: string;
  sessions: ClaudeSessionRecord[];
  startedAt: string;
  usageAt: string;
  totals: TokenTotals;
}

function usage(): never {
  throw new Error('Usage: tsx scripts/research-footprint.ts --root-thread <id> [--root-thread <id> ...] [--claude-transcript <path> ...] --research-dir <path> --prompts-file <path> [--sessions-root <path>]');
}

function parseArgs(values: string[]): Args {
  const rootThreads: string[] = [];
  const claudeTranscripts: string[] = [];
  const options = new Map<string, string>();

  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || !value) usage();

    if (key === '--root-thread') {
      rootThreads.push(value);
    } else if (key === '--claude-transcript') {
      claudeTranscripts.push(resolve(value));
    } else {
      if (options.has(key)) throw new Error(`Option ${key} may not be repeated`);
      options.set(key, value);
    }
  }

  const researchDir = options.get('--research-dir');
  const promptsFile = options.get('--prompts-file');
  if ((!rootThreads.length && !claudeTranscripts.length) || !researchDir || !promptsFile) usage();

  const allowedOptions = new Set(['--research-dir', '--prompts-file', '--sessions-root']);
  for (const key of options.keys()) {
    if (!allowedOptions.has(key)) throw new Error(`Unknown option ${key}`);
  }

  if (new Set(rootThreads).size !== rootThreads.length) throw new Error('Duplicate --root-thread value');
  if (new Set(claudeTranscripts).size !== claudeTranscripts.length) throw new Error('Duplicate --claude-transcript value');

  return {
    rootThreads,
    claudeTranscripts,
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

function emptyRawUsage(): z.infer<typeof usageSchema> {
  return {
    input_tokens: 0,
    cached_input_tokens: 0,
    cache_write_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 0,
  };
}

function addRawUsage(sum: z.infer<typeof usageSchema>, usageValue: z.infer<typeof usageSchema>): z.infer<typeof usageSchema> {
  return {
    input_tokens: sum.input_tokens + usageValue.input_tokens,
    cached_input_tokens: sum.cached_input_tokens + usageValue.cached_input_tokens,
    cache_write_input_tokens: sum.cache_write_input_tokens + usageValue.cache_write_input_tokens,
    output_tokens: sum.output_tokens + usageValue.output_tokens,
    reasoning_output_tokens: sum.reasoning_output_tokens + usageValue.reasoning_output_tokens,
    total_tokens: sum.total_tokens + usageValue.total_tokens,
  };
}

function toTokenTotals(usageValue: z.infer<typeof usageSchema>): TokenTotals {
  return {
    inputTokens: usageValue.input_tokens,
    cachedInputTokens: usageValue.cached_input_tokens,
    cacheWriteInputTokens: usageValue.cache_write_input_tokens,
    outputTokens: usageValue.output_tokens,
    reasoningOutputTokens: usageValue.reasoning_output_tokens,
    totalTokens: usageValue.total_tokens,
    nonCachedInputTokens: usageValue.input_tokens - usageValue.cached_input_tokens,
  };
}

function addTokenTotals(sum: TokenTotals, value: TokenTotals): TokenTotals {
  return {
    inputTokens: sum.inputTokens + value.inputTokens,
    cachedInputTokens: sum.cachedInputTokens + value.cachedInputTokens,
    cacheWriteInputTokens: sum.cacheWriteInputTokens + value.cacheWriteInputTokens,
    outputTokens: sum.outputTokens + value.outputTokens,
    reasoningOutputTokens: sum.reasoningOutputTokens + value.reasoningOutputTokens,
    totalTokens: sum.totalTokens + value.totalTokens,
    nonCachedInputTokens: sum.nonCachedInputTokens + value.nonCachedInputTokens,
  };
}

function emptyTokenTotals(): TokenTotals {
  return toTokenTotals(emptyRawUsage());
}

function validateUsage(usageValue: z.infer<typeof usageSchema>, label: string): void {
  if (usageValue.total_tokens !== usageValue.input_tokens + usageValue.output_tokens) {
    throw new Error(`Token arithmetic failed for ${label}: total != input + output`);
  }
  if (usageValue.cached_input_tokens > usageValue.input_tokens) {
    throw new Error(`Token arithmetic failed for ${label}: cached input > input`);
  }
  if (usageValue.reasoning_output_tokens > usageValue.output_tokens) {
    throw new Error(`Token arithmetic failed for ${label}: reasoning output > output`);
  }
}

function prefixSha256(raw: Buffer, prefixEnd: number): string {
  return createHash('sha256').update(raw.subarray(0, prefixEnd)).digest('hex');
}

function readCodexSession(logPath: string, usageCutoffs: Map<string, number> | null): CodexSessionRecord | null {
  const rawBuffer = readFileSync(logPath);
  const raw = rawBuffer.toString('utf8');
  const lines = raw.split('\n');
  let meta: z.infer<typeof sessionMetaSchema> | undefined;
  const tokenEvents: Array<{ line: number; at: string; prefixEnd: number; usage: z.infer<typeof usageSchema> }> = [];
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
    if (metaResult.success && !meta) meta = metaResult.data;

    const tokenResult = tokenEventSchema.safeParse(value);
    if (tokenResult.success) {
      const cutoffLine = meta ? usageCutoffs?.get(meta.payload.id) : undefined;
      if (cutoffLine !== undefined && index + 1 > cutoffLine) continue;
      const usageValue = tokenResult.data.payload.info.total_token_usage;
      validateUsage(usageValue, `session ${meta?.payload.id ?? logPath} at line ${index + 1}`);
      tokenEvents.push({ line: index + 1, at: tokenResult.data.timestamp, prefixEnd: byteOffset, usage: usageValue });
    }
  }

  if (!meta) return null;
  const source = meta.payload.source;
  const parentId = typeof source === 'string' ? undefined : source.subagent.thread_spawn.parent_thread_id;
  const agentPath = typeof source === 'string' ? '/root' : source.subagent.thread_spawn.agent_path ?? basename(logPath);
  const [firstTokenEvent, ...remainingTokenEvents] = tokenEvents;
  if (!firstTokenEvent) {
    return {
      id: meta.payload.id,
      parentId,
      agentPath,
      cwd: meta.payload.cwd,
      startedAt: meta.payload.timestamp,
      logPath,
      logBytes: rawBuffer.byteLength,
      usageLine: null,
      usageAt: null,
      prefixSha256: null,
      usage: null,
      usageEpochs: [],
    };
  }

  const epochEnds = [];
  let previousTokenEvent = firstTokenEvent;
  for (const tokenEvent of remainingTokenEvents) {
    if (tokenEvent.usage.total_tokens < previousTokenEvent.usage.total_tokens) epochEnds.push(previousTokenEvent);
    previousTokenEvent = tokenEvent;
  }
  epochEnds.push(previousTokenEvent);

  const usageValue = epochEnds.reduce((sum, tokenEvent) => addRawUsage(sum, tokenEvent.usage), emptyRawUsage());
  const usageEpochs = epochEnds.map(tokenEvent => ({
    endLine: tokenEvent.line,
    endAt: tokenEvent.at,
    prefixSha256: prefixSha256(rawBuffer, tokenEvent.prefixEnd),
    usage: tokenEvent.usage,
  }));

  return {
    id: meta.payload.id,
    parentId,
    agentPath,
    cwd: meta.payload.cwd,
    startedAt: meta.payload.timestamp,
    logPath,
    logBytes: rawBuffer.byteLength,
    usageLine: previousTokenEvent.line,
    usageAt: previousTokenEvent.at,
    prefixSha256: prefixSha256(rawBuffer, previousTokenEvent.prefixEnd),
    usage: usageValue,
    usageEpochs,
  };
}

function hasUsage(session: CodexSessionRecord): session is CompleteCodexSessionRecord {
  return session.usage !== null
    && session.usageLine !== null
    && session.usageAt !== null
    && session.prefixSha256 !== null
    && session.usageEpochs.length > 0;
}

function descendants(rootThread: string, sessions: CodexSessionRecord[]): CodexSessionRecord[] {
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

function readClaudeSession(logPath: string, parentId?: string): ClaudeSessionRecord {
  const rawBuffer = readFileSync(logPath);
  const raw = rawBuffer.toString('utf8');
  const lines = raw.split('\n');
  const seenMessages = new Map<string, z.infer<typeof usageSchema>>();
  let transcriptId: string | undefined;
  let agentId: string | undefined;
  let cwd: string | undefined;
  let startedAt: string | undefined;
  let usageAt: string | undefined;
  let usageLine = 0;
  let prefixEnd = 0;
  let byteOffset = 0;
  let duplicateUsageRecordCount = 0;

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

    const recordResult = claudeRecordSchema.safeParse(value);
    if (recordResult.success) {
      const record = recordResult.data;
      transcriptId ??= record.sessionId ?? record.session_id;
      agentId ??= record.agentId;
      cwd ??= record.cwd;
      if (record.timestamp && (!startedAt || new Date(record.timestamp) < new Date(startedAt))) startedAt = record.timestamp;
    }

    const usageResult = claudeAssistantUsageSchema.safeParse(value);
    if (!usageResult.success) continue;
    const rawUsage = usageResult.data.message.usage;
    const inputTokens = rawUsage.input_tokens + rawUsage.cache_read_input_tokens + rawUsage.cache_creation_input_tokens;
    const normalizedUsage = {
      input_tokens: inputTokens,
      cached_input_tokens: rawUsage.cache_read_input_tokens,
      cache_write_input_tokens: rawUsage.cache_creation_input_tokens,
      output_tokens: rawUsage.output_tokens,
      reasoning_output_tokens: 0,
      total_tokens: inputTokens + rawUsage.output_tokens,
    };
    validateUsage(normalizedUsage, `Claude message ${usageResult.data.message.id} at ${logPath}:${index + 1}`);

    const previousUsage = seenMessages.get(usageResult.data.message.id);
    if (previousUsage) {
      const inputChanged = previousUsage.input_tokens !== normalizedUsage.input_tokens
        || previousUsage.cached_input_tokens !== normalizedUsage.cached_input_tokens
        || previousUsage.cache_write_input_tokens !== normalizedUsage.cache_write_input_tokens;
      if (inputChanged || normalizedUsage.output_tokens < previousUsage.output_tokens) {
        throw new Error(`Claude message ${usageResult.data.message.id} has non-monotonic usage records in ${logPath}`);
      }
      duplicateUsageRecordCount += 1;
    }

    seenMessages.set(usageResult.data.message.id, normalizedUsage);
    usageLine = index + 1;
    usageAt = usageResult.data.timestamp;
    prefixEnd = byteOffset;
  }

  const fallbackId = basename(logPath, '.jsonl');
  const rootId = transcriptId ?? fallbackId;
  const id = parentId ? `${parentId}/${agentId ?? fallbackId}` : rootId;
  if (!startedAt) throw new Error(`No timestamped records in Claude transcript ${logPath}`);
  if (!cwd) throw new Error(`No cwd in Claude transcript ${logPath}`);
  if (!usageAt || seenMessages.size === 0) throw new Error(`No assistant usage records in Claude transcript ${logPath}`);
  const usageTotal = [...seenMessages.values()].reduce(addRawUsage, emptyRawUsage());

  return {
    id,
    ...(parentId ? { parentId } : {}),
    agentPath: parentId ? `/claude/${agentId ?? fallbackId}` : '/claude',
    cwd,
    startedAt,
    logPath,
    logBytes: rawBuffer.byteLength,
    usageLine,
    usageAt,
    prefixSha256: prefixSha256(rawBuffer, prefixEnd),
    responseCount: seenMessages.size,
    duplicateUsageRecordCount,
    usage: usageTotal,
  };
}

function latestUsageAt<T extends { usageAt: string }>(sessions: T[]): string {
  const [first, ...rest] = sessions;
  if (!first) throw new Error('Cannot select a timestamp from an empty session list');
  return rest.reduce((latest, session) => new Date(session.usageAt) > new Date(latest) ? session.usageAt : latest, first.usageAt);
}

function earliestStartedAt<T extends { startedAt: string }>(sessions: T[]): string {
  const [first, ...rest] = sessions;
  if (!first) throw new Error('Cannot select a timestamp from an empty session list');
  return rest.reduce((earliest, session) => new Date(session.startedAt) < new Date(earliest) ? session.startedAt : earliest, first.startedAt);
}

function legacyUsageCutoffs(args: Args): Map<string, number> | null {
  if (args.rootThreads.length !== 1 || args.claudeTranscripts.length) return null;
  const manifestPath = join(args.researchDir, 'research-footprint.json');
  if (!existsSync(manifestPath)) return null;

  let value: unknown;
  try {
    value = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
  const result = legacyManifestSchema.safeParse(value);
  if (!result.success || result.data.rootThread !== args.rootThreads[0]) return null;
  return new Map(result.data.sessions.map(session => [session.id, session.usageRecordLine]));
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const usageCutoffs = legacyUsageCutoffs(args);
  const codexSessions = args.rootThreads.length
    ? jsonlFiles(args.sessionsRoot)
      .map(logPath => readCodexSession(logPath, usageCutoffs))
      .filter(record => record !== null)
    : [];
  const allCodexIds = new Set<string>();
  for (const session of codexSessions) {
    if (allCodexIds.has(session.id)) throw new Error(`Duplicate session id ${session.id}`);
    allCodexIds.add(session.id);
  }

  const claimedSessionIds = new Set<string>();
  const codexSources: CodexSourceRecord[] = args.rootThreads.map(rootThread => {
    const availableSessions = usageCutoffs
      ? codexSessions.filter(session => usageCutoffs.has(session.id))
      : codexSessions;
    const includedRecords = descendants(rootThread, availableSessions);
    if (!includedRecords.some(session => session.id === rootThread)) throw new Error(`Root thread ${rootThread} was not found under ${args.sessionsRoot}`);
    const missingUsage = includedRecords.filter(session => !hasUsage(session));
    if (missingUsage.length) throw new Error(`Included sessions missing cumulative token_count events: ${missingUsage.map(session => session.id).join(', ')}`);
    const included = includedRecords.filter(hasUsage);
    if (usageCutoffs) {
      for (const session of included) {
        if (session.usageLine !== usageCutoffs.get(session.id)) {
          throw new Error(`Legacy cutoff line ${usageCutoffs.get(session.id)} was not a cumulative usage record for ${session.id}`);
        }
      }
    }
    for (const session of included) {
      if (claimedSessionIds.has(session.id)) throw new Error(`Codex session ${session.id} belongs to more than one requested root closure`);
      claimedSessionIds.add(session.id);
    }
    const root = included.find(session => session.id === rootThread);
    if (!root) throw new Error(`Root thread ${rootThread} disappeared during aggregation`);
    const totals = included.reduce((sum, session) => addTokenTotals(sum, toTokenTotals(session.usage)), emptyTokenTotals());
    return {
      kind: 'codex',
      id: rootThread,
      path: null,
      sessions: included,
      startedAt: root.startedAt,
      usageAt: latestUsageAt(included),
      totals,
    };
  });

  const claudeSources: ClaudeSourceRecord[] = args.claudeTranscripts.map(transcriptPath => {
    const root = readClaudeSession(transcriptPath);
    const childDirectory = transcriptPath.replace(/\.jsonl$/, '');
    const childLogs = existsSync(childDirectory) ? jsonlFiles(childDirectory) : [];
    const children = childLogs.map(logPath => readClaudeSession(logPath, root.id));
    const sessions = [root, ...children].sort((a, b) => {
      if (!a.parentId) return -1;
      if (!b.parentId) return 1;
      return a.id.localeCompare(b.id);
    });
    for (const session of sessions) {
      if (claimedSessionIds.has(session.id)) throw new Error(`Duplicate included session id ${session.id}`);
      claimedSessionIds.add(session.id);
    }
    const totals = sessions.reduce((sum, session) => addTokenTotals(sum, toTokenTotals(session.usage)), emptyTokenTotals());
    return {
      kind: 'claude',
      id: root.id,
      path: transcriptPath,
      sessions,
      startedAt: root.startedAt,
      usageAt: latestUsageAt(sessions),
      totals,
    };
  });

  const allSessions = [...codexSources.flatMap(source => source.sessions), ...claudeSources.flatMap(source => source.sessions)];
  if (!allSessions.length) throw new Error('No sessions were included');
  const measuredAt = new Date().toISOString();
  const startedAt = earliestStartedAt(allSessions);
  const wallClockMinutes = Math.ceil((new Date(measuredAt).getTime() - new Date(startedAt).getTime()) / 60_000);
  const totals = [...codexSources, ...claudeSources].reduce((sum, source) => addTokenTotals(sum, source.totals), emptyTokenTotals());

  const promptsRaw = readFileSync(args.promptsFile, 'utf8');
  const promptCount = promptsRaw.split(/^---$/m).map(part => part.trim()).filter(Boolean).length;
  const artifactCount = readdirSync(args.researchDir, { withFileTypes: true }).filter(entry => entry.isFile() && entry.name.endsWith('.md')).length;
  const repositoryRoot = execFileSync('git', ['-C', args.researchDir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const researchPathspec = relative(repositoryRoot, args.researchDir);
  const committedArtifactCount = execFileSync('git', ['-C', repositoryRoot, 'ls-tree', '-r', '--name-only', 'HEAD', '--', researchPathspec], { encoding: 'utf8' })
    .split('\n')
    .filter(path => path.endsWith('.md')).length;

  const sources = [
    ...codexSources.map(source => ({
      kind: source.kind,
      id: source.id,
      path: source.path,
      startedAt: source.startedAt,
      usageAt: source.usageAt,
      sessions: source.sessions.map(session => session.id),
      sessionCount: source.sessions.length,
      responses: null,
      epochs: {
        count: source.sessions.reduce((sum, session) => sum + session.usageEpochs.length, 0),
        resetCount: source.sessions.reduce((sum, session) => sum + Math.max(0, session.usageEpochs.length - 1), 0),
        note: 'Codex token_count values are cumulative within each monotonic epoch.',
      },
      tokens: source.totals,
    })),
    ...claudeSources.map(source => ({
      kind: source.kind,
      id: source.id,
      path: source.path,
      startedAt: source.startedAt,
      usageAt: source.usageAt,
      sessions: source.sessions.map(session => session.id),
      sessionCount: source.sessions.length,
      responses: source.sessions.reduce((sum, session) => sum + session.responseCount, 0),
      epochs: {
        count: 0,
        resetCount: 0,
        note: 'Claude usage is per API message, not cumulative; epoch logic does not apply.',
      },
      tokens: source.totals,
    })),
  ];

  const firstRootThread = args.rootThreads[0] ?? claudeSources[0]?.id;
  if (!firstRootThread) throw new Error('No root identifier was available');
  const result = {
    rulesVersion: 3,
    rootThread: firstRootThread,
    rootThreads: args.rootThreads,
    claudeTranscripts: args.claudeTranscripts,
    startedAt,
    measuredAt,
    wallClockMinutes,
    sessionCount: allSessions.length,
    promptCount,
    artifactCount,
    committedArtifactCount,
    uncommittedArtifactCount: artifactCount - committedArtifactCount,
    totals,
    sources,
    sessions: [
      ...codexSources.flatMap(source => source.sessions.map(session => ({
        kind: 'codex',
        sourceId: source.id,
        id: session.id,
        parentId: session.parentId ?? null,
        agentPath: session.agentPath,
        startedAt: session.startedAt,
        cwd: session.cwd,
        log: relative(args.sessionsRoot, session.logPath),
        logBytes: session.logBytes,
        usageRecordLine: session.usageLine,
        usageAt: session.usageAt,
        prefixSha256: session.prefixSha256,
        usageEpochCount: session.usageEpochs.length,
        usageEpochs: session.usageEpochs,
        usage: session.usage,
      }))),
      ...claudeSources.flatMap(source => source.sessions.map(session => ({
        kind: 'claude',
        sourceId: source.id,
        id: session.id,
        parentId: session.parentId ?? null,
        agentPath: session.agentPath,
        startedAt: session.startedAt,
        cwd: session.cwd,
        log: relative(dirname(source.path), session.logPath),
        logBytes: session.logBytes,
        usageRecordLine: session.usageLine,
        usageAt: session.usageAt,
        prefixSha256: session.prefixSha256,
        usageEpochCount: 0,
        usageEpochs: [],
        responseCount: session.responseCount,
        duplicateUsageRecordCount: session.duplicateUsageRecordCount,
        usageNote: 'input includes uncached, cache-read, and cache-creation input; cached input is cache-read only; Claude reasoning tokens are not exposed separately and are reported as 0.',
        usage: session.usage,
      }))),
    ],
    trustBoundary: 'Private Codex and Claude logs are not committed. Prefix hashes commit to the measured private log prefixes, so the totals are auditable by the author with integrity commitments, not publicly reconstructible.',
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
