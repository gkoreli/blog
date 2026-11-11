import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function paths(output) {
  return output.split('\0').filter(Boolean);
}

function privatePath({ path, revision = '' }) {
  // A published synthetic experiment input is retained byte for byte. Changing
  // it or adding personal wording here requires a separate reviewed decision.
  if (path === 'packages/blog/drafts/research/oss-radar-07/repro/cli/prompt.txt'
    && createHash('sha256').update(git('show', `${revision}:${path}`)).digest('hex')
      === '4b439d66162f7bc017709d6243607f00f8bd36590ce115408a52d5bda3d4dca6') return false;
  return /(?:^|\/)(?:docs\/prompts|packages\/blog\/(?:prompts|drafts\/prompts|worklog)|writing-private)\//i.test(path)
    || /\.prompts?\.(?:md|txt|jsonl?|ya?ml)$/i.test(path)
    || /(?:^|\/)(?:prompts?|owner-prompt|source-prompts?|(?:\d+-)?author-prompts)\.(?:md|txt|jsonl?|ya?ml)$/i.test(path)
    || /\.bundle$/i.test(path);
}

function outgoingPaths(remote) {
  if (!remote) throw new Error('The push guard requires the Git remote name.');
  const updates = readFileSync(0, 'utf8').trim().split('\n').filter(Boolean);
  const tips = new Set();
  const bases = new Set();
  for (const line of updates) {
    const fields = line.trim().split(/\s+/);
    if (fields.length !== 4) throw new Error('Invalid Git pre-push input.');
    const [, localSha, , remoteSha] = fields;
    if (![localSha, remoteSha].every(sha => /^[0-9a-f]{40,64}$/.test(sha))) {
      throw new Error('Invalid Git pre-push revision.');
    }
    if (/^0+$/.test(localSha)) continue;
    tips.add(localSha);
    if (!/^0+$/.test(remoteSha)) bases.add(remoteSha);
  }
  if (!tips.size) return [];
  // Preserve accepted historical records already on this remote. Inspect every
  // outgoing commit, including a prompt file deleted again before the final tip.
  const commits = git('rev-list', ...tips, '--not', ...bases, `--remotes=${remote}`)
    .trim().split('\n').filter(Boolean);
  return commits.flatMap(commit => paths(git('diff-tree', '--root', '-m', '--no-commit-id',
    '--name-only', '--diff-filter=ACMRT', '-r', '-z', commit)).map(path => ({ path, revision: commit })));
}

try {
  const [mode, remote] = process.argv.slice(2);
  let candidates;
  if (mode === 'staged') candidates = paths(git('diff', '--cached', '--name-only', '--diff-filter=ACMRT', '-z')).map(path => ({ path }));
  else if (mode === 'tracked') candidates = paths(git('ls-files', '-z')).map(path => ({ path }));
  else if (mode === 'push') candidates = outgoingPaths(remote);
  else throw new Error('Usage: check-private-prompts.mjs staged|tracked|push [remote]');
  const blocked = [...new Set(candidates.filter(privatePath).map(candidate => candidate.path))].sort();
  if (blocked.length) {
    console.error('Private author-prompt files or archives cannot enter this public repository:');
    for (const path of blocked) console.error(`  ${path}`);
    console.error('Keep them in the approved private writing repository or ignored packages/blog/worklog/ storage.');
    process.exitCode = 1;
  }
} catch (error) {
  console.error('The private-prompt guard could not verify this operation. Fetch the remote if its revision is unavailable.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
