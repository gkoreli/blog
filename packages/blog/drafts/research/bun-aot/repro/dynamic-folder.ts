const name: string = process.argv[2] ?? 'alpha';
const module: unknown = await import('./plugins/' + name + '.ts');
if (typeof module !== 'object' || module === null || !('value' in module) || typeof module.value !== 'number') throw new Error('Invalid plugin');
console.log(JSON.stringify({ result: module.value + 1 }));
