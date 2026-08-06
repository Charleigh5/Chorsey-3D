import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACK, PLACEHOLDER_HASH, sha256Bytes, sha256File } from './core.mjs';

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
}

async function viewerHtml(payload) {
  const templatePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'assets', 'viewer-template.html');
  const template = await readFile(templatePath, 'utf8');
  return template
    .replaceAll('__EVIDENCE_TITLE__', htmlEscape(payload.manifest.selection.objectName))
    .replace('__EVIDENCE_PAYLOAD__', escapeScriptJson(payload));
}

function htmlEscape(value) { return String(value ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

export async function buildEvidence({ output, gameDir, packageFile, packageRelative, objectName, inventory, validation, umodelReceipt, includeSourcePaths }) {
  const sourceInfoBefore = await stat(packageFile);
  const selectedPackageSha256 = await sha256File(packageFile);
  const sourceInfoAfter = await stat(packageFile);
  if (sourceInfoBefore.size !== sourceInfoAfter.size || sourceInfoBefore.mtimeMs !== sourceInfoAfter.mtimeMs || selectedPackageSha256 !== await sha256File(packageFile)) {
    throw new Error('Selected source package changed during read-only processing');
  }
  const generatedAt = new Date().toISOString();
  const manifest = {
    schema: 'ueviewer.asset-bridge.manifest.v1',
    generatedAt,
    mode: 'READ_ONLY_EVIDENCE_BUILD',
    source: {
      gameDirectory: includeSourcePaths ? gameDir : '<REDACTED_AUTHORIZED_GAME_DIRECTORY>',
      selectedPackageRelativePath: packageRelative,
      selectedPackageBytes: sourceInfoBefore.size,
      selectedPackageModifiedUtc: sourceInfoBefore.mtime.toISOString(),
      selectedPackageSha256,
      inventoryDigest: inventory.inventoryDigest,
      inventoryPackageCount: inventory.packageCount
    },
    selection: { packageRelativePath: packageRelative, objectName },
    exporter: umodelReceipt,
    validation: { status: validation.status, class: validation.validationClass, gltfSha256: validation.gltfSha256 },
    output: {
      type: 'SELF_CONTAINED_OFFLINE_HTML',
      canonicalHashRule: 'SHA-256 of the complete HTML after replacing manifest.output.canonicalHtmlSha256 with 64 ASCII zeroes.',
      canonicalHtmlSha256: PLACEHOLDER_HASH
    },
    safety: {
      sourceMutation: 'NONE_OBSERVED', networkRuntime: 'NONE', externalAssets: 'NONE',
      sourceAuthorizationAcknowledgement: ACK,
      limitations: ['Structural glTF validation is not a substitute for the official Khronos validator.', 'The embedded preview is a bounded static mesh viewer and does not evaluate skeletal animation or full Unreal material graphs.']
    }
  };
  const receipt = {
    schema: 'ueviewer.asset-bridge.execution-receipt.v1',
    startedAt: generatedAt,
    completedAt: new Date().toISOString(),
    sourceReads: [packageRelative, 'package inventory', path.basename(validation.sourcePath || 'selected glTF')],
    sourceWrites: [],
    outputWrites: [path.basename(output)],
    sourcePackageHashVerifiedStable: true,
    status: validation.errors.length ? 'BLOCKED_VALIDATION_FAILED' : 'PASS'
  };
  const publicValidation = { ...validation };
  delete publicValidation.json; delete publicValidation.raw; delete publicValidation.resources; delete publicValidation.sourcePath;
  const payload = { manifest, inventory, validation: publicValidation, receipt, model: validation.json, resources: validation.resources };
  let html = await viewerHtml(payload);
  if (!html.includes(PLACEHOLDER_HASH)) throw new Error('Canonical hash placeholder missing');
  const canonicalHash = sha256Bytes(Buffer.from(html, 'utf8'));
  html = html.replace(PLACEHOLDER_HASH, canonicalHash);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html, { encoding: 'utf8', flag: 'wx' });
  const finalSha256 = await sha256File(output);
  return { output, canonicalHash, finalSha256, bytes: (await stat(output)).size };
}
