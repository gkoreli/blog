interface Entry { id: number; weight: number; next: Entry | undefined }
let entries: Entry[] = [];
function retain(count: number): number {
  const fresh: Entry[] = [];
  let next: Entry | undefined;
  for (let id = 0; id < count; id++) {
    const entry: Entry = { id, weight: (id % 97) / 10, next };
    fresh.push(entry);
    next = entry;
  }
  entries = fresh;
  return entries.length;
}
const count = Number(process.env.RETAIN ?? '100000');
retain(count);
const server = Bun.serve({
  hostname: '127.0.0.1', port: Number(process.env.PORT ?? '0'),
  fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/state') return Response.json({ count: entries.length, first: entries[0]?.id, last: entries.at(-1)?.id });
    if (url.pathname === '/sum') {
      let total = 0;
      for (let i = 0; i < 1000; i++) total += entries[i % entries.length]?.weight ?? 0;
      return Response.json({ total });
    }
    if (url.pathname === '/walk') {
      let node = entries.at(-1);
      let total = 0;
      for (let i = 0; i < 1000 && node; i++) { total += node.weight; node = node.next; }
      return Response.json({ total });
    }
    if (url.pathname === '/release') { entries = []; Bun.gc(true); return Response.json({ count: entries.length }); }
    return new Response('not found', { status: 404 });
  }
});
console.log(JSON.stringify({ port: server.port, count: entries.length }));
