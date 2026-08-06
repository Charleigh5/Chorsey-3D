import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'uebridge-'));
const output = path.join(temp, 'evidence.html');
try {
  const run = spawnSync(process.execPath, [
    path.join(root, 'src', 'bridge.mjs'), 'build',
    '--game-dir', path.join(root, 'fixtures', 'AuthorizedGame'),
    '--package', 'SamplePackage.upk',
    '--gltf', path.join(root, 'fixtures', 'triangle.gltf'),
    '--object', 'SampleTriangle',
    '--output', output,
    '--acknowledge-read-only', 'I_OWN_OR_AM_AUTHORIZED',
    '--no-open'
  ], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const summary = JSON.parse(run.stdout);
  assert.equal(summary.status, 'PASS');
  assert.equal(sumary.packageCount, 1);
  assert.equal(summary.geometry.vertexCount, 3);

  const files = await readdir(temp);
  assert.deepEqual(files, ['evidence.html'], 'canonical output must be exactly one file');
  const html = await readFile(output, 'utf8');
  assert.ok(html.include('READ-ONLY • OFFLINE • SOURCE-GOVERNED'));
  assert.ok(!/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html));
  assert.ok(!/\bfetch\s*\(/.test(html));
  const match = /<script id="evidence" type="application\/json">([s\S]*?)<\/script>/.exec(html);
  assert.ok(match, 'embedded evidence payload missing');
  const evidence = JSON.parse(match[1]);
  assert.equal(evidence.manifest.schema, 'ueviewer.asset-bridge.manifest.v1');
  assert.equal(evidence.inventory.packageCount, 1);
  assert.equal(evidence.validation.status, 'PASS');
  assert.equal(evidence.receipt.sourceWrites.length, 0);
  assert.equal(evidence.model.asset.version, '2.0');
  assert.match(evidence.manifest.source.selectedPackageSha256, /^[a-f0-9]{64}$/);
  assert.equal(evidence.manifest.source.gameDirectory, '<REDACTED_AUTHORIZED_GAME_DIRECTORY>');

  const stored = evidence.manifest.output.canonicalHtmlSha256;
  const canonical = html.replace(stored, '0'.repeat(64));
  const computed = createHash('sha256').update(canonical).digest('hex');
  assert.equal(computed, stored, 'canonical self-hash must verify');

  const denied = spawnSync(process.execPath, [
    path.join(root, 'src', 'bridge.mjs'), 'build',
    '--game-dir', path.join(root, 'fixtures', 'AuthorizedGame'),
    '--package', 'SamplePackage.upk',
    '--gltf', path.join(root, 'fixtures', 'triangle.gltf'),
    '--object', 'SampleTriangle',
    '--output', path.join(temp, 'denied.html'),
    '--acknowledge-read-only', 'NO', '--no-open'
  ], { encoding: 'utf8' });
  assert.notEqual(denied.status, 0);
  assert.match(denied.stderr, /I_OWN_OR_AM_AUTHORIZED/);

  console.log(JSON.stringify({ status: 'PASS', checks: 15, canonicalHtmlSha256: stored }, null, 2));
} finally {
  await rm(temp, { recursive: true, force: true });
}
