(() => {
const P3 = window.P3 = { t: 0, ms: 0, ms0: 100000, on: false, shk: [], S: {} };
const _pn = performance.now.bind(performance);
performance.now = () => P3.on ? P3.ms : _pn();
const W = () => window.__wd;
const cl = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const seg = (t, a, b) => cl((t - a) / (b - a));
const E = { out: q => 1 - (1 - q) * (1 - q), out3: q => 1 - Math.pow(1 - q, 3), out5: q => 1 - Math.pow(1 - q, 5), in: q => q * q, in3: q => q * q * q, io: q => q < .5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2,
  back: q => { const c = 2.2; return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); }, bell: q => Math.sin(cl(q) * Math.PI) };
const H = n => hsh(n);
const INK = '#2a1d16';
P3.E = E; P3.seg = seg; P3.cl = cl;
// ---------- primitives ----------
const X = () => ctx;
function add(f) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; f(); ctx.restore(); }
function glow(x, y, r, col, a) { if (a <= 0.003 || r <= 0.5) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 1; softDot(x, y, r, col, cl(a)); ctx.restore(); }
function dot(x, y, r, col, a) { if (a <= 0.003 || r <= 0.5) return; ctx.save(); ctx.globalAlpha = 1; softDot(x, y, r, col, cl(a)); ctx.restore(); }
function ell(x, y, rx, ry, w, col, a, ink, rot = 0) { if (a <= 0.003 || rx <= 0.5) return; ctx.save(); ctx.globalAlpha = cl(a); ctx.beginPath(); ctx.ellipse(x, y, rx, Math.max(0.1, ry), rot, 0, 6.283);
  if (ink) { ctx.lineWidth = w + ink; ctx.strokeStyle = INK; ctx.stroke(); } ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); ctx.restore(); }
function aell(x, y, rx, ry, w, col, a) { add(() => { ctx.globalAlpha = cl(a * 0.35); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.283); ctx.lineWidth = w * 3; ctx.strokeStyle = col; ctx.stroke(); ctx.globalAlpha = cl(a); ctx.lineWidth = w; ctx.stroke(); }); }
function line(x0, y0, x1, y1, w, col, a, cap = 'round') { if (a <= 0.003 || w <= 0.1) return; ctx.save(); ctx.globalAlpha = cl(a); ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); ctx.restore(); }
function aline(x0, y0, x1, y1, w, col, a) { add(() => line(x0, y0, x1, y1, w, col, a)); }
// tapered streak (thick at head)
function streak(hx, hy, tx, ty, w, col, a, core) { const dx = hx - tx, dy = hy - ty, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; if (a <= 0.003) return;
  add(() => { ctx.globalAlpha = cl(a); const g = ctx.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, hexA(col, 0)); g.addColorStop(1, hexA(col, 1)); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx + nx * w / 2, hy + ny * w / 2); ctx.arc(hx, hy, w / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true); ctx.closePath(); ctx.fill();
    if (core) { const g2 = ctx.createLinearGradient(tx, ty, hx, hy); g2.addColorStop(0.3, hexA(core, 0)); g2.addColorStop(1, hexA(core, 1)); ctx.fillStyle = g2; const w2 = w * 0.38;
      ctx.beginPath(); ctx.moveTo(tx + (hx - tx) * 0.3, ty + (hy - ty) * 0.3); ctx.lineTo(hx + nx * w2 / 2, hy + ny * w2 / 2); ctx.arc(hx, hy, w2 / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true); ctx.closePath(); ctx.fill(); } }); }
// radial spark streaks
function sparks(x, y, n, sd, p, o) { if (p < 0 || p >= 1) return; const fa = 1 - p;
  for (let i = 0; i < n; i++) { const a = (o.a0 ?? 0) + (o.spread != null ? (H(sd + i) - 0.5) * o.spread : i * 6.283 / n + H(sd + i) * 0.5), v = (o.v || 120) * (0.55 + 0.6 * H(sd + i * 3.1)),
      d = v * E.out(p), gy = (o.g || 0) * p * p, hx = x + Math.cos(a) * d, hy = y + Math.sin(a) * d * (o.fy || 1) + gy, L = (o.len || 22) * fa * (0.6 + 0.6 * H(sd + i * 7));
    const tx = hx - Math.cos(a) * L, ty = hy - Math.sin(a) * L * (o.fy || 1) - (o.g || 0) * p * 0.12;
    streak(hx, hy, tx, ty, (o.w || 4) * (0.5 + 0.5 * fa), o.col || '#ffd66b', fa * (o.a ?? 1), o.core || '#ffffff'); } }
