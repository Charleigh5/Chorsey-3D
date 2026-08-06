import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { COMPONENT_BYTES, MAX_EMBED_BYTES, TYPE_COMPONENTS, arrayLength, dataUriToBytes, indexOk, normalizeSlashes, safeResourcePath, sha256Bytes } from './core.mjs';

export async function validateGltf(gltfPath) {
  if (path.extname(gltfPath).toLowerCase() !== '.gltf') throw new Error('v0.1 evidence viewer accepts JSON .gltf exports. Convert or export UEViewer output as .gltf.');
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
    if (!COMPONENT_BYTES.has(accessor.componentType)) errors.push(`accessors[${i}].componentType is unsupported`);
    if (!TYPE_COMPONENTS.has(accessor.type)) errors.push(`accessors[${i}].type is unsupported`);
    if (!Number.isInteger(accessor.count) || accessor.count < 0) errors.push(`accessors[${i}].count is invalid`);
    if (accessor.sparse) warnings.push(`accessors[${i}] uses sparse data; browser preview does not apply sparse patches`);
  }

  for (let mi = 0; mi < counts.meshes; mi++) {
    const mesh = json.meshes[mi] || {};
    if (!Array.isArray(mesh.primitives) || !mesh.primitives.length) errors.push(`meshes[${mi}] has no primitives`);
    for (let pi = 0; pi < (mesh.primitives || []).length; pi++) {
      const primitive = mesh.primitives[pi] || {};
      primitiveCount++;
      const position = primitive.attributes?.POSITION;
      if (!indexOk(position, counts.accessors)) errors.push(`meshes[${mi}].primitives[${pi}] has no valid POSITION accessor`);
      else vertexCount += json.accessors[position].count || 0;
      if (primitive.indices !== undefined) {
        if (!indexOk(primitive.indices, counts.accessors)) errors.push(`meshes[${mi}].primitives[${pi}].indices is out of range`);
        else indexCount += json.accessors[primitive.indices].count || 0;
      }
      if (primitive.material !== undefined && !indexOk(primitive.material, counts.materials)) errors.push(`meshes[${mi}].primitives[${pi}].material is out of range`);
      const mode = primitive.mode ?? 4;
      if (![0,1,2,3,4,5,6].includes(mode)) errors.push(`meshes[${mi}].primitives[${pi}].mode is invalid`);
      if (mode !== 4) warnings.push(`meshes[${mi}].primitives[${pi}] uses mode ${mode}; v0.1 browser preview is optimized for TRIANGLES (4)`);
    }
  }

  for (let i = 0; i < counts.nodes; i++) {
    const node = json.nodes[i] || {};
    if (node.mesh !== undefined && !indexOk(node.mesh, counts.meshes)) errors.push(`nodes[${i}].mesh is out of range`);
    if (Array.isArray(node.children)) for (const child of node.children) if (!indexOk(child, counts.nodes)) errors.push(`nodes[${i}] child ${child} is out of range`);
  }
  for (let i = 0; i < counts.scenes; i++) {
    const scene = json.scenes[i] || {};
    if (Array.isArray(scene.nodes)) for (const node of scene.nodes) if (!indexOk(node, counts.nodes)) errors.push(`scenes[${i}] node ${node} is out of range`);
  }

  for (let i = 0; i < counts.images; i++) {
    const image = json.images[i] || {};
    if (typeof image.uri === 'string') {
      try {
        let bytes, key = image.uri;
        if (key.startsWith('data:')) bytes = dataUriToBytes(key);
        else {
          const full = safeResourcePath(path.dirname(gltfPath), key);
          bytes = await readFile(full);
          resources[normalizeSlashes(key)] = { mimeType: image.mimeType || mimeFromPath(key), base64: bytes.toString('base64'), sha256: sha256Bytes(bytes), bytes: bytes.length };
        }
        embeddedBytes += bytes.length;
      } catch (error) { errors.push(`images[${i}] ${error.message}`); }
    } else if (image.bufferView !== undefined) {
      if (!indexOk(image.bufferView, counts.bufferViews)) errors.push(`images[${i}].bufferView is out of range`);
      if (!image.mimeType) warnings.push(`images[${i}] uses a bufferView without mimeType`);
    } else errors.push(`images[${i}] must have uri or bufferView`);
  }

  if (embeddedBytes > MAX_EMBED_BYTES) errors.push(`Evidence payload ${embeddedBytes} bytes exceeds ${MAX_EMBED_BYTES} byte v0.1 limit`);
  const gltfSha256 = sha256Bytes(Buffer.from(raw, 'utf8'));
  return {
    schema: 'ueviewer.asset-bridge.gltf-validation.v1',
    validationClass: 'STRUCTURAL_VALIDATION_NOT_FULL_KHRONOS_CONFORMANCE',
    status: errors.length ? 'FAIL' : warnings.length ? 'PASS_WITH_WARNINGS' : 'PASS',
    errors, warnings, gltfSha256, counts,
    summary: { meshCount: counts.meshes, primitiveCount, vertexCount, indexCount, materialCount: counts.materials, textureCount: counts.textures, imageCount: counts.images, animationCount: counts.animations, skinCount: counts.skins },
    json, raw, resources, embeddedBytes
  };
}

function mimeFromPath(value) {
  switch (path.extname(value).toLowerCase()) {
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.ktx2': return 'image/ktx2';
    case '.bin': return 'application/octet-stream';
    default: return 'application/octet-stream';
  }
}
