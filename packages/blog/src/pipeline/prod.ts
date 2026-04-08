import { loadLocalEnv } from './env.js';
import { cleanDist, copyStaticAssets, buildHTML, bundleClient } from './build.js';

loadLocalEnv();

cleanDist();
copyStaticAssets();
await buildHTML();
await bundleClient();
