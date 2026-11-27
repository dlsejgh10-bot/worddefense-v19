(() => { const P = window.P3, S = P.S, E = P.E, seg = P.seg, cl = P.cl, H = P.H, INK = P.INK; const W = () => window.__wd;
P.shake = () => {}; // no screen shake on passives
/* chewy swap squash around swap time e: squash in 0.08s, swap at peak, elastic overshoot/settle 0.3s */
P.chew = (t, e, A = 1.8) => { const u = t - (e - 0.08); if (u >= 0 && u < 0.08) return A * P.E.out(u / 0.08); if (u >= 0.08 && u < 0.4) { const v = (u - 0.08) / 0.3; return A * Math.exp(-3.2 * v) * Math.cos(2.6 * Math.PI * v); } return 0; };
{ const _fr = P.frame; let gt0 = null; P.frame = (f, fps = 24) => { const G = W().G; if (gt0 === null) gt0 = G.t || 0; G.t = gt0 + f / fps; return _fr(f, fps); }; }
const head = m => ({ x: m.x, y: m.y - 22 }), mid = m => ({ x: m.x, y: m.y - 12 }), gnd = m => ({ x: m.x, y: m.y + 3 });
const base = (mobs, towers = []) => P.snapshot([...mobs, ...towers], ['x', 'y', 'hp', 'face']);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const hpDrop = (m, t, th, f) => { if (t >= th) m.hp = Math.max(m.maxHp * 0.04, m.hp - m.maxHp * f); };
const knock = (m, t, th, dx, dy, d = 0.25) => { return; if (t < th) return; const q = seg(t, th, th + d); const k = Math.sin(q * Math.PI * 0.5) * (1 - 0.6 * seg(t, th + d, th + d + 0.4)); m.x += dx * k; m.y += dy * k; };
const sparkBurst = (x, y, n, sd, q, o) => P.sparks(x, y, n, sd, q, o);
P.U = { head, mid, gnd, base, dist, hpDrop, knock };
// generic impact: bloom + animated rays + ring + sparks
const impact = (x, y, q, col, s = 1, sd = 1, o = {}) => { if (q <= 0 || q >= 1) return; const fa = 1 - q, e = E.out(q);
  P.bloom(x, y, 90 * s * (0.6 + 0.4 * e), col, 0.9 * fa); P.bloom(x, y, 34 * s * (1 - q), '#ffffff', 1 - seg(q, 0, 0.35));
  const rq = seg(q, 0, 0.7); if (rq < 1) P.rays(x, y, o.n || 12, 26 * s * E.out5(rq), 80 * s * E.out5(rq), 5 * s * (1 - rq), o.rc || col, 1 - E.in(rq), q * 0.6 + sd, sd);
  P.ringGlow(x, y, 12 * s + 60 * s * E.out(seg(q, 0, 0.6)), o.fy || 1, 5 * s * (1 - q) + 1, col, 0.9 * (1 - seg(q, 0, 0.6)));
  P.sparks(x, y, o.ns || 12, sd * 7, seg(q, 0, 0.8), { a0: o.a0, spread: o.spread, v: 140 * s, len: 26 * s, w: 4.5 * s, col: o.sc || col, g: o.g ?? 180 }); };
P.impact = impact;
// ======================= 레인저 =======================
S.ranger = { dur: 1.2,
  init() { const T = this.T = PM.T, M = this.M = { x: T.x - 27, y: T.y - 3 }; this.tg = PM.tg.slice(); this.base = base(W().G.mobs, [T]);
    const h2 = head(this.tg[this.tg.length - 1]); const dx = h2.x - M.x, dy = h2.y - M.y, L = Math.hypot(dx, dy); this.u = { x: dx / L, y: dy / L };
    this.L = L + 120; this.tf = 0.2; this.hits = this.tg.map((m, i) => this.tf + 0.02 + i * 0.02); },
  update(t) { const { T, tf } = this; P.atk(T, t, tf, 0.25);
    this.tg.forEach((m, i) => { const th = this.hits[i]; P.hit(m, t, th, { fl: 0.08 }); hpDrop(m, t, th, 0.2); }); },
  top(t) { const { M, u, tf, L } = this, an = Math.atan2(u.y, u.x), h0 = head(this.tg[0]);
    // quick reticle lock (~0.15s)
    const aq = seg(t, 0.05, tf), af = 1 - seg(t, tf, tf + 0.05);
    if (aq > 0 && af > 0) { const k = E.out(aq), R = 40 - 18 * E.out3(aq); ctx.save(); ctx.translate(h0.x, h0.y); ctx.rotate((1 - k) * 1.6); ctx.globalAlpha = k * af; ctx.lineCap = 'round';
      for (const [lw, c] of [[7, INK], [3.4, '#ff3b30']]) { ctx.lineWidth = lw; ctx.strokeStyle = c; for (let s = 0; s < 4; s++) { ctx.beginPath(); ctx.arc(0, 0, R, s * 1.571 + 0.3, s * 1.571 + 1.27); ctx.stroke(); ctx.save(); ctx.rotate(s * 1.571); ctx.beginPath(); ctx.moveTo(R * 0.55, 0); ctx.lineTo(R * 1.25, 0); ctx.stroke(); ctx.restore(); } }
      ctx.restore(); }
    // instant bullet: thin tracer streak that vanishes within 0.07s
    const tq = seg(t, tf, tf + 0.07); if (tq > 0 && tq < 1) { const a0 = L * E.out(tq) * 0.6, a1 = L * Math.min(1, 0.35 + tq * 1.2); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - tq; ctx.lineCap = 'round';
      for (const [w, c] of [[5, 'rgba(255,170,60,0.55)'], [2, '#fff6d0']]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(M.x + u.x * a0, M.y + u.y * a0); ctx.lineTo(M.x + u.x * a1, M.y + u.y * a1); ctx.stroke(); } ctx.restore(); }
    // tiny muzzle flash (2 frames)
    const mq = seg(t, tf, tf + 0.085); if (mq > 0 && mq < 1) { const s = 1 - mq * 0.5; P.bloom(M.x + u.x * 8, M.y + u.y * 8, 26 * s, '#ffb040', 0.9);
      ctx.save(); ctx.translate(M.x, M.y); ctx.rotate(an); ctx.beginPath(); ctx.moveTo(0, -6 * s); ctx.lineTo(22 * s, 0); ctx.lineTo(0, 6 * s); ctx.closePath(); ctx.lineWidth = 2; ctx.strokeStyle = '#8a2a0a'; ctx.stroke(); ctx.fillStyle = '#ffd23a'; ctx.fill(); ctx.scale(0.6, 0.5); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore(); }
    // sharp hit sparks + headshot reticle on each pierced slime
    this.tg.forEach((m, i) => { const th = this.hits[i], q = seg(t, th, th + 0.2), h = head(m); impact(h.x, h.y, q, '#ff5a2a', 0.6, 11 + i * 5, { a0: an, spread: 1.2, rc: '#ffb43a', sc: '#ffd27a', g: 100, ns: 4, n: 6 });
      const c = seg(t, th, th + 0.08), cf = 1 - seg(t, th + 0.2, th + 0.32); if (t >= th && cf > 0) { const sc = 1.6 - 0.6 * E.back(c), R = 16 * sc; ctx.save(); ctx.translate(h.x, h.y); ctx.globalAlpha = cf;
        for (const [lw, col] of [[7, INK], [3.4, '#ff3b30']]) { ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate(k * Math.PI / 2); ctx.beginPath(); ctx.moveTo(R * 0.45, 0); ctx.lineTo(R * 1.5, 0); ctx.stroke(); ctx.restore(); } } ctx.restore(); } });
    this.tg.forEach((m, i) => { const h = head(m); P.dmg(h.x + 4, h.y - 40 - i * 26, 1240, '#ff5a3c', t - this.hits[i], true, 0.9); });
  } };
// ======================= 레인저 액티브: 난사(쇼타임) — wd-skill.js V.rapid: n=5 (Lv1), gap 0.15s, R 120, every shot hits all mobs in R =======================
// sprite = user's barrage-01-physical sheet (3x2, 512px cells); muzzle tips measured on the sheet
const BAR_MZ = { bar1: [[153, 262, 180], [429, 266, 0]], bar2: [[59, 203, -150], [446, 243, 0]], bar3: [[42, 241, 180], [466, 242, 0]], bar4: [[115, 376, 130], [477, 116, -35]], bar5: [[65, 121, -145], [453, 340, 30]], bar6: [[449, 204, 0], [446, 299, 5]] };   /* bar1~6 re-cut 592px wide (+40px clear margin each side, same centre/foot) so sheet pixel x = old + 40 */
/* barrage sheets = tier-6 (6글자) gunner art, so this scene places a 6-letter ranger: idle/charge/return and barrage poses are the same design */
PM.S.ranger_skill = Object.assign({}, PM.S.ranger, { setup() { PM.S.ranger.setup(); PM.T = PM.place('rapid', 0, 0, 4, [6]); } });
S.ranger_skill = { dur: 1.9,
  init() { const G = W().G, T = this.T = PM.T, X = 360, Y = T.y; const o = G.towers.find(q => q !== T && Math.abs(q.x - X) < 30 && Math.abs(q.y - Y) < 30); if (o) { o.x = T.x; o.y = T.y; } T.x = X;
    const pos = [[292, 727], [330, 719], [395, 729], [430, 721], [215, 725], [505, 723]];
    G.mobs.forEach((m, i) => { const p = pos[i % pos.length]; if (i < pos.length) { m.x = p[0]; m.y = p[1]; } else { m.x = -999; } m.hp = m.maxHp * (0.75 + 0.05 * (i % 3)); });
    this.R = 120; this.ms = G.mobs.filter(m => Math.hypot(m.x - T.x, m.y - T.y) <= this.R); this.base = base(G.mobs, G.towers);
    this.f0 = T.face; this.t0 = 0.5; this.gap = 0.1; /* user: interval 0.10s (game value to change next build) */ this.face = [1, -1, -1, 1, -1]; this.pose = ['bar6', 'bar2', 'bar5', 'bar4', 'bar6']; this.shots = this.face.map((f, i) => this.t0 + i * this.gap); this.H = 422; },
  cur(t) { let k = -1; this.shots.forEach((s, i) => { if (t >= s - 0.03) k = i; }); return k; },
  update(t) { const { T } = this, k = this.cur(t), end = t > this.shots[4] + 0.25;
    /* idle/return: NEW black-coat 6글자 physical ranger art (u2 6_0_rapid_i, commit 00e0704), drawn with the game's u2 anchor (foot = image bottom, cx = -p[0] = 99.2) */
    const IDLE = { nm: 'r6i', flip: this.f0 < 0, H: 207, cx: 99.2 };
    T.__spr = end || t < 0.12 ? IDLE : k < 0 ? { nm: 'bar1', flip: false, H: this.H } : { nm: this.pose[k], flip: this.face[k] < 0, H: this.H }; T.face = T.__spr ? (T.__spr.flip ? -1 : 1) : this.f0; T.animT = -1;
    /* chewy return: squash on the last barrage frame (0.08s), swap to the normal sprite at peak squash, overshoot stretch, elastic settle (~0.3s) */
    { const e = this.shots[4] + 0.25, u = t - (e - 0.08); let sq = 0; if (u >= 0 && u < 0.08) sq = 1.8 * E.out(u / 0.08); else if (u >= 0.08 && u < 0.4) { const v = (u - 0.08) / 0.3; sq = 1.8 * Math.exp(-3.2 * v) * Math.cos(2.6 * Math.PI * v); } T.squash = sq; }
    this.shots.forEach((s, i) => this.ms.forEach((m, j) => { P.hit(m, t, s, { fl: 0.05 }); hpDrop(m, t, s, 0.05); })); },
  top(t) { const { T } = this, k = this.cur(t);
    // polished fast charge (~0.27s): dense additive gold/white particles spiralling hard into the chest/gun hands with motion-trail tails,
    // an inward-contracting soft glow disc, a core that swells then snaps -> crisp short star flash + ONE sharp thin shockwave ring at fire
    { const c = { x: T.x, y: T.y - 6 }, c0 = this.t0 - 0.3, c1 = this.t0 - 0.03, cq = seg(t, c0, c1);
      if (cq > 0 && cq < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
        // REDESIGN (no rotation at all): soft glow disc contracting + light needles shooting STRAIGHT inward along fixed radial lines, fast early then easing (ease-out)
        { const eo = 1 - Math.pow(1 - cq, 3), r = 56 - 38 * eo, g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r); g.addColorStop(0, `rgba(255,236,170,${0.10 + 0.35 * cq})`); g.addColorStop(0.55, `rgba(255,190,70,${0.08 + 0.2 * cq})`); g.addColorStop(1, 'rgba(255,170,40,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.82, 0, 0, 6.283); ctx.fill(); }
        const NP = 10; ctx.lineCap = 'round'; for (let i = 0; i < NP; i++) { const st = H(i + 600) * 0.3, p = seg(cq, st, Math.min(1, st + 0.6)); if (p <= 0 || p >= 1) continue;
          const an = i * 6.283 / NP + (H(i + 603) - 0.5) * 0.35, ux = Math.cos(an), uy = Math.sin(an) * 0.82, e = 1 - Math.pow(1 - p, 3), rO = (50 + 16 * H(i + 602)) * (1 - e) + 3, rI = rO * (0.45 + 0.2 * e), al = Math.min(1, p * 5) * (1 - seg(p, 0.85, 1));
          const g = ctx.createLinearGradient(c.x + ux * rO, c.y + uy * rO, c.x + ux * rI, c.y + uy * rI); g.addColorStop(0, 'rgba(255,190,80,0)'); g.addColorStop(1, 'rgba(255,248,220,1)');
          ctx.globalAlpha = al; ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(c.x + ux * rO, c.y + uy * rO); ctx.lineTo(c.x + ux * rI, c.y + uy * rI); ctx.stroke(); }
        ctx.restore();
        // core: swells, then snaps tight right before the flash
        const sw = cq < 0.82 ? 1 - Math.pow(1 - cq / 0.82, 3) : 1 - 0.6 * seg(cq, 0.82, 1); P.bloom(c.x, c.y, 6 + 18 * sw, '#ffc95a', 0.5 + 0.5 * sw); P.bloom(c.x, c.y, 3 + 7 * sw, '#ffffff', 0.7 + 0.3 * sw); }
      // fire: crisp short star flash + one thin sharp shockwave ring
      const fq = seg(t, c1, c1 + 0.09); if (fq > 0 && fq < 1) { const k = 1 - fq; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(c.x, c.y);
        for (let s = 0; s < 4; s++) { const L = (s % 2 ? 22 : 34) * (0.6 + 0.4 * k), w = 2.6 * k + 0.4; ctx.save(); ctx.rotate(s * Math.PI / 2 + 0.785 * (s > 1 ? 0 : 0)); const g = ctx.createLinearGradient(0, 0, L, 0); g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, 'rgba(255,210,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w); ctx.lineTo(L, 0); ctx.lineTo(0, w); ctx.closePath(); ctx.fill(); ctx.rotate(Math.PI); ctx.restore(); }
        ctx.restore(); P.bloom(c.x, c.y, 16 * k + 4, '#ffffff', k); P.bloom(c.x, c.y, 30 * k, '#ffc95a', 0.6 * k); }
      const rq = seg(t, c1, c1 + 0.16); if (rq > 0 && rq < 1) { const r = 8 + 62 * E.out5(rq); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - E.in(rq); ctx.lineWidth = 1.6 * (1 - rq) + 0.6; ctx.strokeStyle = '#fff2c4'; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.82, 0, 0, 6.283); ctx.stroke();
        ctx.globalAlpha = 0.45 * (1 - rq); ctx.lineWidth = 4 * (1 - rq) + 1; ctx.strokeStyle = '#ffb84a'; ctx.stroke(); ctx.restore(); } }
    this.shots.forEach((s, i) => { if (t < s || t > s + 0.2) return; const nm = this.pose[i], fl = this.face[i] < 0, sv = T.__spr; T.__spr = { nm, flip: fl, H: this.H };
      const mz = BAR_MZ[nm].map(([px, py, a]) => { const p = P3.sprPt(T, px, py), an = (fl ? 180 - a : a) * Math.PI / 180; return { x: p.x, y: p.y, an }; }); T.__spr = sv;
      // muzzle flash at every gun tip of this frame: crisp 3-spike flash along the barrel, white core, no outline (~2 frames)
      const mq = seg(t, s, s + 0.1); if (mq > 0 && mq < 1) for (const M of mz) { const sc = 1.25 * (1 - 0.45 * mq), a = 1 - mq * 0.6;
        P.bloom(M.x + Math.cos(M.an) * 6, M.y + Math.sin(M.an) * 6, 18 * sc, '#ffb040', 0.75 * a);
        ctx.save(); ctx.translate(M.x, M.y); ctx.rotate(M.an); ctx.globalCompositeOperation = 'lighter';
        const spike = (len, w, an, c0, c1) => { ctx.save(); ctx.rotate(an); const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w); ctx.quadraticCurveTo(len * 0.4, -w * 0.7, len, 0); ctx.quadraticCurveTo(len * 0.4, w * 0.7, 0, w); ctx.closePath(); ctx.fill(); ctx.restore(); };
        ctx.globalAlpha = a; spike(24 * sc, 6 * sc, 0, 'rgba(255,200,80,0.95)', 'rgba(255,120,30,0)'); spike(12 * sc, 3.6 * sc, -0.85, 'rgba(255,190,80,0.9)', 'rgba(255,120,30,0)'); spike(12 * sc, 3.6 * sc, 0.85, 'rgba(255,190,80,0.9)', 'rgba(255,120,30,0)');
        spike(15 * sc, 2.8 * sc, 0, 'rgba(255,255,240,1)', 'rgba(255,240,200,0)'); const g = ctx.createRadialGradient(1, 0, 0, 1, 0, 6 * sc); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(1, 0, 6 * sc, 0, 6.283); ctx.fill(); ctx.restore(); } });
    // hit sparks + numbers
    this.shots.forEach((s, i) => this.ms.forEach((m, j) => { const h = mid(m), th = s, q = seg(t, th, th + 0.16); if (q > 0 && q < 1) { const an = Math.atan2(h.y - T.y, h.x - T.x); P.bloom(h.x, h.y, 14 * (1 - q), '#ffe0a0', 0.8 * (1 - q)); P.sparks(h.x, h.y, 4, 400 + i * 13 + j, q, { a0: an, spread: 1.3, v: 70, len: 7, w: 1.8, col: '#ffd27a', g: 0 }); }
      P.dmg(h.x + (H(i * 7 + j) - 0.5) * 18, h.y - 34 - i * 13, 480, '#ffffff', t - th, false, 0.6); }));
  } };
// ======================= 사수 =======================
S.archer = { dur: 2.0,
  init() { const G = W().G, T = this.T = PM.T; this.B = { x: T.x - 22, y: T.y - 10 }; this.N = PM.N; const D = PM.D;
    const v = this.V = Object.assign({}, G.mobs[1], { id: 99999, x: D.x, y: D.y + 4, flash: 0, dbT: new Array(10).fill(0), dbK: new Array(10).fill(0), dbIn: [], maxHp: 1000, hp: 120, dead: false }); G.mobs.push(v);
    this.base = base(G.mobs, [T]); this.all = G.mobs.slice(); this.t1 = 0.12; this.t2 = 0.32; this.tc = 0.4; this.tr = 0.5; this.th = 0.6; },
  update(t) { const G = W().G, { T, V } = this; G.mobs = t < this.t2 + 0.03 ? this.all.slice() : this.all.filter(m => m !== V);
    /* shooting pose = the user's archer skill cut (t5_12, same 5글자 archer as the scene hero) for both shots, per-shot recoil, then chewy return to idle */
    { const fl = this.N.x < T.x, e = this.tr + 0.2; T.__spr = t >= this.t1 - 0.04 && t < e ? { nm: 't5_12', flip: fl, H: 340 } : null; T.face = fl ? -1 : 1; T.animT = -1;
      let sq = 0, rx = 0; for (const s of [this.t1, this.tr]) { const u = t - (s - 0.035); if (u < 0 || u > 0.1) continue; if (u < 0.035) { const k = E.out(u / 0.035); sq = 1.3 * k; rx = 2.5 * k; } else { const v = (u - 0.035) / 0.065; sq = -0.9 * Math.exp(-3 * v) * Math.cos(1.6 * Math.PI * v); rx = 2.5 * (1 - E.out3(v)) - 1.2 * Math.sin(Math.PI * v); } }
      const ch = P.chew(t, e); if (ch) sq = ch; T.squash = sq; T.x += (fl ? 1 : -1) * rx; } P.hit(V, t, this.t2); P.hit(this.N, t, this.th, { fl: 0.12, col: '#fff3b0' }); hpDrop(this.N, t, this.th, 0.5);
    const dx = this.N.x - this.B.x, dy = this.N.y - this.B.y, L = Math.hypot(dx, dy);  },
  path(q, A, Bp) { return { x: A.x + (Bp.x - A.x) * q, y: A.y + (Bp.y - A.y) * q - 26 * Math.sin(q * Math.PI) }; },
  top(t) { const { V, T } = this, vm = mid(V), nm = mid(this.N), B = (() => { const sv = T.__spr, fl = this.N.x < T.x; T.__spr = { nm: 't5_12', flip: fl, H: 340 }; const p = P3.sprPt(T, 325, 210); T.__spr = sv; return p; })();
    { const q = seg(t, this.t1, this.t2); if (q > 0 && q < 1) { const p = this.path(q, B, vm), p2 = this.path(Math.min(1, q + 0.02), B, vm); arrow13(p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), 0, 1, true); } }
    // kill pop: quick small puff
    { const q = seg(t, this.t2, this.t2 + 0.3); if (q > 0 && q < 1) { const fa = 1 - q; P.bloom(vm.x, vm.y, 40, '#ffffff', 0.7 * (1 - seg(q, 0, 0.4))); for (let i = 0; i < 5; i++) { const an = i * 1.257 + 0.3, d = 8 + 22 * E.out(q); P.smoke(vm.x + Math.cos(an) * d, vm.y + Math.sin(an) * d * 0.6 - 8 * q, 10 + 6 * q, 0.8 * fa, '#ffffff'); } } }
    // shooting-star shot: small bright golden head + crisp tapered streak, no glow haze
    const A0 = { x: B.x, y: B.y }, A1 = { x: nm.x, y: nm.y }, dx = A1.x - A0.x, dy = A1.y - A0.y, L = Math.hypot(dx, dy), an = Math.atan2(dy, dx), ux = Math.cos(an), uy = Math.sin(an);
    { const q = seg(t, this.tr, this.th); if (q > 0) P.starShot(A0, A1, q, seg(t, this.th, this.th + 0.2)); }
    // hit: clean flash + short sparks + modest smoke
    P.starHit(nm.x, nm.y, t - this.th, an, 77);
    P.dmg(nm.x + 4, nm.y - 44, 3480, '#ffd23a', t - this.th, true, 1.0);
  } };
