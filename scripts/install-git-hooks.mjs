import { spawnSync } from 'node:child_process';
import { accessSync, constants, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
const top = git('rev-parse', '--show-toplevel');

// Source archives and isolated builds must not change another checkout's config.
if (top.status === 0 && realpathSync(top.stdout.trim()) === root) {
  const configured = git('config', '--get', 'core.hooksPath').stdout.trim();
  const hookPath = git('rev-parse', '--git-path', 'hooks').stdout.trim();
  const active = ['pre-commit', 'pre-push'].filter(name => {
    try { accessSync(resolve(root, hookPath, name), constants.X_OK); return true; }
    catch { return false; }
  });
  if (configured && configured !== '.githooks' || !configured && active.length) {
    console.error('Existing Git hooks preserved. Integrate the private-prompt checks into those hooks before publishing.');
  } else {
    const installed = git('config', '--local', 'core.hooksPath', '.githooks');
    if (installed.status !== 0) {
      console.error('Could not install the private-prompt Git hooks.');
      process.exitCode = 1;
    } else console.log('Private-prompt commit and push guards installed.');
  }
}
