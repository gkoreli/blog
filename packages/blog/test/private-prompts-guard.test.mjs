import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../../', import.meta.url));
const roots = [];
function run(root, command, args, input) {
  return spawnSync(command, args, { cwd: root, input, encoding: 'utf8' });
}
function git(root, ...args) {
  const result = run(root, 'git', args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function write(root, path, text = 'Synthetic private-note fixture.\n') {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'private-prompt-guard-'));
  roots.push(root);
  git(root, 'init', '--initial-branch=main');
  git(root, 'config', 'user.name', 'Fixture');
  git(root, 'config', 'user.email', 'fixture@example.test');
  git(root, 'config', 'commit.gpgsign', 'false');
  for (const path of ['.gitignore', '.githooks/pre-commit', '.githooks/pre-push',
    'scripts/check-private-prompts.mjs', 'scripts/install-git-hooks.mjs']) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    copyFileSync(join(source, path), join(root, path));
    if (path.startsWith('.githooks/')) chmodSync(join(root, path), 0o755);
  }
  write(root, 'README.md', '# Fixture\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'Fixture');
  return root;
}
function install(root) {
  const result = run(root, process.execPath, ['scripts/install-git-hooks.mjs']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git(root, 'config', '--local', '--get', 'core.hooksPath'), '.githooks');
}
function pushCheck(root, base, remote = 'origin') {
  return run(root, 'sh', ['.githooks/pre-push', remote, 'https://example.test/repo'],
    `refs/heads/main ${git(root, 'rev-parse', 'HEAD')} refs/heads/main ${base}\n`);
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

test('ordinary staging ignores retired prompt paths, author records and history bundles', () => {
  const root = fixture();
  for (const path of ['docs/prompts/next.md', 'packages/blog/prompts/next.md',
    'packages/blog/drafts/prompts/next.md', 'research/next.prompt.md', 'research/next.prompts.md',
    'research/owner-prompt.md', 'research/01-author-prompts.md', 'history.bundle']) write(root, path);
  git(root, 'add', '.');
  assert.equal(git(root, 'diff', '--cached', '--name-only'), '');
});

test('installed commit hook rejects force-added author records without displaying their contents', () => {
  const root = fixture();
  const base = git(root, 'rev-parse', 'HEAD');
  install(root);
  write(root, 'research/next.prompts.md');
  git(root, 'add', '--force', 'research/next.prompts.md');
  const result = run(root, 'git', ['commit', '-m', 'Attempt']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /research\/next\.prompts\.md/);
  assert.doesNotMatch(result.stderr, /Synthetic private-note fixture/);
  assert.equal(git(root, 'rev-parse', 'HEAD'), base);
});

test('push hook catches a private record added and deleted between outgoing commits', () => {
  const root = fixture();
  const base = git(root, 'rev-parse', 'HEAD');
  git(root, 'update-ref', 'refs/remotes/origin/main', base);
  write(root, 'research/next.prompts.md');
  git(root, 'add', '--force', 'research/next.prompts.md');
  git(root, 'commit', '-m', 'Synthetic record');
  git(root, 'rm', 'research/next.prompts.md');
  git(root, 'commit', '-m', 'Remove synthetic record');
  install(root);
  assert.equal(run(root, process.execPath, ['scripts/check-private-prompts.mjs', 'tracked']).status, 0);
  const result = pushCheck(root, base);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /research\/next\.prompts\.md/);
});

test('a new branch still checks its outgoing commits', () => {
  const root = fixture();
  git(root, 'update-ref', 'refs/remotes/origin/main', git(root, 'rev-parse', 'HEAD'));
  write(root, 'research/owner-prompt.md');
  git(root, 'add', '--force', 'research/owner-prompt.md');
  git(root, 'commit', '-m', 'Synthetic record');
  install(root);
  assert.notEqual(pushCheck(root, '0'.repeat(40)).status, 0);
});

test('retained history does not block later ordinary code or synthetic research changes', () => {
  const root = fixture();
  write(root, 'research/old.prompts.md');
  git(root, 'add', '--force', 'research/old.prompts.md');
  git(root, 'commit', '-m', 'Historical fixture');
  git(root, 'rm', 'research/old.prompts.md');
  git(root, 'commit', '-m', 'Historical retirement');
  const base = git(root, 'rev-parse', 'HEAD');
  git(root, 'update-ref', 'refs/remotes/origin/main', base);
  install(root);
  write(root, 'research/07-golden-prompts.md', '# Reproducible synthetic test inputs\n');
  write(root, 'src/prompt.ts', 'export const example = "Synthetic input";\n');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'Ordinary research');
  assert.equal(pushCheck(root, base).status, 0);
  assert.equal(pushCheck(root, '0'.repeat(40)).status, 0);
});

test('unavailable remote revisions fail verification without passing the push', () => {
  const root = fixture();
  install(root);
  assert.notEqual(pushCheck(root, 'f'.repeat(40)).status, 0);
});

test('the existing synthetic fixture is allowed only with its original bytes in each outgoing commit', () => {
  const root = fixture();
  const path = 'packages/blog/drafts/research/oss-radar-07/repro/cli/prompt.txt';
  const original = readFileSync(join(source, path), 'utf8');
  install(root);
  write(root, path, original);
  git(root, 'add', path);
  git(root, 'commit', '-m', 'Preserve published synthetic fixture');
  const base = git(root, 'rev-parse', 'HEAD');
  git(root, 'update-ref', 'refs/remotes/origin/main', base);
  write(root, path, 'Different private-note fixture.\n');
  git(root, 'add', path);
  assert.notEqual(run(root, 'git', ['commit', '-m', 'Attempt']).status, 0);
  // Simulate a bypass in this disposable fixture; the push guard must catch it.
  git(root, '-c', 'core.hooksPath=/dev/null', 'commit', '-m', 'Bypassed fixture hook');
  write(root, path, original);
  git(root, 'add', path);
  git(root, 'commit', '-m', 'Restore fixture');
  assert.equal(run(root, process.execPath, ['scripts/check-private-prompts.mjs', 'tracked']).status, 0);
  assert.notEqual(pushCheck(root, base).status, 0);
});

test('hook installation preserves existing custom hooks and skips nested source snapshots', () => {
  const root = fixture();
  git(root, 'config', 'core.hooksPath', '.custom-hooks');
  write(root, '.custom-hooks/pre-commit', '#!/bin/sh\nexit 0\n');
  const result = run(root, process.execPath, ['scripts/install-git-hooks.mjs']);
  assert.equal(result.status, 0);
  assert.match(result.stderr, /Existing Git hooks preserved/);
  assert.equal(git(root, 'config', 'core.hooksPath'), '.custom-hooks');
  assert.equal(readFileSync(join(root, '.custom-hooks/pre-commit'), 'utf8'), '#!/bin/sh\nexit 0\n');
  write(root, 'snapshot/scripts/install-git-hooks.mjs', readFileSync(join(root, 'scripts/install-git-hooks.mjs'), 'utf8'));
  assert.equal(run(root, process.execPath, ['snapshot/scripts/install-git-hooks.mjs']).status, 0);
  assert.equal(git(root, 'config', 'core.hooksPath'), '.custom-hooks');
});
