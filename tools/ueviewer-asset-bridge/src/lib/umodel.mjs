import { spawn } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { resolveExisting } from './core.mjs';

export async function runUmodel({ executable, gameDir, packageRelative, objectName, outputDir, gameOption }) {
  const exe = await resolveExisting(executable, 'file');
  if (gameOption && !/^-game=[A-Za-z0-9_.-]+$/.test(gameOption)) throw new Error('Only one safe --game-option=-game=<id> value is permitted in v0.1');
  await mkdir(outputDir, { recursive: true });
  const args = [`-path=${gameDir}`, '-export', '-gltf', `-out=${outputDir}`];
  if (gameOption) args.push(gameOption);
  args.push(packageRelative, objectName);
  const startedAt = new Date().toISOString();
  const result = await new Promise((resolve, reject) => {
    const child = spawn(exe, args, { cwd: outputDir, shell: false, windowsHide: true, stdio: ['ignore','pipe','pipe'] });
    let stdout = '', stderr = '';
    const limit = 2 * 1024 * 1024;
    child.stdout.on('data', chunk => { if (stdout.length < limit) stdout += chunk; });
    child.stderr.on('data', chunk => { if (stderr.length < limit) stderr += chunk; });
    child.on('error', reject);
    const timer = setTimeout(() => { child.kill(); reject(new Error('UEViewer export exceeded 15 minute timeout')); }, 15 * 60 * 1000);
    child.on('close', code => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
  });
  if (result.code !== 0) throw new Error(`UEViewer exited with code ${result.code}: ${result.stderr || result.stdout}`);
  const candidates = await findFiles(outputDir, file => path.extname(file).toLowerCase() === '.gltf');
  const exact = candidates.filter(file => path.basename(file, '.gltf').toLowerCase() === objectName.toLowerCase());
  const selected = exact.length === 1 ? exact[0] : candidates.length === 1 ? candidates[0] : null;
  if (!selected) throw new Error(`UEViewer export produced ${candidates.length} glTF files; unable to select exactly one for object ${objectName}`);
  return {
    selectedGltf: selected,
    receipt: {
      invoked: true,
      executableName: path.basename(exe),
      argumentsRedacted: ['-path=<AUTHORIZED_GAME_DIR>', '-export', '-gltf', '-out=<QUARANTINE_OUTPUT>', ...(gameOption ? [gameOption] : []), packageRelative, objectName],
      startedAt,
      completedAt: new Date().toISOString(),
      exitCode: result.code,
      stdoutTail: stdout.slice(-12000),
      stderrTail: stderr.slice(-12000)
    }
  };
}

async function findFiles(root, predicate) {
  const results = [], stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const child of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, child.name);
      if (child.isDirectory()) stack.push(full);
      else if (child.isFile() && predicate(full)) results.push(full);
    }
  }
  return results.sort();
}
