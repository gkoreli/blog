import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { z } from 'zod/v4';

const nonNegativeInteger = z.number().int().nonnegative();

export const spawnSourceSchema = z.looseObject({
  subagent: z.looseObject({
    thread_spawn: z.looseObject({
      parent_thread_id: z.string(),
      agent_path: z.string().nullable().optional(),
    }),
  }),
});

export const sessionMetaSchema = z.looseObject({
  type: z.literal('session_meta'),
  payload: z.looseObject({
    id: z.string(),
    timestamp: z.string(),
    cwd: z.string(),
    source: z.union([z.string(), spawnSourceSchema]),
  }),
});

export const tokenUsageSchema = z.object({
  input_tokens: nonNegativeInteger,
  cached_input_tokens: nonNegativeInteger,
  cache_write_input_tokens: nonNegativeInteger,
  output_tokens: nonNegativeInteger,
  reasoning_output_tokens: nonNegativeInteger,
  total_tokens: nonNegativeInteger,
});

export const tokenEventSchema = z.looseObject({
  timestamp: z.string(),
  type: z.literal('event_msg'),
  payload: z.looseObject({
    type: z.literal('token_count'),
    info: z.object({ total_token_usage: tokenUsageSchema }),
  }),
});

export const claudeRecordSchema = z.looseObject({
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
  session_id: z.string().optional(),
  cwd: z.string().optional(),
  agentId: z.string().optional(),
});

export const claudeAssistantUsageSchema = z.looseObject({
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
      output_tokens_details: z.looseObject({
        thinking_tokens: nonNegativeInteger.default(0),
      }).nullish(),
    }),
  }),
});

export const ompSessionSchema = z.looseObject({
  type: z.literal('session'),
  id: z.string(),
  timestamp: z.string(),
  cwd: z.string(),
});

export const ompAssistantUsageSchema = z.looseObject({
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

export const legacyManifestSchema = z.object({
  rulesVersion: z.number().int().max(2),
  rootThread: z.string(),
  sessions: z.array(z.object({
    id: z.string(),
    usageRecordLine: z.number().int().positive(),
  })),
});

export type RawTokenUsage = z.infer<typeof tokenUsageSchema>;

export interface TokenTotals {
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteInputTokens: number;
  outputTokens: number;
  reasoningOutputTokens: number;
  totalTokens: number;
  nonCachedInputTokens: number;
}

export interface UsageEpoch {
  endLine: number;
  endAt: string;
  prefixSha256: string;
  usage: RawTokenUsage;
}

export interface CodexSessionRecord {
  id: string;
  parentId: string | undefined;
  agentPath: string;
  cwd: string;
  startedAt: string;
  logPath: string;
  logBytes: number;
  usageLine: number | null;
  usageAt: string | null;
  prefixSha256: string | null;
  usage: RawTokenUsage | null;
  usageEpochs: UsageEpoch[];
}

export interface CompleteCodexSessionRecord extends CodexSessionRecord {
  usageLine: number;
  usageAt: string;
  prefixSha256: string;
  usage: RawTokenUsage;
}

export interface ClaudeSessionRecord {
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
  usage: RawTokenUsage;
}

export interface OmpSessionRecord {
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
  usage: TokenTotals;
}

export interface CodexSourceRecord {
  kind: 'codex';
  id: string;
  path: null;
  sessions: CompleteCodexSessionRecord[];
  startedAt: string;
  usageAt: string;
  totals: TokenTotals;
}

export interface ClaudeSourceRecord {
  kind: 'claude';
  id: string;
  path: string;
  sessions: ClaudeSessionRecord[];
  startedAt: string;
  usageAt: string;
  totals: TokenTotals;
}

export interface CliOption {
  key: string;
  value: string;
}

export function parseCliOptionPairs(values: string[], invalid: () => never): CliOption[] {
  const pairs: CliOption[] = [];
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith('--') || !value) invalid();
    pairs.push({ key, value });
  }
  return pairs;
}

export function emptyRawUsage(): RawTokenUsage {
  return {
    input_tokens: 0,
    cached_input_tokens: 0,
    cache_write_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 0,
  };
}

