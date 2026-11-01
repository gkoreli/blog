import { DatabaseSync } from 'node:sqlite';

// Preseed outside timing. The working directory holds the same read-only file.
const db = new DatabaseSync(process.env.DB_PATH ?? 'fixture.sqlite', { readOnly: true });

const readUser = db.prepare('SELECT id, name, bio FROM users WHERE id = ?');
const readOrders = db.prepare('SELECT id, cents FROM orders WHERE user_id = ? ORDER BY id');
const readSummary = db.prepare('SELECT COUNT(*) AS count, SUM(cents) AS cents FROM orders WHERE user_id = ?');
const readSettings = db.prepare('SELECT theme FROM settings WHERE user_id = ?');

export function dashboard(id) {
  const user = readUser.get(id);
  if (!user) return null;
  return {
    user,
    orders: readOrders.all(id),
    summary: readSummary.get(id),
    settings: readSettings.get(id),
    padding: 'p'.repeat(100),
  };
}

export const responseSchema = {
  type: 'object',
  required: ['user', 'orders', 'summary', 'settings', 'padding'],
  properties: {
    user: {
      type: 'object', required: ['id', 'name', 'bio'],
      properties: { id: { type: 'integer' }, name: { type: 'string' }, bio: { type: 'string' } },
    },
    orders: {
      type: 'array', items: {
        type: 'object', required: ['id', 'cents'],
        properties: { id: { type: 'integer' }, cents: { type: 'integer' } },
      },
    },
    summary: {
      type: 'object', required: ['count', 'cents'],
      properties: { count: { type: 'integer' }, cents: { type: 'integer' } },
    },
    settings: {
      type: 'object', required: ['theme'], properties: { theme: { type: 'string' } },
    },
    padding: { type: 'string' },
  },
};