function star5(x, y, r, rot, fill, a, lw = 2.4) { if (a <= 0.01 || r < 0.5) return; ctx.save(); ctx.globalAlpha = cl(a); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.47 : r, an = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.lineJoin = 'round';
  ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = fill; ctx.fill();
  ctx.beginPath(); ctx.ellipse(-r * 0.18, -r * 0.22, r * 0.22, r * 0.13, -0.6, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); ctx.restore(); }
function spark4(x, y, r, col, a) { if (a <= 0.01) return; add(() => { softDot(x, y, r * 1.6, col, a * 0.5); star4(x, y, r, '#ffffff', cl(a)); }); }
// orbiting stun stars (game: ★ circling the head)
function stun(x, y, t, s = 1, a = 1) { if (a <= 0.01) return; const n = 3, sc = s * (0.6 + 0.4 * E.back(cl(t / 0.25)));
  const pts = []; for (let i = 0; i < n; i++) { const an = t * 7 + i * 6.283 / n; pts.push({ an, z: Math.sin(an) }); }
  ell(x, y, 32 * sc, 10 * sc, 2.4, 'rgba(255,236,150,1)', 0.45 * a);
  pts.sort((p, q) => p.z - q.z).forEach(p => star5(x + Math.cos(p.an) * 32 * sc, y + Math.sin(p.an) * 10 * sc, (11 + 3 * p.z) * sc, p.an * 0.5, p.z < 0 ? '#f0c23a' : '#ffe04a', a));
}
// damage number, game style (thick ink outline, GWTT), with crit pop
function dmg(x, y, v, col, t, crit = true, sc = 1) { if (t < 0 || t > 1.0) return; const pop = t < 0.16 ? 0.3 + 1.1 * E.back(t / 0.16) : 1.0 + 0.4 * Math.max(0, 0.06 - (t - 0.16)) ;
  const fs = Math.round((crit ? 25 : 17) * 1.35 * sc), str = (typeof v === 'number' ? fmt(v) : v) + (crit ? '!' : ''), a = 1 - Math.max(0, t - 0.7) / 0.3;
  ctx.save(); ctx.globalAlpha = cl(a); ctx.translate(Math.round(x), Math.round(y - 14 - 30 * E.out(cl(t / 0.9)))); ctx.scale(pop, pop); ctx.font = canvasFont(fs); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, Math.round(fs * 0.24)); ctx.strokeStyle = '#2a1d16'; ctx.strokeText(str, 0, 0); ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore(); }
function rock(x, y, r, an, a, c0 = '#9a8f84', c1 = '#4a423a') { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = cl(a); rock6(x, y, r, an, c0, c1); ctx.restore(); }
function puff(x, y, r, col, a) { dot(x, y, r, col, a); }
// cartoon cloud puff with ink outline
function cloud(x, y, r, fill, a, sd) { if (a <= 0.01 || r < 1) return; ctx.save(); ctx.globalAlpha = cl(a); const P = [[0, 0, 1], [-0.62, 0.18, 0.7], [0.6, 0.15, 0.72], [-0.25, -0.45, 0.66], [0.32, -0.42, 0.6]];
  ctx.fillStyle = INK; for (const [dx, dy, s] of P) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, s * r + 2.6, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = fill; for (const [dx, dy, s] of P) { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, s * r, 0, 6.283); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.5, r * 0.28, 0, 6.283); ctx.fill(); ctx.restore(); }