export function addRawUsage(sum: RawTokenUsage, value: RawTokenUsage): RawTokenUsage {
  return {
    input_tokens: sum.input_tokens + value.input_tokens,
    cached_input_tokens: sum.cached_input_tokens + value.cached_input_tokens,
    cache_write_input_tokens: sum.cache_write_input_tokens + value.cache_write_input_tokens,
    output_tokens: sum.output_tokens + value.output_tokens,
    reasoning_output_tokens: sum.reasoning_output_tokens + value.reasoning_output_tokens,
    total_tokens: sum.total_tokens + value.total_tokens,
  };
}

export function toTokenTotals(value: RawTokenUsage): TokenTotals {
  return {
    inputTokens: value.input_tokens,
    cachedInputTokens: value.cached_input_tokens,
    cacheWriteInputTokens: value.cache_write_input_tokens,
    outputTokens: value.output_tokens,
    reasoningOutputTokens: value.reasoning_output_tokens,
    totalTokens: value.total_tokens,
    nonCachedInputTokens: value.input_tokens - value.cached_input_tokens,
  };
}

export function emptyTokenTotals(): TokenTotals {
  return toTokenTotals(emptyRawUsage());
}

export function emptyOmpTokenTotals(): TokenTotals {
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

export function addTokenTotals(sum: TokenTotals, value: TokenTotals): TokenTotals {
  return {
    ...sum,
    inputTokens: sum.inputTokens + value.inputTokens,
    cachedInputTokens: sum.cachedInputTokens + value.cachedInputTokens,
    cacheWriteInputTokens: sum.cacheWriteInputTokens + value.cacheWriteInputTokens,
    outputTokens: sum.outputTokens + value.outputTokens,
    reasoningOutputTokens: sum.reasoningOutputTokens + value.reasoningOutputTokens,
    totalTokens: sum.totalTokens + value.totalTokens,
    nonCachedInputTokens: sum.nonCachedInputTokens + value.nonCachedInputTokens,
  };
}

export function validateUsage(value: RawTokenUsage, label: string): void {
  if (value.total_tokens !== value.input_tokens + value.output_tokens) {
    throw new Error(`Token arithmetic failed for ${label}: total != input + output`);
  }
  if (value.cached_input_tokens > value.input_tokens) {
    throw new Error(`Token arithmetic failed for ${label}: cached input > input`);
  }
  if (value.reasoning_output_tokens > value.output_tokens) {
    throw new Error(`Token arithmetic failed for ${label}: reasoning output > output`);
  }
}

export function prefixSha256(raw: Buffer | string, prefixEnd: number): string {
  const prefix = typeof raw === 'string' ? raw.slice(0, prefixEnd) : raw.subarray(0, prefixEnd);
  return createHash('sha256').update(prefix).digest('hex');
}

export function readCodexSession(logPath: string, usageCutoffs: Map<string, number> | null): CodexSessionRecord | null {
  const rawBuffer = readFileSync(logPath);
  const raw = rawBuffer.toString('utf8');
  const lines = raw.split('\n');
  let meta: z.infer<typeof sessionMetaSchema> | undefined;
  const tokenEvents: Array<{ line: number; at: string; prefixEnd: number; usage: RawTokenUsage }> = [];
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

  const epochEnds: typeof tokenEvents = [];
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

export function hasUsage(session: CodexSessionRecord): session is CompleteCodexSessionRecord {
  return session.usage !== null
    && session.usageLine !== null
    && session.usageAt !== null
    && session.prefixSha256 !== null
    && session.usageEpochs.length > 0;
}

export function descendants(rootThread: string, sessions: CodexSessionRecord[]): CodexSessionRecord[] {
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

export function readClaudeSession(logPath: string, parentId?: string): ClaudeSessionRecord {
  const rawBuffer = readFileSync(logPath);
  const raw = rawBuffer.toString('utf8');
  const lines = raw.split('\n');
  const seenMessages = new Map<string, RawTokenUsage>();
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
    const normalizedUsage: RawTokenUsage = {
      input_tokens: inputTokens,
      cached_input_tokens: rawUsage.cache_read_input_tokens,
      cache_write_input_tokens: rawUsage.cache_creation_input_tokens,
      output_tokens: rawUsage.output_tokens,
      reasoning_output_tokens: rawUsage.output_tokens_details?.thinking_tokens ?? 0,
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

export function parseOmpResponseUsage(value: unknown): TokenTotals | null {
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

export function readOmpSession(logPath: string, parentId?: string): OmpSessionRecord {
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
  let usageTotal = emptyOmpTokenTotals();

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

    const responseUsage = parseOmpResponseUsage(value);
    if (responseUsage) {
      usageTotal = addTokenTotals(usageTotal, responseUsage);
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
    prefixSha256: prefixSha256(raw, prefixEnd),
    responseCount,
    usage: usageTotal,
  };
}

export function latestUsageAt<T extends { usageAt: string }>(sessions: T[]): string {
  const [first, ...rest] = sessions;
  if (!first) throw new Error('Cannot select a timestamp from an empty session list');
  return rest.reduce((latest, session) => new Date(session.usageAt) > new Date(latest) ? session.usageAt : latest, first.usageAt);
}

export function earliestStartedAt<T extends { startedAt: string }>(sessions: T[]): string {
  const [first, ...rest] = sessions;
  if (!first) throw new Error('Cannot select a timestamp from an empty session list');
  return rest.reduce((earliest, session) => new Date(session.startedAt) < new Date(earliest) ? session.startedAt : earliest, first.startedAt);
}

export function wallClockMinutes(startedAt: string, measuredAt: string): number {
  return Math.ceil((new Date(measuredAt).getTime() - new Date(startedAt).getTime()) / 60_000);
}

export function countPrompts(promptsFile: string): number {
  return readFileSync(promptsFile, 'utf8').split(/^---$/m).map(part => part.trim()).filter(Boolean).length;
}

export function repositoryRootFor(path: string): string {
  return execFileSync('git', ['-C', path, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

export function markdownArtifactCounts(researchDir: string): { artifactCount: number; committedArtifactCount: number } {
  const artifactCount = readdirSync(researchDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md')).length;
  const repositoryRoot = repositoryRootFor(researchDir);
  const researchPathspec = relative(repositoryRoot, researchDir);
  const committedArtifactCount = execFileSync(
    'git',
    ['-C', repositoryRoot, 'ls-tree', '-r', '--name-only', 'HEAD', '--', researchPathspec],
    { encoding: 'utf8' },
  )
    .split('\n')
    .filter(path => path.endsWith('.md')).length;
  return { artifactCount, committedArtifactCount };
}

export function readArtifactManifest(artifactsFile: string): string[] {
  return readFileSync(artifactsFile, 'utf8')
    .split('\n')
    .map(path => path.trim())
    .filter(path => path && !path.startsWith('#'));
}

export function artifactExistsAtHead(repositoryRoot: string, artifactPath: string): boolean {
  try {
    execFileSync('git', ['-C', repositoryRoot, 'cat-file', '-e', `HEAD:${artifactPath}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function committedArtifactsAtHead(repositoryRoot: string, artifactPaths: string[]): string[] {
  return artifactPaths.filter(path => artifactExistsAtHead(repositoryRoot, path));
}

interface LegacyUsageCutoffArgs {
  rootThreads: string[];
  claudeTranscripts: string[];
  researchDir: string;
}

export function legacyUsageCutoffs(args: LegacyUsageCutoffArgs): Map<string, number> | null {
  const [rootThread] = args.rootThreads;
  if (args.rootThreads.length !== 1 || !rootThread || args.claudeTranscripts.length) return null;
  const manifestPath = join(args.researchDir, 'research-footprint.json');
  if (!existsSync(manifestPath)) return null;

  let value: unknown;
  try {
    value = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
  const result = legacyManifestSchema.safeParse(value);
  if (!result.success || result.data.rootThread !== rootThread) return null;
  return new Map(result.data.sessions.map(session => [session.id, session.usageRecordLine]));
}
