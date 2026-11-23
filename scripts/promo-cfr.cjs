// Offline export of the real game engine, one captured canvas per 1/30s.
// No real account, live database, altered game rules, or interpolated frames.
// Silent motion proof: real-time WebAudio cannot be reused on this clock.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const out = path.resolve('promo-capture');
fs.mkdirSync(out, { recursive: true });
const FPS = 30, SECONDS = Number(process.env.PROMO_SECONDS || 24);
const report = { method: 'Actual offline game engine; Playwright clock advances every captured frame; no motion interpolation', fps: FPS, seconds: SECONDS, audio: 'silent motion proof', events: [], errors: [], samples: [] };
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--disable-dev-shm-usage'] });
  // Deliberately no second page video recorder or real-time MediaRecorder.
  const context = await browser.newContext({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  let encoder;
  try {
    await page.clock.install();
    await page.route('**/*', r => /^(http:\/\/127\.0\.0\.1:8766\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort());
    await page.addInitScript(() => {
      localStorage.setItem('wd_main_v1', JSON.stringify({ v: 3, nick: '단어 디펜스', uid: 'promo-offline-only', avatar: 4, gold: 0, gems: 0, set: { bgm: 0, sfx: 0, vib: false, lang: 'ko' }, en: { v: 30, t: Date.now() } }));
      setInterval(() => {
        window.__wdIntro = false; window.__wdOMPause = false;
        const lobby = document.getElementById('wdl'); if (lobby) lobby.hidden = true;
        for (const id of ['wdl-wipe', 'wdl-login', 'wdl-intro']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
      }, 100);
    });
    page.on('pageerror', e => report.errors.push(String(e)));
    await page.goto('http://127.0.0.1:8766/index.html?nolobby=1&wdframe=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__wdLoaded && window.__wd?.G?.tiles?.length, null, { timeout: 120000 });
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 50));
    const dictionaries = await page.evaluate(() => ({ words: Object.keys(__wd.DICT), maxLength: Math.min(5, __wd.CFG.MAX_ROW || 4) }));
    encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'warning', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-vcodec', 'mjpeg', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, 'main-game-cfr30.mp4')], { stdio: ['pipe', 'ignore', 'pipe'] });
    let encoderErrors = ''; encoder.stderr.on('data', d => encoderErrors += d);
    encoder.stdin.on('error', () => {});
    let word = '', letter = 0, nextInput = 0, rerollAt = -9999;
    let lastHash = '', repeats = 0, maxRepeats = 0, duplicateFrames = 0;
    let firstTime, lastTime;
    for (let i = 0; i < Math.round(FPS * SECONDS); i++) {
      await page.clock.runFor(Math.round((i + 1) * 1000 / FPS) - Math.round(i * 1000 / FPS));
      if (i >= nextInput) {
        const state = await page.evaluate(() => {
          const a = __wd, g = a.G;
          return { over: g.over, tileT: g.tileT, sel: g.sel.length, tiles: g.tiles.filter(t => t.state === 'hand').map(t => ({ ch: t.ch, wild: t.wild })), gold: g.gold, cost: a.rerollCost(), n: g.rerollN };
        });
        if (state.over) throw new Error('Game ended before motion proof completed');
        if (!word && !state.sel && state.tileT > 0) {
          word = dictionaries.words.filter(w => {
            if (w.length < 2 || w.length > dictionaries.maxLength) return false;
            const hand = state.tiles.slice();
            for (const ch of w) { let k = hand.findIndex(t => t.ch === ch); if (k < 0) k = hand.findIndex(t => t.wild); if (k < 0) return false; hand.splice(k, 1); }
            return true;
          }).sort((a, b) => b.length - a.length)[0] || '';
          letter = 0;
          if (word) report.events.push({ frame: i, action: 'normal-card-input', word });
          else if (state.tiles.length && state.n < 5 && state.gold >= state.cost && i - rerollAt > FPS * 3) {
            await page.evaluate(() => __wd.reroll()); rerollAt = i;
            report.events.push({ frame: i, action: 'paid-normal-reroll', cost: state.cost });
          }
        }
        if (word) {
          const hit = await page.evaluate(ch => {
            const a = __wd, t = a.G.tiles.find(t => t.state === 'hand' && t.ch === ch) || a.G.tiles.find(t => t.state === 'hand' && t.wild);
            if (!t) return false; a.tapHand(t); return true;
          }, word[letter]);
          if (!hit || ++letter === word.length) { word = ''; nextInput = i + FPS * 1.5; }
          else nextInput = i + 4;
        } else nextInput = i + 5;
      }
      const capture = await page.evaluate(() => {
        const g = __wd.G, c = document.querySelector('#c');
        if (g.towers.some(t => t.len === 6)) throw new Error('Forbidden six-character unit in frame');
        return { jpeg: c.toDataURL('image/jpeg', 0.94).split(',')[1], gameTime: g.t, wave: g.wave, towers: g.towers.length, kills: g.kills };
      });
      if (firstTime === undefined) firstTime = capture.gameTime;
      lastTime = capture.gameTime;
      const bytes = Buffer.from(capture.jpeg, 'base64');
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      if (hash === lastHash) { repeats++; duplicateFrames++; } else repeats = 0;
      maxRepeats = Math.max(maxRepeats, repeats); lastHash = hash;
      if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain');
      if (i % FPS === 0) { report.samples.push({ frame: i, gameTime: capture.gameTime, wave: capture.wave, towers: capture.towers, kills: capture.kills }); console.log('FRAME', i, capture.gameTime.toFixed(3), capture.towers, capture.kills); }
      if (i === FPS * 8 || i === FPS * 20) fs.writeFileSync(path.join(out, `frame-${i}.jpg`), bytes);
    }
    encoder.stdin.end();
    const [code] = await once(encoder, 'close');
    if (code !== 0) throw new Error('Encoder failed: ' + encoderErrors.slice(-1000));
    report.frameCount = Math.round(FPS * SECONDS);
    report.gameTimeSpan = lastTime - firstTime;
    report.duplicateFrames = duplicateFrames;
    report.longestRepeatSeconds = maxRepeats / FPS;
    report.uniqueFrameRate = (report.frameCount - duplicateFrames) / SECONDS;
    if (report.uniqueFrameRate < FPS * 0.95 || report.longestRepeatSeconds > 0.1) throw new Error('Motion QA failed: duplicates/freezes');
    if (Math.abs(report.gameTimeSpan - (SECONDS - 1 / FPS)) > 0.15) throw new Error('Game clock cadence differs from output timeline');
    report.passed = true;
  } catch (e) {
    report.failure = String(e); report.passed = false; process.exitCode = 1;
    if (encoder && !encoder.killed) encoder.kill();
    console.error(e);
  } finally {
    fs.writeFileSync(path.join(out, 'cfr-report.json'), JSON.stringify(report, null, 2));
    await context.close(); await browser.close();
  }
})();
