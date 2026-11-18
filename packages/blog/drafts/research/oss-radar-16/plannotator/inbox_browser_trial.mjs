/** Exercise the published macOS binary, its browser UI and its MCP read route.
 * Args: PLANNOTATOR_BINARY CHROME_BINARY COMPONENT_DEPS MCP_DEPS FRESH_OUTPUT
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";

const [binary, chrome, browserDeps, mcpDeps, output] = process.argv.slice(2).map(value => resolve(value));
const { chromium } = createRequire(join(browserDeps, "package.json"))("playwright-core");
const { Client, StreamableHTTPClientTransport } =
  createRequire(join(mcpDeps, "package.json"))("@modelcontextprotocol/client");
const binarySha256 = createHash("sha256").update(readFileSync(binary)).digest("hex");
assert.equal(binarySha256, "c383a5ff5338af20ced2c0090926e0ecd6a6019dcdd4112901bbb859e4186c06");
mkdirSync(output, { mode: 0o700 });
const data = join(output, "data");
const project = join(output, "fixture-project");
mkdirSync(data);
mkdirSync(project);
const registry = join(data, "inbox", "inbox.json");
const sandbox = join(output, "plannotator.sb");
writeFileSync(sandbox, [
  "(version 1)", "(allow default)", "(deny file-write*)",
  `(allow file-write* (subpath ${JSON.stringify(output)}) (literal "/dev/null"))`,
  `(deny file-read-data (subpath ${JSON.stringify(process.env.HOME)}))`,
  "(deny network*)", '(allow network-bind (local ip "localhost:*"))',
  '(allow network-inbound (local ip "localhost:*"))',
  '(allow network-outbound (remote ip "localhost:*"))',
].join("\n"));
const evidence = { version: "v0.29.0", commit: "55e6bbd2b16580b23b5926b235a314a17591d12a", binarySha256, cases: [] };
function save(name, fields) {
  evidence.cases.push({ name, ...fields });
  writeFileSync(join(output, "results.json"), JSON.stringify(evidence, null, 2) + "\n");
}

async function launch(attempt) {
  const log = openSync(join(output, `server-${attempt}.log`), "w", 0o600);
  const proc = spawn("/usr/bin/sandbox-exec", ["-f", sandbox, binary, "inbox", "--no-open"], {
    cwd: project,
    env: { PATH: "/usr/bin:/bin", HOME: process.env.HOME, TMPDIR: output,
      PLANNOTATOR_DATA_DIR: data, PLANNOTATOR_INBOX_CONNECT: "0",
      PLANNOTATOR_UPDATE_CHECK: "0", PLANNOTATOR_AUTO_UPDATE: "0",
      PLANNOTATOR_INBOX_NOTES: "0" },
    stdio: ["ignore", log, log],
  });
  closeSync(log);
  const exited = once(proc, "exit");
  const stop = async () => {
    if (proc.exitCode !== null || proc.signalCode !== null) return;
    proc.kill("SIGTERM");
    if (!(await Promise.race([exited.then(() => true), wait(3000, false, { ref: false })]))) {
      proc.kill("SIGKILL");
      await exited;
    }
  };
  try {
    for (let n = 0; n < 80; n++) {
      if (proc.exitCode !== null) throw new Error("Published Inbox exited. See owned server log.");
      try {
        const entry = JSON.parse(readFileSync(registry, "utf8"));
        if (entry.pid === proc.pid) {
          const url = new URL(entry.url);
          assert(["127.0.0.1", "localhost"].includes(url.hostname));
          if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok) return { url, stop };
        }
      } catch (error) {
        if (error.code !== "ENOENT" && error.name !== "TypeError" && error.name !== "TimeoutError") throw error;
      }
      await wait(100);
    }
    throw new Error("The published Inbox did not open its owned loopback server.");
  } catch (error) {
    await stop();
    throw error;
  }
}

async function connect(base) {
  const client = new Client({ name: "radar-fixture", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL("/mcp", base)));
  return client;
}

const session = "00000000-0000-4000-8000-000000000016";
const question = "Should the fixture keep original timestamps in the release report?";
const answer = "Keep the original timestamps and show them in UTC.";
let server;
let client;
let browser;
try {
  server = await launch(1);
  client = await connect(server.url);
  const sent = await client.callTool({ name: "send_message", arguments: {
    body: question, project_path: project, agent_session: session, agent_host: "t3", agent_name: "Fixture T3",
  }});
  assert(!sent.isError, JSON.stringify(sent));
  const { thread_id: id } = sent.structuredContent;
  assert.match(id, /^msg_[A-Za-z0-9]+$/);
  async function thread() {
    const res = await fetch(new URL(`/api/inbox/threads/${id}`, server.url));
    assert.equal(res.status, 200);
    return (await res.json()).thread;
  }
  async function read(reader) {
    const result = await client.callTool({ name: "read_thread", arguments: {
      thread_id: id, agent_session: reader,
    }});
    assert(!result.isError, JSON.stringify(result));
    return result;
  }
  browser = await chromium.launch({ executablePath: chrome, headless: true,
    args: ["--disable-background-networking", "--disable-component-update", "--disable-sync"] });
  evidence.browser = browser.version();
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
  page.setDefaultTimeout(9000);
  const origin = server.url.origin;
  await page.route("**/*", route => new URL(route.request().url()).origin === origin
    ? route.continue() : route.abort());
  await page.goto(`${origin}/#thread=${id}`);
  await page.getByText(question, { exact: true }).last().waitFor();
  const box = page.getByRole("textbox", { name: /Reply/ });
  if (!(await box.isVisible())) await page.getByRole("button", { name: "Reply", exact: true }).last().click();
  await box.fill(answer);
  const [response] = await Promise.all([
    page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/reply")),
    page.getByRole("button", { name: "Send", exact: true }).last().click(),
  ]);
  assert(response.ok(), `Reply route returned ${response.status()}`);
  await page.getByText(answer, { exact: true }).last().waitFor();
  const original = await thread();
  const reply = original.messages.find(m => m.body === answer);
  assert(reply && reply.author.kind === "person");
  assert(!original.messages[0].wakes);
  save("browser_reply", { http_status: response.status(), author: reply.author.kind,
    no_wake_promised: !original.messages[0].wakes, delivery: reply.delivery ?? null });
  const waiting = await page.locator("body").innerText();
  await page.screenshot({ path: join(output, "browser-reply.png") });

  const other = await read("ses_other_fixture_reader");
  const subsequent = await thread();
  assert.equal(subsequent.messages[0].agent_checked_seq ?? 0, original.messages[0].agent_checked_seq ?? 0);
  assert.equal(subsequent.messages.find(m => m.id === reply.id)?.delivery ?? null, null);
  save("other_mcp_reader", { reply_in_response: JSON.stringify(other).includes(answer),
    checked_mark_advanced: false, delivery: null });
  await client.close();
  await browser.close();
  browser = undefined;
  await server.stop();
  server = await launch(2);
  client = await connect(server.url);
  const reopened = await thread();
  assert(reopened.messages.some(m => m.id === reply.id && m.body === answer));
  assert.equal(reopened.messages.find(m => m.id === reply.id)?.delivery ?? null, null);
  const intended = await read(session);
  assert(JSON.stringify(intended).includes(answer));
  const final = await thread();
  const finalReply = final.messages.find(m => m.id === reply.id);
  assert(finalReply?.delivery?.state === "delivered"
    || (final.messages[0].agent_checked_seq ?? 0) > (reopened.messages[0].agent_checked_seq ?? 0),
  "The intended reader did not settle the reply");
  save("original_mcp_reader_after_restart", { preserved_body: true, reply_in_response: true,
    checked_mark_advanced: (final.messages[0].agent_checked_seq ?? 0) > (reopened.messages[0].agent_checked_seq ?? 0),
    delivery_state: finalReply?.delivery?.state ?? null });
  writeFileSync(join(output, "browser-body.txt"), waiting, { mode: 0o600 });
  console.log(JSON.stringify(evidence));
} finally {
  await client?.close().catch(() => {});
  await browser?.close().catch(() => {});
  await server?.stop();
}
