(() => { const P = window.P3, S = P.S, E = P.E, seg = P.seg, cl = P.cl, H = P.H, INK = P.INK; const W = () => window.__wd;
const { head, mid, gnd, base, dist, hpDrop, knock } = P.U; const impact = P.impact;
// ======================= 광부: 분쇄 =======================
S.miner = { dur: 1.5,
  /* game passive (wd-skill.js fireAttack, key 'miner'): 8% per attack -> that attack x crX (Lv1 x3) + stun 1s (crStun) on every mob within the miner's range (ROLES miner range 125, centred on the miner) */
  init() { const T = this.T = PM.T, G = W().G; const pos = [[350, 729], [292, 721], [420, 731], [200, 725], [530, 723]]; G.mobs.forEach((o, k) => { if (pos[k]) { o.x = pos[k][0]; o.y = pos[k][1]; } o.stunT = 0; });
    this.O = { x: T.x, y: T.y }; this.R = 125; this.vs = G.mobs.filter(o => !o.dead && Math.hypot(o.x - T.x, o.y - T.y) <= this.R); this.base = base(G.mobs, [T]); this.ti = 0.35; },
  update(t) { const { T, ti } = this; P.atk(T, t, ti, 0.5); this.vs.forEach(o => { P.hit(o, t, ti + 0.02, { fl: 0.1 }); hpDrop(o, t, ti + 0.02, 0.2); if (t >= ti + 0.04) o.stunT = 1; }); },
  ground(t) { const { O, R, ti } = this; if (t < ti) return; const q = t - ti;
    // radiating ground cracks from the hit point (grow in 0.08s, molten glow cools, fade by 0.6s)
    const g = E.out5(seg(q, 0, 0.08)), fa = 1 - seg(q, 0.3, 0.6), heat = 1 - seg(q, 0, 0.35); if (fa > 0) for (let i = 0; i < 10; i++) { const an = [0.15, -0.35, 0.55, -0.85, -1.35, 2.99, 3.49, 2.59, 3.99, 4.5][i] + (H(i + 800) - 0.5) * 0.25, L = (70 + 40 * H(i + 801)) * g; let x = O.x, y = O.y + FOOT_DY - 2; const pts = [[x, y]];
      for (let k = 1; k <= 3; k++) { const aa = an + (H(i * 5 + k + 802) - 0.5) * 0.6; x += Math.cos(aa) * L / 3; y += Math.sin(aa) * L / 3 * 0.45; pts.push([x, y]); }
      ctx.save(); ctx.globalAlpha = fa; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2a1a0c'; for (let k = 0; k < 3; k++) { ctx.lineWidth = 3.4 * (1 - k / 3) + 0.8; ctx.beginPath(); ctx.moveTo(pts[k][0], pts[k][1]); ctx.lineTo(pts[k + 1][0], pts[k + 1][1]); ctx.stroke(); }
      if (heat > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fa * heat; ctx.strokeStyle = '#ffb04a'; ctx.lineWidth = 1.5; ctx.beginPath(); pts.forEach(([px, py], k) => k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.stroke(); } ctx.restore(); }
    // double shock ring out to the range: thick hot leading ring + thinner trailing ring, warm fill
    const q1 = seg(q, 0, 0.22), q2 = seg(q, 0.05, 0.3), f1 = 1 - seg(q, 0.1, 0.34), f2 = 1 - seg(q, 0.16, 0.4);
    if (f1 > 0) { ctx.save(); ctx.globalAlpha = 0.22 * f1; const gr = ctx.createRadialGradient(O.x, O.y, 0, O.x, O.y, R * E.out(q1)); gr.addColorStop(0, 'rgba(255,214,150,0)'); gr.addColorStop(0.75, 'rgba(255,190,110,0.7)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(O.x, O.y, R * E.out(q1), 0, 6.283); ctx.fill(); ctx.restore();
      P.ringGlow(O.x, O.y, 18 + (R - 18) * E.out(q1), 1, 7 * (1 - q1) + 2.5, '#ffb44a', f1); P.ringGlow(O.x, O.y, 18 + (R - 18) * E.out(q1), 1, 2.2 * (1 - q1) + 1, '#fff3c8', f1); }
    if (f2 > 0) P.ringGlow(O.x, O.y, 14 + (R * 0.72 - 14) * E.out(q2), 1, 3 * (1 - q2) + 1.2, '#ffd890', 0.85 * f2); },
  top(t) { const { O, ti } = this, q = t - ti;
    // bright core flash at impact
    if (q >= 0 && q < 0.22) { const k = seg(q, 0, 0.22); P.bloom(O.x, O.y + 4, 60 * (1 - 0.4 * k), '#ffb44a', 0.85 * (1 - k)); P.bloom(O.x, O.y + 4, 26 * (1 - 0.5 * k), '#ffffff', 1 - seg(q, 0, 0.1)); }
    // debris chips bursting OUTWARD (radial, decelerating, no gravity), short
    for (let i = 0; i < 8; i++) { const dq = seg(q, 0, 0.32); if (dq <= 0 || dq >= 1) continue; const an = i * 0.785 + H(i + 830) * 0.5, d = (14 + 46 * H(i + 831)) * E.out3(dq); P.chunk(O.x + Math.cos(an) * d * 1.3, O.y + FOOT_DY - 6 + Math.sin(an) * d * 0.5 - 10 * E.out(dq), 2.6 + 1.8 * H(i + 832), dq * 9 + i, 1 - E.in(dq), i, i % 2 ? '#cbb89a' : '#a8957c', '#5e4e3e'); }
    for (let i = 0; i < 6; i++) { const pq = seg(q, 0, 0.45); if (pq <= 0 || pq >= 1) continue; const a = i * 1.047 + 0.3, d = 14 + 22 * E.out(pq); P.smoke(O.x + Math.cos(a) * d, O.y + 8 + Math.sin(a) * d * 0.4 - 8 * pq, 8 + 6 * pq, 0.35 * (1 - pq), '#e8dcc6'); }
    this.vs.forEach((o, k) => { const c = mid(o), th = ti + 0.02, hq = seg(t, th, th + 0.18); if (hq > 0 && hq < 1) { P.bloom(c.x, c.y, 16 * (1 - hq), '#ffe0a0', 0.8 * (1 - hq)); P.sparks(c.x, c.y, 5, 600 + k * 7, hq, { a0: Math.atan2(c.y - O.y, c.x - O.x), spread: 1.6, v: 60, len: 8, w: 2, col: '#ffcf7a', g: 0 }); }
      P.dmg(c.x + 2, c.y - 40, 1215, '#ffcf7a', t - th, true, 0.85); }); } };
S.miner_skill = { dur: 2.0,
  /* game CAST.miner (진심 펀치): front target, mobsIn(target, R 55) all hit; no stun. VFX: user's SlamVFX variant 2 '03 파편 폭발' (scaled to R55; wire-like cracks replaced by earth fissures) at the target (shake:false) */
  init() { const T = this.T = PM.T, G = W().G; this.m = PM.tg; G.mobs.filter(o => o !== this.m).slice(0, 2).forEach((o, k) => { o.x = this.m.x + (k ? 46 : -44); o.y = this.m.y + (k ? 4 : -7); });
    this.R = 55; this.vs = G.mobs.filter(o => !o.dead && Math.hypot(o.x - this.m.x, o.y - this.m.y) <= this.R);
    this.base = base(G.mobs, [T]); this.ti = 0.5; this.HG = 175; this.F = { x: this.m.x, y: this.m.y + 3 };
    this.cr = []; for (let i = 0; i < 8; i++) { const a = i * 0.785 + (H(i) - 0.5) * 0.5, L = (38 + 20 * H(i + 3)) * (0.8 / 0.45), pts = [[0, 0]]; let x = 0, y = 0; for (let k = 1; k <= 4; k++) { const aa = a + (H(i * 9 + k) - 0.5) * 0.7; x += Math.cos(aa) * L / 4; y += Math.sin(aa) * L / 4 * 0.42; pts.push([x, y]); } this.cr.push({ pts, w: (2.2 + 1.0 * H(i + 7)) * (0.8 / 0.45) }); } },
  update(t) { const { T, ti } = this, e = ti + 0.4, fl = this.m.x < T.x; T.animT = -1; T.face = fl ? -1 : 1;
    /* 5글자 golem: attack-ready (cell 6) short trembling charge -> slam (cell 14) at impact -> chewy return to idle */
    T.__spr = t < 0.06 || t >= e ? null : t < ti ? { nm: 't5_6', flip: fl, H: this.HG } : { nm: 't5_14', flip: fl, H: this.HG };
    T.squash = P.chew(t, 0.06, 1.2) + P.chew(t, ti, 1.4) + P.chew(t, e);
    this.vs.forEach(o => { P.hit(o, t, ti, { fl: 0.12 }); hpDrop(o, t, ti, 0.35); });
    { const w = seg(t, 0.1, ti - 0.04) * (t < ti - 0.02 ? 1 : 0), fr = Math.round(t * 24); if (w > 0) T.x += (H(fr * 3 + 1) - 0.5) * 4.5 * (0.4 + 0.6 * w); } },
  ground(t) { /* ONE fast converging ring onto the miner + bright flash when it closes */ const T = this.T, cq = seg(t, 0.14, 0.38); if (cq > 0 && cq < 1) { const r = 6 + 140 * (1 - E.in(cq)); P.ringGlow(T.x, T.y + 8, r, 0.62, 3 + 7 * cq, '#ffcf7a', 0.35 + 0.65 * cq); P.ringGlow(T.x, T.y + 8, r, 0.62, 1.5 + 2 * cq, '#fff6d8', 0.5 + 0.5 * cq); }
    const fq = seg(t, 0.38, 0.48); if (fq > 0 && fq < 1) { P.bloom(T.x, T.y - 6, 60 * (1 - 0.4 * fq), '#ffd890', 0.9 * (1 - fq)); P.bloom(T.x, T.y - 6, 26, '#ffffff', 1 - fq); }
    /* earthquake fissures (from the earlier 死 version, sized to R55): crater shade + jagged dark tapered wedges with a light dirt rim */
    { const { F, ti } = this, q = t - ti; if (q >= 0) { const fa = 1 - seg(q, 1.0, 1.5), g = E.out5(seg(q, 0, 0.14));
      ctx.save(); ctx.globalAlpha = 0.5 * fa; const gr = ctx.createRadialGradient(F.x, F.y, 0, F.x, F.y, 40 * (0.8 / 0.45) * g + 0.1); gr.addColorStop(0, '#3a2814'); gr.addColorStop(0.6, 'rgba(70,48,24,0.7)'); gr.addColorStop(1, 'rgba(70,48,24,0)'); ctx.fillStyle = gr; ctx.translate(F.x, F.y); ctx.scale(1, 0.42); ctx.translate(-F.x, -F.y); ctx.beginPath(); ctx.arc(F.x, F.y, 40 * (0.8 / 0.45) * g + 0.1, 0, 6.283); ctx.fill(); ctx.restore();
      this.cr.forEach(c => { const n = c.pts.length, Lk = g * (n - 1); const pts = c.pts.slice(0, Math.ceil(Lk) + 1).map(([x, y], k) => k > Lk ? null : [F.x + x, F.y + y]).filter(Boolean); if (pts.length < 2) return; const wd = k => c.w * (1 - k / (n - 1)) + 0.5;
        ctx.save(); ctx.globalAlpha = fa; ctx.beginPath(); for (let k = 0; k < pts.length; k++) { const [x, y] = pts[k], [x2, y2] = pts[Math.min(k + 1, pts.length - 1)], [x0, y0] = pts[Math.max(0, k - 1)], dx = x2 - x0, dy = y2 - y0, L = Math.hypot(dx, dy) || 1; ctx.lineTo(x - dy / L * wd(k), y + dx / L * wd(k) * 0.6); }
        for (let k = pts.length - 1; k >= 0; k--) { const [x, y] = pts[k], [x2, y2] = pts[Math.min(k + 1, pts.length - 1)], [x0, y0] = pts[Math.max(0, k - 1)], dx = x2 - x0, dy = y2 - y0, L = Math.hypot(dx, dy) || 1; ctx.lineTo(x + dy / L * wd(k), y - dx / L * wd(k) * 0.6); }
        ctx.closePath(); ctx.fillStyle = '#2a1a0c'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(200,160,100,0.75)'; ctx.stroke(); ctx.restore(); }); } } },
  top(t) { const { F, m, ti } = this, q = t - ti;
    if (q >= -0.12 && window.SlamVFX) SlamVFX.draw(ctx, 2, q + SlamVFX.impactTime, { x: F.x, y: F.y, scale: 0.8, shake: false,
      palette: Object.assign({ bright: '#fff5df', accent: '#e5ba6d', ink: '#151719', stone: '#70706b', stoneLight: '#b6b4a9', dust: '#88857b', dustLight: '#b8b2a4' }, { noCracks: true }) /* readme default palette; cracks replaced by the earth fissures in ground() */ });
    this.vs.forEach((o, k) => { const h = head(o); P.dmg(h.x, h.y - 40 - (o === m ? 10 : 0), 4820, '#ff7a4a', q - 0.02 - k * 0.02, true, o === m ? 1.0 : 0.85); }); } };
/* passive variant (05_miner_passive_death): no glyph, no charge — quick slam frame then a small fast energetic burst centred on the miner, chewy return */
S.miner_passive_death = { dur: 1.3,
  init() { const T = this.T = PM.T, G = W().G; const pos = [[350, 729], [292, 721], [420, 731], [200, 725], [530, 723]]; G.mobs.forEach((o, k) => { if (pos[k]) { o.x = pos[k][0]; o.y = pos[k][1]; } o.stunT = 0; });
    this.R = 125; this.vs = G.mobs.filter(o => !o.dead && Math.hypot(o.x - T.x, o.y - T.y) <= this.R); this.base = base(G.mobs, [T]); this.ti = 0.14; this.HG = 175; this.fl = (this.vs[0] || T).x < T.x; },
  update(t) { const { T, ti } = this, e = ti + 0.32; T.animT = -1; T.face = this.fl ? -1 : 1; T.__spr = t >= 0.04 && t < e ? { nm: 't5_14', flip: this.fl, H: this.HG } : null; T.squash = P.chew(t, 0.04, 1.3) + P.chew(t, e);
    this.vs.forEach(o => { P.hit(o, t, ti + 0.02, { fl: 0.1 }); hpDrop(o, t, ti + 0.02, 0.2); }); },
  /* user's SlamVFX variant 0 '01 압축 충격파' (original look/palette), compact, centred on the miner, on the ground layer = BEHIND the miner sprite */
  ground(t) { const { T, ti } = this, q = t - ti; if (q >= 0 && q < 0.45) { const k = 1 - seg(q, 0, 0.45); P.bloom(T.x, T.y + 2, 70 * (0.5 + 0.5 * E.out(seg(q, 0, 0.15))), '#ff9a2a', 0.55 * k); P.bloom(T.x, T.y - 4, 34, '#fff1c0', 0.8 * (1 - seg(q, 0, 0.18))); }
    /* high-contrast warm palette (same 01 shape): white-hot core, saturated orange/gold ring, dark brown shadow */
    if (q >= -0.12 && window.SlamVFX) SlamVFX.draw(ctx, 0, q + SlamVFX.impactTime, { x: T.x, y: T.y + 4, scale: 0.9, shake: false, palette: { bright: '#fff4cc', accent: '#ff8a1a', ink: '#3a1d0c', stone: '#7a6650', stoneLight: '#c9b08a', dust: '#a08560', dustLight: '#d8c29a' } }); },
  top(t) { const { ti } = this;
    this.vs.forEach((o, k) => { const h = head(o); P.dmg(h.x, h.y - 40, 1215, '#ff8a3a', t - ti - 0.02 - k * 0.02, true, 0.85); }); } };
// ======================= 포병 =======================
S.artillery0 = { sp(q) { const A = this.mz, B = { x: this.Bp.x - 6, y: this.Bp.y - 14 }; return { x: A.x + (B.x - A.x) * q, y: A.y + (B.y - A.y) * q - 190 * Math.sin(q * Math.PI) }; },
  update(t) { const { T, tb } = this; P.atk(T, t, this.tf, 0.45); if (t >= this.tl) P.shake(this.tl, 2.5, 0.15); if (t >= tb) P.shake(tb, 13, 0.45);
    this.vic.forEach((m, i) => { P.hit(m, t, tb + 0.02, { fl: 0.13, col: '#ffe0b0' }); hpDrop(m, t, tb, 0.4); const dx = m.x - this.Bp.x, dy = m.y - this.Bp.y, L = Math.hypot(dx, dy) || 1; knock(m, t, tb + 0.02, dx / L * 22, dy / L * 10 - 6, 0.16); }); },
  shell(x, y, a, s, blink) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-13, -8); ctx.lineTo(4, -8); ctx.quadraticCurveTo(18, -6, 22, 0); ctx.quadraticCurveTo(18, 6, 4, 8); ctx.lineTo(-13, 8); ctx.quadraticCurveTo(-16, 0, -13, -8); ctx.closePath();
    ctx.lineWidth = 3.2; ctx.strokeStyle = INK; ctx.stroke(); const g = ctx.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, '#7f8a92'); g.addColorStop(0.45, '#4b545c'); g.addColorStop(1, '#2c3238'); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = blink > 0 ? `rgb(255,${Math.round(80 + 120 * (1 - blink))},60)` : '#c8402e'; ctx.fillRect(-3, -8, 5, 16); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-3, -8, 5, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-11, -5.5, 24, 2.4); ctx.beginPath(); ctx.rect(-17, -5, 4, 10); ctx.fillStyle = '#b08a3a'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); },
};
S.artillery = { dur: 2.2,
  init() { const T = this.T = PM.T; this.Bp = { x: PM.B.x, y: PM.B.y + 4 }; this.mz = { x: T.x + 30, y: T.y - 10 }; this.tf = 0.1; this.tl = 0.62; this.tb = 1.2;
    W().G.mobs = W().G.mobs.filter(m => m.y > 700); this.base = base(W().G.mobs, [T]); this.vic = W().G.mobs.filter(m => Math.hypot(m.x - this.Bp.x, (m.y - this.Bp.y) * 1.6) < 125); },
  sp(q) { const A = this.mz, B = { x: this.Bp.x - 6, y: this.Bp.y - 14 }; return { x: A.x + (B.x - A.x) * q, y: A.y + (B.y - A.y) * q - 190 * Math.sin(q * Math.PI) }; },
  update(t) { S.artillery0.update.call(this, t); },
  ground(t) { const { Bp, tl, tb } = this;
    if (t > this.tf && t < tl) { const q = seg(t, this.tf, tl); P.shadow(Bp.x, Bp.y, 24 * q, 0.5 * q); }
    if (t >= tl && t < tb) { const k = seg(t, tl, tb), pul = 0.5 + 0.5 * Math.sin((t - tl) * (8 + 30 * k)); ctx.save(); ctx.translate(Bp.x, Bp.y); ctx.scale(1, 0.38); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 42); g.addColorStop(0, hexA('#ff3a1e', 0)); g.addColorStop(0.75, hexA('#ff3a1e', (0.1 + 0.2 * pul) * k)); g.addColorStop(1, hexA('#ff3a1e', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 42, 0, 6.283); ctx.fill(); ctx.restore();
      P.ringGlow(Bp.x, Bp.y, 40, 0.38, 2, '#ff4a2a', (0.3 + 0.5 * pul) * k); }
    if (t >= tb) { const fa = 1 - seg(t, tb + 0.3, tb + 0.8); ctx.save(); ctx.globalAlpha = 0.5 * fa; ctx.translate(Bp.x, Bp.y); ctx.scale(1, 0.38); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 75); g.addColorStop(0, 'rgba(30,20,12,0.9)'); g.addColorStop(0.6, 'rgba(40,26,14,0.45)'); g.addColorStop(1, 'rgba(40,26,14,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 75, 0, 6.283); ctx.fill(); ctx.restore();
      P.bloom(Bp.x, Bp.y, 60, '#ff6a1e', 0.4 * (1 - seg(t, tb, tb + 0.4))); } },
  top(t) { const { Bp, mz, tf, tl, tb } = this, A0 = S.artillery0;
    { const q = seg(t, tf, tf + 0.35); if (q > 0 && q < 1) { P.bloom(mz.x, mz.y, 70 * (1 - q), '#ffb43a', 1 - q); P.rays(mz.x, mz.y, 8, 20, 50 * (1 - q), 5 * (1 - q), '#ffd27a', 1 - q, -1, 3); for (let i = 0; i < 4; i++) P.smoke(mz.x + 6 + i * 9, mz.y - 6 - 22 * q - i * 4, (9 + 3 * i) * (0.6 + 0.8 * q), 0.55 * (1 - q), '#e6dfd4'); } }
    if (t >= tf && t < tl + 0.6) { const q = seg(t, tf, tl), fa = 1 - seg(t, tl, tl + 0.6); for (let k = 1; k <= 12; k++) { const qq = q - k * 0.035; if (qq <= 0) break; const p = A0.sp.call(this, qq); P.smoke(p.x + Math.sin(k * 2) * 3, p.y - k * 0.6, 7 + k * 1.3, 0.45 * (1 - k / 13) * fa, '#e0d8cc'); }
      if (t < tl) { const p = A0.sp.call(this, q), p2 = A0.sp.call(this, Math.min(1, q + 0.02)), a = Math.atan2(p2.y - p.y, p2.x - p.x); P.bloom(p.x - Math.cos(a) * 22, p.y - Math.sin(a) * 22, 26, '#ffb43a', 0.8); A0.shell(p.x, p.y, a, 0.74, 0); } }
    if (t >= tl && t < tb) { const k = seg(t, tl, tb), lq = seg(t, tl, tl + 0.35), wob = Math.sin((t - tl) * (18 + 40 * k)) * 0.07 * k, sx = Bp.x - 4, sy = Bp.y - 18 + 4 * (1 - E.back(lq));
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5, d = 18 * E.out(lq); P.smoke(Bp.x + Math.cos(a) * d, Bp.y - 4 + Math.sin(a) * d * 0.4 - 5 * lq, 6 + 5 * lq, 0.45 * (1 - lq), '#d9c7a6'); }
      const blink = Math.max(0, Math.sin((t - tl) * (6 + 30 * k))); if (blink > 0.5) P.bloom(sx, sy - 6, 26 + 10 * k, '#ff3a1e', 0.5 * blink);
      ctx.save(); ctx.beginPath(); ctx.ellipse(Bp.x - 2, Bp.y + 3, 27, 9.5, 0, 0, 6.283); ctx.fillStyle = 'rgba(60,40,20,0.55)'; ctx.fill(); ctx.restore();
      A0.shell(sx, sy + 9, 1.95 + wob, 0.8, blink > 0.5 ? 1 : 0);
      // strongly flickering fuse
      const fx = sx + Math.cos(1.95 + wob + Math.PI) * 14, fy = sy + 9 + Math.sin(1.95 + wob + Math.PI) * 14, fr = Math.floor(t * 24), fl = 0.6 + 0.8 * H(fr), fk = 1 + k;
      P.bloom(fx, fy, (20 + 12 * H(fr + 3)) * fk, '#ff9a1e', 0.8 * fl); P.bloom(fx, fy, 8 * fl * fk, '#ffffff', 1); P.twinkle(fx, fy, (5 + 5 * H(fr + 1)) * fk, 1, fr * 0.7, '#ffd27a');
      for (let i = 0; i < 6; i++) { const ph = ((t - tl) * 3.5 + H(i)) % 1, a = -Math.PI / 2 + (H(i + 5) - 0.5) * 3, v = (18 + 18 * H(i + 2)) * fk; const x = fx + Math.cos(a) * v * ph, y = fy + Math.sin(a) * v * ph + 110 * ph * ph; P.streak(x, y, x - Math.cos(a) * 10, y - Math.sin(a) * 10 + 5, 3.5, '#ffd23a', 1 - ph, '#ffffff'); }
      for (let i = 0; i < 3; i++) { const ph = ((t - tl) * 1.6 + i / 3) % 1; P.smoke(fx + 4 + 6 * ph, fy - 10 - 30 * ph, 6 + 8 * ph, 0.35 * (1 - ph), '#bfb6aa'); } }
    // explosion (v4 size restored): additive fire core -> fireballs -> translucent smoke; debris stays local, no far streaks
    const q = t - tb; if (q >= 0 && q < 1.0) P.Z(Bp.x, Bp.y, 1.45, () => { const c = { x: Bp.x, y: Bp.y - 12 }, f0 = seg(q, 0, 0.12);
      P.bloom(c.x, c.y, 150, '#ff7a1e', 0.75 * (1 - seg(q, 0, 0.45))); P.bloom(c.x, c.y, 70 * (1 - 0.4 * f0), '#ffffff', 0.95 * (1 - f0)); P.bloom(c.x, c.y, 100, '#ffd27a', 0.6 * (1 - seg(q, 0, 0.2)));
      P.ringGlow(c.x, c.y, 10 + 75 * E.out(seg(q, 0, 0.25)), 1, 5, '#fff3b0', 0.8 * (1 - seg(q, 0, 0.25)));
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.3, sq = seg(q, 0.1, 1.0); P.smoke(c.x + Math.cos(a) * (14 + 40 * E.out(sq)), c.y - 6 + Math.sin(a) * 12 - 34 * E.out(sq), 16 + 18 * sq, 0.32 * E.bell(seg(q, 0.06, 1.0)), '#d6cec4'); }
      for (let i = 0; i < 9; i++) { const a = i * 0.698 + H(i + 300) * 0.5, lq = seg(q, 0, 0.45 + 0.15 * H(i + 301)); if (lq >= 1) continue; const d = (20 + 42 * H(i + 302)) * E.out3(lq), r = (22 + 12 * H(i + 303)) * (0.5 + 0.5 * E.back(seg(lq, 0, 0.3))) * (1 - 0.4 * lq), x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d * 0.6 - 16 * lq;
        const g = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r), hh = 1 - lq; g.addColorStop(0, P.mix('#ff8a1e', '#fff3b0', hh)); g.addColorStop(0.55, P.mix('#b8341a', '#ff9a1e', hh)); g.addColorStop(1, hexA(P.mix('#6a2a18', '#e0451e', hh), 0)); ctx.save(); ctx.globalAlpha = cl(1 - E.in(lq)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore(); }
      P.flame(c.x, c.y, 52 * (1 - seg(q, 0.05, 0.4)), 1 - seg(q, 0, 0.3), 1 - seg(q, 0.05, 0.4));
      for (let i = 0; i < 9; i++) { const vx = (H(i + 60) - 0.5) * 170, vy = -(110 + 90 * H(i + 70)); let x = c.x + vx * q, y = c.y + vy * q + 520 * q * q; const land = Bp.y + 4 + (H(i + 80) - 0.5) * 16; if (y > land) { y = land; x = c.x + vx * Math.min(q, 0.6); } P.chunk(x, y, 3 + 2 * H(i + 90), Math.min(q, 0.6) * 14 + i, 1 - seg(q, 0.7, 1.0), i, '#7a6a5a', '#2e2620'); } });
    this.vic.forEach((m, i) => { const c = mid(m); P.dmg(c.x, c.y - 44 - (i % 2) * 28, 2650, '#ff8a3a', t - tb - 0.02 - i * 0.03, true, 0.95); });
  } };
P.missile = (x, y, a, s, flame) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
  if (flame > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const fl = 0.85 + 0.15 * Math.sin(P3.t * 90); const g = ctx.createLinearGradient(-20, 0, -52, 0); g.addColorStop(0, 'rgba(255,250,220,' + flame + ')'); g.addColorStop(0.35, 'rgba(255,170,60,' + 0.9 * flame + ')'); g.addColorStop(1, 'rgba(255,80,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-18, -4.5); ctx.quadraticCurveTo(-34, -6 * fl, -54 * fl, 0); ctx.quadraticCurveTo(-34, 6 * fl, -18, 4.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // fins
  ctx.fillStyle = '#7a2a1e'; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-10, sy * 4); ctx.lineTo(-20, sy * 11); ctx.lineTo(-21, sy * 4); ctx.closePath(); ctx.fill(); }
  // body: metallic cylinder
  let g = ctx.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, '#e8e4dc'); g.addColorStop(0.35, '#b9b3a8'); g.addColorStop(0.75, '#6a645c'); g.addColorStop(1, '#3a3630'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-19, -5.5); ctx.lineTo(10, -5.5); ctx.quadraticCurveTo(22, -4, 26, 0); ctx.quadraticCurveTo(22, 4, 10, 5.5); ctx.lineTo(-19, 5.5); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(40,30,24,0.8)'; ctx.stroke();
  // red warhead band + nose
  ctx.fillStyle = '#c8321e'; ctx.fillRect(4, -5.4, 5, 10.8); g = ctx.createLinearGradient(0, -5, 0, 5); g.addColorStop(0, '#ff8a6a'); g.addColorStop(1, '#8a1e12'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(10, -5.2); ctx.quadraticCurveTo(22, -4, 26, 0); ctx.quadraticCurveTo(22, 4, 10, 5.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-16, -4, 24, 1.6); ctx.restore(); };
S.artillery_skill = { dur: 3.0,
  init() { const T = this.T = PM.T; this.Bp = { x: PM.B.x, y: PM.B.y + 4 }; this.mz = { x: T.x + 30, y: T.y - 10 }; this.tf = 0.1; this.tl = 0.7; this.tb = 1.7; this.tfire = 0.08; this.tret = 0.48; this.HA = 300; /* game CAST.artillery: fly 0.6s, stun R90 1s on landing, explode after delay 1s */
    W().G.mobs = W().G.mobs.filter(m => m.y > 700); this.base = base(W().G.mobs, [T]); this.R = 90; this.vic = W().G.mobs.filter(m => Math.hypot(m.x - this.Bp.x, m.y - this.Bp.y) <= this.R); },
  sp(q) { const B = this.Bp, A = { x: B.x - 320, y: B.y - 320 } /* exactly 45 deg */, e = q * q * (0.4 + 0.6 * q); return { x: A.x + (B.x - A.x) * e, y: A.y + (B.y - A.y) * e }; },
  update(t) { const { T, tl, tb } = this; T.animT = -1;
    /* 5글자 artillery attack frame (tier-5 sheet cell 4, same tier as the scene hero): fire at tfire with recoil, chewy return to idle at e */
    { const tf2 = this.tfire, e = this.tret, fl = this.Bp.x < T.x; T.face = fl ? -1 : 1; T.__spr = t >= 0.02 && t < e ? { nm: 't5_4', flip: fl, H: this.HA } : null;
      let sq = P.chew(t, 0.02, 1.0) + P.chew(t, e); const u = t - tf2; if (u >= 0 && u < 0.3) { sq += 1.6 * Math.exp(-u * 18) * Math.cos(u * 40); T.x -= (fl ? -1 : 1) * 5 * Math.exp(-u * 14) * (u < 0.02 ? u / 0.02 : 1); } T.squash = sq; }
    this.vic.forEach((m, i) => { if (t >= tl && t < tl + 1.0) m.stunT = 1; P.hit(m, t, tb + 0.02 + i * 0.03, { fl: 0.12 }); hpDrop(m, t, tb + 0.02, 0.45); }); },
  ground(t) { const { Bp, tl, tb } = this;
    if (t > this.tf && t < tl) { const q = seg(t, this.tf, tl); P.shadow(Bp.x, Bp.y, 24 * q * q, 0.5 * q); }
    if (t >= tl && t < tb) { const k = seg(t, tl, tb), pul = 0.5 + 0.5 * Math.sin((t - tl) * (8 + 30 * k)); ctx.save(); ctx.translate(Bp.x, Bp.y); ctx.scale(1, 0.38); const R = this.R, g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, hexA('#ff3a1e', 0.06)); g.addColorStop(0.8, hexA('#ff3a1e', 0.12 + 0.16 * pul)); g.addColorStop(1, hexA('#ff3a1e', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill(); ctx.restore();
      P.ringGlow(Bp.x, Bp.y, this.R, 0.38, 2.2, '#ff4a2a', 0.35 + 0.5 * pul); P.ringGlow(Bp.x, Bp.y, this.R * (1 - ((t - tl) * 1.4 % 1)), 0.38, 1.4, '#ff8a5a', 0.4 * ((t - tl) * 1.4 % 1)); }
    if (t >= tl && t < tl + 0.25) { const k = seg(t, tl, tl + 0.25); P.ringGlow(Bp.x, Bp.y, 20 + (this.R - 20) * E.out(k), 0.38, 5 * (1 - k) + 1, '#ffb347', 1 - k); }
    if (t >= tb) { const fa = 1 - seg(t, tb + 0.3, tb + 0.8); ctx.save(); ctx.globalAlpha = 0.5 * fa; ctx.translate(Bp.x, Bp.y); ctx.scale(1, 0.38); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 95); g.addColorStop(0, 'rgba(30,20,12,0.9)'); g.addColorStop(0.6, 'rgba(40,26,14,0.45)'); g.addColorStop(1, 'rgba(40,26,14,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 95, 0, 6.283); ctx.fill(); ctx.restore();
      P.bloom(Bp.x, Bp.y, 60, '#ff6a1e', 0.4 * (1 - seg(t, tb, tb + 0.4))); } },
  top(t) { const { Bp, mz, tf, tl, tb } = this, A0 = S.artillery0;
    { const T = this.T, u = t - this.tfire; if (u >= 0 && u < 0.35 && T.__spr) { const p = P3.sprPt(T, 312, 160), an = (T.__spr.flip ? 180 + 32 : -32) * Math.PI / 180, ca = Math.cos(an), sa = Math.sin(an), f = seg(u, 0, 0.1);
      if (f < 1) { const k = 1 - f; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(p.x, p.y); ctx.rotate(an);
        for (const [L, w, o2] of [[34, 7, 0], [20, 4, -0.5], [20, 4, 0.5]]) { ctx.save(); ctx.rotate(o2); const g = ctx.createLinearGradient(0, 0, L * (0.6 + 0.4 * k), 0); g.addColorStop(0, `rgba(255,255,235,${k})`); g.addColorStop(0.4, `rgba(255,200,90,${0.9 * k})`); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -w * k); ctx.quadraticCurveTo(L * 0.5, -w * 0.6 * k, L * (0.6 + 0.4 * k), 0); ctx.quadraticCurveTo(L * 0.5, w * 0.6 * k, 0, w * k); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.restore(); P.bloom(p.x, p.y, 22 * k + 6, '#ffd890', k); }
      const sm = seg(u, 0.03, 0.35); if (sm > 0 && sm < 1) for (let i = 0; i < 3; i++) P.smoke(p.x + ca * (8 + 16 * sm) + (i - 1) * 4, p.y + sa * (8 + 16 * sm) - 6 * sm - i * 2, 5 + 7 * sm, 0.35 * (1 - sm), '#d8d2c8'); } }
    // user's missile art (missile_sheet.png): cut 1 = flying, cut 2 = embedded in dirt. art axis 44.3 deg, centre (301,314), nose 280px / tail 222px from centre
    const K = 0.13, IM1 = __spr.mis1.im, IM2 = __spr.mis2.im, an = Math.PI / 4, ux = Math.cos(an), uy = Math.sin(an), ART = 44.3 * Math.PI / 180;
    if (t >= tf && t < tl) { const q = seg(t, tf, tl), p0 = this.sp(q), c = { x: p0.x - ux * 280 * K, y: p0.y - uy * 280 * K }, tail = { x: c.x - ux * 222 * K, y: c.y - uy * 222 * K }, fl = 0.85 + 0.15 * Math.sin(t * 95);
      // smoke wisps along the path (light, rising)
      for (let k = 1; k <= 8; k++) { const qq = q - k * 0.03; if (qq <= 0) break; const pp = this.sp(qq); P.smoke(pp.x - ux * 60 * K * 8, pp.y - uy * 60 * K * 8 - k * 0.8, 5 + k * 1.2, 0.26 * (1 - k / 9), '#e0d8cc'); }
      // exhaust: long tapered additive flame plume + hot core + glow behind the tail
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(tail.x, tail.y); ctx.rotate(an + Math.PI);
      const plume = (len, w, c0, c1, a) => { const g = ctx.createLinearGradient(0, 0, len, 0); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-2, -w); ctx.quadraticCurveTo(len * 0.35, -w * 0.9, len, 0); ctx.quadraticCurveTo(len * 0.35, w * 0.9, -2, w); ctx.closePath(); ctx.fill(); };
      plume(95 * fl, 11, 'rgba(255,150,50,0.85)', 'rgba(255,70,20,0)', 0.9); plume(60 * fl, 7, 'rgba(255,220,120,1)', 'rgba(255,140,40,0)', 1); plume(30 * fl, 3.6, 'rgba(255,255,240,1)', 'rgba(255,230,160,0)', 1); ctx.restore();
      P.bloom(tail.x, tail.y, 26, '#ffb43a', 0.9);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(an - ART); ctx.scale(K, K); ctx.drawImage(IM1, -301, -314); ctx.restore(); }
    // embedded: cut 2 (missile stuck in dirt), dust puff, red blink during the 1s stun
    if (t >= tl && t < tb) { const k = seg(t, tl, tb), lq = seg(t, tl, tl + 0.3), cx = Bp.x, cy = Bp.y, ax = 437, ay = 505; /* cut-2 nose/ground entry point on the 45deg line */
      ctx.save(); ctx.translate(cx, cy + 3); ctx.scale(1, 0.38); let g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, 'rgba(40,26,14,0.55)'); g.addColorStop(1, 'rgba(60,40,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.283); ctx.fill(); ctx.restore();
      const sq = 1 + 0.08 * Math.exp(-lq * 10) * Math.cos(lq * 30);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(K * (2 - sq), K * sq); ctx.rotate(3.6 * Math.PI / 180); /* cut-2 body axis 41.4deg -> 45deg, same line as the flight */ ctx.drawImage(IM2, -ax, -ay);
      const blink = Math.max(0, Math.sin((t - tl) * (6 + 30 * k)));
      if (blink > 0.45) { if (!this.red) { const cv = document.createElement('canvas'); cv.width = 627; cv.height = 627; const x2 = cv.getContext('2d'); x2.drawImage(IM2, 0, 0); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = '#ff2a1a'; x2.fillRect(0, 0, 627, 627); this.red = cv; }
        ctx.globalAlpha = 0.5 * blink; ctx.drawImage(this.red, -ax, -ay); }
      ctx.restore();
      if (blink > 0.45) { P.bloom(cx - 8, cy - 30, 24 + 10 * k, '#ff2a1a', 0.6 * blink); }
      if (t < tl + 0.12) { const f = seg(t, tl, tl + 0.12); P.bloom(cx, cy - 4, 42 * (1 - 0.3 * f), '#ffd090', 0.8 * (1 - f)); }
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + 0.2, d = 12 + 24 * E.out(lq); P.smoke(cx + Math.cos(a) * d, cy - 2 + Math.sin(a) * d * 0.4 - 10 * lq, 7 + 6 * lq, 0.5 * (1 - lq), '#d9c7a6'); }
      for (let i = 0; i < 3; i++) { const ph = ((t - tl) * 1.4 + i / 3) % 1; P.smoke(cx - 14 + 6 * ph, cy - 30 - 26 * ph, 5 + 7 * ph, 0.22 * (1 - ph), '#bfb6aa'); } }
    // ENERGY explosion: implosion (core sucks in ~0.08s) -> white-cyan/yellow energy sphere (additive), thin crisp shock rings, sharp rays, crackling arcs; no smoke, no outlines, no debris
    { const c = { x: Bp.x, y: Bp.y - 14 }, ky = 0.62, u = t - tb;
      if (u >= -0.08 && u < 0) { const k = seg(u, -0.08, 0); P.bloom(c.x, c.y, 60 * (1 - 0.7 * k), '#9ff4ff', 0.6 + 0.4 * k); P.bloom(c.x, c.y, 16 * (1 - 0.5 * k), '#ffffff', 1);
        for (let i = 0; i < 14; i++) { const an = i * 0.449 + H(i + 950) * 0.4, d0 = 90 * (1 - E.in(k)) + 6, d1 = d0 + 18 * (1 - k); P.streak(c.x + Math.cos(an) * d1, c.y + Math.sin(an) * d1 * ky, c.x + Math.cos(an) * d0, c.y + Math.sin(an) * d0 * ky, 2, i % 2 ? '#bff8ff' : '#fff6c8', 0.9 * k, '#ffffff'); } }
      if (u >= 0 && u < 0.75) { const o5 = E.out5(seg(u, 0, 0.22)), fade = 1 - E.in(seg(u, 0.1, 0.55));
        if (u < 0.05) P.bloom(c.x, c.y, 120, '#ffffff', 0.9 - seg(u, 0, 0.05) * 0.5);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = 18 + 78 * o5, g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`); g.addColorStop(0.16, `rgba(200,248,255,${0.75 * fade})`); g.addColorStop(0.45, `rgba(40,170,255,${0.42 * fade})`); g.addColorStop(0.8, `rgba(20,120,255,${0.22 * fade})`); g.addColorStop(0.93, `rgba(255,225,90,${0.55 * fade})`); g.addColorStop(1, 'rgba(255,200,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, 6.283); ctx.fill(); ctx.restore();
        P.bloom(c.x, c.y, 130 * (0.6 + 0.4 * o5), '#1e9cff', 0.4 * fade); P.bloom(c.x, c.y, 26 * (1 - 0.5 * o5), '#ffffff', fade);
        // thin crisp shock rings (ground ellipse + sphere outline)
        for (let j = 0; j < 3; j++) { const rq = seg(u, j * 0.05, 0.34 + j * 0.08); if (rq <= 0 || rq >= 1) continue; const e = E.out5(rq), rr = 20 + (this.R * (1.55 - j * 0.25) - 20) * e; P.ringGlow(Bp.x, Bp.y, rr, 0.42, 2.2 * (1 - rq) + 0.8, j === 1 ? '#ffe9a0' : '#c8f6ff', 1 - E.in(rq)); }
        { const rq = seg(u, 0, 0.22); if (rq < 1) P.ringGlow(c.x, c.y, 16 + 92 * E.out5(rq), 1, 1.8 * (1 - rq) + 0.6, '#ffffff', 1 - rq); }
        // sharp radial light rays
        for (let i = 0; i < 16; i++) { const an = i * 0.3927 + (H(i + 960) - 0.5) * 0.25, sq = seg(u, 0, 0.22 + 0.1 * H(i + 961)); if (sq >= 1) continue; const d0 = 14 + 170 * E.out5(sq) * (0.6 + 0.4 * H(i + 962)), d1 = d0 - (50 + 40 * H(i + 963)) * (1 - sq);
          P.streak(c.x + Math.cos(an) * Math.max(8, d1), c.y + Math.sin(an) * Math.max(8, d1) * ky, c.x + Math.cos(an) * d0, c.y + Math.sin(an) * d0 * ky, 2.6 * (1 - sq) + 0.5, i % 3 ? '#bff4ff' : '#fff2b0', 1 - E.in(sq), '#ffffff'); }
        // crackling energy arcs bursting outward
        { const fr = Math.floor(t * 24); for (let i = 0; i < 6; i++) { const aq = seg(u, 0.02 + 0.02 * (i % 3), 0.36 + 0.06 * H(i + 970)); if (aq <= 0 || aq >= 1) continue; const an = i * 1.047 + H(i + 971) * 0.6, d0 = 20 + 40 * E.out3(aq), d1 = d0 + 40 + 40 * E.out3(aq);
          P.bolt(c.x + Math.cos(an) * d0, c.y + Math.sin(an) * d0 * ky, c.x + Math.cos(an + 0.2) * d1, c.y + Math.sin(an + 0.2) * d1 * ky, fr * 7 + i * 13, 12, i % 2 ? '#9ff0ff' : '#fff0a0', 1 - E.in(aq), 1.4, false); } }
        // tiny sparkle motes drifting outward (no gravity)
        P.sparks(c.x, c.y, 16, 980, seg(u, 0.02, 0.6), { a0: 0, spread: 6.28, v: 210, len: 8, w: 2, col: '#d8fbff', g: 0 }); } }
    this.vic.forEach((m, i) => { const c = mid(m); P.dmg(c.x, c.y - 44 - (i % 2) * 28, 5520, '#ff8a3a', t - tb - 0.02 - i * 0.03, true, 0.95); });
  } };
// ======================= 마법사 =======================
S.mage = { dur: 3.0,
  init() { const T = this.T = PM.T; this.tg = PM.tg.slice(); this.st = [this.tg[0], this.tg[2]]; this.C = { x: PM.C.x, y: PM.C.y + 4 }; this.S0 = { x: T.x - 16, y: T.y - 36 }; this.base = base(W().G.mobs, [T]); this.tc = 0.12; this.tl = 0.42; this.tb = 0.66; },
  op(q) { const A = this.S0, B = this.C; return { x: A.x + (B.x - A.x) * q, y: A.y + (B.y - A.y) * q - 60 * Math.sin(q * Math.PI) }; },
  update(t) { const { T, tb } = this; P.atk(T, t, this.tl, 0.5); if (t >= tb) P.shake(tb, 6, 0.28);
    this.tg.forEach(m => { P.hit(m, t, tb, { fl: 0.09, col: '#e8dcff' }); hpDrop(m, t, tb, 0.2); if (t > tb + 0.08) m.stunT = 1; });
    this.st.forEach((m, i) => { const ts = tb + 0.08 + i * 0.05; P.hit(m, t, ts, { fl: 0.14, col: '#dff4ff' }); if (t > ts) m.stunT = 1; }); },
  top(t) { const { S0, C, tb } = this, fr2 = Math.floor(t * 12);
    // (charge-up removed) orb flight
    { const q = seg(t, this.tl, tb); if (q > 0 && q < 1) { const pts = []; for (let k = 0; k <= 12; k++) pts.push(this.op(Math.max(0, q - (12 - k) * 0.03))); P.beamPath(pts, 9, '#8a5cff', '#e0d0ff', 1);
      const p = this.op(q); P.bloom(p.x, p.y, 60, '#8a5cff', 1); P.bloom(p.x, p.y, 20, '#ffffff', 1); P.bolt(p.x, p.y, p.x + (H(fr2) - 0.5) * 50, p.y + (H(fr2 + 1) - 0.5) * 50, fr2 * 5, 6, '#b994ff', 0.8, 1.2, false); } }
    // arcane blast
    { const q = seg(t, tb, tb + 0.6); if (q > 0 && q < 1) { const fa = 1 - q; P.bloom(C.x, C.y, 130 * (0.5 + 0.5 * E.out(q)), '#7a4cff', 0.6 * fa); P.bloom(C.x, C.y, 40 * (1 - q), '#ffffff', 0.7 * (1 - seg(q, 0, 0.25)));
      P.ringGlow(C.x, C.y + 12, 16 + 110 * E.out(seg(q, 0, 0.6)), 0.45, 8 * (1 - q) + 1, '#b08aff', 1 - seg(q, 0, 0.6)); P.ringGlow(C.x, C.y, 12 + 70 * E.out(seg(q, 0, 0.5)), 1, 5, '#c9b0ff', 1 - seg(q, 0, 0.5));
      P.rays(C.x, C.y, 12, 30 * E.out5(q), 100 * E.out5(seg(q, 0, 0.4)), 7 * fa, '#b08aff', fa, q, 31); } }
    // (chain lightning to other enemies removed)
    // electric flash on 2 targets on hit; stunned mobs show only the game's own stun stars
    this.st.forEach((m, i) => { const ts = tb + 0.08 + i * 0.05, h = head(m), c = mid(m), fr = Math.floor(t * 12) + i * 50, L = 1 - seg(t, this.dur - 0.25, this.dur);
      const k = seg(t, ts, ts + 0.4); if (k > 0 && k < 1) { const fa = 1 - k; P.bloom(c.x, c.y, 60 * (1 - E.in(k)), '#3fbaff', 0.4 * fa); P.bloom(c.x, c.y, 24 * fa, '#ffffff', 0.45 * (1 - seg(k, 0, 0.4))); P.rays(c.x, c.y, 10, 30, 70 * E.out5(seg(k, 0, 0.3)), 4 * fa, '#bff4ff', 0.6 * fa, fr, 9); P.ringGlow(c.x, c.y, 10 + 60 * E.out(k), 1, 4 * fa + 1, '#bff4ff', fa); }
    });
    this.tg.forEach((m, i) => { const c = mid(m); P.dmg(c.x + (i - 1) * 14, c.y - 44 - (i % 2) * 34, 980, '#c9b0ff', t - tb - i * 0.06, false, 1.0); });
  } };
// ======================= 장판: 늪 =======================
S.zone = { dur: 3.0,
  init() { const G = W().G; G.zones = []; this.T = PM.T; this.tg = PM.tg.slice(); this.C = { x: PM.C.x, y: PM.C.y + 16 }; this.base = base(G.mobs, [this.T]); this.RX = 140; this.RY = 58; },
  edge(a, t) { return 1 + 0.06 * Math.sin(a * 5 + t * 2.1) + 0.04 * Math.sin(a * 9 - t * 3.0); },
  s(t) { return E.back(seg(t, 0, 0.45)); },
  /* user: NO effect, it's just a slow. mobs walk along the lane; the ones in the zone simply slow down (no overlay, no tint, no particles) */
  update(t) { const v0 = 30, ik = t < 0.2 ? 0 : t < 0.5 ? (t - 0.2) * (t - 0.2) / 0.6 : 0.15 + (t - 0.5); W().G.mobs.forEach(m => { const dir = (m.face || 1) < 0 ? -1 : 1, slow = this.tg.includes(m); m.x += dir * v0 * (slow ? t - 0.6 * ik : t); }); },
  _ground_removed(t) { const s = this.s(t), { C, RX, RY } = this; if (s <= 0) return; const tt = t * 2.0944;
    // soft-edged swamp: radial gradient, wobbly multiplied blobs, no hard outline
    ctx.save(); ctx.translate(C.x, C.y); ctx.scale(1, RY / RX);
    for (const [k, c0, c1, a] of [[1.12, 'rgba(40,30,14,0.0)', 'rgba(40,30,14,0.35)', 1], [1.0, 'rgba(58,72,22,0.92)', 'rgba(48,60,18,0.0)', 1]]) { const g = ctx.createRadialGradient(0, 0, RX * s * 0.2, 0, 0, RX * s * k); if (k > 1.05) { g.addColorStop(0, c1); g.addColorStop(0.8, c1); g.addColorStop(1, c0); } else { g.addColorStop(0, c0); g.addColorStop(0.7, 'rgba(60,76,24,0.85)'); g.addColorStop(1, c1); } ctx.fillStyle = g; ctx.beginPath(); for (let i = 0; i <= 64; i++) { const an = i / 64 * 6.283, w = this.edge(an, tt) * s * k * RX; ctx.lineTo(Math.cos(an) * w, Math.sin(an) * w); } ctx.closePath(); ctx.fill(); }
    // sheen blobs drifting
    for (let i = 0; i < 5; i++) { const an = i * 1.25 + t * 0.4, d = RX * s * (0.25 + 0.3 * H(i)); const x = Math.cos(an) * d, y = Math.sin(an) * d; const g = ctx.createRadialGradient(x, y, 0, x, y, 40); g.addColorStop(0, 'rgba(150,170,70,0.45)'); g.addColorStop(1, 'rgba(150,170,70,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 40, 0, 6.283); ctx.fill(); }
    ctx.restore();
    // animated ripples (additive, thin)
    for (let k = 0; k < 4; k++) { const ph = (t * 0.8 + k / 4) % 1; P.ringGlow(C.x, C.y, RX * s * (0.1 + 0.85 * ph), RY / RX, 3.6, '#d4f070', 0.85 * E.bell(ph)); }
    { const pl = 0.55 + 0.3 * Math.sin(t * 5); P.ringGlow(C.x, C.y, RX * s * 0.96, RY / RX, 7, '#a8e040', pl * cl(s)); P.ringGlow(C.x, C.y, RX * s * 0.9, RY / RX, 3, '#e8ff9a', 0.35 * pl * cl(s)); }
    // bubbles: translucent, grow, pop
    for (let i = 0; i < 12; i++) { const per = [0.9, 1.2, 1.5][i % 3], ph = ((t + H(i) * per) % per) / per, _x = 0, a = H(i + 3) * 6.283, d = 0.1 + 0.7 * H(i + 5), x = C.x + Math.cos(a) * RX * d * s, y = C.y + Math.sin(a) * RY * d * s;
      if (ph < 0.72) { const r = (8 + 9 * H(i + 7)) * E.out(ph / 0.72); ctx.save(); const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.9, 0, x, y - r * 0.5, r); g.addColorStop(0, 'rgba(230,245,170,0.9)'); g.addColorStop(0.5, 'rgba(150,175,70,0.45)'); g.addColorStop(1, 'rgba(110,130,40,0.75)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - r * 0.5, r, 0, 6.283); ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(40,50,15,0.6)'; ctx.stroke(); ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.85, r * 0.25, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill(); ctx.restore(); }
      else { const q = (ph - 0.72) / 0.28; P.ringGlow(x, y, 6 + 24 * q, 0.45, 3, '#e8ff9a', 1 - q); P.bloom(x, y - 6, 22 * (1 - q), '#d4f070', 0.7 * (1 - q)); for (let k = 0; k < 6; k++) { const aa = -Math.PI / 2 + (k - 2.5) * 0.5, dd = 24 * q; P.smoke(x + Math.cos(aa) * dd, y - 6 + Math.sin(aa) * dd + 20 * q * q, 3.4, 1 - q, '#5e6e24'); P.smoke(x + Math.cos(aa) * dd - 1, y - 7 + Math.sin(aa) * dd + 20 * q * q, 1.6, 1 - q, '#e8ff9a'); } } }
    // mud rings around sinking feet
    this.tg.forEach((m, i) => { const f = { x: m.x, y: m.y - 1 }; ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1, 0.34); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(36,44,12,0.9)'); g.addColorStop(0.7, 'rgba(50,62,18,0.6)'); g.addColorStop(1, 'rgba(50,62,18,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.283); ctx.fill(); ctx.restore();
      for (let k = 0; k < 2; k++) { const ph = (t + k * 0.5 + i * 0.33) % 1; P.ringGlow(f.x, f.y, 20 + 26 * ph, 0.34, 2, '#c9e06a', 0.5 * (1 - ph)); } }); },
  _top_removed(t) { const s = this.s(t), { C } = this; if (s <= 0) return;
    { const q = seg(t, 0, 0.55); if (q < 1) { P.ringGlow(C.x, C.y, 20 + 140 * E.out(q), 0.42, 8 * (1 - q) + 1, '#b8d060', 1 - q);
      for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (H(i + 40) - 0.5) * 2.8, v = 100 + 90 * H(i + 41), x = C.x + Math.cos(a) * v * q * 0.9, y = C.y + Math.sin(a) * v * q + 300 * q * q; P.smoke(x, y, 5 + 2 * H(i), 0.9 * (1 - q), '#5e6e24'); P.smoke(x - 1, y - 2, 2, 0.6 * (1 - q), '#c9dc7a'); } } }
    // drips sliding off the sinking mobs
    this.tg.forEach((m, i) => { for (let k = 0; k < 3; k++) { const ph = ((t * 0.8 + k / 3 + i * 0.2) % 1), x = m.x + (k - 1) * 11, y = m.y - 24 + 26 * E.in(ph), a = 1 - seg(ph, 0.8, 1); P.smoke(x, y, 4.2, 0.85 * a, '#4e5c1c'); P.smoke(x - 1, y - 1.5, 1.6, 0.7 * a, '#d8ec8a'); } });
  } };
})();
// ======================= 마법사 스킬: 메테오 (stylized, clean) =======================
(() => { const P = window.P3, S = P.S, E = P.E, seg = P.seg, cl = P.cl, H = P.H; const W = () => window.__wd; const { mid, base, hpDrop } = P.U;
S.mage_meteor = { dur: 2.5,
  init() { const T = this.T = PM.T, G = W().G; this.base = base(G.mobs, [T]); this.C = { x: PM.C.x, y: PM.C.y + 14 }; this.R = 101; this.t0 = 0.25; this.fall = 0.5; this.tb = this.t0 + this.fall;
    this.vic = G.mobs.filter(m => !m.dead && Math.hypot(m.x - this.C.x, m.y - this.C.y) < this.R + 6); this.S0 = { x: this.C.x + 150, y: this.C.y - 420 }; },
  update(t) { P.atk(this.T, t, this.t0, 0.5); this.vic.forEach((m, i) => { P.hit(m, t, this.tb + 0.02, { fl: 0.1, col: '#ffd0a0' }); hpDrop(m, t, this.tb, 0.45); }); },
  ground(t) { const { C, R, t0, tb } = this;
    // warning circle (thin, translucent)
    const wq = seg(t, t0, tb); if (wq > 0 && t < tb + 0.05) { ctx.save(); ctx.translate(C.x, C.y); ctx.scale(1, 0.5); ctx.globalAlpha = 0.15 + 0.25 * wq; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, 'rgba(255,110,40,0.05)'); g.addColorStop(0.85, 'rgba(255,110,40,0.35)'); g.addColorStop(1, 'rgba(255,110,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.35 + 0.45 * wq; ctx.lineWidth = 1.8; ctx.strokeStyle = '#ff7a3a'; ctx.beginPath(); ctx.arc(0, 0, R * (0.3 + 0.7 * E.out(wq)), 0, 6.283); ctx.stroke(); ctx.restore(); }
    // scorch decal: dark burn + glowing ember rim that cools
    if (t >= tb) { const b2 = t - tb, fa = 1 - seg(b2, 0.9, 1.7), hot = 1 - seg(b2, 0.05, 0.9); ctx.save(); ctx.translate(C.x, C.y); ctx.scale(1, 0.46);
      ctx.globalAlpha = 0.75 * fa * seg(b2, 0, 0.08); let g = ctx.createRadialGradient(0, 0, 0, 0, 0, 70); g.addColorStop(0, 'rgba(24,14,10,0.95)'); g.addColorStop(0.55, 'rgba(40,22,12,0.55)'); g.addColorStop(1, 'rgba(40,22,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 6.283); ctx.fill();
      if (hot > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = hot; g = ctx.createRadialGradient(0, 0, 0, 0, 0, 62); g.addColorStop(0, 'rgba(255,170,70,0.75)'); g.addColorStop(0.45, 'rgba(255,90,30,0.35)'); g.addColorStop(0.75, 'rgba(255,120,40,0.45)'); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 62, 0, 6.283); ctx.fill();
        for (let i = 0; i < 9; i++) { const a = i * 0.698 + H(i + 640) * 0.5, r0 = 18 + 10 * H(i + 641), r1 = 44 + 16 * H(i + 642); ctx.globalAlpha = hot * 0.8; ctx.strokeStyle = 'rgba(255,170,80,0.9)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a + 0.12) * (r0 + r1) / 2, Math.sin(a + 0.12) * (r0 + r1) / 2); ctx.lineTo(Math.cos(a - 0.05) * r1, Math.sin(a - 0.05) * r1); ctx.stroke(); } }
      ctx.restore(); } },
  top(t) { const { C, R, S0, t0, tb, T } = this;
    // cast glow at staff
    { const q = seg(t, 0.05, t0 + 0.1); if (q > 0 && q < 1) P.bloom(T.x - 16, T.y - 36, 22 * E.bell(q), '#ff9a4a', 0.8 * E.bell(q)); }
    // falling meteor: one seamless body (white-hot core -> orange -> deep red), crisp tapered trail, a few embers
    const q = seg(t, t0, tb); if (q > 0 && q < 1) { const k = E.in(q), x = S0.x + (C.x - S0.x) * k, y = S0.y + (C.y - 18 - S0.y) * k, dx = C.x - S0.x, dy = C.y - 18 - S0.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux, an = Math.atan2(uy, ux);
      const tail = (hw, len, c0, c1, c2) => { ctx.beginPath(); ctx.arc(x, y, hw, an + Math.PI / 2, an - Math.PI / 2, true); for (let j = 1; j <= 18; j++) { const s = j / 18, w = hw * Math.pow(1 - s, 1.2); ctx.lineTo(x - ux * len * s - nx * w, y - uy * len * s - ny * w); }
        for (let j = 17; j >= 1; j--) { const s = j / 18, w = hw * Math.pow(1 - s, 1.2); ctx.lineTo(x - ux * len * s + nx * w, y - uy * len * s + ny * w); } ctx.closePath(); const g = ctx.createLinearGradient(x + ux * hw, y + uy * hw, x - ux * len, y - uy * len); g.addColorStop(0, c0); g.addColorStop(0.2, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fill(); };
      const sl = 120 + 110 * k; ctx.save();
      for (let j = 0; j < 6; j++) { const s = 0.25 + j * 0.13, ph = (t * 3 + H(j + 70)) % 1; P.smoke(x - ux * sl * s + nx * (H(j + 71) - 0.5) * 16, y - uy * sl * s + ny * (H(j + 71) - 0.5) * 16, 6 + 8 * s, 0.18 * (1 - s), '#d8cfc4'); }
      tail(20, sl, 'rgba(255,220,140,1)', 'rgba(255,110,30,0.9)', 'rgba(170,30,10,0)'); tail(11, sl * 0.6, '#fffbe8', 'rgba(255,214,100,0.95)', 'rgba(255,150,40,0)');
      ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, 34); g.addColorStop(0, 'rgba(255,240,200,0.9)'); g.addColorStop(0.4, 'rgba(255,130,40,0.45)'); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 34, 0, 6.283); ctx.fill(); ctx.restore();
      for (let j = 0; j < 7; j++) { const ph = (t * 2.6 + H(j + 80)) % 1, s = 0.15 + ph * 0.8, ex = x - ux * sl * s + nx * (H(j + 81) - 0.5) * 30 * ph, ey = y - uy * sl * s + ny * (H(j + 81) - 0.5) * 30 * ph; ctx.save(); ctx.globalAlpha = (1 - ph) * 0.9; ctx.fillStyle = j % 2 ? '#ffd27a' : '#ff7a2e'; ctx.beginPath(); ctx.arc(ex, ey, 2.2 * (1 - ph) + 0.6, 0, 6.283); ctx.fill(); ctx.restore(); } }
    // impact: short white core flash -> layered additive hot core -> crisp heat shockwave -> outward embers -> rising smoke
    const b = t - tb; if (b >= 0 && b < 1.6) { const c = { x: C.x, y: C.y - 12 }; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // wide warm glow
      { const a = 1 - E.out(seg(b, 0, 0.5)); if (a > 0) { const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 170); g.addColorStop(0, `rgba(255,140,50,${0.35 * a})`); g.addColorStop(0.5, `rgba(255,80,30,${0.14 * a})`); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 170, 0, 6.283); ctx.fill(); } }
      // layered hot core: white -> yellow -> orange -> deep red, cooling outward (normal blend keeps it saturated)
      ctx.globalCompositeOperation = 'source-over'; { const q = seg(b, 0, 0.4); if (q < 1) { const r = 26 + 46 * E.out3(seg(b, 0, 0.2)), cool = 0.7 * E.in(q), a = 1 - E.out(seg(b, 0.1, 0.4)); const g = ctx.createRadialGradient(c.x, c.y - 4, 0, c.x, c.y, r);
        g.addColorStop(0, P.mix('#fffbe8', '#ffb040', cool)); g.addColorStop(0.2, P.mix('#ffe070', '#ff7a20', cool)); g.addColorStop(0.45, P.mix('#ff9a20', '#c8381a', cool)); g.addColorStop(0.72, hexA(P.mix('#e8401a', '#6a1a10', cool), 0.85)); g.addColorStop(1, 'rgba(100,20,10,0)');
        ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(c.x, c.y, r, r * 0.82, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; } } ctx.globalCompositeOperation = 'lighter';
      // very short bright core flash
      { const f = seg(b, 0, 0.09); if (f < 1) { const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 60); g.addColorStop(0, `rgba(255,255,255,${1 - f})`); g.addColorStop(0.35, `rgba(255,240,200,${0.6 * (1 - f)})`); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 80, 0, 6.283); ctx.fill(); } }
      // heat shockwave: crisp bright leading edge with soft inner falloff (on the ground plane)
      for (const [d0, d1, am] of [[0, 0.3, 1], [0.04, 0.4, 0.45]]) { const q = seg(b, d0, d1); if (q <= 0 || q >= 1) continue; const r = 18 + (R * 1.12 - 18) * E.out(q), a = am * (1 - E.in(q)); ctx.save(); ctx.translate(C.x, C.y); ctx.scale(1, 0.48);
        const g = ctx.createRadialGradient(0, 0, Math.max(0, r - 26), 0, 0, r + 4); g.addColorStop(0, 'rgba(255,200,120,0)'); g.addColorStop(0.7, `rgba(255,190,110,${0.35 * a})`); g.addColorStop(0.9, `rgba(255,245,215,${0.95 * a})`); g.addColorStop(1, 'rgba(255,230,180,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, 6.283); ctx.fill(); ctx.restore(); }
      // ember sparks bursting outward (radial, decelerating, slight rise; no gravity)
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 24; i++) { const life = 0.35 + 0.25 * H(i + 660), q = seg(b, 0.01, life); if (q <= 0 || q >= 1) continue; const a = i * 0.2618 + (H(i + 661) - 0.5) * 0.25, v = 70 + 70 * H(i + 662), d = v * E.out(q), d0 = Math.max(0, d - (10 + 14 * (1 - q))),
          x1 = c.x + Math.cos(a) * d, y1 = c.y + Math.sin(a) * d * 0.55 - 14 * q, x0 = c.x + Math.cos(a) * d0, y0 = c.y + Math.sin(a) * d0 * 0.55 - 14 * q;
        ctx.globalAlpha = 1 - E.in(q); ctx.strokeStyle = q < 0.35 ? '#ffe27a' : '#ff7a28'; ctx.lineCap = 'round'; ctx.lineWidth = 3.2 * (1 - q) + 1; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      ctx.restore();
      // smoke that rises and dissipates upward
      for (let i = 0; i < 8; i++) { const q = seg(b, 0.1 + i * 0.025, 1.4 + i * 0.03); if (q <= 0 || q >= 1) continue; const a = i * 0.785 + 0.3, x = c.x + Math.cos(a) * (14 + 26 * E.out(q)), y = c.y - 6 + Math.sin(a) * 8 - 62 * E.out(q);
        P.smoke(x, y, 14 + 20 * q, 0.3 * E.bell(seg(q, 0, 1)) * (1 - 0.3 * q), P.mix('#c9a890', '#dcd6d0', seg(q, 0, 0.4))); } }
    this.vic.forEach((m, i) => { const c = mid(m); P.dmg(c.x + (i % 2 ? 6 : -6), c.y - 44 - (i % 3) * 22, 4120, '#ff8a3a', t - tb - 0.02 - i * 0.03, true, 0.95); });
  } };
})();
