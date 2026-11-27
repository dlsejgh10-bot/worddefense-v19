// Renders a scene's SFX track with the GAME'S OWN SFX engine (mock.html SFX.play) inside an OfflineAudioContext. Offline: all non-local hosts blocked.
// usage: node sfx.mjs spec.json   spec: { out: 'x.wav', dur: 2.0, ev: [[t, 'name' | 'x:custom', gain?], ...] }
import { chromium } from '/workspace/pw/node_modules/playwright/index.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT = '/workspace/q1116/passive_mock/site'; const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const PORT = +(process.env.PORT0 || 14100);
const server = http.createServer((req, res) => { const u = new URL(req.url, 'http://127.0.0.1'); const rel = path.normalize(decodeURIComponent(u.pathname)).replace(/^\/+/, ''); const fp = path.join(ROOT, rel);
  if (rel.includes('..') || !fs.existsSync(fp) || !fs.statSync(fp).isFile()) { res.writeHead(404); res.end(); return; } const ty = { html: 'text/html; charset=utf-8', js: 'text/javascript', png: 'image/png', json: 'application/json', mp3: 'audio/mpeg', webp: 'image/webp', woff2: 'font/woff2', css: 'text/css' }[path.extname(fp).slice(1)] || 'application/octet-stream'; res.writeHead(200, { 'Content-Type': ty }); fs.createReadStream(fp).pipe(res); });
await new Promise(r => server.listen(PORT, '127.0.0.1', r));
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36' }); let blocked = 0;
await c.route('**/*', r => { let h = ''; try { h = new URL(r.request().url()).hostname; } catch (e) {} if (h === '127.0.0.1' || r.request().url().startsWith('data:') || r.request().url().startsWith('blob:')) return r.continue(); blocked++; return r.abort(); });
await c.addInitScript(() => { try { localStorage.setItem('wd_settings', JSON.stringify({ sfxOn: true, bgmOn: false, sfxVol: 0.75, bgmVol: 0 })); localStorage.setItem('wd_qa', '1'); } catch (e) {}
  const F = function () { if (!window.__oac) throw new Error('no audio yet'); return window.__oac; }; window.AudioContext = F; window.webkitAudioContext = F; });
const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 150)));
await p.goto(`http://127.0.0.1:${PORT}/mock.html?wdqa=7k2m`, { waitUntil: 'domcontentloaded', timeout: 180000 });
try {  await p.waitForFunction(() => typeof SFX !== 'undefined', null, { timeout: 20000 }); } catch (e) { console.log('ERRS', JSON.stringify(errs)); throw e; } await p.waitForTimeout(500);
const custom = fs.readFileSync(new URL('./custom.js', import.meta.url), 'utf8');
const b64 = await p.evaluate(async ({ spec, custom }) => {
  window.__vt = 100000; performance.now = () => window.__vt; const SR = 48000, oac = new OfflineAudioContext(2, Math.ceil(SR * spec.dur), SR); window.__oac = oac; SFX.unlock();
  const X = (new Function('oac', custom))(oac); const log = [];
  const groups = {}; for (const [t, n, gn] of spec.ev) { const q = Math.max(1, Math.round(t * SR / 128)) * 128 / SR; (groups[q] = groups[q] || []).push([n, gn]); }
  for (const q of Object.keys(groups).map(Number).sort((a, b) => a - b)) oac.suspend(q).then(() => { window.__vt = 100000 + q * 1000; for (const [n, gn] of groups[q]) { if (n.startsWith('x:')) { (() => { const ps = n.slice(2).split(':'); X[ps[0]](q + 0.005, gn || 1, ...ps.slice(1).map(Number)); })(); log.push([q, n, 1]); } else { window.__sfxlog = (nm, ok) => log.push([q, nm, ok]); SFX.play(n); window.__sfxlog = null; } } oac.resume(); });
  const buf = await oac.startRendering(); const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, dv = new DataView(new ArrayBuffer(44 + n * 4));
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); }; ws(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, SR, true); dv.setUint32(28, SR * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, n * 4, true);
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  for (let i = 0; i < n; i++) { dv.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); dv.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  const u8 = new Uint8Array(dv.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  window.__log = log; window.__pk = pk; return btoa(s); }, { spec, custom });
fs.writeFileSync(spec.out, Buffer.from(b64, 'base64'));
console.log('sfx', spec.out, 'peak', (await p.evaluate(() => __pk)).toFixed(3), 'log', JSON.stringify(await p.evaluate(() => __log.map(([q, n, ok]) => [+q.toFixed(3), n, ok]))), 'errs', JSON.stringify(errs.slice(0, 2)), 'blockedExt', blocked);
await b.close(); server.close();
