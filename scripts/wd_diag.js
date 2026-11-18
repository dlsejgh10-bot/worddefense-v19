/* CI/diag only (login): measure the Google / Apple login path inside the real WKWebView (wdgame://app) */
(async function () {
  if (window.__wdDiagRan) return; window.__wdDiagRan = 1;
  const log = m => { const s = typeof m === 'string' ? m : JSON.stringify(m); try { window.webkit.messageHandlers.WDNative.postMessage({ method: 'diagLog', id: '0', msg: s }); } catch (e) {} };
  const sl = ms => new Promise(r => setTimeout(r, ms));
  const errs = []; window.addEventListener('error', e => errs.push('E ' + e.message + ' @' + (e.filename || '').slice(-40) + ':' + e.lineno)); window.addEventListener('unhandledrejection', e => errs.push('R ' + (e.reason && (e.reason.code || e.reason.message) || String(e.reason))));
  const T = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT ' + ms)), ms))]);
  try {
    if (!localStorage.getItem('wd_diag_seed')) {
      const S = { nick: '배고픈여우', gold: 50000, gems: 5000, tut: { intro: 3, lobby: 3, battle: 3, defeat: 3, draw: 3, sword: 3, relic: 3, inbox: 3, wb: 3, bp: 3, win1: 3 } };
      localStorage.clear(); localStorage.setItem('wd_main_v1', JSON.stringify(S)); localStorage.setItem('wd_diag_seed', '1'); log('seeded, reloading'); location.reload(); return;
    }
  } catch (e) { log('seed err ' + e); }
  for (let i = 0; i < 300 && !(window.WDLobby && window.WDAcct); i++) await sl(200);
  await sl(5000);
  let ring = []; try { ring = (window.WDNet && WDNet._ && WDNet._.ring) || []; } catch (e) {}
  log({ step: 'env', href: location.href.slice(0, 40), ua: navigator.userAgent, secure: window.isSecureContext, idb: typeof indexedDB, acct: !!window.WDAcct, ready: window.WDAcct && WDAcct.ready(), natG: !!(window.WDNative && typeof WDNative.googleSignIn === 'function'), natA: !!(window.WDNative && typeof WDNative.appleSignIn === 'function'), raw: !!window.WDNativeRaw, errs });
  log('SHOT lobby'); await sl(2500);
  /* 1) Firebase Auth SDK boot (same call the login button makes) */
  let sdk = null; const t0 = Date.now();
  try { sdk = await T(WDAcct._boot(), 45000); log({ step: 'boot', ok: true, ms: Date.now() - t0, cur: !!(sdk.auth.currentUser) }); }
  catch (e) { log({ step: 'boot', ok: false, ms: Date.now() - t0, code: e && e.code, msg: String(e && e.message).slice(0, 300) }); }
  /* 2) signInWithCredential with a fake Google token: reaching the server = INVALID_IDP_RESPONSE / auth/invalid-credential */
  if (sdk) {
    const { FU, auth } = sdk; const t1 = Date.now();
    try { await T(FU.signInWithCredential(auth, FU.GoogleAuthProvider.credential('eyJhbGciOiJSUzI1NiJ9.e30.x')), 30000); log({ step: 'fakeG', ok: 'UNEXPECTED' }); }
    catch (e) { log({ step: 'fakeG', ms: Date.now() - t1, code: e && e.code, msg: String(e && e.message).slice(0, 300) }); }
    const t2 = Date.now();
    try { await T(FU.signInWithCredential(auth, new FU.OAuthProvider('apple.com').credential({ idToken: 'eyJhbGciOiJSUzI1NiJ9.e30.x', rawNonce: 'n' })), 30000); log({ step: 'fakeA', ok: 'UNEXPECTED' }); }
    catch (e) { log({ step: 'fakeA', ms: Date.now() - t2, code: e && e.code, msg: String(e && e.message).slice(0, 300) }); }
  }
  /* 3) Tap the real login buttons on the login screen; native calls are intercepted at the JS wrapper (no real Google/Apple sheet) */
  const calls = []; const realG = WDNative.googleSignIn, realA = WDNative.appleSignIn;
  WDNative.googleSignIn = () => { calls.push('googleSignIn'); return Promise.resolve({ idToken: 'eyJhbGciOiJSUzI1NiJ9.e30.x' }); };
  WDNative.appleSignIn = () => { calls.push('appleSignIn'); return Promise.resolve({ idToken: 'eyJhbGciOiJSUzI1NiJ9.e30.x', nonce: 'n' }); };
  const toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && /toast/i.test(String(n.className || '') + ' ' + (n.id || ''))) toasts.push(n.textContent.trim().slice(0, 60)); }).observe(document.body, { childList: true, subtree: true });
  const tap = el => { const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch', isPrimary: true };
    const top = document.elementFromPoint(x, y); el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o)); (top || el).dispatchEvent(new MouseEvent('click', o)); return top === el || el.contains(top) ? 'hit' : 'COVERED by ' + (top && (top.id || top.className || top.tagName)); };
  for (const k of ['login', 'apple']) {
    try { WDAcct.showLogin(); } catch (e) { log('showLogin err ' + e); } await sl(1200);
    const b = document.querySelector('#wdl-ov [data-acct="' + k + '"]');
    if (!b) { log({ step: 'tap_' + k, present: false }); continue; }
    if (k === 'login') { log('SHOT loginmodal'); await sl(2500); }
    const h = tap(b); await sl(8000);
    log({ step: 'tap_' + k, present: true, hit: h, calls: calls.slice(), toasts: toasts.slice() });
  }
  WDNative.googleSignIn = realG; WDNative.appleSignIn = realA;
  /* 4) real native Apple sheet call on the simulator (no Apple ID → error code, proves the bridge round-trips) */
  try { const r = await T(WDNative.appleSignIn(), 20000); log({ step: 'nativeApple', res: r ? Object.keys(r) : r }); } catch (e) { log({ step: 'nativeApple', code: e && e.code, msg: String(e && e.message).slice(0, 120) }); }
  log('SHOT end'); await sl(2500);
  log({ step: 'errs', errs: errs.slice(0, 15) });
  log('DONE');
})();
