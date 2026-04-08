import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT } from '../lib/paths.js';

const ENV_FILE = join(REPO_ROOT, '.env');

export function loadLocalEnv(): void {
  if (!existsSync(ENV_FILE)) return;
  process.loadEnvFile(ENV_FILE);
}
