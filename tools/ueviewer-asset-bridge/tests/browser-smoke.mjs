import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactDir = path.join(root, 'artifacts');
const evidencePath = path.join(artifactDir, 'sample-evidence.html');
const evidence = await readFile(evidencePath);
const requests = [];
const externalRequests = [];
const server = createServer((req, res) => {
  requests.push(req.url);
  if (req.url !== '/' && req.url !== '/sample-evidence.html') {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': 'text/html; charset=utf-8',
    'content-length': evidence.length,
    'cache-control': 'no-store'
  });
  res.end(evidence);
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const address = server.address();
const browser = await chromium.launch({
  headless: process.env.HEADLESS !== 'false',
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist'
  ]
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('request', request => {
  const url = new URL(request.url());
  if (url.hostname !== '127.0.0.1') externalRequests.push(request.url());
});
try {
  await mkdir(artifactDir, { recursive: true });
  await page.goto(`http://127.0.0.1:${address.port}/sample-evidence.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('#renderStatus')?.textContent !== 'INITIALIZING', null, { timeout: 15000 });
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => ({
    status: document.querySelector('#renderStatus')?.textContent,
    canvasWidth: document.querySelector('#view')?.width || 0,
    canvasHeight: document.querySelector('#view')?.height || 0,
    title: document.title,
    webgl2: Boolean(document.querySelector('#view')?.getContext('webgl2')),
    offlineLabel: document.body.textContent.includes('READ-ONLY • OFFLINE • SOURCE-GOVERNED')
  }));
  await page.screenshot({ path: path.join(artifactDir, 'browser-smoke.png'), fullPage: true });
  const diagnostics = { ...result, pageErrors, consoleErrors, documentRequests: requests.length, externalRequests };
  if (result.status !== 'RENDERED') throw new Error(`Unexpected render result: ${JSON.stringify(diagnostics)}`);
  if (!result.webgl2) throw new Error(`WebGL2 context unavailable: ${JSON.stringify(diagnostics)}`);
  if (result.canvasWidth < 1 || result.canvasHeight < 1) throw new Error(`Canvas has no rendered dimensions: ${JSON.stringify(diagnostics)}`);
  if (!result.offlineLabel) throw new Error('Offline governance label missing');
  if (externalRequests.length) throw new Error(`Unexpected network requests: ${JSON.stringify(externalRequests)}`);
  if (pageErrors.length || consoleErrors.length) throw new Error(`Browser errors: ${JSON.stringify({ pageErrors, consoleErrors })}`);
  console.log(JSON.stringify({ status: 'PASS', ...diagnostics }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
