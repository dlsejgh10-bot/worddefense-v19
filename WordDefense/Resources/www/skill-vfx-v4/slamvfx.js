/* user's SlamVFX pack (miner_active_user/slam-vfx.js), mock-only patches marked 'mock patch' */
(function (scope) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const out = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const fade = (t, end) => Math.pow(1 - clamp(t / end), 1.4);
  const noise = (n) => {
    const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  function ellipse(ctx, x, y, rx, ry, color, alpha = 1, width = 0) {
    if (rx <= 0 || ry <= 0 || alpha <= 0) return;
    ctx.globalAlpha = clamp(alpha);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    if (width) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
    else { ctx.fillStyle = color; ctx.fill(); }
  }
  function polygon(ctx, pts, color, alpha = 1) {
    if (!pts.length || alpha <= 0) return;
    ctx.globalAlpha = clamp(alpha);
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath(); ctx.fill();
  }
  function line(ctx, pts, color, alpha, width) {
    if (!pts.length || alpha <= 0) return;
    ctx.globalAlpha = clamp(alpha);
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(0.2, width);
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt'; ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke();
  }
  function glow(ctx, x, y, radius, color, alpha, squash = 1) {
    if (alpha <= 0 || radius <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, squash);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    g.addColorStop(0, color); g.addColorStop(1, 'transparent');
    ctx.globalAlpha = clamp(alpha); ctx.fillStyle = g;
    ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }
  function star(ctx, t, p, strength = 1) {
    const a = fade(t, 0.115);
    if (a <= 0) return;
    const size = (24 + 48 * Math.sin(clamp(t / 0.1) * Math.PI)) * strength;
    glow(ctx, 0, -9, size * 2.3, p.accent, a * 0.42, 0.6);
    polygon(ctx, [[-size, 0], [-14, -7], [-7, -size * 0.76], [4, -13],
      [size, -4], [18, 6], [8, size * 0.35], [-4, 9]], p.bright, a);
    ellipse(ctx, 0, -3, size * 0.47, size * 0.17, p.bright, a);
  }
  function ring(ctx, t, p, opts = {}) {
    const life = opts.life || 0.48;
    if (t < 0 || t > life) return;
    const k = out(t / life), a = fade(t, life);
    const r = 16 + k * (opts.radius || 152);
    const width = (opts.width || 14) * Math.pow(1 - k, 0.6) + 0.5;
    ellipse(ctx, 0, 0, r, r * (opts.squash || 0.29), p.accent, a * 0.65, width * 2.1);
    ellipse(ctx, 0, -1, r, r * (opts.squash || 0.29), p.bright, a, width);
    if (opts.broken) {
      for (let i = 0; i < 12; i++) {
        const angle = i * TAU / 12 + 0.12;
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r * 0.29;
        polygon(ctx, [[x - 4, y], [x + Math.cos(angle) * 15, y + Math.sin(angle) * 5],
          [x + 3, y + 4]], p.bright, a * 0.8);
      }
    }
  }
  function rays(ctx, t, p, count, distance, life = 0.28) {
    if (t < 0 || t > life) return;
    const u = clamp(t / life), a = fade(t, life);
    for (let i = 0; i < count; i++) {
      const ang = i * TAU / count + noise(i + 5) * 0.28;
      const r0 = 22 + u * distance * 0.45;
      const r1 = r0 + Math.sin(u * Math.PI) * (25 + noise(i + 10) * 44);
      const q = 2 + 2 * noise(i);
      polygon(ctx, [[Math.cos(ang) * r0, Math.sin(ang) * r0 * 0.32],
        [Math.cos(ang) * r1, Math.sin(ang) * r1 * 0.32],
        [Math.cos(ang) * r0 + q, Math.sin(ang) * r0 * 0.32 + q]],
      i % 3 ? p.bright : p.accent, a);
    }
  }
  function cracks(ctx, t, p, options = {}) {
    if (t < 0 || t > 1.2) return;
    const count = options.count || 8;
    const alpha = clamp((1.2 - t) / 0.35) * clamp(t / 0.025);
    const reach = out(t / 0.24) * (options.radius || 145);
    for (let i = 0; i < count; i++) {
      const ang = i * TAU / count + noise(i + 75) * 0.5;
      const pts = [[Math.cos(ang) * 13, Math.sin(ang) * 5]];
      for (let n = 1; n <= 5; n++) {
        const dist = reach * n / 5;
        const bend = (noise(i * 7 + n * 3) - 0.5) * 19;
        pts.push([Math.cos(ang) * dist - Math.sin(ang) * bend,
          (Math.sin(ang) * dist + Math.cos(ang) * bend) * 0.32]);
      }
      line(ctx, pts, p.ink, alpha, 5.5);
      line(ctx, pts.map(([x, y]) => [x, y - 1.4]), p.accent, alpha * 0.53, 1.15);
      const fork = pts[3];
      const branch = ang + (i % 2 ? 0.6 : -0.6);
      const tip = [fork[0] + Math.cos(branch) * reach * 0.22,
        fork[1] + Math.sin(branch) * reach * 0.08];
      line(ctx, [fork, [(fork[0] + tip[0]) / 2 + 4, (fork[1] + tip[1]) / 2], tip],
        p.ink, alpha, 2.3);
    }
  }
  function dust(ctx, t, p, count = 20, radius = 130, amount = 1) {
    if (t < 0 || t > 0.95) return;
    for (let i = 0; i < count; i++) {
      const angle = i * TAU / count + noise(i + 15) * 0.3;
      const delay = noise(i + 121) * 0.045;
      const local = t - delay;
      if (local < 0) continue;
      const life = 0.52 + noise(i + 44) * 0.35;
      const u = clamp(local / life);
      const distance = 12 + out(u) * radius * (0.55 + noise(i + 62) * 0.45);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance * 0.28 - Math.sin(u * Math.PI) * (12 + noise(i + 33) * 21);
      const r = (7 + noise(i + 93) * 10) * (0.4 + Math.sin(u * Math.PI) * 0.95);
      ellipse(ctx, x, y, r * 1.35, r * 0.66, p.dust, Math.sin(u * Math.PI) * 0.29 * amount);
      ellipse(ctx, x + r * 0.3, y - r * 0.15, r * 0.8, r * 0.43,
        p.dustLight, Math.sin(u * Math.PI) * 0.16 * amount);
    }
  }
  function rock(ctx, x, y, size, angle, p, alpha, sharp) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    const shape = sharp ? [[-size, 6], [-size * 0.45, -size * 1.8], [size * 0.65, -size * 0.55],
      [size, size * 0.65], [size * 0.1, size]] :
      [[-size, -size * 0.2], [-size * 0.45, -size], [size * 0.65, -size * 0.65], [size, size * 0.4], [-size * 0.3, size * 0.8]];
    polygon(ctx, shape, p.ink, alpha);
    polygon(ctx, shape.map(([a, b]) => [a * 0.85, b * 0.85]), p.stone, alpha);
    polygon(ctx, [[-size * 0.75, -size * 0.2], [-size * 0.35, -size * 0.8],
      [size * 0.52, -size * 0.52], [size * 0.05, size * 0.1]], p.stoneLight, alpha);
    ctx.restore();
  }
  function debris(ctx, t, p, options = {}) {
    if (t < 0 || t > 1) return;
    const count = options.count || 12;
    for (let i = 0; i < count; i++) {
      const angle = i * TAU / count + noise(i + 8) * 0.3;
      const life = 0.48 + noise(i + 17) * 0.38;
      const u = t / life;
      if (u > 1) continue;
      const distance = (options.distance || 140) * (0.6 + noise(i + 21) * 0.4) * out(u);
      const height = Math.sin(u * Math.PI) * (options.height || 70) * (0.5 + noise(i + 47) * 0.7);
      const x = Math.cos(angle) * distance;
      const floorY = Math.sin(angle) * distance * 0.29;
      const size = (options.size || 8) * (0.5 + noise(i + 83) * 0.85);
      if (u > 0.5) continue; /* mock patch: rocks fade/shrink out by the apex, never fall back down */
      const a = Math.min(1, (0.5 - u) * 5);
      ellipse(ctx, x, floorY + 4, size * 0.85, size * 0.22, p.ink, a * 0.25);
      rock(ctx, x, floorY - height, size, (noise(i + 110) - 0.5) * 3 + u * (i % 2 ? 3 : -3), p, a, options.sharp);
    }
  }
  function embers(ctx, t, p, count = 36) {
    if (t < 0 || t > 0.55) return;
    const u = t / 0.55;
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI + noise(i + 730) * Math.PI;
      const speed = 55 + noise(i + 900) * 150;
      const x = Math.cos(ang) * speed * u;
      const y = Math.sin(ang) * speed * u; /* mock patch: no gravity on sparks */
      line(ctx, [[x, y], [x - Math.cos(ang) * 7 * (1 - u), y - Math.sin(ang) * 7 * (1 - u)]],
        i % 5 ? p.bright : p.accent, fade(t, 0.55), i % 3 ? 1.1 : 2);
    }
  }
  function anticipation(ctx, t, p) {
    if (t < 0 || t > 0.12) return;
    const u = t / 0.12;
    ellipse(ctx, 0, 0, 38 - u * 20, 10 - u * 5, p.accent, 0.15 + u * 0.3, 1);
    const y = -204 + Math.pow(u, 3.4) * 206;
    polygon(ctx, [[-3, y], [-7, y - 47], [0, y - 100], [7, y - 47], [3, y]], p.bright, u * 0.8);
  }
  function shock(ctx, t, p) {
    ellipse(ctx, 0, 1, 34 + out(t / 0.16) * 23, 11, p.ink, fade(t, 0.7) * 0.7);
    ring(ctx, t, p, { radius: 160, life: 0.46, width: 16 });
    ring(ctx, t - 0.065, p, { radius: 132, life: 0.43, width: 5 });
    rays(ctx, t, p, 18, 160);
    dust(ctx, t - 0.035, p, 22, 155, 0.8);
    debris(ctx, t, p, { count: 9, height: 44, size: 5, distance: 138 });
    star(ctx, t, p, 1.25);
  }
  function fracture(ctx, t, p) {
    ellipse(ctx, 0, 0, 49, 15, p.ink, fade(t, 1.05) * 0.75);
    cracks(ctx, t, p, { count: 9, radius: 174 });
    ring(ctx, t, p, { radius: 82, life: 0.23, width: 6, broken: true });
    debris(ctx, t, p, { count: 13, height: 46, size: 6, distance: 110 });
    dust(ctx, t + 0.015, p, 18, 135, 0.9);
    star(ctx, t, p, 0.9);
  }
  function shatter(ctx, t, p) {
    ellipse(ctx, 0, 1, 52, 16, p.ink, fade(t, 1) * 0.72);
    if (!p.noCracks) cracks(ctx, t, p, { count: 6, radius: 110 }); /* mock patch: game draws its own earth fissures when palette.noCracks */
    ring(ctx, t, p, { radius: 132, life: 0.31, width: 8, broken: true });
    dust(ctx, t - 0.03, p, 27, 130, 1.1);
    debris(ctx, t, p, { count: 14, height: 133, size: 12, distance: 134, sharp: true });
    embers(ctx, t, p, 29);
    if (t < 0.15) {
      const a = fade(t, 0.15), w = 19 * (1 - t / 0.15);
      polygon(ctx, [[-w, 4], [-5, -122], [0, -177], [6, -99], [w, 4]], p.bright, a * 0.85);
    }
    star(ctx, t, p, 1.05);
  }
  function double(ctx, t, p) {
    ellipse(ctx, 0, 0, 50, 15, p.ink, fade(t, 1) * 0.85);
    const second = t - 0.19;
    ring(ctx, t, p, { radius: 86, life: 0.27, width: 9 });
    star(ctx, t, p, 0.85);
    if (second >= 0) {
      cracks(ctx, second, p, { count: 6, radius: 133 });
      ring(ctx, second, p, { radius: 176, life: 0.48, width: 18, broken: true });
      ring(ctx, second - 0.08, p, { radius: 154, life: 0.42, width: 4 });
      rays(ctx, second, p, 22, 183, 0.3);
      dust(ctx, second - 0.02, p, 25, 167, 0.9);
      debris(ctx, second, p, { count: 11, height: 68, size: 8, distance: 146 });
      star(ctx, second, p, 1.3);
    }
  }
  function draw(ctx, kind, time, options) {
    if (!ctx || !Number.isFinite(time) || time < 0 || time > 1.6) return;
    const o = options || {}, p = o.palette;
    if (!p) throw new Error('SlamVFX.draw requires options.palette');
    const variant = clamp(Math.round(kind), 0, 3);
    ctx.save();
    ctx.translate(o.x || 0, o.y || 0);
    ctx.scale(o.scale || 1, o.scale || 1);
    const age = time - 0.12;
    if (o.shake !== false && age >= 0 && age < 0.18) {
      const s = 3.8 * fade(age, 0.18);
      ctx.translate(Math.sin(age * 197) * s, Math.cos(age * 153) * s * 0.5);
    }
    /* mock patch: anticipation spike from above removed (no beam from above rule) */
    if (age >= 0) [shock, fracture, shatter, double][variant](ctx, age, p);
    ctx.restore();
  }
  scope.SlamVFX = Object.freeze({ draw, duration: 1.6, impactTime: 0.12,
    names: ['압축 충격파', '지면 균열', '파편 폭발', '이중 강타'] });
})(typeof globalThis !== 'undefined' ? globalThis : window);
