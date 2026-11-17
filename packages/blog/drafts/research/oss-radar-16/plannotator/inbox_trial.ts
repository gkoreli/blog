/** Copy to the pinned upstream root; run with Bun and a fresh output directory.
 * The store, JSONL log, credential and wake/delivery classes are real.
 * Only the T3 RPC endpoint is scripted; no provider or account is contacted.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { InboxStore } from "@plannotator/shared/inbox/store";
import type { InboxMessage } from "@plannotator/core/inbox-types";
import type { InboxReplyCommand } from "@plannotator/shared/inbox/connection";
import { createInboxT3Wake, type InboxT3Wake } from "./packages/server/inbox-t3-wake";
import { T3Credentials } from "@plannotator/t3-code/auth";
import type { T3Rpc } from "@plannotator/t3-code/t3-client";

const source = dirname(fileURLToPath(import.meta.url));
const outputArg = process.argv[2];
assert(outputArg, "Pass a fresh output directory");
const output = resolve(outputArg);
const rawExpected: unknown = JSON.parse(readFileSync(join(source, "oss-radar-source-hashes.json"), "utf8"));
const expectedSources = z.record(z.string(), z.object({ sha256: z.string(), bytes: z.number() })).parse(rawExpected);
for (const [name, expected] of Object.entries(expectedSources)) {
  const bytes = readFileSync(join(source, name));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expected.sha256, name);
  assert.equal(bytes.length, expected.bytes, name);
}
mkdirSync(output, { mode: 0o700 });
const SESSION = "00000000-0000-4000-8000-000000000016";
const endpoint = new URL("http://127.0.0.1:3773/mcp");
const cases: Array<Record<string, unknown>> = [];
const activeWakes: InboxT3Wake[] = [];
let clock = Date.parse("2026-11-17T17:00:00Z");
const now = () => clock;
const stamp = () => new Date(clock++);

function record(name: string, fields: Record<string, unknown>) {
  cases.push({ case: name, ...fields });
  writeFileSync(join(output, "progress.json"), JSON.stringify(cases, null, 2) + "\n");
}

function makeWorld(name: string, host = "t3", session = SESSION, promised = false) {
  const dir = join(output, name);
  mkdirSync(dir);
  const store = InboxStore.open(dir, { now: stamp });
  const project = store.ensureProject({ name: "Radar fixture", root: join(dir, "project") });
  const asked = store.sendMessage({
    project_id: project.id,
    author: { kind: "agent", host, session, name: "Fixture agent" },
    body: "Which parser should I use for the release notes?",
    ...(promised ? { wakes: true } : {}),
  }).message;
  const reply = store.sendReply(asked.id, {
    words: "Use the streaming parser and preserve the original timestamps.",
    idempotency_key: `reply-${name}`,
  }).reply;
  return { dir, store, asked, reply };
}

function readAs(store: InboxStore, thread: string, reader: string | null) {
  store.markAgentChecked(thread, Number.POSITIVE_INFINITY, undefined, reader);
  store.settleReadPast(thread, reader);
}

function commandOf(item: InboxMessage): InboxReplyCommand {
  return { type: "reply", id: item.id, thread_id: item.thread_id,
    reply_to: item.reply_to, subject: "Radar fixture", body: item.body,
    url: `http://127.0.0.1:3773/inbox/${item.thread_id}` };
}

function login(dir: string) {
  new T3Credentials(dir, endpoint).save({ endpoint: endpoint.href,
    epoch: "radar-fixture-epoch", tokens: { access_token: "radar-fixture-not-a-real-token",
      token_type: "Bearer", scope: "orchestration:operate settings:write" } });
}

type Outcome = "ok" | "transport" | "not_found";
function scriptedT3() {
  const state: { read: Outcome; send: Outcome } = { read: "ok", send: "ok" };
  const calls: Array<{ method: string; args: Record<string, unknown> }> = [];
  const accepted: Array<Record<string, unknown>> = [];
  const rpc: T3Rpc = {
    async call(method, args) {
      calls.push({ method, args });
      assert.equal(args.threadId, SESSION);
      const outcome = method === "t3_thread_read" ? state.read : state.send;
      if (outcome === "transport") throw new Error("fetch failed: fixture transport unavailable");
      if (outcome === "not_found") throw new Error("thread_not_found: The thread was not found.");
      if (method === "t3_thread_read") return {
        thread: { threadId: SESSION, projectId: "fixture", status: "idle",
          activeRunId: null, latestRunId: null, itemCount: 0, worktreePath: null,
          archived: false, pendingRequestCount: 0 },
        recentRuns: [], items: [], nextPosition: null, hasMore: false,
      };
      assert.equal(method, "t3_thread_send");
      accepted.push(args);
      return { threadId: SESSION, messageId: `fixture-message-${accepted.length}`,
        runId: "fixture-run", status: "queued", delivery: "queued" };
    },
  };
  return { state, calls, accepted, rpc };
}

function attach(store: InboxStore, dir: string, rpc: T3Rpc) {
  const logs: string[] = [];
  const wake = createInboxT3Wake({ store, dataDir: dir, commandOf,
    connect: async () => rpc, now, grantCheckMs: 60_000, log: line => logs.push(line) });
  activeWakes.push(wake);
  store.setDeliveryPresence({ connection: () => null, askerLive: () => false,
    wakeGone: session => wake.gone(session) });
  return { wake, logs };
}

try {
  const own = makeWorld("readers");
  for (const reader of ["ses_another_reader", null]) {
    assert.equal(own.store.readSettles(own.reply, reader), false);
    readAs(own.store, own.asked.thread_id, reader);
    assert.deepEqual(own.store.pendingReplies(SESSION).map(m => m.id), [own.reply.id]);
  }
  const reopened = InboxStore.open(own.dir, { now: stamp });
  assert.deepEqual(reopened.pendingReplies(SESSION).map(m => m.id), [own.reply.id]);
  readAs(reopened, own.asked.thread_id, SESSION);
  assert.deepEqual(reopened.pendingReplies(SESSION), []);
  record("other_and_unnamed_reader_then_owner_after_reopen", {
    pending_before_owner: [own.reply.id], owner_read_settled: true,
    thread_after: reopened.message(own.asked.thread_id), reply_after: reopened.message(own.reply.id),
  });

  for (const [name, host, session] of [["raw_mcp", "cursor", "ses_original"],
                                    ["wrong_host", "cursor", SESSION]] as const) {
    const world = makeWorld(name, host, session);
    readAs(world.store, world.asked.thread_id, "ses_restarted");
    assert.deepEqual(world.store.pendingReplies(session), []);
    record(name, { newcomer_read_settled: true, thread_after: world.store.message(world.asked.thread_id) });
  }

  const late = makeWorld("late_grant");
  const lateT3 = scriptedT3();
  const first = attach(late.store, late.dir, lateT3.rpc);
  await first.wake.sweep();
  assert.equal(late.store.message(late.reply.id)?.t3_wait, "sign_in");
  assert.equal(first.wake.gone(SESSION), false);
  readAs(late.store, late.asked.thread_id, "ses_before_grant");
  assert.equal(late.store.pendingReplies(SESSION).length, 1);
  first.wake.stop();
  const lateStore = InboxStore.open(late.dir, { now: stamp });
  assert.equal(lateStore.pendingReplies(SESSION).length, 1);
  const second = attach(lateStore, late.dir, lateT3.rpc);
  await second.wake.sweep();
  login(late.dir);
  await second.wake.sweep();
  assert.equal(lateT3.accepted.length, 1);
  const submitted = lateT3.accepted[0];
  assert(submitted);
  assert.equal(submitted.threadId, SESSION);
  assert.equal(submitted.clientRequestId, `plannotator-inbox-${late.reply.id}`);
  assert.equal(typeof submitted.message, "string");
  assert(String(submitted.message).includes(late.reply.body));
  assert.equal(lateStore.message(late.reply.id)?.delivery?.state, "delivered");
  await second.wake.sweep();
  assert.equal(lateT3.accepted.length, 1);
  second.wake.stop();
  const deliveredStore = InboxStore.open(late.dir, { now: stamp });
  assert.equal(deliveredStore.pendingReplies(SESSION).length, 0);
  assert.equal(deliveredStore.message(late.reply.id)?.delivery?.session, SESSION);
  record("late_grant_after_other_reader_and_restart", { accepted: lateT3.accepted,
    reply_after: deliveredStore.message(late.reply.id), logs: [...first.logs, ...second.logs] });

  const transport = makeWorld("transport");
  login(transport.dir);
  const down = scriptedT3();
  down.state.read = "transport";
  const transportWake = attach(transport.store, transport.dir, down.rpc);
  await transportWake.wake.sweep();
  assert.equal(transportWake.wake.gone(SESSION), false);
  readAs(transport.store, transport.asked.thread_id, "ses_during_outage");
  assert.equal(transport.store.pendingReplies(SESSION).length, 1);
  assert.equal(down.accepted.length, 0);
  down.state.read = "ok";
  clock += 31_000;
  await transportWake.wake.sweep();
  assert.equal(down.accepted.length, 1);
  assert.equal(transport.store.message(transport.reply.id)?.delivery?.state, "delivered");
  transportWake.wake.stop();
  record("transport_outage_preserves_owner_then_retries", { gone_during_outage: false,
    accepted_after_recovery: down.accepted, logs: transportWake.logs });

  const absent = makeWorld("unmatched_grant");
  login(absent.dir);
  const missing = scriptedT3();
  missing.state.read = "not_found";
  const absentWake = attach(absent.store, absent.dir, missing.rpc);
  await absentWake.wake.sweep();
  assert.equal(absentWake.wake.gone(SESSION), false);
  readAs(absent.store, absent.asked.thread_id, "ses_wrong_environment");
  assert.equal(absent.store.pendingReplies(SESSION).length, 1);
  absentWake.wake.stop();
  record("lookup_under_unmatched_grant_does_not_prove_gone", {
    gone: false, pending: [absent.reply.id], calls: missing.calls, logs: absentWake.logs });

  for (const promised of [false, true]) {
    const gone = makeWorld(promised ? "promised_gone" : "unpromised_gone", "t3", SESSION, promised);
    login(gone.dir);
    const ended = scriptedT3();
    ended.state.send = "not_found";
    const endedWake = attach(gone.store, gone.dir, ended.rpc);
    await endedWake.wake.sweep();
    assert.equal(endedWake.wake.gone(SESSION), true);
    assert.equal(gone.store.pendingReplies(SESSION).length, 1);
    readAs(gone.store, gone.asked.thread_id, "ses_after_ended");
    assert.equal(gone.store.pendingReplies(SESSION).length, promised ? 1 : 0);
    const pendingAfterReader = gone.store.pendingReplies(SESSION).map(m => m.id);
    ended.state.send = "ok";
    endedWake.wake.noteToolCall(SESSION);
    assert.equal(endedWake.wake.gone(SESSION), false);
    await endedWake.wake.sweep();
    if (promised) assert.equal(gone.store.message(gone.reply.id)?.delivery?.state, "delivered");
    endedWake.wake.stop();
    record(promised ? "explicit_wake_stays_strict_when_gone" : "known_thread_ended_newcomer_can_settle", {
      promised, pending_after_new_reader: pendingAfterReader, tool_call_cleared_gone: true,
      calls: ended.calls, reply_after: gone.store.message(gone.reply.id), logs: endedWake.logs });
  }
  const cached = Object.keys(require.cache).map(path => resolve(path));
  const sources: Record<string, { sha256: string; bytes: number }> = {};
  for (const path of cached) {
    const local = relative(source, path);
    if (local.startsWith("packages/") && statSync(path).isFile()) {
      const bytes = readFileSync(path);
      sources[local] = { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length };
    }
  }
  assert.deepEqual(sources, expectedSources, "The executed source closure differs from the pinned trial");
  const result = { source_commit: "969084882013ac7634283ebca06f3118e766d30d", release: "v0.28.67",
    bun: process.versions.bun, system: process.platform, arch: process.arch,
    cases, loaded_upstream_sources: Object.fromEntries(Object.entries(sources).sort()),
    limits: ["scripted T3 RPC boundary; no real T3 turn", "component store/wake path; no Inbox UI or MCP-route evaluation",
      "isolated direct dependency pins, not full upstream workspace install"] };
  writeFileSync(join(output, "results.json"), JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ cases: cases.length, upstream_sources: Object.keys(sources).length,
    result: join(output, "results.json") }));
} finally {
  for (const wake of activeWakes) wake.stop();
}
