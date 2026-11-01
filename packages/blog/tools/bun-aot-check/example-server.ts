const port = Number(process.env.PORT ?? 3000);
Bun.serve({
  port,
  fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/health') return Response.json({ status: 'ok' });
    if (path === '/echo' && request.method === 'POST') {
      return request.json().then(value => Response.json(value));
    }
    return new Response('missing', { status: 404 });
  },
});
