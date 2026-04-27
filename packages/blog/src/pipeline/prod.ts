import { loadLocalEnv } from './env.js';
import { cleanDist, buildComponentStyles, copyStaticAssets, buildHTML, validateHtmlOutput, bundleClient } from './build.js';

loadLocalEnv();

cleanDist();
buildComponentStyles();
copyStaticAssets();
await buildHTML();
validateHtmlOutput();
await bundleClient();
