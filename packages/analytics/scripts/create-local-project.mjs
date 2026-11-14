import { randomBytes } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const analytics = new URL('../', import.meta.url);
const repository = new URL('../../../', import.meta.url);

/** Disposable evaluation project; this does not provision or deploy anything. */
export function createLocalProject(destination) {
  const target = resolve(destination);
  // An existing directory is never an invitation to overwrite its files.
  mkdirSync(target, { mode: 0o700 });
  const sourcePackage = JSON.parse(readFileSync(new URL('package.json', analytics), 'utf8'));
  const rootPackage = JSON.parse(readFileSync(new URL('package.json', repository), 'utf8'));
  const vendor = resolve(target, 'vendor/analytics');
  mkdirSync(vendor, { recursive: true });
  cpSync(new URL('src/', analytics), resolve(vendor, 'src'), {
    recursive: true, filter: path => statSync(path).isDirectory() || path.endsWith('.ts'),
  });
  cpSync(new URL('schema/', analytics), resolve(vendor, 'schema'), { recursive: true });
  cpSync(new URL('LICENSE', repository), resolve(vendor, 'LICENSE'));
  const packaged = { name: sourcePackage.name, version: sourcePackage.version, private: true,
    type: sourcePackage.type, main: sourcePackage.main, exports: sourcePackage.exports,
    dependencies: sourcePackage.dependencies, license: 'MIT' };
  writeFileSync(resolve(vendor, 'package.json'), JSON.stringify(packaged, null, 2) + '\n');
  writeFileSync(resolve(target, 'package.json'), JSON.stringify({
    name: 'analytics-local-evaluation', private: true, type: 'module',
    packageManager: rootPackage.packageManager, engines: rootPackage.engines,
    scripts: {
      'db:local': 'wrangler d1 migrations apply analytics-local-example --local',
      dev: 'wrangler dev --local --ip 127.0.0.1',
    },
    dependencies: { '@gkoreli/analytics': 'file:./vendor/analytics' },
    // Match the tool version evaluated by this local example, not a floating
    // latest release or the production runtime's independently managed build.
    devDependencies: { wrangler: '4.71.0' },
  }, null, 2) + '\n');
  cpSync(new URL('.mise.toml', repository), resolve(target, '.mise.toml'));
  const example = new URL('examples/minimal-worker/', analytics);
  const worker = readFileSync(new URL('worker.ts', example), 'utf8');
  const sourceImport = "from '../../src/index.js'";
  if (!worker.includes(sourceImport)) throw new Error('Example import changed; review the local-project adapter');
  writeFileSync(resolve(target, 'worker.ts'), worker.replace(sourceImport, "from '@gkoreli/analytics'")
    .replace("from '../../src/reporting.js'", "from '@gkoreli/analytics/reporting'")
    .replace("from '../../src/contracts.js'", "from '@gkoreli/analytics/contracts'"));
  const config = JSON.parse(readFileSync(new URL('wrangler.jsonc', example), 'utf8'));
  config.d1_databases[0].migrations_dir = './vendor/analytics/schema';
  writeFileSync(resolve(target, 'wrangler.jsonc'), JSON.stringify(config, null, 2) + '\n');
  writeFileSync(resolve(target, '.gitignore'), 'node_modules/\n.wrangler/\n.dev.vars\n');
  writeFileSync(resolve(target, '.dev.vars'),
    `ANALYTICS_HASH_KEY="${randomBytes(32).toString('hex')}"\nADMIN_SECRET="${randomBytes(32).toString('hex')}"\n`,
    { mode: 0o600 });
  writeFileSync(resolve(target, 'README.md'), `# Local analytics evaluation

This is a disposable project generated from local workspace source. No cloud
resources have been provisioned. Use one database per site. Generated local
secrets are in the ignored .dev.vars file; do not commit or share that file.

Confirm Node 24.14.1 and pnpm 9.15.4, then run:

    pnpm install
    pnpm db:local
    pnpm dev

Installation needs package-registry access or a populated cache. After the first
install, retain pnpm-lock.yaml and use pnpm install --frozen-lockfile for repeats.
The .mise.toml and packageManager fields preserve the evaluated tool versions;
use your runtime manager if it does not automatically apply those pins.

Visit /notes, then /stats or /api/stats?traffic=all at the printed local address. Read
analytics.observation_stored before treating a response as a stored event. The
API's totals.views counts events; totals.dailyClients counts rotating daily
identifiers. Neither is a people count. byKind and byAgent explain composition;
an unsigned agent name is a declaration. Missing referrers leave origin unknown.
analytics.example_report_calculation logs each report's provider-returned work
counters. Those are local, last-attempt counters, not production billing.

The report uses the package cache and durable D1 admission. The example allows
24 cold fills and 1,000,000 reported reads per UTC day, with 7d/30d selections.
The read threshold stops later fills; it does not cancel an admitted SQL query.
Unknown work keeps admission closed for that day. Cache hits remain available.
Calculation/admission queries are separate work. Choose limits for your site.
The cache keeps a result up to one hour, capped at UTC midnight; owner marks and
new traffic become visible after expiry. Repeat db:local to apply ordered schema
upgrades; the issued baseline stays unchanged. Public use needs separate
secrets, a database and explicit privacy, retention and recovery decisions.
No deployment command is supplied. This local trial establishes no adoption,
human accuracy or real audience demand.
`);
  return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3) throw new Error('Pass one new destination directory');
  console.log(`Created local evaluation project: ${createLocalProject(process.argv[2])}`);
}
