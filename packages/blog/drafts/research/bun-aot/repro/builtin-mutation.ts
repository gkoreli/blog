try {
  const result = Reflect.set(Array.prototype, 'push', () => 99);
  console.log(JSON.stringify({ replaced: result }));
} catch (error) {
  console.log(JSON.stringify({ error: error instanceof Error ? error.name : String(error) }));
}
