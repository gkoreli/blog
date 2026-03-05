import { cleanDist, copyStaticAssets, buildHTML, bundleClient } from './build.js';

cleanDist();
copyStaticAssets();
await buildHTML();
await bundleClient();
