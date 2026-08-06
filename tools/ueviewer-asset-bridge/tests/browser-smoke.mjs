import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidencePath = path.join(root, 'artifacts', 'sample-evidence.html');
const evidence = await readFile(evidencePath);
const requests = [];
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
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('request', request => {
  const url = new URL(request.url());
  if (url.hostname !== '127.0.0.1') throw new Error(`Unexpected network request: ${request.url()}`);
});
try {
  await page.goto(`http://127.0.0.1:${address.port}/sample-evidence.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('#renderStatus')?.textContent === 'RENDERED', null, { timeout: 15000 });
  const result = await page.evaluate(() => ({
    status: document.querySelector('#renderStatus')?.textContent,
    canvasWidth: document.querySelector('#view')?.width || 0,
    canvasHeight: document.querySelector('#view')?.height || 0,
    title: document.title,
    offlineLabel: document.body.textContent.includes('READ-ONLY • OFFLINE • SOURCE-GOVERNED')
  }));
  if (result.status !== 'RENDERED') throw new Error(`Unexpected render status: ${result.status}`);
  if (result.canvasWidth < 1 || result.canvasHeight < 1) throw new Error('Canvas has no rendered dimensions');
  if (!result.offlineLabel) throw new Error('Offline governance label missing');
  if (pageErrors.length || consoleErrors.length) throw new Error(`Browser errors: ${JSON.stringify({ pageErrors, consoleErrors })}`);
  await mkdir(path.join(root, 'artifacts'), { recursive: true });
  await page.screenshot({ path: path.join(root, 'artifacts', 'browser-smoke.png'), fullPage: true });
  console.log(JSON.stringify({ status: 'PASS', ...result, documentRequests: requests.length, externalRequests: 0 }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
