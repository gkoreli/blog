// Local synthetic sockets; pass a new absolute receipt path. No external providers.
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, resolve, isAbsolute } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { writeFileSync, openSync, closeSync, readFileSync } from "node:fs";
const [outputPath] = process.argv.slice(2);
assert.ok(outputPath && isAbsolute(outputPath), "Pass a new absolute output path");
const output = openSync(outputPath, "wx", 0o600);
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const rootRequire = createRequire(`${repo}/package.json`);
const blogRequire = createRequire(`${repo}/packages/blog/package.json`);
const { Miniflare, Log, LogLevel } = await import(pathToFileURL(rootRequire.resolve("miniflare", { paths: [dirname(rootRequire.resolve("wrangler/package.json"))] })));
const { build, version: esbuildVersion } = await import(pathToFileURL(blogRequire.resolve("esbuild")));
const fixture = `
import { handleConfirmationRequest } from '../newsletter/src/confirmation-request.ts';
import { handleResendWebhook } from '../newsletter/src/webhook.ts';
export default { async fetch(request) {
  const env = {
    RESEND_API_KEY: 'synthetic', TURNSTILE_SECRET_KEY: 'synthetic',
    RESEND_WEBHOOK_SECRET: 'whsec_c3ludGhldGlj',
    SUBSCRIBE_RATE_LIMITER: { async limit() { return { success: true }; } },
    DB: { prepare() { throw new Error('Unexpected database access'); } },
  };
  const response = new URL(request.url).pathname === '/webhook'
    ? await handleResendWebhook(request, env)
    : await handleConfirmationRequest(request, env, 'subscribe');
  response.headers.set('x-native-handler', 'executed');
  return response;
} };
`;
const bundle = await build({ stdin: { resolveDir: `${repo}/packages/blog`, contents: fixture }, bundle: true, write: false, format: "esm", platform: "browser", target: "es2024" });
let providerCalls = 0;
const mf = new Miniflare({
  modules: true,
  script: bundle.outputFiles[0].text,
  compatibilityDate: "2026-03-06",
  cf: {},
  log: new Log(LogLevel.NONE),
  // Consume runtime logs without retaining generated request identifiers.
  handleRuntimeStdio(stdout, stderr) {
    stdout.resume();
    stderr.resume();
  },
  host: "127.0.0.1",
  port: 0,
  outboundService() {
    providerCalls++;
    throw new Error("Provider outbound forbidden");
  }
});
const results = [];
try {
  const url = await mf.ready;
  async function send(label, path, declaredLength, prefix, finish = false) {
    const started = performance.now();
    return await new Promise((resolveResult, reject) => {
      let settled = false;
      const request = http.request(new URL(path, url), { method: "POST", agent: false, headers: {
        "content-type": "application/json",
        ...(declaredLength === null ? { "transfer-encoding": "chunked" }
          : { "content-length": String(declaredLength) }),
      } }, (response) => {
        // Keep only status and controlled measurements, never body/header text.
        response.resume();
        response.on("error", (error) => {
          if (!settled) {
            settled = true;
            clearTimeout(guard);
            request.destroy();
            reject(error);
          }
        });
        response.on("end", () => {
          settled = true;
          clearTimeout(guard);
          if (request.writableEnded !== finish) {
            request.destroy();
            reject(new Error("Request end state must match the framing control"));
            return;
          }
          const result = {
            label,
            status: response.statusCode,
            elapsedMs: Math.round(performance.now() - started),
            handlerExecuted: response.headers["x-native-handler"] === "executed",
            declaredLength,
            framing: declaredLength === null ? "chunked" : "content-length",
            sentBytes: Buffer.byteLength(prefix),
            requestEndedByClient: request.writableEnded
          };
          request.destroy();
          resolveResult(result);
        });
      });
      request.on("error", (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(guard);
          request.destroy();
          reject(error);
        }
      });
      const guard = setTimeout(() => {
        settled = true;
        request.destroy();
        reject(new Error(`${label}: no complete response within 8 seconds while request held open`));
      }, 8e3);
      if (finish) request.end(prefix);
      else {
        request.flushHeaders();
        request.write(prefix);
      }
    });
  }
  results.push(await send("partial JSON Content-Length held open", "/subscribe", 100, '{"email":'));
  results.push(await send("webhook missing auth before body finish", "/webhook", 100, "{"));
  results.push(await send("declared oversized body before body finish", "/subscribe", 5e3, "{"));
  results.push(await send("completed malformed address control", "/subscribe", 12, '{"email":""}', true));
  results.push(await send("chunked actual-byte overflow held open", "/subscribe", null, "x".repeat(4_097)));
  results.push(await send("chunked partial JSON held open", "/subscribe", null, '{"email":'));
  assert.equal(results[0].status, 408);
  assert.ok(results[0].elapsedMs >= 4500 && results[0].elapsedMs < 7e3);
  assert.equal(results[1].status, 401);
  assert.ok(results[1].elapsedMs < 1e3);
  assert.equal(results[2].status, 413);
  assert.ok(results[2].elapsedMs < 1e3);
  assert.equal(results[3].status, 400);
  assert.equal(results[4].status, 413);
  assert.ok(results[4].elapsedMs < 1_000);
  assert.equal(results[5].status, 408);
  assert.ok(results[5].elapsedMs >= 4_500 && results[5].elapsedMs < 7_000);
  assert.equal(results.filter(row => row.framing === "chunked").length, 2);
  assert.ok(results.filter(row => row.framing === "chunked").every(row => !row.requestEndedByClient && row.declaredLength === null));
  assert.ok(results.every((row) => row.handlerExecuted));
  assert.equal(providerCalls, 0);
  const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const miniflareRequire = createRequire(rootRequire.resolve("miniflare", { paths: [dirname(rootRequire.resolve("wrangler/package.json"))] }));
  const receipt = {
    checkedAt: new Date().toISOString(),
    runtime: "Miniflare.ready local HTTP proxy + workerd",
    compatibilityDate: "2026-03-06",
    sourceSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    fixtureSha256: sha256(fixture),
    bundleSha256: sha256(bundle.outputFiles[0].text),
    versions: { node: process.versions.node, esbuild: esbuildVersion, miniflare: miniflareRequire("miniflare/package.json").version, workerd: miniflareRequire("workerd/package.json").version },
    limits: ["Local Miniflare proxy and workerd only; production front door unmeasured", "Conflicting/malformed framing and disconnect propagation unmeasured; chunked controls are limited to overflow and incomplete JSON"],
    actualClientSocketFraming: true,
    constructedRequestStreams: false,
    providerCalls,
    productionCalls: 0,
    results
  };
  writeFileSync(output, JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
  console.log(JSON.stringify({ incomingWire: "pass", cases: results.length, providerCalls, productionCalls: 0 }));
} finally {
  closeSync(output);
  await mf.dispose();
}