function mix(c0, c1, k) { const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], A = p(c0), B = p(c1); k = cl(k); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
Object.assign(P3, { mix, glow, dot, ell, aell, line, aline, streak, sparks, star5, spark4, stun, dmg, rock, cloud, add, INK, H });
// ---------- shake ----------
P3.shake = (t0, a, d = 0.3) => P3.shk.push({ t0, a, d });
function shakeOff() { let dx = 0, dy = 0; for (const s of P3.shk) { const q = (P3.t - s.t0) / s.d; if (q < 0 || q >= 1) continue; const A = s.a * Math.pow(1 - q, 1.5); dx += Math.sin((P3.t - s.t0) * 95) * A; dy += Math.cos((P3.t - s.t0) * 71) * A * 0.7; } return [Math.round(dx), Math.round(dy)]; }
// ---------- hooks ----------
const _dg = drawGround10; drawGround10 = function () { _dg(); if (P3.on && P3.sc && P3.sc.ground) { ctx.save(); try { P3.sc.ground(P3.t); } catch (e) { console.error(e); } ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } };
const _df = drawField; drawField = function () { if (!P3.on) return _df(); const [dx, dy] = shakeOff(); ctx.save(); ctx.translate(dx, dy); try { _df(); if (P3.sc && P3.sc.top) { ctx.save(); P3.sc.top(P3.t); ctx.restore(); } } catch (e) { console.error(e); } ctx.restore(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; };
// ---------- mob helpers ----------
P3.hit = (m, t, th, o = {}) => { if (t >= th) { m.hsq13 = P3.ms0 + th * 1000; } if (t >= th && t < th + (o.fl || 0.09)) { m.flash = 1; m.flashCol = o.col || '#ffffff'; } };
P3.atk = (T, t, tf, dur = 0.5) => { const A = (typeof anim3 === 'function' && anim3(T)) || (ANIM && ANIM[T.role]) || {}; const rel = A.relT || 0.4, st = tf - rel * dur; if (t >= st && t < st + dur) { T.animDur = dur; T.animT = t - st; } else { T.animT = -1; } };
P3.frame = (f, fps = 24) => { const t = P3.t = f / fps; P3.ms = P3.ms0 + t * 1000; P3.on = true; const G = W().G; const sc = P3.sc;
  for (const m of G.mobs) { m.flash = 0; m.stunT = 0; }
  if (sc.base) sc.base.forEach(([o, s]) => Object.assign(o, s));
  P3.shk = []; sc.update && sc.update(t); render(); };
P3.snapshot = (objs, keys) => objs.map(o => [o, Object.fromEntries(keys.map(k => [k, o[k]]))]);
})();
(() => { window.P3.Z = (x, y, s, fn) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y); try { fn(); } finally { ctx.restore(); } }; })();
(() => { const P = window.P3, cl = P.cl, H = P.H, INK = P.INK;
// gaussian-ish additive bloom
P.bloom = (x, y, r, col, a) => { if (a <= 0.004 || r <= 0.5) return; a = cl(a); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(col, a)); g.addColorStop(0.2, hexA(col, a * 0.6)); g.addColorStop(0.45, hexA(col, a * 0.22)); g.addColorStop(0.72, hexA(col, a * 0.06)); g.addColorStop(1, hexA(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore(); };
// layered additive beam (straight), gaussian falloff
P.beam = (x0, y0, x1, y1, w, col, core, a) => { if (a <= 0.004 || w <= 0.1) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (const [k, c, al] of [[5, col, 0.07], [3.2, col, 0.14], [2.1, col, 0.3], [1.35, col, 0.55], [0.8, core, 0.85], [0.34, '#ffffff', 1]]) { ctx.globalAlpha = cl(al * a); ctx.lineWidth = w * k; ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  ctx.restore(); };
// polyline version (for curved trails)
P.beamPath = (pts, w, col, core, a, taper = true) => { if (a <= 0.004 || pts.length < 2) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [k, c, al] of [[4, col, 0.1], [2.3, col, 0.28], [1.3, col, 0.6], [0.7, core, 0.9], [0.3, '#ffffff', 1]]) { for (let i = 1; i < pts.length; i++) { const u = taper ? i / (pts.length - 1) : 1; ctx.globalAlpha = cl(al * a * u); ctx.lineWidth = w * k * (0.3 + 0.7 * u); ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); } }
  ctx.restore(); };
// animated radial rays (additive, tapered, gradient along length)
P.rays = (x, y, n, L0, L1, w, col, a, rot = 0, sd = 1) => { if (a <= 0.004 || L1 <= 1) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const an = rot + i * 6.283 / n + (H(sd + i) - 0.5) * 0.35, L = L0 + (L1 - L0) * H(sd + i * 2.3), ww = w * (0.6 + 0.6 * H(sd + i * 4.1)); const ex = x + Math.cos(an) * L, ey = y + Math.sin(an) * L;
    const g = ctx.createLinearGradient(x, y, ex, ey); g.addColorStop(0, hexA(col, a)); g.addColorStop(0.6, hexA(col, a * 0.5)); g.addColorStop(1, hexA(col, 0)); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(an + 1.57) * ww, y + Math.sin(an + 1.57) * ww); ctx.lineTo(ex, ey); ctx.lineTo(x + Math.cos(an - 1.57) * ww, y + Math.sin(an - 1.57) * ww); ctx.closePath(); ctx.fill(); }
  ctx.restore(); };
