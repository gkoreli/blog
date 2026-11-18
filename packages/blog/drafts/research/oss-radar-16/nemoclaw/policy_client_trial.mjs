/** Exercise the real v0.0.144 blueprint policy client with scripted captures.
 * Args: PINNED_NEMOCLAW_SOURCE PINNED_OPENSHELL_BINARY FRESH_RESULT_JSON
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [source, openshell, output] = process.argv.slice(2).map(value => resolve(value));
const clientPath = "nemoclaw/src/blueprint/openshell-policy.ts";
const boundaryPath = "nemoclaw/src/shared/openshell-policy-boundary.cts";
const { createBlueprintOpenShellPolicyClient } = await import(pathToFileURL(join(source, clientPath)));
const env = { PATH: "/usr/bin:/bin", HOME: process.env.HOME };
function helpCommand(args) {
  const result = spawnSync(openshell, args, { env, input: "", encoding: "utf8", timeout: 5000 });
  assert.equal(result.status, 0, result.stderr || result.error);
  return result.stdout;
}
const version = helpCommand(["--version"]).trim();
assert.equal(version, "openshell 0.0.116");
const getHelp = helpCommand(["policy", "get", "--help"]);
for (const flag of ["--base", "--rev", "--full", "--output"]) assert(getHelp.includes(flag), flag);
const setHelp = helpCommand(["policy", "set", "--help"]);
for (const flag of ["--policy", "--wait"]) assert(setHelp.includes(flag), flag);

const target = { gatewayName: "fixture", sandboxName: "radar" };
const observations = [];
const calls = [];
const replies = [
  JSON.stringify({ scope: "sandbox", sandbox: "radar", status: "effective", policy_source: "global",
    hash: "sha256:fixture-effective", active_version: 6,
    policy: { version: 1, network_policies: { published: { endpoints: [] } } } }),
  "Active: 6\n---\nversion: 1\nnetwork_policies: {}\n",
  "Active: 5\n---\nversion: 1\nnetwork_policies: {}\n",
];
let writeResponse;
const client = createBlueprintOpenShellPolicyClient({
  captureRead: async (command, gateway) => {
    assert.equal(gateway, "fixture");
    calls.push(command);
    assert(replies.length);
    return { stdout: replies.shift() };
  },
  captureWrite: async (command, gateway) => {
    assert.equal(gateway, "fixture");
    calls.push(command);
    return writeResponse;
  },
});
const effective = await client.inspectSandboxPolicy(target);
assert.equal(effective.policySource, "global");
assert.equal(effective.policyIdentity.activeVersion, 6);
assert.deepEqual(Object.keys(effective.effectivePolicy.network_policies), ["published"]);
const base = await client.readSandboxBasePolicy(target);
assert.equal(base.appliedRevision, 6);
assert(!base.document.includes("published"));
const revision = await client.readSandboxPolicyRevision({ ...target, revision: 5 });
assert.equal(revision.appliedRevision, 5);
assert.deepEqual(calls.slice(0, 3), [
  ["openshell", "policy", "get", "-g", "fixture", "--full", "--output", "json", "radar"],
  ["openshell", "policy", "get", "-g", "fixture", "--base", "radar"],
  ["openshell", "policy", "get", "-g", "fixture", "--rev", "5", "--base", "radar"],
]);
const scenarios = [
  ["confirmed_exit", { status: 0 }, "applied"],
  ["gateway_refusal", { status: 1, stderr: "Error: code: 'failed precondition', message: 'fixture policy rejected'" }, "rejected"],
  ["transport", { status: 1, stderr: "tonic::transport::error: fixture disconnected" }, "ambiguous"],
  ["timeout", { status: null, error: { message: "fixture timed out" } }, "ambiguous"],
  ["generic_nonzero", { status: 2, stderr: "fixture command ended" }, "ambiguous"],
];
for (const [condition, response, kind] of scenarios) {
  writeResponse = response;
  const submission = await client.setSandboxPolicy({ ...target, policyPath: "fixture.yaml" });
  assert.equal(submission.outcome.kind, kind, condition);
  assert.deepEqual(calls.at(-1),
    ["openshell", "policy", "set", "-g", "fixture", "--policy", "fixture.yaml", "--wait", "radar"]);
  observations.push({ condition, response, submission });
}
const sourceFiles = Object.fromEntries([clientPath, boundaryPath].map(path => [
  path, createHash("sha256").update(readFileSync(join(source, path))).digest("hex"),
]));
const result = { source_commit: "82e1ad7474ec7175c5b860b2bfa9d7940bc6e75f",
  release: "v0.0.144", version, bun: process.versions.bun, sourceFiles,
  reads: { effective, base, revision }, calls, observations };
writeFileSync(output, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ read_controls: 3, write_controls: observations.length, openshell: version }));
