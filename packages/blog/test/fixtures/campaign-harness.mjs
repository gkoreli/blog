import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

/** Local handler tests use the production SQL and an isolated in-memory database. */
export function campaignHarness(t, handleSend, { recipients = 1 } = {}) {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of ['0001_create_subscribers.sql', '0003_add_bounced_at.sql',
    '0004_delivery_logs.sql', '0005_confirmation_admission.sql', '0006_campaign_admission.sql']) {
    sqlite.exec(readFileSync(new URL(`../../../newsletter/migrations/${name}`, import.meta.url), 'utf8'));
  }
  for (let index = 0; index < recipients; index++) {
    sqlite.prepare(`INSERT INTO subscribers (id,email,status,unsubscribe_token,confirmed_at)
      VALUES (?,?, 'active',?,datetime('now'))`).run(`subscriber-${index}`, `recipient-${index}@example.invalid`, `unsubscribe-${index}`);
  }
  t.after(() => sqlite.close());
  let logFailure = false;
  let completionFailure = false;
  let lostAdmissionAck = false;
  function prepared(sql, values = []) {
    const execute = () => {
      if (logFailure && /INSERT INTO delivery_logs/.test(sql)) throw new Error('private synthetic log failure');
      if (completionFailure && /UPDATE newsletter_campaign_runs/.test(sql)) throw new Error('private synthetic completion failure');
      const statement = sqlite.prepare(sql);
      if (statement.columns().length) return { success: true, results: statement.all(...values), meta: { changes: 0 } };
      const changes = Number(statement.run(...values).changes);
      if (lostAdmissionAck && changes === 1 && /INSERT INTO newsletter_campaign_runs/.test(sql)) {
        lostAdmissionAck = false;
        throw new Error('private synthetic lost admission acknowledgment');
      }
      return { success: true, results: [], meta: { changes } };
    };
    return {
      bind(...next) { return prepared(sql, next); },
      async first(column) { const row = sqlite.prepare(sql).get(...values); return row ? column ? row[column] : row : null; },
      async all() { return execute(); }, async run() { return execute(); }, execute,
    };
  }
  const env = { ADMIN_SECRET: 'synthetic-admin', RESEND_API_KEY: 'synthetic-provider-key', DB: {
    prepare: prepared,
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try { const results = statements.map(statement => statement.execute()); sqlite.exec('COMMIT'); return results; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  } };
  const mail = [], logs = [];
  let provider = async (_url, init) => Response.json({ data: JSON.parse(init.body).map(() => ({ id: crypto.randomUUID() })) });
  t.mock.method(globalThis, 'fetch', async (url, init) => { mail.push({ url, ...init }); return provider(url, init); });
  t.mock.method(console, 'log', (...event) => { logs.push(event); });
  const body = { campaign_id: 'campaign-one', subject: 'Private subject marker', html: '<p>Private content marker</p>', text: 'Private text marker' };
  return {
    sqlite, env, body, mail, logs,
    async send(payload = body, options = {}) {
      return handleSend(new Request('https://fixture.invalid/api/send', {
        method: 'POST', headers: { authorization: 'Bearer synthetic-admin', 'content-type': 'application/json', ...options.headers },
        body: options.rawBody ?? JSON.stringify(payload), ...options.init,
      }), env);
    },
    row(id = 'campaign-one') { return sqlite.prepare('SELECT * FROM newsletter_campaign_runs WHERE campaign_id=?').get(id); },
    deliveryCount() { return sqlite.prepare('SELECT COUNT(*) AS n FROM delivery_logs').get().n; },
    setProvider(value) { provider = value; },
    failDeliveryLog() { logFailure = true; },
    failCompletion() { completionFailure = true; },
    loseAdmissionAck() { lostAdmissionAck = true; },
  };
}
