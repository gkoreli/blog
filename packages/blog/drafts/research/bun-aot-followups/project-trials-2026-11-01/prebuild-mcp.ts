// Run with the selected Bun before native compilation. This does not run a server.
import path from 'node:path';
const lab = process.argv[2];
if (!lab) throw new Error('Pass the study lab directory');
const app = path.join(lab, 'keryx/example/backend');
const { resolveMcpAppHtml } = await import(path.join(lab, 'keryx/packages/keryx/util/mcpAppBundler.ts'));
const html = await resolveMcpAppHtml({ client: path.join(app, 'mcpApp/status.ts') });
if (!html.includes('<script type="module">') || !html.includes('<div id="root">')) throw new Error('MCP shell or script missing');
await Bun.write(path.join(app, 'study-mcp-status.ts'), `export default ${JSON.stringify(html)};\n`);
await Bun.write(path.join(lab, 'prebuilt-mcp-status.html'), html);
console.log(JSON.stringify({ bytes: Buffer.byteLength(html), sha256: new Bun.CryptoHasher('sha256').update(html).digest('hex') }));
