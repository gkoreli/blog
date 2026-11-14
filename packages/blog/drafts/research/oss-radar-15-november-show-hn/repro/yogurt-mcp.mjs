// Real protocol/socket modules with a wholly synthetic store; no recording or model.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { connect } from 'node:net';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [modules, fixture, output] = process.argv.slice(2).map(value => resolve(value));
assert(modules && fixture && output);
await mkdir(fixture);
const { createMcp } = await import(pathToFileURL(join(modules, 'server.ts')));
const { serveMcp } = await import(pathToFileURL(join(modules, 'socket.ts')));
let enabled = false;
let reads = 0;
const meeting = { id: 'fictional-meeting', title: 'Synthetic planning meeting', startedAt: 0,
  endedAt: 1000, state: 'done', attendees: [], app: 'Fictional call', trashedAt: null };
const store = {
  meeting(id) { reads++; return id === meeting.id ? meeting : undefined; },
  meetings() { reads++; return [meeting]; },
  segments() { reads++; return [{ startMs: 0, endMs: 1000, speaker: 'me', track: 'me', text: 'ONLY_SYNTHETIC_TRANSCRIPT' }]; },
  notes() { reads++; return { mine: 'Synthetic notes', enhanced: 'Synthetic summary' }; },
  search() { reads++; return []; },
};
const mcp = createMcp({ store, enabled: () => enabled, me: () => 'Fixture Person',
  version: 'research-fixture', audio: async () => [] });
const socketPath = join(fixture, 'meeting.sock');
const server = await serveMcp(socketPath, mcp, () => {});
const mode = (await stat(socketPath)).mode & 0o777;
assert.equal(mode, 0o600);
async function client(name) {
  const socket = connect(socketPath);
  await once(socket, 'connect');
  socket.setEncoding('utf8');
  let buffer = '';
  let next = 1;
  const pending = new Map();
  socket.on('data', chunk => {
    buffer += chunk;
    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const row = JSON.parse(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1);
      const accept = pending.get(row.id); pending.delete(row.id); accept?.(row);
    }
  });
  async function request(method, params) {
    const id = next++;
    const answer = new Promise(resolveAnswer => pending.set(id, resolveAnswer));
    socket.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return Promise.race([answer, new Promise((_, reject) => {
      const timer = setTimeout(() => reject(new Error('Fixture request timed out')), 5000); timer.unref();
    })]);
  }
  await request('initialize', { protocolVersion: '2025-06-18', clientInfo: { name, version: 'fixture' } });
  return { name, socket, request };
}
const clients = await Promise.all([client('Fixture A'), client('Fixture B')]);
const phases = [];
for (const [phase, value] of [['off', false], ['on', true], ['off-again', false]]) {
  enabled = value;
  const before = reads;
  const results = [];
  for (const c of clients) {
    const reply = await c.request('tools/call', { name: 'get_transcript', arguments: { id: meeting.id } });
    const isError = reply.result?.isError === true;
    const containsFixture = JSON.stringify(reply).includes('ONLY_SYNTHETIC_TRANSCRIPT');
    assert.equal(isError, !value); assert.equal(containsFixture, value);
    results.push({ client: c.name, refused: isError, syntheticTranscriptReturned: containsFixture });
  }
  if (!value) assert.equal(reads, before);
  phases.push({ phase, storeReads: reads - before, results });
}
const connectedNames = server.clients().sort();
assert.deepEqual(connectedNames, ['Fixture A', 'Fixture B']);
await Promise.all(clients.map(async c => { c.socket.end(); await once(c.socket, 'close'); }));
await server.close();
const receipt = { sourceCommit: 'ada44ea930d34b11742e2febc5b4f129261124cb', node: process.version,
  socketMode: mode.toString(8), phases, connectedNames, actualMeetingDataUsed: false,
  microphoneUsed: false, modelServiceCalls: 0, userConfigurationChanged: false,
  scope: 'Two same-user connections to the unchanged MCP/socket modules with an in-memory synthetic store; not full-app privacy or transcription acceptance.' };
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ globalGateVerified: true, bothClientsReadWhileEnabled: true, subsequentReadsBlockedAfterDisable: true, socketMode: mode.toString(8) }));
