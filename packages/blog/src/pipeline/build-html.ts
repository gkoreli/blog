import { loadLocalEnv } from './env.js';
import { copyStaticAssets, buildHTML } from './build.js';

loadLocalEnv();

copyStaticAssets();
await buildHTML();
