import Fastify from 'fastify';
import { dashboard, responseSchema } from './database.mjs';

const app = Fastify({ logger: false });
app.get('/health', () => ({ ready: true }));
app.addHook('preHandler', (req, reply, done) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  if (req.url !== '/health' && req.headers.authorization !== 'Bearer local-test-token') {
    reply.code(401).send({ error: 'unauthorized' });
    return;
  }
  done();
});
app.get('/dashboard/:id', { schema: { response: { 200: responseSchema } } }, (req, reply) => {
  const id = req.params.id;
  if (!/^\d+$/.test(id)) return reply.code(400).send({ error: 'invalid-id' });
  const value = dashboard(Number(id));
  if (!value) return reply.code(404).send({ error: 'missing-user' });
  return value;
});
await app.listen({ port: Number(process.env.PORT ?? 3000), host: '127.0.0.1' });