P.goldArrow = (x, y, a, s) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(255,190,40,0.95)'; ctx.shadowBlur = 22;
  // shaft
  ctx.beginPath(); ctx.rect(-44, -3.2, 62, 6.4); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.shadowBlur = 0; let g = ctx.createLinearGradient(0, -3, 0, 3); g.addColorStop(0, '#fff2a0'); g.addColorStop(0.5, '#ffc21e'); g.addColorStop(1, '#b87808'); ctx.fillStyle = g; ctx.fill();
  // fletching
  for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-40, sy * 13); ctx.lineTo(-52, sy * 13); ctx.lineTo(-42, 0); ctx.closePath(); ctx.lineWidth = 3.4; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = sy < 0 ? '#ff7a2e' : '#e0541e'; ctx.fill(); ctx.beginPath(); ctx.moveTo(-31, sy * 2); ctx.lineTo(-43, sy * 10); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,230,180,0.9)'; ctx.stroke(); }
  // head
  ctx.shadowBlur = 26; ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(14, -11); ctx.lineTo(18, 0); ctx.lineTo(14, 11); ctx.closePath(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.shadowBlur = 0; g = ctx.createLinearGradient(14, -11, 30, 6); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#ffe27a'); g.addColorStop(1, '#d89a10'); ctx.fillStyle = g; ctx.fill();
  ctx.restore(); P.bloom(x + Math.cos(a) * 34 * s, y + Math.sin(a) * 34 * s, 22, '#fff3b0', 0.8); };
