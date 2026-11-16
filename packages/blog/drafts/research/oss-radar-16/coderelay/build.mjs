import { build } from "esbuild";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const source = join(root, ".work/source");
const manifest = JSON.parse(readFileSync(join(root, "source-hashes.json"), "utf8"));
for (const [relative, expected] of Object.entries(manifest.files)) {
  const bytes = readFileSync(join(source, relative));
  if (bytes.length !== expected.bytes || createHash("sha256").update(bytes).digest("hex") !== expected.sha256) {
    throw new Error(`Source differs from the declared pin: ${relative}`);
  }
}
const contracts = join(source, "packages/contracts/src");
await build({
  entryPoints: [join(root, "entry.mjs")],
  outfile: join(root, "hub.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node24",
  nodePaths: [join(root, "node_modules")],
  alias: {
    "@t3tools/contracts/teamHub": join(contracts, "teamHub.ts"),
    "@t3tools/contracts": join(contracts, "baseSchemas.ts"),
  },
});
