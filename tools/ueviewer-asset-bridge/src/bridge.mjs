#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { access, lstat, mkdir, open, readFile, realpath, readdir, stat, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ACK = 'I_OWN_OR_AM_AUTHORIZED';
const PACKAGE_EXTENSIONS = new Set([
  '.u', '.utx', '.ukx', '.usx', '.uax', '.upk', '.udk', '.xxx',
  '.umap', '.uasset', '.uexp', '.ubulk', '.uptnl', '.pak', '.ucas', '.utoc'
]);
const COMPONENT_BYTES = new Map([[5120,1],[5121,1],[5122,2],[5123,2],[5125,4],[5126,4]]);
const TYPE_COMPONENTS = new Map([['SCALAR',1],['VEC2',2],['VEC3',3],['VEC4',4],['MAT2',4],['MAT3',9],['MAT4',16]]);
const MAX_EMBED_BYTES = 256 * 1024 * 1024;
const PLACEHOLDER_HASH = '0'.repeat(64);

function help() {
  console.log(`UEViewer Asset Bridge v0.1.0\n\n` +
`Build one self-contained, offline HTML evidence package.\n\n` +
`Required:\n` +
`  --game-dir <authorized Unreal game directory>\n` +
`  --package <package path relative to game directory>\n` +
`  --object <mesh object name>\n` +
`  --output <evidence.html>\n` +
`  --acknowledge-read-only ${ACK}\n\n` +
`Choose one export source:\n` +
`  --umodel <umodel executable>       Run UEViewer with -export -gltf\n` +
`  --gltf <existing .gltf>           Test/import an already exported glTF\n\n` +
`Optional:\n` +
`  --game-option=-game=<id>          One safe UEViewer game selector\n` +
`  --hash-all-packages               Hash every inventoried package\n` +
`  --include-source-paths            Preserve absolute source paths in evidence\n` +
`  --no-open                         Do not open the generated HTML\n`);
}

function parseArgs(argv) {
  const out = { command: 'build', flags: new Set() };
  const args = [...argv];
  if (args[0] && !args[0].startsWith('-')) out.command = args.shift();
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const eq = token.indexOf('=');
    if (eq > 2) {
      out[token.slice(2, eq)] = token.slice(eq + 1);
      continue;
    }
    const key = token.slice(2);
    const next = args[i + 1];
    if (!next || next.startsWith('--')) out.flags.add(key);
    else { out[key] = next; i++; }
  }
  return out;
}

function required(options, key) {
  const value = options[key];
  if (!value) throw new Error(`Missing required --${key}`);
  return value;
}

function normalizeSlashes(value) { return value.split(path.sep).join('/'); }
function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}
function sanitize(value) {
  return String(value || 'mesh').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'mesh';
}
function sha256Bytes(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
async function sha256File(file) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}
function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

async function resolveExisting(input, type = 'file') {
  const resolved = await realpath(path.resolve(input));
  const info = await stat(resolved);
  if (type === 'file' && !info.isFile()) throw new Error(`Expected file: ${resolved}`);
  if (type === 'dir' && !info.isDirectory()) throw new Error(`Expected directory: ${resolved}`);
  return resolved;
}

async function walkPackages(root, hashAll) {
  const entries = [];
  const skipped = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let children;
    try { children = await readdir(dir, { withFileTypes: true }); }
    catch (error) { skipped.push({ path: normalizeSlashes(path.relative(root, dir)), reason: error.code || error.message }); continue; }
    children.sort((a,b) => a.name.localeCompare(b.name));
    for (const child of children) {
      const full = path.join(dir, child.name);
      let info;
      try { info = await lstat(full); }
      catch (error) { skipped.push({ path: normalizeSlashes(path.relative(root, full)), reason: error.code || error.message }); continue; }
      if (info.isSymbolicLink() || info.isCharacterDevice() || info.isBlockDevice()) {
        skipped.push({ path: normalizeSlashes(path.relative(root, full)), reason: 'REPARSE_OR_SPECIAL_FILE_SKIPPED' });
        continue;
      }
      if (info.isDirectory()) stack.push(full);
      else if (info.isFile() && PACKAGE_EXTENSIONS.has(path.extname(child.name).toLowerCase())) {
        const entry = {
          relativePath: normalizeSlashes(path.relative(root, full)),
          extension: path.extname(child.name).toLowerCase(),
          bytes: info.size,
          modifiedUtc: info.mtime.toISOString()
        };
        if (hashAll) entry.sha256 = await sha256File(full);
        entries.push(entry);
      }
    }
  }
  entries.sort((a,b) => a.relativePath.localeCompare(b.relativePath));
  const inventoryDigest = sha256Bytes(Buffer.from(stableJson(entries), 'utf8'));
  return { schema: 'ueviewer.asset-bridge.inventory.v1', packageCount: entries.length, inventoryDigest, entries, skipped };
}

