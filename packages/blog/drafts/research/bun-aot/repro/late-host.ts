const path: string = process.argv[2] ?? './plugins/alpha.ts';
const module: unknown = await import(path);
if (typeof module !== 'object' || module === null || !('value' in module) || typeof module.value !== 'number') throw new Error('Invalid plugin');
console.log(JSON.stringify({ result: module.value + 1 }));
