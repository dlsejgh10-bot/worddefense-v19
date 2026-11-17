/* CI/diag only: drive tabs, measure tab-switch frames + layout, ask the runner for screenshots ("SHOT name") */
(async function () {
  if (window.__wdDiagRan) return; window.__wdDiagRan = 1;
  const log = m => { const s = typeof m === 'string' ? m : JSON.stringify(m); try { window.webkit.messageHandlers.WDNative.postMessage({ method: 'diagLog', id: '0', msg: s }); } catch (e) {} try { (window.__diagOut || (window.__diagOut = [])).push(s); console.log('WDDIAG ' + s); } catch (e) {} };
  const sl = ms => new Promise(r => setTimeout(r, ms));
  try {
    if (!localStorage.getItem('wd_diag_seed')) {
      const S = { nick: '배고픈여우', gold: 50000, gems: 5000, tut: { intro: 3, lobby: 3, battle: 3, defeat: 3, draw: 3, sword: 3, relic: 3, inbox: 3, wb: 3, bp: 3, win1: 3 } };
      localStorage.clear(); localStorage.setItem('wd_main_v1', JSON.stringify(S)); localStorage.setItem('wd_diag_seed', '1'); log('seeded, reloading'); location.reload(); return;
    }
  } catch (e) { log('seed err ' + e); }
  for (let i = 0; i < 300 && !(window.WDLobby && document.querySelector('#wdl-tabs .tab')); i++) await sl(200);
  await sl(6000);
  const clean = () => document.querySelectorAll('#wdl-ov .mback').forEach(e => e.remove());
  clean(); try { WDLobby.go('home'); } catch (e) {} await sl(1500); clean();
  const R = el => { if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height)]; };
  const cs = getComputedStyle(document.documentElement);
  log({ ua: navigator.userAgent, inner: [innerWidth, innerHeight], dpr: devicePixelRatio, cls: document.documentElement.className, wst: cs.getPropertyValue('--wst'), wsb: cs.getPropertyValue('--wsb'), q: location.search });
  const shot = async n => { log('SHOT ' + n); await sl(2500); };
  await shot('lobby');
  /* frame times after each tab tap (rAF deltas, 1.5 s window) */
  window.__fd = []; let last = 0; const f = t => { if (last) window.__fd.push([t, t - last]); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f);
  const tabEl = n => [...document.querySelectorAll('#wdl-tabs .tab')].find(x => x.textContent.includes(n));
  const tap = el => { const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointerdown', o)); try { const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y }); el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [t], targetTouches: [t], changedTouches: [t] })); el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [t] })); } catch (e) {}
    el.dispatchEvent(new PointerEvent('pointerup', o)); el.dispatchEvent(new MouseEvent('click', o)); };
  const seq = ['상점', '유물', '속성검', '상점', '전투', '유물', '전투', '속성검', '상점', '전투'];
  const res = [];
  for (let round = 0; round < 2; round++) for (const n of seq) {
    const t0 = performance.now(); tap(tabEl(n)); await sl(1700);
    const fr = window.__fd.filter(a => a[0] > t0 && a[0] < t0 + 1500).map(a => a[1]);
    res.push({ n, round, max: Math.round(Math.max(...fr)), j33: fr.filter(d => d > 34).length, j50: fr.filter(d => d > 50).length, sum: fr.reduce((a, b) => a + b, 0), cnt: fr.length });
  }
  const agg = rs => ({ worstFrame: Math.max(...rs.map(r => r.max)), meanWorst: Math.round(rs.reduce((a, r) => a + r.max, 0) / rs.length), jank34: rs.reduce((a, r) => a + r.j33, 0), jank50: rs.reduce((a, r) => a + r.j50, 0), fps: +(rs.reduce((a, r) => a + r.cnt, 0) / rs.reduce((a, r) => a + r.sum, 0) * 1000).toFixed(1) });
  log({ tabs1: agg(res.filter(r => !r.round)), tabs2: agg(res.filter(r => r.round)), per: res.map(r => r.n + r.round + ':' + r.max).join(' ') });
  tap(tabEl('상점')); await sl(1500);
  log({ shop: [...document.querySelectorAll('#wdl .sgrid .sc')].slice(0, 6).map(e => R(e)[1]), tabs: R(document.querySelector('#wdl-tabs')), app: R(document.querySelector('#wdl .wdl-app')), view: R(document.querySelector('#wdl .view.on') || document.querySelector('#wdl .view')) });
  await shot('shop');
  tap(tabEl('유물')); await sl(1500);
  log({ relic: [...document.querySelectorAll('#wdl .rl-grid > *, #wdl .grid .rcell')].slice(0, 6).map(e => R(e)[1]) });
  await shot('relic');
  const sc = document.querySelector('#wdl .view.on') || document.querySelector('#wdl .view'); if (sc) { const s = [...sc.querySelectorAll('*')].find(e => e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)); if (s) s.scrollTop = 400; } await sl(600);
  await shot('relic2');
  tap(tabEl('전투')); await sl(1200); try { WDLobby.go('home'); } catch (e) {} await sl(800);
  try { WDLobby._att.startGame(null); } catch (e) { log('start err ' + e); }
  for (let k = 0; k < 150; k++) { if (window.__wd && __wd.G && __wd.G.towers) break; await sl(100); }
  await sl(4500); clean();
  await shot('battle');
  log('DONE');
})();
