/**
 * NEURAPOLIS — Pipeline personnage : rig (pose) SÉPARÉ du rendu.
 *
 * Étape 1-2 de la direction artistique. Le rig ne dessine RIEN : il calcule une
 * POSE 2D (positions/angles des articulations + signaux d'état). Le renderer prend
 * cette pose et affiche un personnage. Deux renderers :
 *   - drawDebug      : squelette (prototype technique, clairement assumé) ;
 *   - drawCharacter  : pose + assets « sprite » (chaque partie est un pixel-art
 *                      édité, avec contour + ombre + lumière), positionné par la pose.
 *
 * Contrat d'asset (CHARACTER_ART) : chaque partie = { w, h, rows, map } où
 * rows[] est la bitmap (1 char = 1 pixel) et map traduit les chars en couleurs.
 * On peut donc remplacer SAMPLE_ART par de VRAIS sprites d'artiste sans toucher
 * au rig ni à la boucle. Déterministe, zéro dépendance.
 */
(function (global) {
  'use strict';

  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function h2r(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function r2h(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = h2r(a), B = h2r(b); return r2h(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  const light = c => mix(c, '#ffdf9e', 0.35);
  const shade = c => mix(c, '#2c2540', 0.42);

  // ---------- IK 2 segments (le rig) ----------
  function ik2(x1, y1, x2, y2, l1, l2, bend) {
    let dx = x2 - x1, dy = y2 - y1;
    let d = Math.hypot(dx, dy); d = Math.min(d, l1 + l2 - 0.001); if (d < 0.001) d = 0.001;
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const mx = x1 + dx * a / d, my = y1 + dy * a / d;
    const px = -dy / d * h * bend, py = dx / d * h * bend;
    return [mx + px, my + py];
  }

  // ---------- POSE 2D (sortie pure du rig, aucun dessin) ----------
  // Pose = données articulaires + signaux d'état. C'est le contrat animation↔rendu.
  function makeRig(cfg) {
    const s = cfg.scale || 1;
    return {
      scale: s,
      legLen: 16 * s, foot: 4 * s, torso: 13 * s, armLen: 12 * s, headR: 6.5 * s, neck: 2 * s,
      cadence: cfg.cadence || 1, sway: cfg.sway || 1, stepLen: cfg.stepLen || 1,
      col: { skin: cfg.skin || '#eab78a', hair: cfg.hair || '#5b3a29', shirt: cfg.shirt || '#e76f51', pants: cfg.pants || '#3a4a6b', shoes: cfg.shoes || '#2a2a2a' },
    };
  }
  function makeState() {
    return { phase: 0, speed: 0, targetSpeed: 0, breath: Math.random() * 6.28, blink: 3, plantL: 0, plantR: 0, lastQL: 0, lastQR: 0, lookX: 0, lookT: 0 };
  }

  function computePose(rig, st, dt, x, groundY) {
    // transitions de vitesse, phase, pieds plantés (appui réel)
    st.speed += (st.targetSpeed - st.speed) * Math.min(1, dt * 6);
    const stride = 14 * rig.scale * rig.stepLen, v = st.speed;
    st.phase += v * (0.5 * rig.cadence) * dt;
    const C = Math.PI * 2, qL = ((st.phase / C)) % 1, qR = ((st.phase / C) + 0.5) % 1, stance = 0.55;
    if (qL < stance && st.lastQL >= stance) st.plantL = x + stride;
    if (qR < stance && st.lastQR >= stance) st.plantR = x + stride;
    st.lastQL = qL; st.lastQR = qR;
    st.breath += dt * 1.6; st.blink -= dt * (0.3 + Math.random() * 0.02);
    if (st.blink < 0) st.blink = 2.2 + Math.random() * 3;
    if (Math.abs(v) < 1) { st.lookT -= dt; if (st.lookT < 0) { st.lookT = 2 + Math.random() * 4; st.lookX = (Math.random() - 0.5) * 3; } }

    const walking = Math.abs(v) > 1, ph = st.phase;
    const bob = walking ? Math.abs(Math.sin(ph)) * 1.6 * rig.scale * rig.sway : Math.sin(st.breath * 0.9) * 0.4 * rig.scale;
    const hipY = groundY - rig.legLen - bob * 0.6;
    const hipX = x + (walking ? Math.cos(ph) * 1.2 * rig.scale * rig.sway : Math.sin(st.breath * 0.7) * 0.7 * rig.scale);
    const chestY = hipY - rig.torso;
    const neckX = x + (walking ? Math.sin(ph) * 0.8 : Math.sin(st.breath * 0.5) * 0.4) * rig.scale;
    const headX = neckX + (walking ? Math.sin(ph) * 0.3 : Math.sin(st.breath * 0.5) * 0.4) * rig.scale;
    const headY = chestY - rig.neck - rig.headR * 0.6;
    const torsoAngle = walking ? Math.sin(ph) * 0.10 * rig.sway : 0;

    function footP(q, plant) { return q < stance ? { fx: plant, fy: groundY } : { fx: plant + stride * ((q - stance) / (1 - stance)), fy: groundY - Math.sin(Math.PI * ((q - stance) / (1 - stance))) * 5 * rig.scale }; }
    const FL = footP(qL, st.plantL), FR = footP(qR, st.plantR);
    const [kneeLx, kneeLy] = ik2(hipX, hipY, FL.fx, FL.fy - rig.foot, rig.legLen * 0.62, rig.legLen * 0.62, -1);
    const [kneeRx, kneeRy] = ik2(hipX, hipY, FR.fx, FR.fy - rig.foot, rig.legLen * 0.62, rig.legLen * 0.62, -1);
    const armA = walking ? Math.sin(ph) * 0.5 * rig.sway : Math.sin(st.breath) * 0.06;
    function armP(side, ang) {
      const sx = hipX + side * 7 * rig.scale * 0.42, sy = chestY + 1 * rig.scale;
      const tx = sx + Math.sin(ang) * rig.armLen * 0.8, ty = sy + rig.armLen * 0.85 + Math.cos(ang) * 2 * rig.scale;
      const [ex, ey] = ik2(sx, sy, tx, ty, rig.armLen * 0.55, rig.armLen * 0.55, 1);
      return { sx, sy, ex, ey, tx, ty };
    }
    const AR = armP(1, armA), AL = armP(-1, armA + Math.PI);

    return {
      hipX, hipY, chestY, neckX, headX, headY, torsoAngle,
      shoulderL: { x: hipX - 7 * rig.scale * 0.42, y: chestY + rig.scale }, shoulderR: { x: hipX + 7 * rig.scale * 0.42, y: chestY + rig.scale },
      AR, AL, kneeL: { x: kneeLx, y: kneeLy }, kneeR: { x: kneeRx, y: kneeRy },
      footL: { x: FL.fx, y: FL.fy }, footR: { x: FR.fx, y: FR.fy },
      blink: st.blink, lookX: st.lookX, speed: v, walking, phase: ph, groundY,
    };
  }

  // ---------- Renderer 1 : squelette (DEBUG, prototype technique) ----------
  function drawDebug(ctx, pose, rig, pal) {
    function L(a, b, w, c) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    function J(p, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
    L({ x: pose.hipX, y: pose.hipY }, { x: pose.kneeL.x, y: pose.kneeL.y }, 3, '#8a9bb8');
    L({ x: pose.kneeL.x, y: pose.kneeL.y }, { x: pose.footL.x, y: pose.footL.y }, 3, '#8a9bb8');
    L({ x: pose.hipX, y: pose.hipY }, { x: pose.kneeR.x, y: pose.kneeR.y }, 3, '#8a9bb8');
    L({ x: pose.kneeR.x, y: pose.kneeR.y }, { x: pose.footR.x, y: pose.footR.y }, 3, '#8a9bb8');
    L({ x: pose.hipX, y: pose.hipY }, { x: pose.hipX, y: pose.chestY }, 5, '#8a9bb8');
    L(pose.AR, { x: pose.AR.ex, y: pose.AR.ey }, 2.5, '#c15f8a'); L({ x: pose.AR.ex, y: pose.AR.ey }, { x: pose.AR.tx, y: pose.AR.ty }, 2.5, '#c15f8a');
    L(pose.AL, { x: pose.AL.ex, y: pose.AL.ey }, 2.5, '#c15f8a'); L({ x: pose.AL.ex, y: pose.AL.ey }, { x: pose.AL.tx, y: pose.AL.ty }, 2.5, '#c15f8a');
    J({ x: pose.headX, y: pose.headY }, '#ffd98a'); J({ x: pose.hipX, y: pose.hipY }, '#4ea1ff');
    ctx.fillStyle = '#8a9bb8'; ctx.font = '10px monospace'; ctx.fillText('DEBUG', pose.headX + 12, pose.headY - 10);
  }

  // ---------- Contrat d'asset (pixel-art par partie) ----------
  // Remplacer SAMPLE_ART par les sprites d'un artiste, même clés, même format :
  // chaque partie = { w, h, rows:[...], map:{ char -> couleur } }, 'o' = contour.
  const SAMPLE_ART = {
    head: {
      w: 12, h: 12,
      rows: [
        '..oooooooo..',
        '.ohhhhhhhho.',
        '.ohhhhhhhho.',
        'ohhhhhhhhhho',
        'ohhhhhhhhhho',
        'ohssssssssho',
        'ohseesssseho',
        'ohseesssseho',
        'ohssssssssho',
        'ohssmmmmssho',
        '.osssssssso.',
        '..oooooooo..',
      ],
      map: { o: '#3a2a20', h: '#5b3a29', s: '#eab78a', e: '#2a1f18', m: '#b76a55' },
    },
    torso: {
      w: 12, h: 14,
      rows: [
        '..oooooooo..',
        '.otttttttto.',
        '.otttttttto.',
        '.otttttttto.',
        'otttttttttto',
        'otttttttttto',
        'otttttttttto',
        'otttttttttto',
        'otttttttttto',
        'otttttttttto',
        'otttttttttto',
        '.oddddddddo.',
        '.oddddddddo.',
        '..oooooooo..',
      ],
      map: { o: '#3a2a20', t: '#e76f51', d: '#3a4a6b' },
    },
    armUpper: { w: 4, h: 8, rows: ['otoo', 'otoo', 'otoo', 'otoo', 'otoo', 'otoo', 'otoo', 'otoo'], map: { o: '#3a2a20', t: '#e76f51' } },
    armLower: { w: 4, h: 8, rows: ['osoo', 'osoo', 'osoo', 'osoo', 'osoo', 'osoo', 'osoo', 'osoo'], map: { o: '#3a2a20', s: '#eab78a' } },
    legUpper: { w: 5, h: 10, rows: ['opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'opoo'].map(r => 'o' + r + 'o'), map: { o: '#3a2a20', p: '#3a4a6b' } },
    legLower: { w: 5, h: 10, rows: ['opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'opoo', 'oboo', 'oboo', 'oboo'].map(r => 'o' + r + 'o'), map: { o: '#3a2a20', p: '#3a4a6b', b: '#2a2a2a' } },
    foot: { w: 6, h: 3, rows: ['obbbbo', 'obbbbo', 'obbbbo'], map: { o: '#3a2a20', b: '#2a2a2a' } },
  };

  function drawPart(ctx, part, x1, y1, x2, y2, thickness) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    const px = thickness, py = len / part.h;
    ctx.save();
    ctx.translate(x1, y1); ctx.rotate(ang + Math.PI / 2);
    for (let r = 0; r < part.h; r++) {
      const row = part.rows[r];
      for (let c = 0; c < part.w; c++) {
        const ch = row[c]; if (ch === '.') continue;
        ctx.fillStyle = part.map[ch];
        const sx = (c - part.w / 2) * px, sy = (r) * py;
        ctx.fillRect(sx, sy, px + 0.5, py + 0.5);
      }
    }
    ctx.restore();
  }

  function drawCharacter(ctx, pose, rig, art, lightWarm) {
    const col = rig.col;
    // jambes + pieds
    drawPart(ctx, art.legUpper, pose.hipX, pose.hipY, pose.kneeL.x, pose.kneeL.y, 5 * rig.scale);
    drawPart(ctx, art.legLower, pose.kneeL.x, pose.kneeL.y, pose.footL.x, pose.footL.y - rig.foot, 5 * rig.scale);
    drawPart(ctx, art.legUpper, pose.hipX, pose.hipY, pose.kneeR.x, pose.kneeR.y, 5 * rig.scale);
    drawPart(ctx, art.legLower, pose.kneeR.x, pose.kneeR.y, pose.footR.x, pose.footR.y - rig.foot, 5 * rig.scale);
    drawPart(ctx, art.foot, pose.footL.x - 2, pose.footL.y - 2, pose.footL.x + 4, pose.footL.y - 2, 3 * rig.scale);
    drawPart(ctx, art.foot, pose.footR.x - 2, pose.footR.y - 2, pose.footR.x + 4, pose.footR.y - 2, 3 * rig.scale);
    // torse (avec angle)
    ctx.save(); ctx.translate(pose.hipX, pose.chestY + rig.torso * 0.5); ctx.rotate(pose.torsoAngle);
    drawPart(ctx, art.torso, 0, -rig.torso / 2, 0, rig.torso / 2, 13 * rig.scale);
    ctx.restore();
    // bras (derrière puis devant)
    drawPart(ctx, art.armUpper, pose.AL.sx, pose.AL.sy, pose.AL.ex, pose.AL.ey, 4 * rig.scale);
    drawPart(ctx, art.armLower, pose.AL.ex, pose.AL.ey, pose.AL.tx, pose.AL.ty, 4 * rig.scale);
    drawPart(ctx, art.armUpper, pose.AR.sx, pose.AR.sy, pose.AR.ex, pose.AR.ey, 4 * rig.scale);
    drawPart(ctx, art.armLower, pose.AR.ex, pose.AR.ey, pose.AR.tx, pose.AR.ty, 4 * rig.scale);
    // tête (cheveux teintés par la lumière)
    ctx.save();
    ctx.translate(pose.headX, pose.headY);
    drawPart(ctx, art.head, 0, -rig.headR, 0, rig.headR, rig.headR * 2);
    ctx.restore();
  }

  global.NeurPipeline = { makeRig, makeState, computePose, drawDebug, drawCharacter, SAMPLE_ART, mulberry };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.NeurPipeline;
})(typeof window !== 'undefined' ? window : globalThis);
