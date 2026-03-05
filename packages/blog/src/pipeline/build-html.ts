import { copyStaticAssets, buildHTML } from './build.js';

copyStaticAssets();
await buildHTML();
