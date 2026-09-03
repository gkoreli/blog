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

import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import {
  addTokenTotals,
  countPrompts,
  descendants,
  earliestStartedAt,
  emptyTokenTotals,
  hasUsage,
  latestUsageAt,
  legacyUsageCutoffs,
  markdownArtifactCounts,
  parseCliOptionPairs,
  readClaudeSession,
  readCodexSession,
  toTokenTotals,
  wallClockMinutes,
} from './research-footprint.models.js';
import type { ClaudeSourceRecord, CodexSourceRecord } from './research-footprint.models.js';

interface Args {
  rootThreads: string[];
  claudeTranscripts: string[];
  sessionsRoot: string;
  researchDir: string;
  promptsFile: string;
}

function usage(): never {
  throw new Error('Usage: tsx scripts/research-footprint.ts --root-thread <id> [--root-thread <id> ...] [--claude-transcript <path> ...] --research-dir <path> --prompts-file <path> [--sessions-root <path>]');
}

function parseArgs(values: string[]): Args {
  const rootThreads: string[] = [];
  const claudeTranscripts: string[] = [];
  const options = new Map<string, string>();

  for (const { key, value } of parseCliOptionPairs(values, usage)) {
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
  const measuredWallClockMinutes = wallClockMinutes(startedAt, measuredAt);
  const totals = [...codexSources, ...claudeSources].reduce((sum, source) => addTokenTotals(sum, source.totals), emptyTokenTotals());

  const promptCount = countPrompts(args.promptsFile);
  const { artifactCount, committedArtifactCount } = markdownArtifactCounts(args.researchDir);

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
    wallClockMinutes: measuredWallClockMinutes,
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