// ======================= 저격수 =======================
S.sniper = { dur: 2.6,
  init() { const T = this.T = PM.T; this.M = { x: T.x - 40, y: T.y - 6 }; this.tg = PM.tg.slice(); this.base = base(W().G.mobs, [T]); this.N = this.tg[0];
    this.shots = [0.2, 0.6, 1.0, 1.6]; this.tc = 1.1;
    const c0 = mid(this.N), dx = c0.x - this.M.x, dy = c0.y - this.M.y, L0 = Math.hypot(dx, dy); this.u = { x: dx / L0, y: dy / L0 }; this.Lr = 400;
    // game pierce rule: every mob whose centre is within width/2 + r of the line (width 22), 0..range along it
    const ux = this.u.x, uy = this.u.y; this.pm = W().G.mobs.filter(m => { if (m.dead) return false; const c = mid(m), px = c.x - this.M.x, py = c.y - this.M.y, al = px * ux + py * uy; return al > 0 && al < this.Lr && Math.abs(px * uy - py * ux) <= 11 + (m.r || 14); })
      .map(m => { const c = mid(m); return { m, al: (c.x - this.M.x) * ux + (c.y - this.M.y) * uy }; }).sort((a, b2) => a.al - b2.al); },
  update(t) { const { T } = this; this.shots.forEach((s, i) => { if (t >= s - 0.2 && (i === 3 || t < this.shots[i + 1] - 0.2 || t < s + 0.3)) P.atk(T, t, s, 0.35); this.pm.forEach((p, j) => P.hit(p.m, t, s + 0.02 + j * 0.012, { fl: i === 3 ? 0.1 : 0.06, col: i === 3 ? '#ff9aa6' : '#ffffff' })); });
    this.pm.forEach((p, j) => hpDrop(p.m, t, this.shots[3], 0.4)); },
  top(t) { const { M, T } = this, c = mid(this.N), ux = this.u.x, uy = this.u.y, L = this.Lr;
    const tr = (s, w, c0, c1, comp) => { const q = seg(t, s, s + 0.07); if (q <= 0 || q >= 1) return; const a0 = L * Math.max(0, q * 1.4 - 0.4), a1 = L * Math.min(1, 0.4 + q * 1.2); ctx.save(); ctx.globalCompositeOperation = comp; ctx.globalAlpha = 1 - q * 0.6; ctx.lineCap = 'round';
      ctx.lineWidth = w + 2; ctx.strokeStyle = c0; ctx.beginPath(); ctx.moveTo(M.x + ux * a0, M.y + uy * a0); ctx.lineTo(M.x + ux * a1, M.y + uy * a1); ctx.stroke(); ctx.lineWidth = w * 0.45; ctx.strokeStyle = c1; ctx.stroke(); ctx.restore(); };
    // shots 1-3: normal light shot
    for (let i = 0; i < 3; i++) { const s = this.shots[i]; tr(s, 2.4, 'rgba(255,240,200,0.6)', '#ffffff', 'lighter'); this.pm.forEach((p, j) => { const cc = mid(p.m), f = seg(t, s + 0.02 + j * 0.012, s + 0.14 + j * 0.012); if (f > 0 && f < 1) { ctx.save(); star4(cc.x, cc.y, 9 * (1 - 0.4 * f), '#fff6d0', 1 - f); ctx.restore(); } }); }
    // 4th-hit charge: subtle dark-crimson aura on the sniper
    const ag = seg(t, this.tc, this.tc + 0.3) * (1 - seg(t, this.shots[3] + 0.05, this.shots[3] + 0.35)); if (ag > 0) { const g0 = { x: T.x, y: T.y - 6 }, pul = 0.85 + 0.15 * Math.sin(t * 18);
      ctx.save(); ctx.globalAlpha = ag * pul; ctx.translate(g0.x, g0.y); ctx.scale(1, 1.25); const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 30); g.addColorStop(0, 'rgba(70,6,16,0)'); g.addColorStop(0.65, 'rgba(90,8,22,0.38)'); g.addColorStop(0.85, 'rgba(150,20,36,0.45)'); g.addColorStop(1, 'rgba(60,4,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.283); ctx.fill(); ctx.restore();
      for (let i = 0; i < 5; i++) { const ph = (t * 0.9 + H(i + 20)) % 1, x = T.x + (H(i + 21) - 0.5) * 34, y = T.y + 10 - 40 * ph; ctx.save(); ctx.globalAlpha = ag * E.bell(ph) * 0.85; ctx.fillStyle = i % 2 ? '#5a0814' : '#9a1828'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill(); ctx.restore(); } }
    // 4th shot: thin quick dark-red tracer + small impact
    const s4 = this.shots[3]; tr(s4, 3.2, 'rgba(60,4,12,0.85)', '#c0283a', 'source-over');
    { const mq = seg(t, s4, s4 + 0.1); if (mq > 0 && mq < 1) { ctx.save(); ctx.globalAlpha = 1 - mq; ctx.fillStyle = '#7a0e1c'; ctx.beginPath(); ctx.arc(M.x, M.y, 6 * (1 - 0.3 * mq), 0, 6.283); ctx.fill(); ctx.restore(); } }
    this.pm.forEach((p, j) => { const c = mid(p.m); { const k = t - s4 - 0.02 - j * 0.012; if (k >= 0) { const f = seg(k, 0, 0.14); if (f < 1) { ctx.save(); star4(c.x, c.y, 16 * (1 - 0.4 * f), '#4a0610', 1 - f); star4(c.x, c.y, 10 * (1 - 0.4 * f), '#d0303e', 1 - f); ctx.restore(); }
      P.sparks(c.x, c.y, 5, 91 + j * 7, seg(k, 0, 0.22), { a0: -Math.PI / 2, spread: 2.4, v: 60, len: 10, w: 2.4, col: '#a01828', g: 0 }); } } });
    this.pm.forEach((p, j) => { const cc = mid(p.m); for (let i = 0; i < 3; i++) P.dmg(cc.x + 4 + (i - 1) * 10, cc.y - 40 - i * 12, 820, '#ffffff', t - this.shots[i] - 0.02 - j * 0.012, false, 0.7);
      P.dmg(cc.x + 6, cc.y - 82, 2460, '#c0283a', t - s4 - 0.02 - j * 0.012, true, 0.9); });
  } };
