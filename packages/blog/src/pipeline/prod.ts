import { loadLocalEnv } from './env.js';
import { cleanDist, buildComponentStyles, copyStaticAssets, buildHTML, bundleClient } from './build.js';

loadLocalEnv();

cleanDist();
buildComponentStyles();
copyStaticAssets();
await buildHTML();
await bundleClient();
