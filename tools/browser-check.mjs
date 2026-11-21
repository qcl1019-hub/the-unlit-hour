// Launch headless Chrome via CDP to check console errors, exceptions, and network requests.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function parseArgs(argv) {
  const opts = { url: '', wait: 1000, keys: '', evalExpr: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--url') opts.url = argv[++i] || '';
    else if (a === '--wait') opts.wait = Number(argv[++i] || 1000);
    else if (a === '--keys') opts.keys = argv[++i] || '';
    else if (a === '--eval') opts.evalExpr = argv[++i] || '';
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!opts.url) throw new Error('Missing --url <url>');
  if (!Number.isFinite(opts.wait) || opts.wait < 0) throw new Error('Invalid --wait');
  return opts;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForTarget(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const list = await res.json();
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) return page;
      }
    } catch {
      // Chrome still booting.
    }
    await sleep(100);
  }
  throw new Error('Timed out waiting for Chrome DevTools target');
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id) {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          if (msg.error) entry.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else entry.resolve(msg.result);
        }
      } else if (msg.method) {
        const list = this.listeners.get(msg.method);
        if (list) {
          for (const fn of list) fn(msg.params || {});
        }
      }
    });
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(fn);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try { this.ws.close(); } catch {}
  }
}

function resolveKeySpec(code) {
  if (code === 'ShiftLeft' || code === 'ShiftRight') return { key: 'Shift', keyCode: 16, modBit: 8 };
  if (code === 'ControlLeft' || code === 'ControlRight') return { key: 'Control', keyCode: 17, modBit: 2 };
  if (code === 'AltLeft' || code === 'AltRight') return { key: 'Alt', keyCode: 18, modBit: 1 };
  if (code === 'Enter') return { key: 'Enter', keyCode: 13, modBit: 0 };
  if (code === 'Escape') return { key: 'Escape', keyCode: 27, modBit: 0 };
  if (code === 'Space') return { key: ' ', keyCode: 32, modBit: 0 };
  if (code === 'ArrowUp') return { key: 'ArrowUp', keyCode: 38, modBit: 0 };
  if (code === 'ArrowDown') return { key: 'ArrowDown', keyCode: 40, modBit: 0 };
  if (code === 'ArrowLeft') return { key: 'ArrowLeft', keyCode: 37, modBit: 0 };
  if (code === 'ArrowRight') return { key: 'ArrowRight', keyCode: 39, modBit: 0 };
  if (/^Key[A-Z]$/.test(code)) {
    const ch = code.slice(3).toLowerCase();
    return { key: ch, keyCode: ch.toUpperCase().charCodeAt(0), modBit: 0 };
  }
  if (/^Digit[0-9]$/.test(code)) {
    const ch = code.slice(5);
    return { key: ch, keyCode: ch.charCodeAt(0), modBit: 0 };
  }
  return { key: code, keyCode: 0, modBit: 0 };
}

async function sendKeys(cdp, keysSpec) {
  if (!keysSpec.trim()) return;
  const steps = keysSpec.split(',').map((s) => s.trim()).filter(Boolean);
  for (const step of steps) {
    const [combo, durStr] = step.split(':');
    const dur = durStr ? Number(durStr) : 150;
    const codes = combo.split('+').map((c) => c.trim()).filter(Boolean);
    let mods = 0;
    const resolved = codes.map((code) => {
      const info = resolveKeySpec(code);
      mods |= info.modBit;
      return { code, ...info };
    });
    for (const k of resolved) {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'rawKeyDown',
        code: k.code,
        key: k.key,
        windowsVirtualKeyCode: k.keyCode,
        nativeVirtualKeyCode: k.keyCode,
        modifiers: mods,
      });
    }
    await sleep(Number.isFinite(dur) && dur >= 0 ? dur : 150);
    for (let i = resolved.length - 1; i >= 0; i--) {
      const k = resolved[i];
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        code: k.code,
        key: k.key,
        windowsVirtualKeyCode: k.keyCode,
        nativeVirtualKeyCode: k.keyCode,
        modifiers: mods,
      });
    }
  }
}

function isUrlAllowed(reqUrl, targetUrl) {
  if (reqUrl === 'about:blank' || reqUrl.startsWith('data:')) return true;
  if (targetUrl.startsWith('file:')) {
    return reqUrl.startsWith('file:');
  }
  const targetOrigin = new URL(targetUrl).origin;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(targetOrigin)) {
    return reqUrl.startsWith(targetOrigin + '/');
  }
  return false;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const port = await getFreePort();
  const userDir = mkdtempSync(join(tmpdir(), 'unlit-chrome-'));
  const chrome = spawn(CHROME_PATH, [
    '--do-not-de-elevate',
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1280,480',
    '--force-device-scale-factor=1',
    'about:blank',
  ], { stdio: 'ignore' });

  const consoleIssues = [];
  const exceptions = [];
  const badRequests = [];
  let cdp = null;

  try {
    const target = await waitForTarget(port);
    cdp = new CdpClient(target.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Network.enable');

    let loadResolve;
    const loaded = new Promise((r) => { loadResolve = r; });
    cdp.on('Page.loadEventFired', () => loadResolve());

    cdp.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error' || p.type === 'warning') {
        const text = (p.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
        consoleIssues.push(`[console.${p.type}] ${text}`);
      }
    });

    cdp.on('Log.entryAdded', (p) => {
      const e = p.entry || {};
      if (e.level === 'error' || e.level === 'warning') {
        consoleIssues.push(`[log.${e.level}] ${e.text || ''} (${e.url || ''})`);
      }
    });

    cdp.on('Runtime.exceptionThrown', (p) => {
      const det = p.exceptionDetails || {};
      const msg = det.exception?.description || det.text || 'Uncaught exception';
      exceptions.push(msg);
    });

    cdp.on('Network.requestWillBeSent', (p) => {
      const reqUrl = p.request?.url || '';
      if (!isUrlAllowed(reqUrl, opts.url)) {
        badRequests.push(reqUrl);
      }
    });

    await cdp.send('Page.navigate', { url: opts.url });
    await Promise.race([loaded, sleep(5000)]);
    await sleep(opts.wait);

    if (opts.keys) {
      await sendKeys(cdp, opts.keys);
      await sleep(100);
    }

    if (opts.evalExpr) {
      const res = await cdp.send('Runtime.evaluate', {
        expression: opts.evalExpr,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        exceptions.push(res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Eval error');
      } else {
        console.log(`EVAL: ${JSON.stringify(res.result?.value)}`);
      }
    }

    console.log(`URL: ${opts.url}`);
    console.log(`CONSOLE_ISSUES: ${consoleIssues.length}`);
    for (const msg of consoleIssues) console.log(`  ${msg}`);
    console.log(`EXCEPTIONS: ${exceptions.length}`);
    for (const ex of exceptions) console.log(`  ${ex}`);
    console.log(`OUTSIDE_REQUESTS: ${badRequests.length}`);
    for (const r of badRequests) console.log(`  ${r}`);

    if (consoleIssues.length > 0 || exceptions.length > 0 || badRequests.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (cdp) cdp.close();
    try { chrome.kill('SIGTERM'); } catch {}
    await sleep(200);
    try { if (!chrome.killed) chrome.kill('SIGKILL'); } catch {}
    try { rmSync(userDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
