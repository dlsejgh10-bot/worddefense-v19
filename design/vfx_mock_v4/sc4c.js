(() => { const P = window.P3, S = P.S, E = P.E, seg = P.seg, cl = P.cl, H = P.H, INK = P.INK; const W = () => window.__wd;
const { head, mid, gnd, base, dist, hpDrop, knock } = P.U; const impact = P.impact;
// ======================= 유령 =======================
S.ghost = { dur: 3.2,
  init() { const G = W().G; this.tg = PM.tg.slice(); this.Gs = PM.Gs.slice(); this.tg.forEach(m => { m.dbT = new Array(10).fill(0); m.auraSlow = 0; }); this.base = base(G.mobs, this.Gs); this.fl = 0.5; },
  t0(e) { return 0.12 + e * 0.09; }, V: [0, 1.25], ta(e) { return this.t0(e) + this.fl; },
  life(e, t) { const a = this.ta(e); return seg(t, a, a + 0.2) * (1 - seg(t, this.dur - 0.35, this.dur - 0.05)); },
  update(t) { this.Gs.forEach((T, e) => P.atk(T, t, this.t0(e) + (t > this.t0(e) + 0.9 ? this.V[1] : 0), 0.4)); this.tg.forEach((m, e) => P.hit(m, t, this.ta(e) + this.V[1], { fl: 0.1 })); this.tg.forEach((m, e) => { const a = this.ta(e); P.hit(m, t, a, { fl: 0.12, col: ['#e8e2d6', '#ffd0a0', '#cfe8ff', '#e6f8ff', '#fff6b0'][e] }); hpDrop(m, t, a, 0.12);
    const L = this.life(e, t); if (e === 3 && L > 0) { m.flash = 0.7 * L; m.flashCol = '#bfe9ff'; } if (e === 1 && L > 0 && H(Math.floor(t * 12)) > 0.5) { m.flash = 0.35; m.flashCol = '#ff9a4a'; } if (e === 4 && L > 0) m.stunT = 1; }); },
  top(t) { const cols = [['#b8a890', '#ffffff'], ['#ff6a1e', '#ffd27a'], ['#2f8fff', '#bfe3ff'], ['#6fd8ff', '#eafaff'], ['#ffd21e', '#fff7c2']];
    this.tg.forEach((m, e) => { const T = this.Gs[e], [c, l] = cols[e], t0 = this.t0(e), q = seg(t, t0, this.ta(e)), A = { x: T.x - 2, y: T.y - 22 }, c0 = mid(m), h = head(m), f = { x: m.x, y: m.y + 3 }, sgn = e % 2 ? 1 : -1;
      const P2 = u => ({ x: A.x + (c0.x - A.x) * u + Math.sin(u * Math.PI) * 30 * sgn, y: A.y + (c0.y - A.y) * u - Math.sin(u * Math.PI) * 20 });
      for (const vv of this.V) { const tv = t0 + vv;
      // launch puff at the ghost
      { const k = seg(t, t0, tv + 0.3); if (k > 0 && k < 1) { P.bloom(A.x, A.y, 60 * (1 - k), c, 0.9 * (1 - k)); P.ringGlow(A.x, A.y, 10 + 34 * E.out(k), 1, 4, l, 1 - k); } }
      // projectile with trail
      { const q = seg(t, tv, tv + this.fl); if (q > 0 && q < 1) { const u = E.io(q), pts = []; for (let k = 0; k <= 14; k++) pts.push(P2(Math.max(0, u - (14 - k) * 0.025))); P.beamPath(pts, 11, c, l, 1);
        const p = P2(u); P.bloom(p.x, p.y, 70, c, 1); P.bloom(p.x, p.y, 24, '#ffffff', 1);
        if (e === 1) for (let k = 0; k < 5; k++) { const pp = P2(Math.max(0, u - k * 0.04)); P.flame(pp.x, pp.y - 4, 20 - k * 3, 1 - k / 5, 0.9); }
        if (e === 2) for (let k = 1; k < 6; k++) { const pp = P2(Math.max(0, u - k * 0.05)); P.smoke(pp.x + (H(k) - 0.5) * 6, pp.y + k * 4, 4, 0.9 * (1 - k / 6), '#7fc0ff'); }
        if (e === 3) for (let k = 0; k < 4; k++) { const an = t * 12 + k * 1.57; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(p.x + Math.cos(an) * 14, p.y + Math.sin(an) * 10); ctx.rotate(an); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(3, 0); ctx.lineTo(0, 7); ctx.lineTo(-3, 0); ctx.closePath(); ctx.fillStyle = '#dff6ff'; ctx.fill(); ctx.restore(); }
        if (e === 4) P.bolt(p.x - 16, p.y - 12, p.x + 16, p.y + 12, Math.floor(t * 24) * 3, 8, '#ffe03a', 1, 1.6, false);
        if (e === 0) P.twinkle(p.x, p.y, 12, 1, t * 8, '#ffffff');
        ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 6.283); ctx.lineWidth = 3.2; ctx.strokeStyle = INK; ctx.stroke(); const gg = ctx.createRadialGradient(p.x - 3, p.y - 3, 0, p.x, p.y, 10); gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.45, l); gg.addColorStop(1, c); ctx.fillStyle = gg; ctx.fill(); ctx.restore(); P.bloom(p.x, p.y, 16, '#ffffff', 0.6); } }
      // impact
      impact(c0.x, c0.y, seg(t, tv + this.fl, tv + this.fl + 0.45), c, 1.0, 70 + e * 9, { rc: l, sc: l, ns: 10 });
      }
      const L = this.life(e, t); if (L <= 0) return; const tt = t, fr = Math.floor(tt * 16); P.Z(c0.x, f.y, 1.5, () => {
      if (e === 0) { // 물리: armor shards chip off + crack glints
        P.bloom(c0.x, c0.y, 40, '#bdb4a4', 0.3 * L);
        for (let k = 0; k < 6; k++) { const ph = ((tt * 1.1 + k / 6) % 1), a = k * 1.05 + 0.4, x = c0.x + Math.cos(a) * (16 + 22 * ph), y = c0.y - 4 + Math.sin(a) * 10 + 50 * ph * ph - 14 * ph; ctx.save(); ctx.globalAlpha = L * (1 - seg(ph, 0.7, 1)); shard6(x, y, 7, 4.5, a + ph * 8, '#e9e2d4', '#5e564a'); ctx.restore(); if (ph < 0.15) P.twinkle(x, y, 6, L, k); }
        for (let k = 0; k < 2; k++) { const ph = (tt * 1.3 + k * 0.5) % 1; P.twinkle(c0.x + (k ? 12 : -10), c0.y - 8 + k * 6, 7 * E.bell(ph), L, ph * 3); } }
      if (e === 1) { // 불: moving additive flames + embers
        P.bloom(c0.x, c0.y, 60, '#ff5a1e', 0.35 * L);
        for (let k = 0; k < 6; k++) { const x = f.x + (k - 2.5) * 8, hgt = (26 + 16 * H(k + 2)) * (0.75 + 0.25 * Math.sin(tt * 21 + k * 2)) * (1 - Math.abs(k - 2.5) / 5), sw = Math.sin(tt * 12 + k) * 5; ctx.save(); ctx.globalAlpha = 0.9 * L;
          const g = ctx.createLinearGradient(0, f.y, 0, f.y - hgt); g.addColorStop(0, '#ffe27a'); g.addColorStop(0.45, '#ff7a1e'); g.addColorStop(1, 'rgba(210,50,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 7, f.y); ctx.quadraticCurveTo(x - 8, f.y - hgt * 0.5, x + sw, f.y - hgt); ctx.quadraticCurveTo(x + 8, f.y - hgt * 0.5, x + 7, f.y); ctx.closePath(); ctx.fill(); ctx.restore(); }
        for (let k = 0; k < 14; k++) { const ph = (tt * 1.8 + H(k)) % 1, x = f.x + (H(k + 3) - 0.5) * 34 + Math.sin(ph * 8 + k) * 4, y = f.y - 2 - 48 * ph; P.flame(x, y, (12 + 6 * H(k + 5)) * (1 - 0.7 * ph), 1 - ph, 0.6 * L * (1 - E.in(ph))); }
        for (let k = 0; k < 6; k++) { const ph = ((tt * 1.2 + k / 6) % 1); P.bloom(f.x + (H(k + 9) - 0.5) * 44 + Math.sin(ph * 9 + k) * 6, f.y - 24 - 56 * ph, 6, '#ffd27a', L * (1 - ph)); } }
      if (e === 2) { // 물: dripping water + splash ripples
        P.bloom(c0.x, c0.y, 46, '#2f8fff', 0.35 * L); ctx.save(); ctx.globalAlpha = 0.7 * L; ctx.translate(f.x, f.y + 2); ctx.scale(1, 0.32); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(90,170,255,0.7)'); g.addColorStop(1, 'rgba(90,170,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, 6.283); ctx.fill(); ctx.restore();
        for (let k = 0; k < 4; k++) { const ph = ((tt * 1.3 + k / 4) % 1), x = c0.x + (k - 1.5) * 11, y = h.y - 4 + (f.y - h.y + 4) * E.in(ph); const a = L * (1 - seg(ph, 0.9, 1)); ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.quadraticCurveTo(x + 5, y, x, y + 4); ctx.quadraticCurveTo(x - 5, y, x, y - 8); const g = ctx.createLinearGradient(x, y - 8, x, y + 4); g.addColorStop(0, '#eaf6ff'); g.addColorStop(1, '#4fa2ff'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = '#1f5a9c'; ctx.stroke(); ctx.restore();
          if (ph > 0.85) { const sq = (ph - 0.85) / 0.15; P.ringGlow(x, f.y + 2, 4 + 14 * sq, 0.35, 1.6, '#bfe3ff', L * (1 - sq)); } } }
      if (e === 3) { // 얼음: orbiting ice shards + frost mist
        P.bloom(c0.x, c0.y, 56, '#6fd8ff', 0.4 * L); P.smoke(f.x, f.y - 2, 30, 0.35 * L, '#e6f8ff');
        const sh = []; for (let k = 0; k < 6; k++) { const an = tt * 2.2 + k * 1.047; sh.push({ an, z: Math.sin(an) }); }
        sh.sort((a, b) => a.z - b.z).forEach((s, k) => { const x = c0.x + Math.cos(s.an) * 30, y = c0.y - 6 + Math.sin(s.an) * 10, sc = (0.8 + 0.25 * s.z) * E.back(cl(L * 1.2)); ctx.save(); ctx.globalAlpha = L * (0.75 + 0.25 * s.z); ctx.translate(x, y); ctx.rotate(Math.cos(s.an) * 0.4); ctx.scale(sc, sc); ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(4.5, -2); ctx.lineTo(0, 9); ctx.lineTo(-4.5, -2); ctx.closePath(); const g = ctx.createLinearGradient(-4, -12, 4, 9); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#7fd0ff'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = '#2f6f90'; ctx.stroke(); ctx.restore(); if (s.z > 0.8) P.twinkle(x, y - 6, 5, L, tt); }); }
      if (e === 4) { // 번개: crackling bolts
        P.bloom(c0.x, c0.y, 60, '#ffd21e', (0.3 + 0.25 * H(fr)) * L);
        for (let k = 0; k < 3; k++) { const a0 = H(fr * 3 + k) * 6.283, a1 = a0 + 1.4 + H(fr + k + 5), r = 28; P.bolt(c0.x + Math.cos(a0) * r, c0.y + Math.sin(a0) * r * 0.8, c0.x + Math.cos(a1) * r, c0.y + Math.sin(a1) * r * 0.8, fr * 11 + k, 9, '#ffd21e', L, 1.8, false); }
        if (H(fr + 3) > 0.5) P.bolt(h.x, h.y - 40, h.x + (H(fr) - 0.5) * 16, h.y - 4, fr * 7, 8, '#fff07a', L, 2, false); } });
    });
  } };
// ======================= 버퍼 =======================
S.buffer = { dur: 3.0,
  init() { const T = this.T = PM.T; this.al = PM.al.filter(Boolean); this.base = base(W().G.mobs, [T, ...this.al]); this.C = { x: T.x, y: T.y + 8 }; this.tb = 0.5; this.Rm = 190;
    this.ti = this.al.map(a => this.tb + 0.05 + 0.45 * Math.pow(Math.hypot(a.x - T.x, (a.y - T.y) / 0.62) / this.Rm, 1.6)); },
  update(t) { const { T } = this; P.atk(T, t, this.tb, 0.5); if (t >= this.tb) P.shake(this.tb, 3.5, 0.25);
    this.al.forEach((a, i) => { const th = this.ti[i]; if (t >= th && t < th + 0.14) { a.flash = 0.5; a.flashCol = '#fff3b0'; } else a.flash = 0; }); T.flash = (t >= this.tb && t < this.tb + 0.12) ? 0.4 : 0; T.flashCol = '#fff3b0'; },
  ground(t) { const { C, tb, Rm } = this, L = 1 - seg(t, this.dur - 0.35, this.dur - 0.05);
    const q = seg(t, tb, tb + 0.7); if (q > 0 && q < 1) { const r = Rm * E.out(q); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(C.x, C.y + 10); ctx.scale(1, 0.62); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, hexA('#ffd84a', 0)); g.addColorStop(0.8, hexA('#ffd84a', 0.25 * (1 - q))); g.addColorStop(1, hexA('#ffd84a', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill(); ctx.restore(); }
    this.al.forEach((a, i) => { const k = seg(t, this.ti[i], this.ti[i] + 0.25) * L; if (k <= 0) return; const pul = 0.8 + 0.2 * Math.sin(t * 6.283 + i); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(a.x, a.y + 19); ctx.scale(1, 0.36); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, hexA('#ffe27a', 0.55 * k * pul)); g.addColorStop(0.7, hexA('#ffd84a', 0.3 * k * pul)); g.addColorStop(1, hexA('#ffd84a', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 6.283); ctx.fill(); ctx.restore(); P.ringGlow(a.x, a.y + 19, 28, 0.36, 2.5, '#ffe27a', 0.8 * k * pul); }); },
  top(t) { const { C, tb, Rm, T } = this, hd = { x: T.x, y: T.y - 46 };
    { const q = seg(t, 0.12, tb); if (q > 0 && t < tb + 0.03) { const k = E.in(q); P.bloom(hd.x, hd.y, 40 + 60 * k, '#ffcf3a', 0.5 + 0.5 * k); for (let j = 0; j < 2; j++) { const rq = (q * 2.2 + j * 0.5) % 1; P.ringGlow(hd.x, hd.y, 60 * (1 - rq) + 6, 0.9, 3, '#ffe27a', E.bell(rq) * k); } P.twinkle(hd.x, hd.y, 10 + 14 * k, 1, t * 4); } }
    { const q = seg(t, tb, tb + 0.55); if (q > 0 && q < 1) { P.bloom(hd.x, hd.y, 140 * (1 - q * 0.5), '#ffcf3a', 1 - q); P.bloom(hd.x, hd.y, 50 * (1 - q), '#ffffff', 1 - seg(q, 0, 0.4)); P.rays(hd.x, hd.y, 14, 40 * E.out5(q), 120 * E.out5(seg(q, 0, 0.4)), 8 * (1 - q), '#ffe27a', 1 - q, q * 0.5, 13); } }
    for (let j = 0; j < 3; j++) { const q = seg(t, tb + j * 0.12, tb + 0.8 + j * 0.12); if (q <= 0 || q >= 1) continue; const r = 20 + (Rm - j * 25) * E.out(q), fa = 1 - E.in(q);
      P.ringGlow(C.x, C.y + 10, r, 0.62, (j ? 5 : 11) * (1 - q) + 2, j === 1 ? '#fff3b0' : '#ffcf3a', fa);
      if (!j) for (let k = 0; k < 16; k++) { const a = k * 0.393 + q * 0.6; P.twinkle(C.x + Math.cos(a) * r, C.y + 10 + Math.sin(a) * r * 0.62, 8 * fa * (0.6 + 0.4 * H(k)), fa, a); } }
    const L = 1 - seg(t, this.dur - 0.35, this.dur - 0.05);
    this.al.forEach((a, i) => { const th = this.ti[i], q = seg(t, th, th + 0.7), top = a.y - 120;
      if (q > 0 && q < 1) { const fa = 1 - E.in(q), w = 44 * (1 - 0.6 * E.out(q)), hq = E.out5(seg(q, 0, 0.25)); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const yT = a.y + 19 - 140 * hq; const g = ctx.createLinearGradient(0, a.y + 19, 0, yT); g.addColorStop(0, hexA('#ffd84a', 0.85 * fa)); g.addColorStop(0.6, hexA('#ffd84a', 0.35 * fa)); g.addColorStop(1, hexA('#ffd84a', 0));
        const gx = ctx.createLinearGradient(a.x - w / 2, 0, a.x + w / 2, 0); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(a.x, a.y + 19, w / 2, w * 0.18, 0, 0, Math.PI); ctx.lineTo(a.x - w / 2, yT); ctx.lineTo(a.x + w / 2, yT); ctx.closePath(); ctx.fill();
        const g2 = ctx.createLinearGradient(0, a.y + 19, 0, yT); g2.addColorStop(0, hexA('#ffffff', 0.95 * fa)); g2.addColorStop(1, hexA('#ffffff', 0)); ctx.fillStyle = g2; ctx.fillRect(a.x - w * 0.12, yT, w * 0.24, a.y + 19 - yT); ctx.restore();
        P.bloom(a.x, a.y - 10, 60 * fa, '#ffe27a', 0.7 * fa); P.ringGlow(a.x, a.y + 19, 10 + 36 * E.out(q), 0.36, 4 * fa + 1, '#fff3b0', fa); }
      const k = seg(t, th, th + 0.2) * L; if (k > 0) for (let j = 0; j < 6; j++) { const ph = ((t - th) * 0.9 + j / 6) % 1, an = ph * 9 + j * 1.3, r = 20 - 6 * ph; const x = a.x + Math.cos(an) * r * 1.3, y = a.y + 19 - ph * 90 + Math.sin(an) * r * 0.4; P.bloom(x, y, 8, j % 2 ? '#ffffff' : '#ffd84a', k * (1 - ph)); if (j % 2) P.twinkle(x, y, 5 * (1 - ph) + 1, k * E.bell(ph), an); }
      if (k > 0) { const pul = 0.6 + 0.4 * Math.sin(t * 6 + i); P.bloom(a.x, a.y - 4, 44, '#ffd84a', 0.28 * k * pul); } });
  } };
P.coin2 = (x, y, r, spin, a) => { if (a <= 0.01) return; const cs = Math.cos(spin), sg = cs >= 0 ? 1 : -1, w = Math.max(0.06, Math.abs(cs)), th = r * 0.32 * Math.sqrt(1 - w * w); ctx.save(); ctx.globalAlpha = cl(a); ctx.translate(x, y); ctx.lineJoin = 'round';
  // edge band (thickness) + back rim
  ctx.beginPath(); ctx.ellipse(th * sg, 0, r * w, r, 0, 0, 6.283); ctx.fillStyle = '#7a4606'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  if (th > 0.6) { ctx.beginPath(); ctx.rect(Math.min(0, th * sg), -r, Math.abs(th), r * 2); const gb = ctx.createLinearGradient(0, -r, 0, r); gb.addColorStop(0, '#f0b030'); gb.addColorStop(0.35, '#a8680a'); gb.addColorStop(0.65, '#d8961c'); gb.addColorStop(1, '#6a3c04'); ctx.fillStyle = gb; ctx.fill();
    for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(Math.min(0, th * sg), k * r / 4.6); ctx.lineTo(Math.max(0, th * sg), k * r / 4.6); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(80,40,0,0.55)'; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(th * sg, -r); ctx.lineTo(th * sg, r); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
  // face: metallic gradient
  ctx.beginPath(); ctx.ellipse(0, 0, r * w, r, 0, 0, 6.283); const gf = ctx.createLinearGradient(-r * w, -r, r * w, r); const back = cs < 0;
  gf.addColorStop(0, back ? '#f6d470' : '#fff8d0'); gf.addColorStop(0.28, back ? '#e8a820' : '#ffd23a'); gf.addColorStop(0.5, back ? '#c07a0c' : '#e89a14'); gf.addColorStop(0.68, back ? '#e8b030' : '#ffe680'); gf.addColorStop(1, back ? '#8a5206' : '#b8700a');
  ctx.fillStyle = gf; ctx.fill(); ctx.lineWidth = 3.2; ctx.strokeStyle = INK; ctx.stroke();
  // rim ring (dark) + inner bevel
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.76 * w, r * 0.76, 0, 0, 6.283); ctx.lineWidth = 2.6; ctx.strokeStyle = '#8a5206'; ctx.stroke(); ctx.beginPath(); ctx.ellipse(-0.6 * w, -0.8, r * 0.72 * w, r * 0.72, 0, Math.PI * 0.9, Math.PI * 1.6); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,250,220,0.9)'; ctx.stroke();
  if (w > 0.3) { ctx.save(); ctx.scale(w, 1); ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.2 : r * 0.46; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fillStyle = back ? '#d89418' : '#ffe680'; ctx.fill(); ctx.lineWidth = 1.8; ctx.strokeStyle = '#8a5206'; ctx.stroke(); ctx.restore(); }
  // specular highlight
  ctx.beginPath(); ctx.ellipse(-r * 0.42 * w, -r * 0.5, r * 0.22 * w, r * 0.13, -0.6, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill(); ctx.restore(); };
// ======================= 상인 =======================
S.merchant = { dur: 2.3,
  init() { const T = this.T = PM.T; this.base = base(W().G.mobs, [T]); this.O = { x: T.x, y: T.y - 30 }; this.gy = T.y + 16; this.tn = 0.2; this.tp = 0.6; },
  update(t) { const { T } = this; T.flash = 0; if (t >= this.tp && t < this.tp + 0.1) { T.flash = 0.3; T.flashCol = '#ffe27a'; } P.atk(T, t, this.tp, 0.45); },
  pop(t, g, dy, col, dx = 0) { if (t < 0 || t >= 1) return; const T = this.T, a = t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35, k = t < 0.1 ? 0.7 + 3 * t : 1, y = T.y - 62 + dy - 34 * (1 - Math.pow(1 - Math.min(1, t / 0.9), 2)), str = '+' + fmt(g), fs = Math.round(24 * k);
    ctx.save(); ctx.globalAlpha = a; ctx.font = canvasFont(fs); const tw = ctx.measureText(str).width, cr = 11 * k, tot = cr * 2 + 5 + tw, x0 = T.x + dx - tot / 2; coinIcon(x0 + cr, y, cr); text(str, x0 + cr * 2 + 5, y + 1, fs, col, { align: 'left', stroke: '#2a1d16', lw: 5 }); ctx.restore(); },
  top(t) { const { O, gy, tp } = this;
    // 1) normal gold gain (game's own '+N' pop)
    this.pop(t - this.tn, 20, 0, '#ffd23f', -34);
    // 2) passive bonus: ONE v4-style coin burst (flash + ring + spinning metallic coins + glints), coins ~65% size
    const q = t - tp; if (q >= 0 && q < 1.5) { const f = seg(q, 0, 0.3);
      if (f < 1) { P.bloom(O.x, O.y, 80, '#ffc21e', 0.75 * (1 - f)); P.bloom(O.x, O.y, 34 * (1 - 0.5 * f), '#ffffff', 0.9 * (1 - f)); P.ringGlow(O.x, gy - 10, 14 + 80 * E.out(seg(q, 0, 0.4)), 0.42, 5 * (1 - f) + 1, '#ffe27a', 1 - seg(q, 0, 0.4)); }
      for (let i = 0; i < 6; i++) { const ph = seg(q, 0.05 + i * 0.04, 0.9 + i * 0.04); if (ph > 0 && ph < 1) P.twinkle(O.x + (H(i + 40) - 0.5) * 90, O.y - 20 - 60 * ph, 6 * E.bell(ph), 1, i, '#fff6c8'); }
      const cs = []; for (let i = 1; i < 11; i++) { const sd = 300 + i, vx = (i - 5.5) * 24 + (H(sd) - 0.5) * 20, vy = -(250 + 110 * H(sd + 1)), g = 1100, land = gy + H(sd + 3) * 14, tl = (-vy + Math.sqrt(vy * vy + 2 * g * (land - O.y))) / g; let x = O.x + vx * q, y = O.y + vy * q + 0.5 * g * q * q;
        if (q > tl) { const u = q - tl, v2 = -(vy + g * tl) * 0.3; y = Math.min(land, land + v2 * u + 0.5 * g * u * u); x = O.x + vx * tl + vx * 0.25 * Math.min(u, -2 * v2 / g); }
        const fa = 1 - seg(q, 1.0 + 0.03 * i, 1.3 + 0.015 * i); if (fa > 0) cs.push({ x, y, land, fa, spin: Math.min(q, tl + 0.25) * (9 + 4 * H(sd + 5)) + i, sd }); }
      cs.sort((a, b) => a.y - b.y).forEach(c => { P.shadow(c.x, c.land + 5, 6.4, 0.4 * c.fa); ctx.save(); ctx.translate(c.x, c.y); ctx.scale(0.52, 0.52); P.coin2(0, 0, 20, c.spin, c.fa); ctx.restore(); const gp = (q * 2.5 + H(c.sd)) % 1; if (gp < 0.2) P.twinkle(c.x + 4, c.y - 5, 5.6 * E.bell(gp / 0.2), c.fa, c.sd); }); }
  } };
})();
// ======================= 장판 액티브: 에너지 구 (wd-skill.js zone: dur lin(3,5,L)=3s@L1, tick 0.25s, R 93, follows target 160px/s, zaps all in R each tick; no stun) =======================
(() => { const P = window.P3, S = P.S, E = P.E, seg = P.seg, cl = P.cl, H = P.H; const W = () => window.__wd; const { mid, base, hpDrop } = P.U;
S.zone_energy_orb = { dur: 3.9,
  init() { const T = this.T = PM.T, G = W().G; this.base = base(G.mobs, [T]); this.tg = PM.tg[1]; this.o = { x: this.tg.x, y: this.tg.y }; this.R = 93; this.t0 = 0.35; this.D = 3.0; this.TK = 0.25;
    this.ticks = []; for (let k = 0; k * this.TK <= this.D + 1e-6; k++) this.ticks.push(this.t0 + k * this.TK);
    this.vic = G.mobs.filter(m => !m.dead && Math.hypot(m.x - this.o.x, m.y - this.o.y) <= this.R); },
  update(t) { P.atk(this.T, t, this.t0 - 0.05, 0.5); this.ticks.forEach(s => this.vic.forEach(m => P.hit(m, t, s + 0.02, { fl: 0.05, col: '#dff6ff' }))); this.vic.forEach(m => hpDrop(m, t, this.t0, this.D)); },
  life(t) { const u = t - this.t0; return u < 0 ? 0 : Math.min(1, u / 0.18) * (1 - seg(u, this.D, this.D + 0.25)); },
  last(t) { let s = -1; for (const k of this.ticks) if (t >= k) s = k; return s; },
  ground(t) { const { o, R } = this, lf = this.life(t); if (lf <= 0) return; const s = this.last(t), dt = s < 0 ? 9 : t - s, pulse = dt < 0.2 ? 1 - dt / 0.2 : 0;
    // field on the ground (game's own zone tint), thin rim
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1, 0.62); ctx.globalAlpha = lf; const zg = ctx.createRadialGradient(0, 0, R * 0.12, 0, 0, R); zg.addColorStop(0, `rgba(210,245,255,${0.16 + 0.14 * pulse})`); zg.addColorStop(0.55, `rgba(120,210,255,${0.11 + 0.08 * pulse})`); zg.addColorStop(1, 'rgba(80,180,255,0)'); ctx.fillStyle = zg; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill();
    ctx.strokeStyle = `rgba(160,230,255,${0.4 + 0.2 * pulse})`; ctx.lineWidth = 1.6 / 0.62; ctx.beginPath(); ctx.arc(0, 0, R * 0.98, 0, 6.283); ctx.stroke(); ctx.restore();
    // orb shadow + strike ripple
    ctx.save(); ctx.globalAlpha = 0.2 * lf; ctx.fillStyle = 'rgb(30,30,40)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 15, 6.5, 0, 0, 6.283); ctx.fill(); ctx.restore();
    if (dt < 0.22) { const u = dt / 0.22, rr = 18 + 42 * u; ctx.save(); ctx.globalAlpha = 0.4 * Math.pow(1 - u, 1.3) * lf; ctx.strokeStyle = '#c8e6ff'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(o.x, o.y, rr, rr * 0.38, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }
    if (pulse > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const ig = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, 52); ig.addColorStop(0, `rgba(230,245,255,${0.5 * pulse * lf})`); ig.addColorStop(0.4, `rgba(140,220,255,${0.25 * pulse * lf})`); ig.addColorStop(1, 'rgba(80,180,255,0)'); ctx.fillStyle = ig; ctx.beginPath(); ctx.ellipse(o.x, o.y, 52, 24, 0, 0, 6.283); ctx.fill(); ctx.restore(); } },
  top(t) { const { o, R } = this, lf = this.life(t); if (lf <= 0) return; const u = t - this.t0, s = this.last(t), dt = s < 0 ? 9 : t - s, k = Math.round((s - this.t0) / this.TK), oy = o.y - 112 + Math.sin(t * 5) * 3, sc = 0.6 + 0.4 * E.out(Math.min(1, u / 0.18));
    // strike: main bolt orb -> ground centre + forks to every mob in range, ~0.12s
    if (dt < 0.12) { const a = 1 - dt / 0.12; P.bolt(o.x, oy + 10, o.x + (H(k + 1) - 0.5) * 8, o.y - 2, k * 13 + 1, 12, '#5fd2ff', a * lf, 3.2, true); P.bolt(o.x, oy + 10, o.x, o.y - 2, k * 13 + 2, 10, '#e8fbff', 0.8 * a * lf, 1.4, false);
      this.vic.forEach((m, i) => { if (m === this.tg) return; const c = mid(m); P.bolt(o.x, oy + 14, c.x, c.y - 4, k * 17 + i * 5, 9, '#7fdcff', 0.75 * a * lf, 1.8, false); P.bloom(c.x, c.y, 22, '#9fe4ff', 0.5 * a * lf); });
      P.bloom(o.x, o.y - 6, 30, '#bff0ff', 0.6 * a * lf); }
    // orb: layered additive sphere with surface arcs
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = lf; const r = 21 * sc * (1 + 0.12 * (dt < 0.1 ? 1 - dt / 0.1 : 0));
    let g = ctx.createRadialGradient(o.x, oy, 0, o.x, oy, r * 3); g.addColorStop(0, 'rgba(150,225,255,0.55)'); g.addColorStop(0.45, 'rgba(80,170,255,0.18)'); g.addColorStop(1, 'rgba(60,140,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, oy, r * 3, 0, 6.283); ctx.fill();
    g = ctx.createRadialGradient(o.x - r * 0.25, oy - r * 0.3, 0, o.x, oy, r); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(200,245,255,0.95)'); g.addColorStop(0.75, 'rgba(90,190,255,0.7)'); g.addColorStop(1, 'rgba(60,150,255,0.15)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, oy, r, 0, 6.283); ctx.fill(); ctx.restore();
    const fr = Math.floor(t * 18); for (let j = 0; j < 3; j++) { const a0 = H(fr * 3 + j) * 6.283, a1 = a0 + 1.2 + H(fr + j + 9) * 1.4; P.bolt(o.x + Math.cos(a0) * r * 0.95, oy + Math.sin(a0) * r * 0.95, o.x + Math.cos(a1) * r * 1.25, oy + Math.sin(a1) * r * 1.25, fr * 7 + j, 4, '#dff8ff', 0.7 * lf, 1.1, false); }
    // per-tick damage numbers (small, short)
    this.ticks.forEach((s2, kk) => { if (t < s2 || t > s2 + 0.6) return; this.vic.forEach((m, i) => { const c = mid(m); P.dmg(c.x + (H(kk * 7 + i) - 0.5) * 16, c.y - 24 - (kk % 2) * 8, 162, '#bfe8ff', t - s2 - 0.02, false, 0.62); }); });
  } };
})();
