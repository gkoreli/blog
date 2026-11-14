// Separate native registration from actual glyph selection; one public font subset and authored controls.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [runtime, fontRuntime, fixture, output] = process.argv.slice(2).map(value => resolve(value));
assert(runtime && fontRuntime && fixture && output);
await mkdir(fixture);
const requireRuntime = createRequire(join(runtime, 'package.json'));
const { Renderer } = await import(pathToFileURL(requireRuntime.resolve('@takumi-rs/core')));
const core = JSON.parse(await readFile(join(runtime, 'package-lock.json'), 'utf8')).packages['node_modules/@takumi-rs/core'];
const fontPackage = JSON.parse(await readFile(join(fontRuntime, 'package-lock.json'), 'utf8')).packages['node_modules/@fontsource-variable/geist'];
assert.equal(core.version, '2.20.0'); assert.equal(fontPackage.version, '5.3.0');
const fontPath = 'node_modules/@fontsource-variable/geist/files/geist-cyrillic-wght-normal.woff2';
const data = await readFile(join(fontRuntime, fontPath));
const sha = value => createHash('sha256').update(value).digest('hex');
assert.equal(sha(data), '6894439694946a589d157ece003086960a6a4013d74a813dab7602efdb3d8c09');
const cases = [];
for (const [name, family, register, remove] of [
  ['builtin-only', 'Geist', false, false],
  ['same-family', 'Geist', true, false],
  ['alias-family', 'Radar Cyrillic', true, false],
  ['removed-builtin', 'Geist', true, true],
]) {
  const renderer = new Renderer();
  const removed = remove ? renderer.unregisterFont({ name: 'Geist' }) : false;
  const registered = register ? await renderer.registerFont({ name: family, data }) : [];
  const renders = [];
  for (const [script, text] of [['cyrillic', 'Файли'], ['ascii', 'Files']]) {
    const html = `<div style="font-family: '${family}'; font-weight: 400; font-size: 64px; padding: 16px; color: #111; background: white">${text}</div>`;
    const options = { width: 320, height: 120, format: 'png' };
    const png = await renderer.render(html, options);
    const svg = await renderer.renderSvg(html, { width: 320, height: 120 });
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert(svg.startsWith('<svg'));
    const image = `${name}-${script}.png`;
    await writeFile(join(fixture, image), png, { flag: 'wx' });
    await writeFile(join(fixture, `${name}-${script}.svg`), svg, { flag: 'wx' });
    renders.push({ script, text, image, bytes: png.length, pngSha256: sha(png),
      width: png.readUInt32BE(16), height: png.readUInt32BE(20), svgSha256: sha(svg) });
  }
  cases.push({ case: name, requestedFamily: family, removedBuiltin: removed,
    returnedFamilies: registered.map(value => value.name), renders });
}
await writeFile(join(fixture, 'observations.json'), JSON.stringify(cases, null, 2) + '\n', { flag: 'wx' });
const imageHash = (name, script) => cases.find(value => value.case === name).renders.find(value => value.script === script).pngSha256;
const observations = {
  sameFamilyRegistrationReturnedRequestedName: cases[1].returnedFamilies.includes('Geist'),
  sameFamilyCyrillicEqualsBuiltinOnly: imageHash('same-family', 'cyrillic') === imageHash('builtin-only', 'cyrillic'),
  aliasCyrillicDiffersFromBuiltinOnly: imageHash('alias-family', 'cyrillic') !== imageHash('builtin-only', 'cyrillic'),
  removingBuiltinCyrillicEqualsAlias: imageHash('removed-builtin', 'cyrillic') === imageHash('alias-family', 'cyrillic'),
  removedBuiltinAsciiDiffersFromBuiltinOnly: imageHash('removed-builtin', 'ascii') !== imageHash('builtin-only', 'ascii'),
};
assert(Object.values(observations).every(Boolean), JSON.stringify(observations));
await writeFile(output, JSON.stringify({
  issue: 'https://github.com/kane50613/takumi/issues/2558',
  sourceCommit: 'ae2a35011e5cddedb0a4c8b33ab0c9242ca76b2d',
  packageVersion: core.version, packageIntegrity: core.integrity,
  font: { package: '@fontsource-variable/geist', version: fontPackage.version,
    integrity: fontPackage.integrity, license: fontPackage.license,
    file: fontPath.replace('node_modules/', ''), bytes: data.length, sha256: sha(data) },
  node: process.version, platform: process.platform, architecture: process.arch,
  fontWeight: 400, cases, observations,
  modelServiceCalls: 0, publicWebsiteUsed: false, userFontsUsed: false,
  scope: 'Four fresh native renderer conditions, one Cyrillic subset/word at weight 400 plus ASCII control; registration and output identity, not all glyphs/weights, old-version regression onset or WASM.',
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(observations));