// additive soft ring (annulus with soft falloff)
P.ringGlow = (x, y, r, fy, w, col, a) => { if (a <= 0.004 || r <= 1) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(1, fy);
  const r0 = Math.max(0, r - w * 2), r1 = r + w * 2, g = ctx.createRadialGradient(0, 0, r0, 0, 0, r1), m = (r - r0) / (r1 - r0);
  g.addColorStop(0, hexA(col, 0)); g.addColorStop(Math.max(0, m - 0.25), hexA(col, a * 0.25)); g.addColorStop(m, hexA(col, a)); g.addColorStop(Math.min(1, m + 0.25), hexA(col, a * 0.25)); g.addColorStop(1, hexA(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r1, 0, 6.283); ctx.fill(); ctx.globalAlpha = cl(a); ctx.lineWidth = Math.max(1, w * 0.35); ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.stroke(); ctx.restore(); };
// branching lightning
P.bolt = (x0, y0, x1, y1, sd, disp = 18, col = '#7fd8ff', a = 1, w = 3, branch = true) => { if (a <= 0.01) return; let pts = [[x0, y0], [x1, y1]], d = disp, k = 0;
  for (let it = 0; it < 5; it++) { const np = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, o = (H(sd + k++ * 1.37) - 0.5) * 2 * d; np.push([ax, ay], [mx - dy / L * o, my + dx / L * o]); } np.push(pts[pts.length - 1]); pts = np; d *= 0.55; }
  const draw = (ps, ww, aa) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; for (const [k2, c, al] of [[4.5, col, 0.18], [2.2, col, 0.5], [1, '#ffffff', 1]]) { ctx.globalAlpha = cl(al * aa); ctx.lineWidth = ww * k2; ctx.strokeStyle = c; ctx.beginPath(); ps.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); } ctx.restore(); };
  draw(pts, w, a);
  if (branch) for (let b = 0; b < 3; b++) { const i = 4 + Math.floor(H(sd + 50 + b) * (pts.length - 8)), [bx, by] = pts[i], an = Math.atan2(y1 - y0, x1 - x0) + (H(sd + 60 + b) - 0.5) * 2.2, L = Math.hypot(x1 - x0, y1 - y0) * (0.2 + 0.25 * H(sd + 70 + b));
    P.bolt(bx, by, bx + Math.cos(an) * L, by + Math.sin(an) * L, sd + 100 + b * 17, disp * 0.5, col, a * 0.8, w * 0.6, false); } };
