import express from 'express';
import { dashboard } from './database.mjs';

const app = express();
app.disable('etag');
app.disable('x-powered-by');
app.get('/health', (req, res) => res.json({ ready: true }));
app.use(express.json({ limit: '16kb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  next();
});
app.use((req, res, next) => {
  if (req.headers.authorization !== 'Bearer local-test-token') {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
});
app.get('/dashboard/:id', (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    res.status(400).json({ error: 'invalid-id' });
    return;
  }
  const value = dashboard(Number(req.params.id));
  if (!value) res.status(404).json({ error: 'missing-user' });
  else res.json(value);
});
app.listen(Number(process.env.PORT ?? 3000), '127.0.0.1');
