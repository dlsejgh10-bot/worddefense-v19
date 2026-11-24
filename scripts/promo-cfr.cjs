// Offline export of the real game engine, one captured canvas per 1/30s.
// Staged starting hand for word-order comparison; real summon/combat rules, no live account/database.
// Silent motion proof: real-time WebAudio cannot be reused on this clock.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const out = path.resolve('promo-capture');
fs.mkdirSync(out, { recursive: true });
const FPS = 30, SECONDS = Number(process.env.PROMO_SECONDS || 26);
const report = { method: 'Actual offline game engine; Playwright clock advances every captured frame; no motion interpolation', fps: FPS, seconds: SECONDS, audio: 'silent motion proof', events: [], errors: [], samples: [], stagedSetup: 'Starting cards are explicitly set to gi sa sa gi bak su for a word-order demonstration. This is not an unedited random hand or a player run.' };
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
    await page.evaluate(() => { const g=__wd.G; const ts=g.tiles.filter(t=>t.state==='hand'||t.state==='deal'); if(ts.length!==6)throw new Error('Expected six starting cards'); const chars=['기','사','사','기','박','수']; ts.forEach((t,i)=>{t.ch=chars[i];t.wild=false;}); });
    const planned=[{frame:45,ch:'기'},{frame:53,ch:'사'},{frame:180,ch:'사'},{frame:188,ch:'기'},{frame:330,ch:'박'},{frame:338,ch:'수'}];
    let lastHash = '', repeats = 0, maxRepeats = 0, duplicateFrames = 0;
    let firstTime, lastTime;
    for (let i = 0; i < Math.round(FPS * SECONDS); i++) {
      await page.clock.runFor(Math.round((i + 1) * 1000 / FPS) - Math.round(i * 1000 / FPS));
      const act = planned.find(x=>x.frame===i);
      if(act){ const outcome=await page.evaluate(ch=>{const a=__wd,t=a.G.tiles.find(t=>t.state==='hand'&&t.ch===ch);if(!t)throw new Error('Planned card missing: '+ch);a.tapHand(t);return {ch,selected:a.G.sel.length};},act.ch);report.events.push({frame:i,action:'normal-tap-on-staged-starting-hand',...outcome}); }
      const capture = await page.evaluate(() => {
        const g = __wd.G, c = document.querySelector('#c');
        if (g.towers.some(t => t.len === 6)) throw new Error('Forbidden six-character unit in frame');
        return { jpeg: c.toDataURL('image/jpeg', 0.94).split(',')[1], gameTime: g.t, wave: g.wave, towers: g.towers.length, kills: g.kills, words:g.towers.map(t=>t.word), units:g.towers.map(t=>({word:t.word,role:t.role,x:t.x,y:t.y,side:t.side,el:t.el})), mobs:g.mobs.length };
      });
      if (firstTime === undefined) firstTime = capture.gameTime;
      lastTime = capture.gameTime;
      const bytes = Buffer.from(capture.jpeg, 'base64');
      const hash = crypto.createHash('sha256').update(bytes).digest('hex');
      if (hash === lastHash) { repeats++; duplicateFrames++; } else repeats = 0;
      maxRepeats = Math.max(maxRepeats, repeats); lastHash = hash;
      if (!encoder.stdin.write(bytes)) await once(encoder.stdin, 'drain');
      if (i % FPS === 0) { report.samples.push({ frame: i, gameTime: capture.gameTime, wave: capture.wave, towers: capture.towers, kills: capture.kills, words:capture.words, units:capture.units, mobs:capture.mobs }); console.log('FRAME', i, capture.gameTime.toFixed(3), capture.towers, capture.kills); }
      if (i % FPS === 0) fs.writeFileSync(path.join(out, `frame-${i}.jpg`), bytes);
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