// fire blob (additive), heat 1 = white-hot .. 0 = dull red
P.flame = (x, y, r, heat, a) => { if (a <= 0.004 || r <= 0.5) return; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const c0 = heat > 0.66 ? '#fff6d0' : heat > 0.33 ? '#ffd23a' : '#ff8a2a', c1 = heat > 0.5 ? '#ff9a1e' : '#e0451e';
  g.addColorStop(0, hexA(c0, a)); g.addColorStop(0.35, hexA(c1, a * 0.7)); g.addColorStop(0.7, hexA('#c8281a', a * 0.25)); g.addColorStop(1, hexA('#c8281a', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore(); };
P.smoke = (x, y, r, a, col = '#5d544c') => { if (a <= 0.004 || r <= 0.5) return; ctx.save(); const g = ctx.createRadialGradient(x, y - r * 0.2, 0, x, y, r); g.addColorStop(0, hexA(col, a)); g.addColorStop(0.55, hexA(col, a * 0.6)); g.addColorStop(1, hexA(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore(); };
P.shadow = (x, y, rx, a) => { if (a <= 0.004) return; ctx.save(); ctx.globalAlpha = cl(a); ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.36, 0, 0, 6.283); ctx.fillStyle = 'rgba(30,20,10,0.55)'; ctx.fill(); ctx.restore(); };
P.chunk = (x, y, r, rot, a, sd, c0 = '#c9b79c', c1 = '#7a6a58') => { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = cl(a); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath(); const n = 6;
  for (let i = 0; i < n; i++) { const an = i * 6.283 / n + H(sd + i) * 0.5, rr = r * (0.72 + 0.4 * H(sd + i * 3)); ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.lineJoin = 'round';
  const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.3); ctx.lineTo(-r * 0.1, -r * 0.6); ctx.lineTo(r * 0.3, -r * 0.4); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke(); ctx.restore(); };
P.coin = (x, y, r, spin, a) => { if (a <= 0.01) return; const c = Math.cos(spin), w = Math.max(0.08, Math.abs(c)), th = r * 0.28 * Math.sqrt(1 - w * w); ctx.save(); ctx.globalAlpha = cl(a); ctx.translate(x, y); ctx.lineJoin = 'round';
  // rim (thickness visible when edge-on)
  ctx.beginPath(); ctx.ellipse(th * Math.sign(c || 1), 0, r * w, r, 0, 0, 6.283); ctx.fillStyle = '#b8740c'; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.stroke();
  if (th > 0.5) { ctx.fillStyle = '#d48d14'; ctx.fillRect(-0.1, -r, th * Math.sign(c || 1), r * 2); }
  ctx.beginPath(); ctx.ellipse(0, 0, r * w, r, 0, 0, 6.283); const g = ctx.createRadialGradient(-r * 0.35 * w, -r * 0.4, 0, 0, 0, r * 1.1); g.addColorStop(0, '#fff7c4'); g.addColorStop(0.45, '#ffcf2e'); g.addColorStop(1, '#e09412'); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.68 * w, r * 0.68, 0, 0, 6.283); ctx.lineWidth = 1.6; ctx.strokeStyle = '#c47f0c'; ctx.stroke();
  if (w > 0.35) { ctx.save(); ctx.scale(w, 1); ctx.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * 0.16 : r * 0.42; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fillStyle = '#fff1a0'; ctx.fill(); ctx.lineWidth = 1.2; ctx.strokeStyle = '#c47f0c'; ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.ellipse(-r * 0.4 * w, -r * 0.45, r * 0.2 * w, r * 0.12, -0.5, 0, 6.283); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill(); ctx.restore(); };
P.twinkle = (x, y, r, a, rot = 0, col = '#fff6c8') => { if (a <= 0.01 || r < 0.5) return; P.bloom(x, y, r * 2.2, col, a * 0.6); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.rotate(rot); star4(0, 0, r, '#ffffff', cl(a)); ctx.rotate(0.785); star4(0, 0, r * 0.5, col, cl(a * 0.8)); ctx.restore(); ctx.globalAlpha = 1; };
})();

// ---- motion-sheet sprite override (user's motion sheets; frames cut to /motions) ----
(() => { const _us = unitSrc; unitSrc = function (T) { const o = T && T.__spr; if (o && window.__spr && __spr[o.nm]) { const s = __spr[o.nm], H = o.H || (s.b - s.t), cx = o.cx != null ? o.cx : s.w / 2;
    return { img: s.im, sx: 0, sw: s.w, sh: s.h, dw: s.w, dh: s.h, box: { t: s.b - H, b: s.b, l: cx, r: cx }, flip: o.flip, fb: { cx, foot: s.b }, shr: o.sc || 1 }; } return _us(T); };
  // world point of a sheet pixel (px,py) for T's current override (ignores idle breathing)
  P3.sprPt = (T, px, py) => { const o = T.__spr, s = __spr[o.nm], H = o.H || (s.b - s.t), cx = o.cx != null ? o.cx : s.w / 2, k = UNIT_H / H * (o.sc || 1), f = o.flip ? -1 : 1;
    return { x: T.x + f * (px - cx) * k, y: T.y + FOOT_DY + (py - s.b) * k, f, k }; };
})();