// ======================= 저격수 궁극기: 속성별 빔 =======================
{ const EL = { phys: 0, fire: 1, water: 2, ice: 3, lightning: 4 };
  const mk = C => ({ dur: 3.2,
  init() { const T = this.T = PM.T; this.M = { x: T.x - 40, y: T.y - 6 }; this.tg = PM.tg.slice(); this.base = base(W().G.mobs, [T]);
    const m2 = mid(this.tg[2]), dx = m2.x - this.M.x, dy = m2.y - this.M.y, L = Math.hypot(dx, dy); this.u = { x: dx / L, y: dy / L }; this.L = (this.M.x + 60) / -this.u.x; this.tc = 0.15; this.tf = 1.3; },
  update(t) { const { T, tf } = this; P.atk(T, t, tf, 0.5); if (t >= tf) P.shake(tf, 9, 0.4);
    this.tg.forEach((m, i) => { const th = tf + 0.02 + i * 0.025; P.hit(m, t, th, { fl: 0.13, col: C.l }); hpDrop(m, t, th, 0.5); /* no knockback (standing rule): mobs stay in place */ }); },
  top(t) { const { M, u, tf, L } = this, an = Math.atan2(u.y, u.x), ex = M.x + u.x * L, ey = M.y + u.y * L;
    const q = seg(t, this.tc, tf); if (q > 0 && t < tf + 0.04) { const k = E.in(q), pul = 0.85 + 0.15 * Math.sin(t * 45);
      P.bloom(M.x, M.y, (30 + 70 * k) * pul, C.m, 0.45 + 0.5 * k); P.bloom(M.x, M.y, (10 + 20 * k) * pul, '#ffffff', 0.6 + 0.4 * k);
      /* inward tailed streak particles removed (user) */
      for (let j = 0; j < 1; j++) { const rq = (q * 2.4 + j * 0.5) % 1; P.ringGlow(M.x, M.y, 80 * (1 - E.out(rq)) + 8, 1, 3, C.m, E.bell(rq) * k); }
      P.twinkle(M.x, M.y, (12 + 18 * k) * pul, 1, t * 5, C.l); }
    const b = t - tf; if (b >= 0 && b < 0.75) { const grow = E.out5(cl(b / 0.05)), thin = 1 - E.in(seg(b, 0.18, 0.7)), pul = 1 + 0.18 * Math.sin(b * 80), w = 11.5 * (b < 0.05 ? 1.4 : 1) * thin * pul; /* ~23% thinner core+glow */
      const Lx = M.x + u.x * L * grow, Ly = M.y + u.y * L * grow; P.beam(M.x, M.y, Lx, Ly, w, C.m, C.l, 1);
      for (let i = 0; i < 26; i++) { const ph = (b * 2.2 + H(i)) % 1, d = L * grow * ph, off = (H(i + 5) - 0.5) * 17 * thin; P.bloom(M.x + u.x * d - u.y * off, M.y + u.y * d + u.x * off, 7, C.l, 0.9 * thin); }
      const mq = seg(b, 0, 0.35); P.bloom(M.x, M.y, 120 * (1 - mq), C.m, 1 - mq); P.rays(M.x, M.y, 10, 30 * (1 - mq), 80 * (1 - mq * 0.5), 6 * (1 - mq), C.l, 1 - mq, an + 0.3, 5);
      P.ringGlow(M.x, M.y, 14 + 60 * E.out(mq), 1, 5 * (1 - mq) + 1, C.l, 1 - mq); }
    if (b > 0.1 && b < 1.4) for (let i = 0; i < 24; i++) { const d = L * H(i * 3.3), q2 = seg(b, 0.1 + H(i) * 0.15, 0.8 + H(i) * 0.5); if (q2 <= 0 || q2 >= 1) continue; const off = (H(i + 7) - 0.5) * 40 * E.out(q2); P.bloom(M.x + u.x * d - u.y * off, M.y + u.y * d + u.x * off - 16 * q2, 6 * (1 - q2) + 2, C.l, 1 - q2); }
    this.tg.forEach((m, i) => { const th = tf + 0.02 + i * 0.025, c = mid(m); impact(c.x, c.y, seg(t, th, th + 0.55), C.m, 1.0, 40 + i * 5, { a0: an, spread: 1.8, rc: C.l, sc: C.l, g: 60, fy: 0.85 }); });
    this.tg.forEach((m, i) => { const th = tf + 0.02 + i * 0.025, c = mid(m); P.dmg(c.x + 6, c.y - 42 - i * 24, 2960, C.n, t - th, true, 0.85); });
  } });
  for (const [k, e] of Object.entries(EL)) { const c6 = (typeof EC6 !== 'undefined' ? EC6 : [])[e] || ['#ffffff', '#ffffff', '#888888']; S['sniper_ult_' + k] = mk({ m: e === 1 ? '#ff5a1e' : c6[0], l: e === 1 ? '#ff9a50' : e === 2 ? '#8cc4ff' : c6[1], d: c6[2], n: c6[0] }); } }
