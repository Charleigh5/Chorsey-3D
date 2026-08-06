import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, realpath, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export const ACK = 'I_OWN_OR_AM_AUTHORIZED';
const PACKAGE_EXTENSIONS = new Set([
  '.u', '.utx', '.ukx', '.usx', '.uax', '.upk', '.udk', '.xxx',
  '.umap', '.uasset', '.uexp', '.ubulk', '.uptnl', '.pak', '.ucas', '.utoc'
]);
export const COMPONENT_BYTES = new Map([[5120,1],[5121,1],[5122,2],[5123,2],[5125,4],[5126,4]]);
export const TYPE_COMPONENTS = new Map([['SCALAR',1],['VEC2',2],['VEC3',3],['VEC4',4],['MAT2',4],['MAT3',9],['MAT4',16]]);
export const MAX_EMBED_BYTES = 256 * 1024 * 1024;
export const PLACEHOLDER_HASH = '0'.repeat(64);

export function help() {
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

export function parseArgs(argv) {
  const out = { command: 'build', flags: new Set() };
  const args = [...argv];
  if (args[0] && !args[0].startsWith('-')) out.command = args.shift();
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const eq = token.indexOf('=');
    if (eq > 2) { out[token.slice(2, eq)] = token.slice(eq + 1); continue; }
    const key = token.slice(2);
    const next = args[i + 1];
    if (!next || next.startsWith('--')) out.flags.add(key);
    else { out[key] = next; i++; }
  }
  return out;
}

export function required(options, key) {
  const value = options[key];
  if (!value) throw new Error(`Missing required --${key}`);
  return value;
}

export function normalizeSlashes(value) { return value.split(path.sep).join('/'); }
export function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}
export function sha256Bytes(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
export async function sha256File(file) {
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

export async function resolveExisting(input, type = 'file') {
  const resolved = await realpath(path.resolve(input));
  const info = await stat(resolved);
  if (type === 'file' && !info.isFile()) throw new Error(`Expected file: ${resolved}`);
  if (type === 'dir' && !info.isDirectory()) throw new Error(`Expected directory: ${resolved}`);
  return resolved;
}

export async function walkPackages(root, hashAll) {
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

export function dataUriToBytes(uri) {
  const match = /^data:([^,]*?),(.*)$/s.exec(uri);
  if (!match) throw new Error('Malformed data URI');
  const meta = match[1];
  const payload = match[2];
  return meta.includes(';base64') ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8');
}

export function safeResourcePath(gltfDir, uri) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(uri)) throw new Error(`Network or absolute URI is not allowed: ${uri}`);
  const decoded = decodeURIComponent(uri.split('?')[0].split('#')[0]);
  const full = path.resolve(gltfDir, decoded);
  if (!isInside(gltfDir, full)) throw new Error(`Resource escapes glTF directory: ${uri}`);
  return full;
}

export function arrayLength(json, key) { return Array.isArray(json[key]) ? json[key].length : 0; }
export function indexOk(index, count) { return Number.isInteger(index) && index >= 0 && index < count; }
