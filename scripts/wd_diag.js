/* CI/diag only (ios-logindiag branch): probe Firebase Auth + native sign-in bridge inside the real WKWebView (wdgame:// origin) */
(async function () {
  if (window.__wdDiagRan) return; window.__wdDiagRan = 1;
  const log = m => { const s = typeof m === 'string' ? m : JSON.stringify(m); try { window.webkit.messageHandlers.WDNative.postMessage({ method: 'diagLog', id: '0', msg: s }); } catch (e) {} try { console.log('WDDIAG ' + s); } catch (e) {} };
  const sl = ms => new Promise(r => setTimeout(r, ms));
  const race = (p, ms) => Promise.race([p.then(v => ({ ok: 1, v }), e => ({ err: (e && (e.code || e.message)) || String(e) })), sl(ms).then(() => ({ timeout: ms }))]);
  window.addEventListener('error', e => log('ONERROR ' + e.message + ' @' + e.lineno));
  window.addEventListener('unhandledrejection', e => log('UNHANDLED ' + ((e.reason && (e.reason.code || e.reason.message)) || e.reason)));
  try {
    if (!localStorage.getItem('wd_diag_seed')) {
      const S = { nick: '배고픈여우', gold: 50000, gems: 5000, tut: { intro: 3, lobby: 3, battle: 3, defeat: 3, draw: 3, sword: 3, relic: 3, inbox: 3, wb: 3, bp: 3, win1: 3 } };
      localStorage.clear(); localStorage.setItem('wd_main_v1', JSON.stringify(S)); localStorage.setItem('wd_diag_seed', '1'); log('seeded, reloading'); location.reload(); return;
    }
  } catch (e) { log('seed err ' + e); }
  for (let i = 0; i < 300 && !(window.WDLobby && window.WDAcct && document.querySelector('#wdl-tabs .tab')); i++) await sl(200);
  await sl(3000);
  document.querySelectorAll('#wdl-ov .mback').forEach(e => e.remove());
  log({ step: 'env', href: location.href.slice(0, 60), origin: location.origin, ua: navigator.userAgent, ready: WDAcct.ready(), gs: typeof (window.WDNative && WDNative.googleSignIn), as: typeof (window.WDNative && WDNative.appleSignIn), raw: !!window.WDNativeRaw, idb: typeof indexedDB, build: window.WD_BUILD });
  /* 1. raw network: identitytoolkit from this origin */
  try { const c = WDNet.cfg; const r = await race(fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=' + c.apiKey, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestUri: 'http://localhost', postBody: 'id_token=x.y.z&providerId=google.com', returnSecureToken: true }) }).then(r => r.status), 20000); log({ step: 'rest', r }); } catch (e) { log('rest err ' + e); }
  /* 2. indexedDB open */
  log({ step: 'idb', r: await race(new Promise((res, rej) => { const q = indexedDB.open('wd_probe_db', 1); q.onsuccess = () => { q.result.close(); res('ok'); }; q.onerror = () => rej(q.error); q.onblocked = () => rej(new Error('blocked')); }), 10000) });
  /* 3. SDK import */
  const V = '10.14.1', U = n => `https://www.gstatic.com/firebasejs/${V}/firebase-${n}.js`;
  let t = performance.now(); const imp = await race(Promise.all([import(U('app')), import(U('auth'))]), 30000); log({ step: 'import', ms: Math.round(performance.now() - t), r: imp.ok ? 'ok' : imp });
  if (!imp.ok) { log('DONE'); return; }
  const [FA, FU] = imp.v, c = WDNet.cfg;
  const CONF = {
    B_idb_noresolver: { persistence: [FU.indexedDBLocalPersistence, FU.browserLocalPersistence] },
    C_local_noresolver: { persistence: [FU.browserLocalPersistence] },
  };
  for (const [name, deps] of Object.entries(CONF)) {
    t = performance.now();
    const app = FA.initializeApp({ apiKey: c.apiKey, authDomain: c.authDomain, projectId: c.projectId, appId: c.appId }, 'probe-' + name);
    const auth = FU.initializeAuth(app, deps);
    const rd = await race(auth.authStateReady(), 40000); const ms1 = Math.round(performance.now() - t);
    t = performance.now();
    const sc = await race(FU.signInWithCredential(auth, FU.GoogleAuthProvider.credential('eyJhbGciOiJSUzI1NiJ9.eyJ4IjoxfQ.sig')), 30000);
    log({ step: 'cfg', name, ready: rd.ok ? 'ok' : rd, readyMs: ms1, fakeCred: sc.ok ? 'SIGNED?' : sc, credMs: Math.round(performance.now() - t), iframes: document.querySelectorAll('iframe').length });
  }
  /* 4. real game boot */
  t = performance.now(); const b = await race(WDAcct._boot(), 45000); log({ step: 'game_boot', r: b.ok ? 'ok' : b, ms: Math.round(performance.now() - t) });
  /* 5. native bridge: Apple (simulator w/o Apple ID -> error expected) */
  const pa = race(WDNative.appleSignIn(), 25000);
  await sl(4000); log('SHOT apple'); await sl(2500);
  log({ step: 'apple_native', r: await pa });
  /* 6. real Google button in the login screen (tap) */
  WDAcct.showLogin(); await sl(2500);
  const btn = document.querySelector('#wdl-ov [data-acct="login"]'); log({ step: 'login_btn', found: !!btn });
  const posted = []; const pm = window.webkit.messageHandlers.WDNative.postMessage.bind(window.webkit.messageHandlers.WDNative);
  try { window.webkit.messageHandlers.WDNative.postMessage = o => { posted.push(o && o.method); return pm(o); }; } catch (e) { log('pm wrap fail ' + e); }
  log('SHOT loginscreen'); await sl(2500);
  if (btn) btn.click();
  await sl(6000); log({ step: 'after_google_click', posted });
  log('SHOT google'); await sl(3000);
  log('DONE');
})();