// ======================= 전사: 어스름 (검기 날리기) =======================
S.warrior = { dur: 2.2,
  /* REDESIGN v2 (iai quick-draw): 1s tension charge -> koiguchi glint -> 0.07s crescent sweep -> 0.1s hit-stop (frozen blade + white-flashed targets + razor line) -> line SPLITS + sparks + dmg -> crescent thins out -> chewy idle return */
  init() { const T = this.T = PM.T, G = W().G; { const nm = G.mobs.filter(m => !m.dead).sort((a, b2) => Math.hypot(a.x - T.x, a.y - T.y) - Math.hypot(b2.x - T.x, b2.y - T.y))[0]; if (nm) T.face = nm.x < T.x ? -1 : 1; } /* game: T.face = tgt.x < T.x ? -1 : 1 */
    this.base = base(G.mobs, [T]); this.O = { x: T.x, y: T.y - 12 }; this.ky = 0.62; this.ts = 1.08; this.sw = 0.084; this.HS = 0; this.tsp = this.ts + this.sw + 0.04; /* ONE continuous 270deg pass, no hit-stop pause */ this.A0 = (T.face < 0 ? Math.PI : 0) - Math.PI * 0.75; this.SP = Math.PI * 1.5;
    const ed = m => Math.hypot(m.x - this.O.x, (m.y - this.O.y) / this.ky); const ms = G.mobs.filter(m => !m.dead).sort((a, b2) => ed(a) - ed(b2)); this.R = Math.min(150, Math.max(90, ms.length > 1 ? ed(ms[1]) + 12 : 100));
    this.tg = []; this.th = []; for (const m of ms) { if (ed(m) > this.R + 14) continue; let a = Math.atan2((m.y - this.O.y) / this.ky, m.x - this.O.x), fr = ((a - this.A0) % 6.283 + 6.283) % 6.283 / this.SP; if (fr > 1) continue; this.tg.push(m); this.th.push(this.ts + this.sw * (1 - Math.sqrt(1 - fr))); }
    /* mobs must be CLEAN before the blade passes: no pre-damage state (game draws marks on damaged mobs) */ this.tg.forEach(m => { m.hp = m.maxHp; }); this.base = base(G.mobs, [T]);
    /* razor cut line: straight through all targets, slight tilt, drawn in facing direction */
    if (this.tg.length) { const cs = this.tg.map(m => mid(m)), cx = cs.reduce((s, c) => s + c.x, 0) / cs.length, cy = cs.reduce((s, c) => s + c.y, 0) / cs.length, an = -0.2 * (T.face < 0 ? -1 : 1), ux = Math.cos(an), uy = Math.sin(an);
      const pr = cs.map(c => (c.x - cx) * ux + (c.y - cy) * uy), lo = Math.min(...pr) - 46, hi = Math.max(...pr) + 46; this.CL = T.face < 0 ? { a: { x: cx + ux * hi, y: cy + uy * hi }, b: { x: cx + ux * lo, y: cy + uy * lo } } : { a: { x: cx + ux * lo, y: cy + uy * lo }, b: { x: cx + ux * hi, y: cy + uy * hi } };
      /* visual sweep: crescent passes THROUGH the targets (mirrored to face-right space), hit times follow the blade head */
      const fs = T.face < 0 ? -1 : 1, ang = cs.map(c => Math.atan2((c.y - this.O.y) / this.ky, (c.x - this.O.x) * fs)), rad = cs.map(c => Math.hypot((c.x - this.O.x), (c.y - this.O.y) / this.ky));
      /* 270deg sweep in face-right (mirrored) space: tip starts up-back (-135deg), passes over the front, ends low-back (+135deg); back 90deg empty. hit-stop: blade freezes HS at first contact, then continues */
      this.VR = this.R; this.VA0 = -Math.PI * 0.75; this.VSP = Math.PI * 1.5; this.thw = ang.map(a => this.ts + this.sw * (1 - Math.sqrt(1 - Math.min(1, Math.max(0, (a - this.VA0) / this.VSP)))));
      this.th = this.thw.slice(); } },
  spr(t) { const { T } = this; return t < this.ts ? { nm: 't5_15', flip: T.face < 0, H: 262 } : { nm: 't5_16', flip: T.face < 0, H: 262 }; },
  update(t) { const { T, tsp } = this, e = 1.62; T.__spr = t < e ? this.spr(t) : null; T.squash = P.chew(t, e); T.animT = -1; /* after the draw-slash: chewy return to idle (same 5글자 knight) */
    this.tg.forEach((m, i) => { P.hit(m, t, this.th[i], { fl: tsp - this.th[i] + 0.03, col: '#ffffff' }); hpDrop(m, t, tsp, 0.3); }); },
  top(t) { const { O, T, R, ky, A0, SP, ts, sw, HS, tsp } = this, hand = (() => { const sv = T.__spr; T.__spr = { nm: 't5_15', flip: T.face < 0, H: 262 }; const p = P3.sprPt(T, 262, 300); T.__spr = sv; return p; })();
    const EDGE = '#2f8cff', MIDC = '#a8dcff', add = fn => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; fn(); ctx.restore(); };
    // ---- charge (1s rhythm): sheath aura breathes, 3 thin pressure rings snap into the hilt at accelerating beats
    { const cq = seg(t, 0.1, ts); if (cq > 0 && t < ts + 0.02) { const k = (1 - Math.exp(-4 * cq)) / (1 - Math.exp(-4)); /* exponential: gathers fast early, then settles */ P.bloom(hand.x, hand.y, 8 + 16 * k, '#9fd0ff', 0.2 + 0.5 * k);
      /* ONE ring: converges fast at first, then slows (ease-out), fully converged exactly at ts -> 270deg draw fires */ { const r = seg(t, 0.1, ts); if (r > 0 && r < 1) { const q = (1 - Math.exp(-4 * r)) / (1 - Math.exp(-4)); P.ringGlow(hand.x, hand.y, 4 + 60 * (1 - q), 0.8, 1.6 + 1.6 * q, MIDC, Math.min(1, r / 0.04) * (0.45 + 0.55 * q)); } } } }
    // ---- koiguchi glint: long horizontal star flare on the hilt just before the draw
    { const g = seg(t, ts - 0.09, ts + 0.03); if (g > 0 && g < 1) { const a = E.bell(g), L1 = 8 + 44 * a; add(() => { ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = a; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(hand.x - L1, hand.y); ctx.lineTo(hand.x + L1, hand.y); ctx.stroke(); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(hand.x, hand.y - L1 * 0.4); ctx.lineTo(hand.x, hand.y + L1 * 0.4); ctx.stroke(); }); P.bloom(hand.x, hand.y, 16, '#dff0ff', a); } }
    // ---- crescent blade arc: sweep (sw) -> frozen at full brightness during hit-stop (HS) -> thins to a hairline and fades
    const q = seg(t, ts, ts + sw), rel = seg(t, tsp, tsp + 0.2), fs = T.face < 0 ? -1 : 1; if (this.VR && q > 0 && rel < 1) { const R = this.VR, head = this.VA0 + this.VSP * E.out(q), tl = Math.max(this.VA0, head - this.VSP * 0.75), N = 60, wk = 1 - E.in(rel), rr = R, al = 1 - E.in(rel);
      const quads = (wMax, rOff, col, aMul, pw, mode) => { ctx.save(); ctx.translate(O.x, O.y); ctx.scale(fs, ky); ctx.globalCompositeOperation = mode; ctx.fillStyle = col;
        for (let k = 0; k < N; k++) { const s0 = k / N, s1 = (k + 1) / N, a0 = tl + (head - tl) * s0, a1 = tl + (head - tl) * s1, w0 = wMax * Math.pow(Math.sin(Math.PI * Math.pow(s0, 1.7)), pw), w1 = wMax * Math.pow(Math.sin(Math.PI * Math.pow(s1, 1.7)), pw);
          ctx.globalAlpha = cl(aMul * Math.pow(s1, 0.9)); ctx.beginPath(); ctx.moveTo(Math.cos(a0) * (rr + rOff), Math.sin(a0) * (rr + rOff)); ctx.lineTo(Math.cos(a1) * (rr + rOff), Math.sin(a1) * (rr + rOff)); ctx.lineTo(Math.cos(a1) * (rr + rOff - w1), Math.sin(a1) * (rr + rOff - w1)); ctx.lineTo(Math.cos(a0) * (rr + rOff - w0), Math.sin(a0) * (rr + rOff - w0)); ctx.closePath(); ctx.fill(); } ctx.restore(); };
      quads(48 * wk + 2, 5, 'rgba(10,22,66,1)', 0.3 * al, 0.8, 'source-over');   // faint dark underlay: contrast on grass
      quads(38 * wk + 1, 2, EDGE, 0.6 * al, 0.8, 'source-over');                     // colored edge glow
      quads(22 * wk + 1, 0, MIDC, 0.85 * al, 1.0, 'lighter');
      quads(9 * wk + 1.4, 0, '#ffffff', 1.0 * al, 1.3, 'lighter');                 // white-hot razor core on the leading (outer) edge
      if (q < 1) { const hx = O.x + fs * Math.cos(head) * rr, hy = O.y + Math.sin(head) * rr * ky; P.bloom(hx, hy, 22, '#eaf6ff', 1); }
    }
    // ---- razor cut line through every target: draws at first contact, frozen bright during hit-stop, then SPLITS into two halves that slide apart and vanish
    // ---- per-target cut lines along the blade path (tangent to the 270deg arc): drawn as the tip passes, frozen bright through hit-stop, then each SPLITS into two halves that slide apart and vanish
    { const fs = T.face < 0 ? -1 : 1; this.tg.forEach((m, i) => { const c = mid(m), a = Math.atan2((c.y - O.y) / ky, (c.x - O.x) * fs), tx0 = -Math.sin(a) * fs, ty0 = Math.cos(a) * ky, tn = Math.hypot(tx0, ty0), ux = tx0 / tn, uy = ty0 / tn, nx = -uy, ny = ux, L = 34;
      const A = { x: c.x - ux * L, y: c.y - uy * L }, B = { x: c.x + ux * L, y: c.y + uy * L }, dx = B.x - A.x, dy = B.y - A.y, dq = E.out5(seg(t, this.th[i], this.th[i] + 0.04)), sp = seg(t, tsp, tsp + 0.22);
      if (dq > 0 && sp < 1) add(() => { const ex = A.x + dx * dq, ey = A.y + dy * dq;
        if (sp <= 0) { for (const [lw, col, al] of [[7, EDGE, 0.5], [3, MIDC, 0.9], [1.6, '#ffffff', 1]]) { ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(ex, ey); ctx.stroke(); } }
        else { const off = 2 + 8 * E.out(sp), sh = 10 * E.out(sp), fa = 1 - E.in(sp);
          for (const sg of [-1, 1]) { const ox = nx * off * sg + ux * sh * sg, oy = ny * off * sg + uy * sh * sg; for (const [lw, col, al] of [[4, EDGE, 0.5], [1.4, '#ffffff', 1]]) { ctx.globalAlpha = al * fa; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - 0.6 * sp); ctx.beginPath(); ctx.moveTo(A.x + ox + ux * 2 * L * 0.4 * sp, A.y + oy + uy * 2 * L * 0.4 * sp); ctx.lineTo(B.x + ox - ux * 2 * L * 0.15 * sp, B.y + oy - uy * 2 * L * 0.15 * sp); ctx.stroke(); } } } }); }); }
    // ---- per target: contact pin-flash (during hit-stop) -> at split: cross slash flare + metallic sparks shooting out (radial, no gravity) + dmg
    this.tg.forEach((m, i) => { const th = this.th[i], c = mid(m);
      if (t >= th && t < tsp) P.bloom(c.x, c.y, 18, '#ffffff', 0.85);
      const k = seg(t, tsp, tsp + 0.14); if (k > 0 && k < 1) { const L2 = 26 * E.out5(seg(k, 0, 0.3)) * (1 - 0.3 * k), an = -0.2 * (T.face < 0 ? -1 : 1) + 1.1 * (i % 2 ? 1 : -1); add(() => { for (const [lw, col, al] of [[5, EDGE, 0.6], [1.6, '#ffffff', 1]]) { ctx.globalAlpha = (1 - E.in(k)) * al; ctx.lineWidth = lw * (1 - 0.6 * k); ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(c.x - Math.cos(an) * L2, c.y - Math.sin(an) * L2); ctx.lineTo(c.x + Math.cos(an) * L2, c.y + Math.sin(an) * L2); ctx.stroke(); } }); P.bloom(c.x, c.y, 26 * (1 - k), '#cfe8ff', 0.9 * (1 - k)); }
      if (t > tsp) P.sparks(c.x, c.y, 7, 900 + i * 13, seg(t, tsp, tsp + 0.24), { spread: null, v: 52, len: 12, w: 2.2, col: '#bfe2ff', core: '#ffffff', g: 0 });
      if (t > tsp + 0.02) P.sparks(c.x, c.y, 4, 950 + i * 13, seg(t, tsp + 0.02, tsp + 0.3), { spread: null, v: 38, len: 9, w: 1.8, col: '#ffe9b0', core: '#ffffff', g: 0 });
      P.dmg(c.x + 2, c.y - 38 - (i % 2) * 24, 1880, '#cfe0ff', t - tsp, false, 0.85); });
  } };
})();
// ======================= 사수 스킬: 연사 + 황금 날개 =======================
(() => { const P = window.P3, S = P.S, E = P.E, seg = P.seg, cl = P.cl, H = P.H, INK = P.INK; const W = () => window.__wd; const { head, mid, base, hpDrop } = P.U;
P.starShot = (A, C, q, tail) => { const dx = C.x - A.x, dy = C.y - A.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; if (q <= 0 || tail >= 1) return; q = Math.min(q, 1);
  // after impact: tail stays in place as an afterimage, shrinking toward the impact point and fading (no drift)
  const px = A.x + dx * q, py = A.y + dy * q, sl = Math.min(230, L * q + 40) * (1 - E.out(tail)), nx = -uy, ny = ux; if (sl < 2) return;
  // one seamless piece: needle-sharp white-hot tip that swells slightly then tapers into a long comet trail (no cap, no seam, no outline)
  const piece = (hw, len, tip, c0, c1, c2) => { const tx = px - ux * len, ty = py - uy * len, N = 22, sh = 0.07; ctx.beginPath(); ctx.moveTo(px + ux * tip, py + uy * tip);
    for (let k = 0; k <= N; k++) { const s = k / N, w = s < sh ? hw * Math.sin((s / sh) * Math.PI / 2) : hw * Math.pow(1 - (s - sh) / (1 - sh), 1.35); ctx.lineTo(px - ux * len * s + nx * w, py - uy * len * s + ny * w); }
    for (let k = N; k >= 0; k--) { const s = k / N, w = s < sh ? hw * Math.sin((s / sh) * Math.PI / 2) : hw * Math.pow(1 - (s - sh) / (1 - sh), 1.35); ctx.lineTo(px - ux * len * s - nx * w, py - uy * len * s - ny * w); } ctx.closePath();
    const g = ctx.createLinearGradient(px + ux * tip, py + uy * tip, tx, ty); g.addColorStop(0, c0); g.addColorStop(0.12, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fill(); };
  ctx.save(); ctx.globalAlpha = 1 - tail; const hk = 1 - 0.5 * tail;
  piece(9 * hk, sl, 14 * hk, '#fff8dc', 'rgba(255,190,50,0.95)', 'rgba(255,120,20,0)');
  piece(4.2 * hk, sl * 0.7, 12 * hk, '#ffffff', 'rgba(255,248,215,0.95)', 'rgba(255,230,160,0)');
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.moveTo(px + ux * 10 * hk, py + uy * 10 * hk); ctx.lineTo(px - ux * sl * 0.45, py - uy * sl * 0.45); ctx.stroke();
  ctx.restore(); };
P.starHit = (x, y, k, an, sd) => { if (k < 0) return; const f = seg(k, 0, 0.1);
  if (f < 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = 24 * (0.8 + 0.2 * E.out(f)), g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,245,${1 - f})`); g.addColorStop(0.35, `rgba(255,214,100,${0.8 * (1 - f)})`); g.addColorStop(1, 'rgba(255,150,30,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    const pa = an + Math.PI / 2, sL = 8 + 20 * E.out(f); ctx.lineCap = 'round'; ctx.globalAlpha = 1 - f; ctx.lineWidth = 3 * (1 - f) + 0.6; ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - Math.cos(pa) * sL, y - Math.sin(pa) * sL); ctx.lineTo(x + Math.cos(pa) * sL, y + Math.sin(pa) * sL); ctx.stroke(); ctx.restore(); }
  const rq = seg(k, 0, 0.16); if (rq < 1) P.ringGlow(x, y, 6 + 18 * E.out(rq), 0.8, 1.6 * (1 - rq) + 0.4, '#ffe6a0', 1 - rq);
  const gq = seg(k, 0.02, 0.2); if (gq > 0 && gq < 1) P.bloom(x, y, 8 * (1 - gq), '#fff6d0', 0.9 * (1 - gq));
  P.sparks(x, y, 6, sd, seg(k, 0, 0.14), { a0: -Math.PI / 2, spread: 2.4, v: 46, len: 10, w: 2.2, col: '#ffd76a', g: 0 }); };
// light feather: soft gold-white blade of light along +x (no outline)
const lfeather = (len, w, a, hot) => { if (a <= 0.01 || len < 1) return; ctx.beginPath(); ctx.moveTo(0, -w * 0.3); ctx.quadraticCurveTo(len * 0.5, -w, len, 0); ctx.quadraticCurveTo(len * 0.5, w * 0.7, 0, w * 0.3); ctx.closePath();
  let g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, `rgba(255,190,80,${0.8 * a})`); g.addColorStop(0.55, `rgba(255,220,140,${0.68 * a})`); g.addColorStop(1, `rgba(255,248,225,${0.08 * a})`); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = g; ctx.fill();
  g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, `rgba(255,250,230,${0.35 * a * hot})`); g.addColorStop(0.5, 'rgba(255,240,200,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fill();
  ctx.beginPath(); ctx.moveTo(len * 0.05, 0); ctx.quadraticCurveTo(len * 0.5, -w * 0.25, len * 0.9, 0); ctx.lineWidth = 1; ctx.strokeStyle = `rgba(255,255,240,${0.6 * a})`; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; };
// angel-wing layout: feathers hang from a rising arm (leading edge); primaries long at the tip, coverts short near the shoulder
const lwing = (sx, sy, side, t, op, beat, diss) => { ctx.save(); ctx.translate(sx, sy); ctx.scale(side, 1); const o0 = E.out3(op);
  const arm = (u, o) => { const th = (1.25 * (1 - o) + (-0.18 - 0.6 * u) * o) - beat * u, r = 74 * u * (0.5 + 0.5 * o); return { x: Math.cos(th) * r, y: Math.sin(th) * r, th }; };
  for (const [n, lk, wk, row] of [[11, 1, 1, 0], [9, 0.62, 0.9, 1], [7, 0.36, 0.8, 2]]) for (let i = 0; i < n; i++) { const u = (i + 0.6) / n, o = E.out3(cl((op - u * 0.25 - row * 0.05) / 0.7)); if (o <= 0) continue;
    const A = arm(u, o), phi = A.th + (1.45 - 1.05 * u) * o + 1.6 * (1 - o) - beat * 0.5 * u, len = (24 + 46 * Math.pow(u, 0.8)) * lk * (0.4 + 0.6 * o), dv = cl((diss - (1 - u) * 0.4) / 0.6);
    ctx.save(); ctx.translate(A.x, A.y); ctx.rotate(phi); lfeather(len * (1 - 0.35 * dv), 9 * wk + 3 * u, (0.4 + 0.6 * o) * (1 - dv) * (row === 0 ? 0.85 : 1), row === 2 ? 1.2 : 0.8); ctx.restore(); }
  ctx.restore(); };
S.archer_skill = { dur: 2.2,
  init() { const G = W().G, T = this.T = PM.T; this.B = { x: T.x - 22, y: T.y - 10 }; this.tgs = [PM.N]; /* game CAST.archer: ONE target (front), all n shots at it */ this.base = base(G.mobs, [T]);
    this.ts = []; for (let i = 0; i < 10; i++) this.ts.push(i * 0.1); /* V.archer.gap 0.1, n = 10 (Lv15); NO ready phase: skill pose + wings opening + first arrow all from frame 0 */ this.tw = 0; this.fl = PM.N.x < T.x; },
  update(t) { const { T } = this, e = this.ts[9] + 0.18; T.__spr = t >= this.ts[0] && t < e ? { nm: 't5_12', flip: this.fl, H: 340 } : null; T.face = this.fl ? -1 : 1; T.animT = -1; /* after the volley: chewy return to the normal idle (same 5글자 archer), idle till the end */
    /* per-shot motion: quick pull-back squash + recoil, then snap forward (stretch) easing back to rest, on every shot */
    { let sq = 0, rx = 0; for (const s of this.ts) { const u = t - (s - 0.035); if (u < 0 || u > 0.1) continue; if (u < 0.035) { const k = E.out(u / 0.035); sq = 1.3 * k; rx = 2.5 * k; } else { const v = (u - 0.035) / 0.065; sq = -0.9 * Math.exp(-3 * v) * Math.cos(1.6 * Math.PI * v); rx = 2.5 * (1 - E.out3(v)) - 1.2 * Math.sin(Math.PI * v); } }
      const ch = P.chew(t, e); if (ch) sq = ch; T.squash = sq; T.x += (this.fl ? 1 : -1) * rx; } this.ts.forEach((s, i) => { const m = this.tgs[i % this.tgs.length]; P.hit(m, t, s + 0.1, { fl: 0.06, col: '#fff3b0' }); });
    this.ts.forEach(s => hpDrop(this.tgs[0], t, s + 0.1, 0.07)); },
  ground(t) { const { T } = this, op = seg(t, this.tw, this.tw + 0.32), diss = seg(t, 1.33, 1.73); if (op <= 0 || diss >= 1) return;
    const sx = T.x, sy = T.y - 20, firing = t > this.ts[0] - 0.05 && t < this.ts[9] + 0.15, beat = 0.06 * Math.sin(t * 7) + (firing ? 0.07 * Math.max(0, Math.sin(t * 48)) : 0);
    // soft back-light behind the wings
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(sx, sy - 12, 0, sx, sy - 12, 60); const ga = 0.32 * E.out(op) * (1 - diss); gl.addColorStop(0, `rgba(255,220,140,${ga})`); gl.addColorStop(0.5, `rgba(255,190,90,${ga * 0.4})`); gl.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(sx, sy - 12, 60, 0, 6.283); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(sx, sy); ctx.scale(0.6, 0.6); ctx.translate(-sx, -sy); /* wings 60% */
    lwing(sx - 5, sy, -1, t, op, beat, diss); lwing(sx + 5, sy, 1, t, op, beat, diss);
    // unfold sweep: a light glint racing out along the top edge of each wing
    const gq = seg(t, this.tw + 0.1, this.tw + 0.45); if (gq > 0 && gq < 1) for (const sd of [-1, 1]) { const u = gq, th = -0.18 - 0.6 * u, r = 74 * u; P.bloom(sx + sd * 5 + sd * Math.cos(th) * r, sy + Math.sin(th) * r, 10, '#fff6d8', 0.85 * E.bell(gq)); }
    // dissolve: light motes lifting up/outward from the feather tips
    if (diss > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 24; i++) { const sd = i % 2 ? 1 : -1, u = H(i + 900), an = -0.18 - 0.6 * u, r = 30 + 45 * H(i + 901), lq = seg(diss, H(i + 902) * 0.4, 0.6 + H(i + 902) * 0.4); if (lq <= 0 || lq >= 1) continue;
      const x = sx + sd * (5 + Math.cos(an) * r + 18 * lq), y = sy + Math.sin(an) * r - 30 * E.out(lq); ctx.globalAlpha = (1 - lq) * 0.9; const g = ctx.createRadialGradient(x, y, 0, x, y, 5); g.addColorStop(0, 'rgba(255,250,225,1)'); g.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill(); } ctx.restore(); } ctx.restore(); },
  top(t) { const { B, T } = this; const bw = (() => { const sv = T.__spr; T.__spr = { nm: 't5_12', flip: this.fl, H: 340 }; const p = P3.sprPt(T, 325, 210); T.__spr = sv; return p; })();
    this.ts.forEach((s, i) => { const m = this.tgs[i % this.tgs.length], c = mid(m), C = { x: c.x + (H(i + 3) - 0.5) * 10, y: c.y + (H(i + 4) - 0.5) * 8 }, A = { x: bw.x + (H(i + 5) - 0.5) * 4, y: bw.y + (H(i + 6) - 0.5) * 4 };
      { const q = seg(t, s, s + 0.1); if (q > 0) P.starShot(A, C, q, seg(t, s + 0.1, s + 0.3)); }
      { const mq = seg(t, s - 0.01, s + 0.06); if (mq > 0 && mq < 1) P.bloom(A.x, A.y, 14 * (1 - mq), '#ffe6a0', 0.8 * (1 - mq)); }
      P.starHit(C.x, C.y, t - s - 0.1, Math.atan2(C.y - A.y, C.x - A.x), 200 + i);
      P.dmg(c.x + (H(i + 9) - 0.5) * 24, c.y - 40 - (i % 4) * 16, 640, '#ffd23a', t - s - 0.1, false, 0.8); });
  } };
})();
