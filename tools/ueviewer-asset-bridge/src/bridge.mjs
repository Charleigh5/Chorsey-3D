#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { access, lstat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { ACK, help, isInside, normalizeSlashes, parseArgs, required, resolveExisting, walkPackages } from './lib/core.mjs';
import { validateGltf } from './lib/gltf.mjs';
import { runUmodel } from './lib/umodel.mjs';
import { buildEvidence } from './lib/evidence.mjs';

function openBrowser(file) {
  const platform = process.platform;
  if (platform === 'win32') spawn('cmd', ['/c','start','',file], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  else if (platform === 'darwin') spawn('open', [file], { detached: true, stdio: 'ignore' }).unref();
  else spawn('xdg-open', [file], { detached: true, stdio: 'ignore' }).unref();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === 'help' || options.flags.has('help')) { help(); return; }
  if (options.command !== 'build') throw new Error(`Unknown command: ${options.command}`);
  if (required(options, 'acknowledge-read-only') !== ACK) throw new Error(`Authorization acknowledgement must equal ${ACK}`);
  const gameDir = await resolveExisting(required(options, 'game-dir'), 'dir');
  const packageInput = required(options, 'package');
  const packageFileCandidate = path.isAbsolute(packageInput) ? path.resolve(packageInput) : path.resolve(gameDir, packageInput);
  const packageFile = await resolveExisting(packageFileCandidate, 'file');
  if (!isInside(gameDir, packageFile)) throw new Error('Selected package must be inside the authorized game directory');
  if ((await lstat(packageFile)).isSymbolicLink()) throw new Error('Selected package may not be a symbolic link');
  const packageRelative = normalizeSlashes(path.relative(gameDir, packageFile));
  const objectName = required(options, 'object');
  const output = path.resolve(required(options, 'output'));
  if (path.extname(output).toLowerCase() !== '.html') throw new Error('--output must end in .html');
  if (isInside(gameDir, output)) throw new Error('Output may not be written inside the authorized game directory');
  try { await access(output); throw new Error(`Output already exists; refusing overwrite: ${output}`); } catch (error) { if (error.code !== 'ENOENT') throw error; }

  const inventory = await walkPackages(gameDir, options.flags.has('hash-all-packages'));
  if (!inventory.entries.some(entry => entry.relativePath === packageRelative)) throw new Error(`Selected package extension is not in the supported inventory set: ${packageRelative}`);

  let gltfPath, umodelReceipt;
  if (options.gltf) {
    gltfPath = await resolveExisting(options.gltf, 'file');
    umodelReceipt = { invoked: false, mode: 'EXISTING_GLTF_TEST_OR_PREEXPORTED_INPUT', executableName: null, argumentsRedacted: [], startedAt: null, completedAt: null, exitCode: null };
  } else {
    const quarantine = path.join(path.dirname(output), `.ueviewer-export-${Date.now()}`);
    const result = await runUmodel({ executable: required(options, 'umodel'), gameDir, packageRelative, objectName, outputDir: quarantine, gameOption: options['game-option'] });
    gltfPath = result.selectedGltf; umodelReceipt = result.receipt;
  }
  const validation = await validateGltf(gltfPath);
  validation.sourcePath = gltfPath;
  if (validation.errors.length) throw new Error(`glTF validation failed:\n- ${validation.errors.join('\n- ')}`);
  const built = await buildEvidence({ output, gameDir, packageFile, packageRelative, objectName, inventory, validation, umodelReceipt, includeSourcePaths: options.flags.has('include-source-paths') });
  if (!options.flags.has('no-open')) openBrowser(output);
  console.log(JSON.stringify({ status: validation.status, output: built.output, canonicalHtmlSha256: built.canonicalHash, physicalFileSha256: built.finalSha256, bytes: built.bytes, packageCount: inventory.packageCount, geometry: validation.summary }, null, 2));
}

main().catch(error => { console.error(JSON.stringify({ status: 'FAIL', error: error.message }, null, 2)); process.exitCode = 1; });
