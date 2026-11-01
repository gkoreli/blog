// Run with Bun from the pinned Keryx root; this inspects actual framework state.
import path from 'node:path';
const lab = process.argv[2];
if (!lab) throw new Error('Pass the study lab directory');
const { api } = await import(path.join(lab, 'keryx/example/backend/index.ts'));
await api.start();
try {
  const port = process.env.WEB_SERVER_PORT;
  if (!port) throw new Error('Set WEB_SERVER_PORT to a free loopback port');
  const url = `http://127.0.0.1:${port}/api/greeting/prompt?name=Goga`;
  const count = async () => (await api.redis.redis.keys('session:*')).length;
  const before = await count();
  for (let n = 0; n < 20; n++) {
    const response = await fetch(url);
    if (response.status !== 200) throw new Error('Greeting failed');
    await response.arrayBuffer();
  }
  const afterNew = await count();
  const first = await fetch(url);
  const cookie = first.headers.get('set-cookie')?.split(';')[0];
  await first.arrayBuffer();
  if (!cookie) throw new Error('Session cookie missing');
  const afterCookieCreated = await count();
  for (let n = 0; n < 20; n++) {
    const response = await fetch(url, { headers: { Cookie: cookie } });
    if (response.status !== 200) throw new Error('Returning greeting failed');
    await response.arrayBuffer();
  }
  const afterReturning = await count();
  if (afterNew - before !== 20 || afterCookieCreated - afterNew !== 1 || afterReturning !== afterCookieCreated) throw new Error('Session-count expectation failed');
  console.log(JSON.stringify({ before, after20NewRequests: afterNew, afterOneCookieCreated: afterCookieCreated, after20ReturningRequests: afterReturning }));
} finally {
  await api.stop();
}

// The framework CLI also exits explicitly; in-memory expiry timers can keep this diagnostic alive.
process.exit(0);
