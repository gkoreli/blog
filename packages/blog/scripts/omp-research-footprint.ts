import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import {
  addTokenTotals,
  committedArtifactsAtHead,
  countPrompts,
  emptyOmpTokenTotals,
  latestUsageAt,
  parseCliOptionPairs,
  readArtifactManifest,
  readOmpSession,
  repositoryRootFor,
  wallClockMinutes,
} from './research-footprint.models.js';

interface Args {
  rootLog: string;
  researchDir: string;
  promptsFile: string;
  artifactsFile: string;
  outputFile: string | undefined;
}

function usage(): never {
  throw new Error('Usage: tsx scripts/omp-research-footprint.ts --root-log <path> --research-dir <path> --prompts-file <path> --artifacts-file <path> [--output <path>]');
}

function parseArgs(values: string[]): Args {
  const options = new Map<string, string>();
  for (const { key, value } of parseCliOptionPairs(values, usage)) {
    options.set(key, value);
  }

  const rootLog = options.get('--root-log');
  const researchDir = options.get('--research-dir');
  const outputFile = options.get('--output');
  const promptsFile = options.get('--prompts-file');
  const artifactsFile = options.get('--artifacts-file');
  if (!rootLog || !researchDir || !promptsFile || !artifactsFile) usage();

  return {
    rootLog: resolve(rootLog),
    researchDir: resolve(researchDir),
    promptsFile: resolve(promptsFile),
    artifactsFile: resolve(artifactsFile),
    outputFile: outputFile ? resolve(outputFile) : undefined,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const root = readOmpSession(args.rootLog);
  const agentDirectory = args.rootLog.replace(/\.jsonl$/, '');
  const agentLogs = readdirSync(agentDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.jsonl'))
    .map(entry => resolve(agentDirectory, entry.name))
    .sort();
  const sessions = [root, ...agentLogs.map(path => readOmpSession(path, root.id))];

  const ids = new Set<string>();
  for (const session of sessions) {
    if (ids.has(session.id)) throw new Error(`Duplicate OMP session id ${session.id}`);
    ids.add(session.id);
  }

  const totals = sessions.reduce((sum, session) => addTokenTotals(sum, session.usage), emptyOmpTokenTotals());
  const measuredAt = latestUsageAt(sessions);
  const measuredWallClockMinutes = wallClockMinutes(root.startedAt, measuredAt);
  const promptCount = countPrompts(args.promptsFile);
  const artifactPaths = readArtifactManifest(args.artifactsFile);
  const repositoryRoot = repositoryRootFor(args.researchDir);
  const committedArtifacts = committedArtifactsAtHead(repositoryRoot, artifactPaths);

  const result = {
    rulesVersion: 1,
    format: 'omp-per-response-v1',
    rootSession: root.id,
    startedAt: root.startedAt,
    measuredAt,
    wallClockMinutes: measuredWallClockMinutes,
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

  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (args.outputFile) {
    writeFileSync(args.outputFile, serialized);
    console.log(`Wrote OMP research footprint to ${args.outputFile}`);
  } else {
    console.log(serialized);
  }
}

main();
