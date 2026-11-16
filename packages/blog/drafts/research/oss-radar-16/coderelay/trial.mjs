import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { HubStore, createHubServer } = require("./hub.cjs");
const sourceSha = "ba0f79b7d81c3508e5d6fd95fd915b0babf54ac8";
const dir = mkdtempSync(join(tmpdir(), "radar16-hub-trial-"));
let store = new HubStore(dir);
let server;
const checks = [];
const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);

try {
  server = await createHubServer(store, { host: "127.0.0.1", port: 0 });
  const baseUrl = `http://127.0.0.1:${server.port}`;
  async function request(path, credential, body) {
    const headers = { "content-type": "application/json" };
    if (credential) headers.authorization = `Bearer ${credential}`;
    const response = await fetch(baseUrl + path, {
      method: body === undefined ? "GET" : "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }
  async function post(path, credential, body, status) {
    const result = await request(path, credential, body);
    assert.equal(result.status, status, `${path}: ${JSON.stringify(result.body)}`);
    return result.body;
  }
  const alice = await post("/api/bootstrap", null, {
    token: store.setupToken, teamName: "Fixture team", repo: "fixture.invalid/repo", displayName: "Alice",
  }, 201);
  const inviteBob = await post("/api/invites", alice.credential, {}, 201);
  const bob = await post("/api/join", null, { token: inviteBob.token, displayName: "Bob" }, 201);
  const inviteEve = await post("/api/invites", alice.credential, {}, 201);
  const eve = await post("/api/join", null, { token: inviteEve.token, displayName: "Eve" }, 201);
  const snapshot = async (credential) => {
    const response = await request("/api/snapshot", credential);
    assert.equal(response.status, 200);
    return response.body;
  };
  const bobId = (await snapshot(bob.credential)).selfId;
  const task = async (credential, id) => (await snapshot(credential)).tasks.find((item) => item.id === id);
  const publish = (credential, message, status = 200) => post("/api/publish", credential, message, status);
  const decide = (id, status = 200) => post("/api/tasks/decide", bob.credential, {
    taskId: id, decision: "accepted", threadId: "fixture-bob-thread",
  }, status);
  async function propose(text) {
    await publish(alice.credential, { type: "post_task", assigneeId: bobId, text,
      contract: { branch: "contract/api", path: "api/schema.yaml", sha: A } });
    return (await snapshot(bob.credential)).tasks.find((item) => item.text === text).id;
  }
  assert.equal((await request("/api/snapshot")).status, 401);
  checks.push({ condition: "snapshot_requires_credential", status: 401 });

  const stale = await propose("Stale acceptance fixture");
  assert.equal((await task(bob.credential, stale)).contract.sha, A);
  await publish(alice.credential, { type: "revise_contract", taskId: stale, sha: B });
  await publish(bob.credential, { type: "agree_contract", taskId: stale, sha: A }, 409);
  const before = await task(bob.credential, stale);
  assert.equal(before.contractAwaiting, "assignee");
  assert.equal(before.contract.sha, B);
  checks.push({ condition: "explicit_agreement_with_stale_A", status: 409, currentPin: "B", state: before.status });
  await decide(stale);
  const accepted = await task(bob.credential, stale);
  assert.equal(accepted.status, "accepted");
  assert.equal(accepted.contractAwaiting, null);
  assert.equal(accepted.contract.sha, B);
  checks.push({ condition: "manual_accept_after_author_revision_without_observed_sha", status: 200,
    currentPin: "B", state: accepted.status, contractAwaiting: null });

  const current = await propose("Current agreement fixture");
  await publish(alice.credential, { type: "revise_contract", taskId: current, sha: B });
  await publish(bob.credential, { type: "agree_contract", taskId: current, sha: B });
  await decide(current);
  assert.equal((await task(bob.credential, current)).contract.sha, B);
  checks.push({ condition: "explicit_current_B_then_accept", agreementStatus: 200, acceptanceStatus: 200, currentPin: "B" });
  await publish(alice.credential, { type: "revise_contract", taskId: current, sha: C }, 404);
  checks.push({ condition: "revise_accepted_contract", status: 404 });

  const awaiting = await propose("Author consent fixture");
  await publish(bob.credential, { type: "revise_contract", taskId: awaiting, sha: B });
  await decide(awaiting, 409);
  assert.equal((await task(bob.credential, awaiting)).contractAwaiting, "author");
  checks.push({ condition: "accept_assignee_revision_before_author_agreement", status: 409 });
  await publish(alice.credential, { type: "agree_contract", taskId: awaiting, sha: B });
  await decide(awaiting);
  checks.push({ condition: "accept_assignee_revision_after_author_agreement", status: 200, currentPin: "B" });

  const receipt = { branch: "work/authored-fixture", sha: C, description: "Authored fixture: tests passed (no tests actually run)" };
  await publish(eve.credential, { type: "complete_task", taskId: stale, result: receipt }, 403);
  checks.push({ condition: "completion_by_other_member", status: 403 });
  await publish(bob.credential, { type: "complete_task", taskId: stale, result: { ...receipt, sha: "invalid" } }, 400);
  checks.push({ condition: "completion_with_malformed_sha", status: 400 });
  await publish(bob.credential, { type: "complete_task", taskId: stale, result: receipt });
  await publish(bob.credential, { type: "complete_task", taskId: stale, result: receipt }, 409);
  checks.push({ condition: "repeat_completion", status: 409 });
  await server.close();
  server = null;
  store.close();
  store = new HubStore(dir);
  const persisted = store.snapshot(store.authenticate(bob.credential), new Set()).tasks.find((item) => item.id === stale);
  assert.equal(persisted.status, "done");
  assert.equal(persisted.contract.sha, B);
  assert.deepEqual(persisted.result, receipt);
  checks.push({ condition: "completion_receipt_survives_reopen_without_git_or_test_verification", status: "done",
    currentPin: "B", completionSha: "authored-C", receiptPreserved: true });
  console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), sourceSha, environment: { node: process.version,
    effect: "4.0.0-rc.115", ws: "8.21.3", esbuild: "0.27.3", platform: process.platform, arch: process.arch },
    scope: "Unchanged upstream HubStore and loopback HTTP server; actual schemas; isolated owned SQLite; no provider, real team, Git checkout or claimed end-to-end agent trial",
    checks, passed: checks.length }, null, 2));
} finally {
  if (server) await server.close();
  store.close();
}
