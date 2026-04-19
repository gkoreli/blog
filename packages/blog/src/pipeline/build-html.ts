import { loadLocalEnv } from './env.js';
import { buildComponentStyles, copyStaticAssets, buildHTML } from './build.js';

loadLocalEnv();

buildComponentStyles();
copyStaticAssets();
await buildHTML();