function dataUriToBytes(uri) {
  const match = /^data:([^,]*?),(.*)$/s.exec(uri);
  if (!match) throw new Error('Malformed data URI');
  const meta = match[1];
  const payload = match[2];
  return meta.includes(';base64') ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8');
}

function safeResourcePath(gltfDir, uri) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(uri)) throw new Error(`Network or absolute URI is not allowed: ${uri}`);
  const decoded = decodeURIComponent(uri.split('?')[0].split('#')[0]);
  const full = path.resolve(gltfDir, decoded);
  if (!isInside(gltfDir, full)) throw new Error(`Resource escapes glTF directory: ${uri}`);
  return full;
}

function arrayLength(json, key) { return Array.isArray(json[key]) ? json[key].length : 0; }
function indexOk(index, count) { return Number.isInteger(index) && index >= 0 && index < count; }

async function validateGltf(gltfPath) {
  if (path.extname(gltfPath).toLowerCase() !== '.gltf') {
    throw new Error('v0.1 evidence viewer accepts JSON .gltf exports. Convert or export UEViewer output as .gltf.');
  }
  const raw = await readFile(gltfPath, 'utf8');
  let json;
  try { json = JSON.parse(raw); }
  catch (error) { throw new Error(`Invalid glTF JSON: ${error.message}`); }
  const errors = [], warnings = [];
  if (!json.asset || typeof json.asset.version !== 'string' || !json.asset.version.startsWith('2.')) errors.push('asset.version must declare glTF 2.x');
  const counts = Object.fromEntries(['scenes','nodes','meshes','materials','textures','images','samplers','accessors','bufferViews','buffers','animations','skins'].map(k => [k, arrayLength(json,k)]));
  if (!counts.meshes) errors.push('No meshes found');
  if (!counts.accessors) errors.push('No accessors found');
  if (!counts.buffers) errors.push('No buffers found');
  if (json.scene !== undefined && !indexOk(json.scene, counts.scenes)) errors.push(`scene index ${json.scene} is out of range`);

  const resources = {};
  const bufferBytes = [];
  let embeddedBytes = Buffer.byteLength(raw);
  for (let i = 0; i < counts.buffers; i++) {
    const buffer = json.buffers[i] || {};
    if (!Number.isInteger(buffer.byteLength) || buffer.byteLength < 0) errors.push(`buffers[${i}].byteLength is invalid`);
    if (typeof buffer.uri !== 'string') { errors.push(`buffers[${i}] has no URI; GLB-style binary chunks are unsupported in JSON .gltf v0.1`); bufferBytes.push(Buffer.alloc(0)); continue; }
    try {
      let bytes;
      if (buffer.uri.startsWith('data:')) bytes = dataUriToBytes(buffer.uri);
      else {
        const full = safeResourcePath(path.dirname(gltfPath), buffer.uri);
        bytes = await readFile(full);
        resources[normalizeSlashes(buffer.uri)] = { mimeType: 'application/octet-stream', base64: bytes.toString('base64'), sha256: sha256Bytes(bytes), bytes: bytes.length };
      }
      embeddedBytes += bytes.length;
      if (Number.isInteger(buffer.byteLength) && bytes.length < buffer.byteLength) errors.push(`buffers[${i}] is ${bytes.length} bytes but declares ${buffer.byteLength}`);
      bufferBytes.push(bytes);
    } catch (error) { errors.push(`buffers[${i}] ${error.message}`); bufferBytes.push(Buffer.alloc(0)); }
  }

  for (let i = 0; i < counts.bufferViews; i++) {
    const view = json.bufferViews[i] || {};
    if (!indexOk(view.buffer, counts.buffers)) { errors.push(`bufferViews[${i}].buffer is out of range`); continue; }
    const offset = view.byteOffset || 0;
    if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(view.byteLength) || view.byteLength < 0) { errors.push(`bufferViews[${i}] offset/length is invalid`); continue; }
    if (offset + view.byteLength > bufferBytes[view.buffer].length) errors.push(`bufferViews[${i}] exceeds buffer ${view.buffer}`);
    if (view.byteStride !== undefined && (!Number.isInteger(view.byteStride) || view.byteStride < 4 || view.byteStride > 252)) errors.push(`bufferViews[${i}].byteStride is invalid`);
  }

  let vertexCount = 0, indexCount = 0, primitiveCount = 0;
  for (let i = 0; i < counts.accessors; i++) {
    const accessor = json.accessors[i] || {};
    if (accessor.bufferView !== undefined && !indexOk(accessor.bufferView, counts.bufferViews)) errors.push(`accessors[${i}].bufferView is out of range`);
    if (!COMPONENT_BYTES.has(accessor.componentType)) errors.push(mýï—!j»-®éÜj×