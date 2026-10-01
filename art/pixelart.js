/**
 * NEURAPOLIS — Moteur de pixel art v2 (philosophie refondue, cf. DESIGN-PHILOSOPHY.md).
 *
 * Rampes à 3 tons avec hue shifting (ombre froide / base / lumière chaude),
 * personnages chibi ombrés, bâtiments à deux faces (lumière/ombre) avec fenêtres
 * chaudes et fumée, ciel en dégradé avec nuages dérivants, vignette chaude.
 * Déterministe (mulberry32), zéro asset externe, zéro dépendance. Canvas 2D.
 */
(function (global) {
  'use strict';

  // ---------- PRNG ----------
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- Couleurs (mélange pour hue shifting) ----------
  function h2r(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function r2h(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = h2r(a), B = h2r(b); return r2h(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const light = c => mix(c, '#ffdf9e', 0.35);   // lumière → chaud
  const shade = c => mix(c, '#2c2540', 0.42);   // ombre → froid (bleu/violet)

  // ---------- Palettes (rampes hue-shiftées) ----------
  const PALETTES = {
    jour: {
      skyTop: '#8fd4ee', skyBottom: '#d9f1f8', cloud: '#ffffff',
      grass: { hi: '#b9d98a', base: '#8fbf5f', lo: '#6e9c48' },
      path: { hi: '#e8d6b0', base: '#d8c49a', lo: '#b79f76' },
      water: { hi: '#bce6f2', base: '#6fb8d6', lo: '#4a90b4' },
      dirt: { hi: '#d8b585', base: '#c9a878', lo: '#a9885c' },
      park: '#9fd27a', flower: ['#f2a5b8', '#f6d365', '#e58fb1'],
      wall: { hi: '#f9ecd0', base: '#efd9ac', lo: '#cfa97f' }, trim: '#c9a06a',
      roof: { hi: '#d97a5f', base: '#c15f4a', lo: '#8f3a34' },
      door: '#8a5a3a', doorDark: '#6a4328',
      window: '#bfe0ee', windowLit: '#ffd98a', frame: '#7a5230',
      outline: '#3a2a20',
      skin: { hi: '#f7d0a0', base: '#eab78a', lo: '#c8916a' },
      pants: '#4a5a7a', shoes: '#3a2a20', smoke: '#e9e4da', accent: '#4ea1ff',
    },
    soir: {
      skyTop: '#f2a26a', skyBottom: '#f7dcc0', cloud: '#ffe9d2',
      grass: { hi: '#a8bd78', base: '#7f9c56', lo: '#5f7c42' },
      path: { hi: '#dcc69e', base: '#c3ae8a', lo: '#9c8662' },
      water: { hi: '#9fc6d8', base: '#5f97b8', lo: '#3f7392' },
      dirt: { hi: '#c5a276', base: '#b08a5f', lo: '#8a6a46' },
      park: '#86ad68', flower: ['#e298a8', '#e8c35a', '#d4849e'],
      wall: { hi: '#eed6b2', base: '#e0c199', lo: '#b8907a' }, trim: '#b58a58',
      roof: { hi: '#cf7054', base: '#a8503c', lo: '#7a3a2c' },
      door: '#7a4d30', doorDark: '#5d3a24',
      window: '#ffd98a', windowLit: '#ffe2a8', frame: '#6b4a2c',
      outline: '#2e211a',
      skin: { hi: '#eec694', base: '#ddab7c', lo: '#b58260' },
      pants: '#40506c', shoes: '#2e211a', smoke: '#e4d4c2', accent: '#4ea1ff',
    },
    nuit: {
      skyTop: '#1c2a4a', skyBottom: '#31486a', cloud: '#3a4a68',
      grass: { hi: '#48603a', base: '#33482c', lo: '#26361f' },
      path: { hi: '#4a4a54', base: '#3a3a44', lo: '#2c2c34' },
      water: { hi: '#31577a', base: '#1f3a52', lo: '#152838' },
      dirt: { hi: '#5a4a3a', base: '#463828', lo: '#32281c' },
      park: '#35573a', flower: ['#6a4a68', '#5a5428', '#5a4060'],
      wall: { hi: '#4a4250', base: '#3a3340', lo: '#2c2732' }, trim: '#4d4350',
      roof: { hi: '#5a3a48', base: '#4a2f3a', lo: '#36232c' },
      door: '#4a3424', doorDark: '#382718',
      window: '#2a3540', windowLit: '#ffd98a', frame: '#3a2e28',
      outline: '#0f0d10',
      skin: { hi: '#d3a582', base: '#bd8f68', lo: '#93674a' },
      pants: '#262c40', shoes: '#12121a', smoke: '#2e3440', accent: '#4ea1ff',
    },
  };

  // ---------- Personnage chibi ombré 16x16 ----------
  const ROWS = [
    '...oooooooooo...',
    '...oHHHHHHHho...',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '...ohhhhhhhho...',
    '...oSSSSSSSSo...',
    '...osesssseso...',
    '...osssmmssso...',
    '...osssssssso...',
    '.....oooooo.....',
    '....otttttto....',
    '...oTttttttto...',
    '...otttttttto...',
    '.....oppppppo...',
    '....opp..ppo....',
    '....bbb..bbb....',
  ];
  const WALK = { 14: '......pppp......', 15: '......bbbb......' };
  const LEGEND = { o: 'outline', h: 'hair', H: 'hairLight', s: 'skin', S: 'skinShadow', e: 'eye', m: 'mouth', t: 'shirt', T: 'shirtShadow', p: 'pants', b: 'shoes' };

  function drawPerson(ctx, x, y, scale, base, frame, pal) {
    const colors = {
      outline: pal.outline, hair: base.hair, hairLight: light(base.hair),
      skin: pal.skin.base, skinShadow: pal.skin.lo, eye: pal.outline, mouth: pal.outline,
      shirt: base.shirt, shirtShadow: shade(base.shirt), pants: base.pants || pal.pants, shoes: base.shoes || pal.shoes,
    };
    const rows = ROWS.slice();
    let bob = 0;
    if (frame === 1) { rows[14] = WALK[14]; rows[15] = WALK[15]; bob = -scale; }
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row.charAt(c); if (ch === '.') continue;
        ctx.fillStyle = colors[LEGEND[ch]];
        ctx.fillRect(x + c * scale, y + bob + r * scale, scale, scale);
      }
    }
  }

  // ---------- Tuiles (rampes hue-shiftées) ----------
  function drawTile(ctx, x, y, u, kind, pal, rnd, t) {
    const px = x * u, py = y * u, s = Math.max(1, Math.round(u / 16));
    function speck(col, n, w, h) { for (let i = 0; i < n; i++) { ctx.fillStyle = col; ctx.fillRect(px + Math.floor(rnd() * u), py + Math.floor(rnd() * u), w, h); } }
    ctx.fillStyle = pal.grass.base; ctx.fillRect(px, py, u, u);
    switch (kind) {
      case 'grass': speck(pal.grass.lo, 7, s, s); speck(pal.grass.hi, 3, s, s * 2); break;
      case 'path':
        ctx.fillStyle = pal.path.base; ctx.fillRect(px, py, u, u);
        for (let gx = 0; gx < u; gx += s * 4) for (let gy = 0; gy < u; gy += s * 4) {
          ctx.fillStyle = rnd() < 0.5 ? pal.path.hi : pal.path.lo;
          ctx.fillRect(px + gx + (rnd() * 2 - 1) * s, py + gy + (rnd() * 2 - 1) * s, s * 3, s * 3);
        }
        break;
      case 'water':
        ctx.fillStyle = pal.water.base; ctx.fillRect(px, py, u, u);
        ctx.fillStyle = pal.water.lo; ctx.fillRect(px, py, u, s * 2); ctx.fillRect(px, py + u - s * 2, u, s * 2);
        ctx.fillStyle = pal.water.hi;
        for (let i = 0; i < 3; i++) ctx.fillRect(px + s * 2, py + s * 3 + i * s * 4 + (t % 2 === 0 ? 0 : s), u - s * 4, s);
        break;
      case 'park':
        ctx.fillStyle = pal.park; ctx.fillRect(px, py, u, u);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = pal.flower[i % 3]; ctx.fillRect(px + s * 2 + Math.floor(rnd() * (u - s * 4)), py + s * 2 + Math.floor(rnd() * (u - s * 4)), s * 2, s * 2); }
        break;
      case 'dirt': ctx.fillStyle = pal.dirt.base; ctx.fillRect(px, py, u, u); speck(pal.dirt.lo, 5, s * 2, s * 2); speck(pal.dirt.hi, 2, s * 2, s); break;
      default: speck(pal.grass.lo, 4, s, s);
    }
  }

  // ---------- Bâtiments (deux faces + fenêtres chaudes + fumée) ----------
  function R(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  function O(ctx, x, y, w, h, c) { ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); }
  function wall3(ctx, x, y, w, h, pal) { R(ctx, x, y, w, h, pal.wall.base); R(ctx, x, y, w, h * 0.25, pal.wall.hi); R(ctx, x + w * 0.7, y, w * 0.3, h, pal.wall.lo); O(ctx, x, y, w, h, pal.outline); }
  function smoke(ctx, x, y, t, pal) { ctx.fillStyle = pal.smoke; for (let i = 0; i < 3; i++) { const o = ((t + i * 3) % 18); ctx.globalAlpha = 0.5 - i * 0.12; ctx.fillRect(x + (i % 2) * 2 - 2, y - o, 5 - i, 5 - i); } ctx.globalAlpha = 1; }

  function drawBuilding(ctx, kind, x, y, u, pal, t, lit) {
    const s = Math.max(2, Math.round(u / 16));
    const X = x, Y = y;
    switch (kind) {
      case 'maison': {
        // cheminée + fumée
        R(ctx, X + s * 22, Y + s * 2, s * 4, s * 5, pal.wall.lo); R(ctx, X + s * 21, Y + s * 1, s * 6, s * 2, pal.trim);
        smoke(ctx, X + s * 24, Y + s * 1, t, pal);
        // toit (ombre / base / lumière)
        ctx.fillStyle = pal.roof.base; ctx.beginPath(); ctx.moveTo(X + s, Y + s * 6); ctx.lineTo(X + s * 16, Y - s); ctx.lineTo(X + s * 31, Y + s * 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = pal.roof.lo; ctx.beginPath(); ctx.moveTo(X + s * 16, Y - s); ctx.lineTo(X + s * 31, Y + s * 6); ctx.lineTo(X + s * 22, Y + s * 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = pal.roof.hi; ctx.beginPath(); ctx.moveTo(X + s, Y + s * 6); ctx.lineTo(X + s * 16, Y - s); ctx.lineTo(X + s * 9, Y + s * 6); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = pal.outline; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X + s, Y + s * 6); ctx.lineTo(X + s * 16, Y - s); ctx.lineTo(X + s * 31, Y + s * 6); ctx.stroke();
        // murs
        wall3(ctx, X + s * 3, Y + s * 6, s * 26, s * 18, pal);
        // porte + fenêtres
        R(ctx, X + s * 13, Y + s * 15, s * 6, s * 9, pal.door); R(ctx, X + s * 13, Y + s * 15, s * 6, s * 9, pal.door); R(ctx, X + s * 13, Y + s * 15, s * 6, s * 9, pal.door);
        R(ctx, X + s * 6, Y + s * 9, s * 5, s * 5, lit ? pal.windowLit : pal.window); R(ctx, X + s * 6 + s, Y + s * 9 + s, s * 3, s * 3, pal.frame); ctx.fillStyle = pal.frame; ctx.fillRect(X + s * 6, Y + s * 9, s * 5, s); ctx.fillRect(X + s * 6, Y + s * 9, s, s * 5);
        R(ctx, X + s * 21, Y + s * 9, s * 5, s * 5, lit ? pal.windowLit : pal.window); ctx.fillStyle = pal.frame; ctx.fillRect(X + s * 21, Y + s * 9, s * 5, s); ctx.fillRect(X + s * 21, Y + s * 9, s, s * 5);
        R(ctx, X + s * 13, Y + s * 15, s * 6, s * 3, pal.doorDark); R(ctx, X + s * 16, Y + s * 19, s, s, '#ffd98a');
        // buisson + fleurs
        ctx.fillStyle = pal.grass.lo; ctx.fillRect(X + s * 1, Y + s * 22, s * 8, s * 3); ctx.fillRect(X + s * 2, Y + s * 20, s * 6, s * 3);
        ctx.fillStyle = pal.flower[0]; ctx.fillRect(X + s * 2, Y + s * 19, s * 2, s * 2); ctx.fillStyle = pal.flower[1]; ctx.fillRect(X + s * 6, Y + s * 20, s * 2, s * 2);
        break;
      }
      case 'college': {
        wall3(ctx, X + s * 2, Y + s * 5, s * 30, s * 20, pal);
        R(ctx, X + s * 2, Y + s * 4, s * 30, s * 2, pal.roof.base); R(ctx, X + s * 23, Y + s * 4, s * 9, s * 2, pal.roof.lo); R(ctx, X + s * 2, Y + s * 4, s * 9, s * 2, pal.roof.hi);
        for (let i = 0; i < 4; i++) { R(ctx, X + s * (6 + i * 7), Y + s * 8, s * 4, s * 6, lit ? pal.windowLit : pal.window); ctx.fillStyle = pal.frame; ctx.fillRect(X + s * (6 + i * 7), Y + s * 8, s * 4, s); }
        R(ctx, X + s * 15, Y + s * 15, s * 6, s * 9, pal.door); R(ctx, X + s * 15, Y + s * 15, s * 6, s * 2, pal.doorDark);
        ctx.fillStyle = pal.outline; ctx.fillRect(X + s * 16, Y + s * 3, s * 2, s * 6);
        ctx.fillStyle = pal.accent; ctx.fillRect(X + s * 16, Y + s * 1, s * 9, s * 3);
        break;
      }
      case 'epicerie': {
        wall3(ctx, X + s * 3, Y + s * 6, s * 26, s * 18, pal);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? pal.roof.base : pal.wall.hi; ctx.fillRect(X + s * (3 + i * 4), Y + s * 5, s * 4, s * 3); }
        R(ctx, X + s * 3, Y + s * 2, s * 26, s * 3, pal.roof.base); R(ctx, X + s * 3, Y + s * 2, s * 9, s * 3, pal.roof.hi); R(ctx, X + s * 20, Y + s * 2, s * 9, s * 3, pal.roof.lo);
        R(ctx, X + s * 13, Y + s * 13, s * 6, s * 11, pal.door); R(ctx, X + s * 13, Y + s * 13, s * 6, s * 2, pal.doorDark);
        R(ctx, X + s * 5, Y + s * 10, s * 5, s * 5, lit ? pal.windowLit : pal.window); ctx.fillStyle = pal.frame; ctx.fillRect(X + s * 5, Y + s * 10, s * 5, s);
        R(ctx, X + s * 3, Y + s * 24, s * 8, s * 3, pal.path.lo); R(ctx, X + s * 21, Y + s * 24, s * 8, s * 3, pal.path.lo);
        ctx.fillStyle = pal.flower[2]; ctx.fillRect(X + s * 4, Y + s * 22, s * 2, s * 2); ctx.fillStyle = pal.grass.lo; ctx.fillRect(X + s * 22, Y + s * 22, s * 5, s * 2);
        break;
      }
      case 'arbre': {
        R(ctx, X + s * 13, Y + s * 13, s * 6, s * 13, pal.door); R(ctx, X + s * 13, Y + s * 13, s * 2, s * 13, pal.doorDark);
        const tops = [[16, 11, 11, 0], [8, 15, 8, 1], [24, 15, 8, 1], [16, 17, 9, 2]];
        for (const c of tops) { ctx.fillStyle = [pal.grass.hi, pal.grass.base, pal.grass.lo][c[3]]; ctx.beginPath(); ctx.arc(X + s * c[0], Y + s * c[1], s * c[2], 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = pal.grass.lo; ctx.fillRect(X + s * 12, Y + s * 26, s * 8, s * 2);
        break;
      }
      case 'friche': {
        wall3(ctx, X + s * 2, Y + s * 8, s * 28, s * 16, { wall: { base: '#8a9298', hi: '#9aa2a8', lo: '#5f666c' }, outline: pal.outline });
        for (let i = 0; i < 3; i++) { R(ctx, X + s * (5 + i * 8), Y + s * 10, s * 5, s * 5, pal.window); ctx.fillStyle = pal.outline; ctx.fillRect(X + s * (6 + i * 8), Y + s * 10, s * 2, s * 5); }
        R(ctx, X + s * 3, Y + s * 4, s * 12, s * 5, pal.roof.base); R(ctx, X + s * 3, Y + s * 4, s * 4, s * 5, pal.roof.hi); R(ctx, X + s * 11, Y + s * 4, s * 4, s * 5, pal.roof.lo);
        R(ctx, X + s * 17, Y + s * 3, s * 10, s * 6, pal.roof.base); R(ctx, X + s * 23, Y + s * 3, s * 4, s * 6, pal.roof.lo);
        ctx.fillStyle = pal.grass.lo; for (let i = 0; i < 4; i++) ctx.fillRect(X + s * (4 + i * 7), Y + s * 24, s * 2, s * 4);
        break;
      }
      case 'lampadaire': {
        ctx.fillStyle = pal.outline; ctx.fillRect(X + s * 15, Y + s * 8, s * 3, s * 20); ctx.fillRect(X + s * 12, Y + s * 28, s * 9, s * 3);
        ctx.fillStyle = lit ? pal.windowLit : pal.window; ctx.beginPath(); ctx.arc(X + s * 16, Y + s * 8, s * 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = pal.outline; ctx.lineWidth = 1; ctx.stroke();
        if (lit) { ctx.fillStyle = 'rgba(255,217,138,0.16)'; ctx.beginPath(); ctx.arc(X + s * 16, Y + s * 8, s * 9, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
    }
  }

  // ---------- Carte & scène ----------
  function buildMap(W, H) {
    const map = []; for (let y = 0; y < H; y++) { const r = []; for (let x = 0; x < W; x++) r.push('grass'); map.push(r); }
    function put(x0, y0, x1, y1, k) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) map[y][x] = k; }
    put(2, 3, 17, 3, 'path');   // chemin principal
    put(4, 4, 7, 4, 'path');
    put(2, 6, 5, 7, 'water');   // mare
    put(14, 6, 16, 7, 'park');
    put(12, 1, 13, 1, 'dirt');
    return map;
  }
  const MAP = buildMap(20, 8);
  const SKY_ROWS = 2;

  function renderScene(canvas, paletteName, t) {
    const pal = PALETTES[paletteName] || PALETTES.jour;
    const ctx = canvas.getContext('2d');
    const W = 20, H = MAP.length, u = Math.floor(canvas.width / W);
    canvas.height = u * (H + SKY_ROWS);

    // ciel en dégradé + nuages
    const skyH = u * SKY_ROWS;
    const g = ctx.createLinearGradient(0, 0, 0, skyH);
    g.addColorStop(0, pal.skyTop); g.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, skyH);
    ctx.fillStyle = pal.cloud;
    for (let i = 0; i < 4; i++) {
      const cx = ((t * 0.3 + i * 260) % (canvas.width + 200)) - 100;
      const cy = skyH * (0.25 + 0.2 * (i % 2));
      ctx.beginPath(); ctx.ellipse(cx, cy, 46, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx - 28, cy + 3, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    }

    // sol
    const rnd = mulberry(1234);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) drawTile(ctx, x, y + SKY_ROWS, u, MAP[y][x], pal, rnd, t);

    const lit = paletteName !== 'jour';
    const buildings = [
      ['maison', 5, 2], ['college', 10, 2], ['epicerie', 14, 3], ['arbre', 2, 1], ['friche', 16, 0], ['lampadaire', 8, 5],
    ];
    for (const b of buildings) drawBuilding(ctx, b[0], b[1] * u, (b[2] + SKY_ROWS) * u, u, pal, t, lit);

    const sc = Math.max(2, Math.round(u / 16));
    const people = [
      { cx: 3, row: 3, c: { hair: '#5b3a29', shirt: '#e76f51' }, ph: 0.0, spd: 1.6 },
      { cx: 6, row: 3, c: { hair: '#1f1f2e', shirt: '#3fa7d6' }, ph: 1.2, spd: 1.1 },
      { cx: 9, row: 3, c: { hair: '#c98a3a', shirt: '#6a9e4a' }, ph: 2.6, spd: 1.3 },
      { cx: 12, row: 3, c: { hair: '#3a3a4a', shirt: '#c15f8a' }, ph: 4.0, spd: 0.9 },
      { cx: 15, row: 3, c: { hair: '#8a5a3a', shirt: '#4ea1ff' }, ph: 5.3, spd: 1.4 },
    ];
    for (const p of people) {
      const tx = p.cx + Math.sin(t * 0.04 * p.spd + p.ph) * 2.2;
      const px = tx * u - sc * 8, py = (p.row + SKY_ROWS) * u - sc * 14 + u;
      drawPerson(ctx, px, py, sc, p.c, Math.floor(t * 0.06) % 2, pal);
    }
    const pxx = 9 * u - sc * 8, pyy = (6 + SKY_ROWS) * u - sc * 14 + u;
    drawPerson(ctx, pxx, pyy, sc, { hair: '#2a2a3a', shirt: '#4ea1ff' }, 0, pal);
    ctx.strokeStyle = pal.accent; ctx.lineWidth = Math.max(1, sc); ctx.strokeRect(pxx - sc, pyy - sc, sc * 18, sc * 18);

    // vignette chaude
    const v = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.width * 0.25, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(30,18,10,0.30)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  global.NeurArt = { PALETTES, renderScene, drawPerson, drawBuilding, drawTile, mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.NeurArt;
})(typeof window !== 'undefined' ? window : globalThis);
