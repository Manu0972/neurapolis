/**
 * NEURAPOLIS — Façades Modulaires et Décors Urbains 2.5D.
 *
 * Spécifications et moteurs de rendu graphique pour les lieux emblématiques :
 * - Place des Roses & Marché
 * - Épicerie Bertin (crépi chaud, store banne corail rayé, caisses maraîchères, vitrine 1800K)
 * - Friche Taret & Ateliers (briques rouges industrielles, verrières patinées, enseigne murale, outillage)
 * - Quais du Canal (berges en pierre moussue, péniche amarrée « L'Égalité Flottante », reflets dorés)
 * - Concepts & tuiles des 4 nouveaux quartiers : Canal & Docks, Les Hauts, Bassin Industriel, Souterrains.
 */
import {
  OUTLINE,
  HYGGE_1800K,
  HYGGE_LIGHT,
  SHADOW_COOL,
  WOOD_WARM,
  INK_WARM,
  PALETTE_RAMPS,
} from '../palette';

export type FacadeKind =
  | 'roses'
  | 'bertin'
  | 'friche'
  | 'canal'
  | 'docks'
  | 'hauts'
  | 'bassin'
  | 'souterrains';

export interface DistrictArchitecturalConcept {
  readonly id: FacadeKind;
  readonly districtName: string;
  readonly dominantMaterials: readonly string[];
  readonly architecturalStyle: string;
  readonly ambientLightingKelvin: number;
  readonly keyVisualProps: readonly string[];
}

export const DISTRICT_ARCHITECTURAL_CONCEPTS: Record<FacadeKind, DistrictArchitecturalConcept> = {
  roses: {
    id: 'roses',
    districtName: 'Place des Roses',
    dominantMaterials: ['Crépi calcaire chaud', 'Tuiles terracotta', 'Ferronnerie sombre'],
    architecturalStyle: 'Cité-jardin populaire du début XXe siècle, arcades et venelles piétonnes',
    ambientLightingKelvin: 1800,
    keyVisualProps: ['Fontaine centrale', 'Étal de marché aux légumes', 'Bancs publics sous les platanes'],
  },
  bertin: {
    id: 'bertin',
    districtName: 'Épicerie Bertin',
    dominantMaterials: ['Crépi sable doré', 'Tissu auvent rayé corail/écru', 'Caisses maraîchères en bois'],
    architecturalStyle: 'Boutique de rez-de-chaussée traditionnelle avec vitrine à petits carreaux',
    ambientLightingKelvin: 1800,
    keyVisualProps: ['Store banne festonné', 'Paniers de fruits et légumes frais', 'Lanterne de devanture'],
  },
  friche: {
    id: 'friche',
    districtName: 'La Friche Taret & Ateliers',
    dominantMaterials: ['Brique rouge industrielle patinée', 'Verrières à croisillons métalliques', 'Charpente chêne'],
    architecturalStyle: 'Architecture industrielle fin XIXe reconvertie en tiers-lieu autogéré',
    ambientLightingKelvin: 2200,
    keyVisualProps: ['Enseigne murale peinte TARET COOP', 'Établis de menuiserie', 'Vélos et remorques appuyés'],
  },
  canal: {
    id: 'canal',
    districtName: 'Quais du Canal de Val-Ferrand',
    dominantMaterials: ['Pierre de taille en granit moussue', 'Fer forgé goudronné', 'Bois de chêne fluvial'],
    architecturalStyle: 'Berges navigables avec bittes d\'amarrage et perrés inclinés',
    ambientLightingKelvin: 1900,
    keyVisualProps: ['Péniche associative « L\'Égalité Flottante »', 'Anneaux d\'amarrage en fonte', 'Réverbères de quai'],
  },
  docks: {
    id: 'docks',
    districtName: 'Le Canal & Docks Désaffectés',
    dominantMaterials: ['Palplanches et pieux de bois goudronné', 'Bardage métallique rouillé', 'Bollards fonte'],
    architecturalStyle: 'Port fluvial industriel reconverti en zone associative et logistique douce',
    ambientLightingKelvin: 1900,
    keyVisualProps: ['Grues manuelles à engrenages', 'Pontons flottants sur flotteurs', 'Péniches de café équitable'],
  },
  hauts: {
    id: 'hauts',
    districtName: 'Les Hauts de Val-Ferrand',
    dominantMaterials: ['Brique claire', 'Balcons suspendus en treillis', 'Terreau et végétaux de toiture'],
    architecturalStyle: 'Cité d\'immeubles étagés avec toits-terrasses partagés et panorama plongeant',
    ambientLightingKelvin: 2400,
    keyVisualProps: ['Serres maraîchères sur toit', 'Antennes râteau et mât de radio pirate', 'Lignes de linge flottant'],
  },
  bassin: {
    id: 'bassin',
    districtName: 'Bassin Industriel Nord',
    dominantMaterials: ['Sheds en briques sombres', 'Profilés IPN en acier riveté', 'Verre armé opaque'],
    architecturalStyle: 'Grandes nefs manufacturières reconverties en fablabs et centrales solaires',
    ambientLightingKelvin: 2100,
    keyVisualProps: ['Cheminée d\'usine monumentale', 'Rails de wagonnets incrustés', 'Panneaux solaires citoyens'],
  },
  souterrains: {
    id: 'souterrains',
    districtName: 'Les Souterrains & Caves Voûtées',
    dominantMaterials: ['Calcaire rustique taillé', 'Mortier de chaux', 'Tonneaux et traverses de chêne'],
    architecturalStyle: 'Caves séculaires et galeries de carriers communicantes sous la cité',
    ambientLightingKelvin: 1600,
    keyVisualProps: ['Voûtes en plein cintre', 'Niches à bougies cireuses', 'Champignonnières clandestines'],
  },
};

/**
 * Dessine une façade architecturale 2.5D complète alignée sur la grille logique de tuiles.
 * @param ctx Contexte 2D
 * @param x Coordonnée X de l'ancrage bas-gauche
 * @param y Coordonnée Y de l'ancrage bas (niveau du sol)
 * @param kind Type de façade
 * @param scale Échelle de rendu (ex. 2 pour tuile 32px)
 * @param isDark Mode soirée / nuit (allume les fenêtres et lueurs)
 * @param now Horodatage en millisecondes pour animations (clapotis, flammes)
 */
export function drawFacade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  kind: FacadeKind,
  scale: number,
  isDark = false,
  now = 0,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const u = Math.max(1, Math.round(scale));
  const w = 48 * u;
  const h = 40 * u;
  const topY = y - h;

  switch (kind) {
    case 'bertin':
      drawEpicerieBertin(ctx, x, y, w, h, u, isDark, now);
      break;
    case 'friche':
      drawFricheTaret(ctx, x, y, w, h, u, isDark, now);
      break;
    case 'canal':
    case 'docks':
      drawQuaisCanal(ctx, x, y, w, h, u, isDark, now);
      break;
    case 'hauts':
      drawHautsValFerrand(ctx, x, y, w, h, u, isDark, now);
      break;
    case 'bassin':
      drawBassinIndustriel(ctx, x, y, w, h, u, isDark, now);
      break;
    case 'souterrains':
      drawSouterrainsCaves(ctx, x, y, w, h, u, isDark, now);
      break;
    case 'roses':
    default:
      drawPlaceRoses(ctx, x, y, w, h, u, isDark, now);
      break;
  }

  ctx.restore();
}

/* ── 1. Épicerie Bertin ────────────────────────────────────────── */

function drawEpicerieBertin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  isDark: boolean,
  now: number,
): void {
  const topY = y - h;

  // 1. Mur en crépi calcaire chaud
  ctx.fillStyle = PALETTE_RAMPS.wallPlaster.base; // #efd9ac
  ctx.fillRect(x, topY, w, h);

  // Ombre de corniche supérieure
  ctx.fillStyle = PALETTE_RAMPS.wallPlaster.shadow; // #cfa97f
  ctx.fillRect(x, topY, w, 3 * u);

  // Toiture tuiles terracotta au-dessus
  ctx.fillStyle = PALETTE_RAMPS.brickRoof.base; // #c15f4a
  ctx.fillRect(x - 2 * u, topY - 4 * u, w + 4 * u, 4 * u);
  ctx.fillStyle = OUTLINE;
  ctx.strokeRect(x - 2 * u, topY - 4 * u, w + 4 * u, 4 * u);

  // 2. Fenêtre d'étage
  const winW = 10 * u;
  const winH = 12 * u;
  const winX = x + 6 * u;
  const winY = topY + 6 * u;

  ctx.fillStyle = OUTLINE;
  ctx.fillRect(winX - u, winY - u, winW + 2 * u, winH + 2 * u);
  ctx.fillStyle = isDark ? HYGGE_1800K : '#4a5a7a';
  ctx.fillRect(winX, winY, winW, winH);

  // Croisillons de fenêtre
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(winX + winW / 2 - u / 2, winY, u, winH);
  ctx.fillRect(winX, winY + winH / 2 - u / 2, winW, u);

  // 3. Enseigne peinte « ÉPICERIE BERTIN »
  const signX = x + 20 * u;
  const signY = topY + 7 * u;
  const signW = 24 * u;
  const signH = 8 * u;

  ctx.fillStyle = WOOD_WARM; // #8a5a3a
  ctx.fillRect(signX - u, signY - u, signW + 2 * u, signH + 2 * u);
  ctx.fillStyle = OUTLINE;
  ctx.strokeRect(signX - u, signY - u, signW + 2 * u, signH + 2 * u);

  ctx.fillStyle = INK_WARM;
  ctx.font = `bold ${Math.max(6, Math.floor(4 * u))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BERTIN', signX + signW / 2, signY + signH / 2);

  // 4. Store banne festonné rayé corail (#f48c5d) et crème (#f9ecd0)
  const awningY = topY + 18 * u;
  const awningH = 7 * u;
  const numStripes = 8;
  const stripeW = w / numStripes;

  for (let i = 0; i < numStripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? PALETTE_RAMPS.coral.base : INK_WARM;
    ctx.fillRect(x + i * stripeW, awningY, stripeW, awningH);
  }
  // Bordure inférieure du store (feston)
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(x, awningY + awningH - u, w, u);

  // 5. Vitrine de rez-de-chaussée chaleureusement éclairée le soir (1800K)
  const shopWinX = x + 4 * u;
  const shopWinY = awningY + awningH + u;
  const shopWinW = 24 * u;
  const shopWinH = 13 * u;

  ctx.fillStyle = OUTLINE;
  ctx.fillRect(shopWinX - u, shopWinY - u, shopWinW + 2 * u, shopWinH + 2 * u);
  ctx.fillStyle = isDark ? HYGGE_1800K : '#7fa8c4';
  ctx.fillRect(shopWinX, shopWinY, shopWinW, shopWinH);

  if (isDark) {
    // Halo doux de vitrine vers l'extérieur
    const glow = ctx.createRadialGradient(
      shopWinX + shopWinW / 2,
      shopWinY + shopWinH / 2,
      2,
      shopWinX + shopWinW / 2,
      shopWinY + shopWinH / 2,
      shopWinW,
    );
    glow.addColorStop(0, 'rgba(255, 217, 138, 0.4)');
    glow.addColorStop(1, 'rgba(255, 217, 138, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(shopWinX - 6 * u, shopWinY - 4 * u, shopWinW + 12 * u, shopWinH + 10 * u);
  }

  // 6. Porte d'entrée en chêne
  const doorX = x + 32 * u;
  const doorY = awningY + awningH + u;
  const doorW = 12 * u;
  const doorH = 14 * u;

  ctx.fillStyle = WOOD_WARM;
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.fillStyle = OUTLINE;
  ctx.strokeRect(doorX, doorY, doorW, doorH);
  // Poignée laiton
  ctx.fillStyle = HYGGE_1800K;
  ctx.fillRect(doorX + 2 * u, doorY + doorH / 2, 2 * u, 2 * u);

  // 7. Caisses maraîchères de fruits et légumes devant la boutique
  const crateW = 8 * u;
  const crateH = 5 * u;
  const crateX = shopWinX + u;
  const crateY = y - crateH;

  ctx.fillStyle = PALETTE_RAMPS.wood.base;
  ctx.fillRect(crateX, crateY, crateW, crateH);
  ctx.fillStyle = OUTLINE;
  ctx.strokeRect(crateX, crateY, crateW, crateH);

  // Légumes (pommes corail, poireaux verts, carottes orange)
  ctx.fillStyle = PALETTE_RAMPS.coral.base; // pommes
  ctx.fillRect(crateX + u, crateY - u, 2 * u, 2 * u);
  ctx.fillStyle = PALETTE_RAMPS.foliage.base; // poireaux
  ctx.fillRect(crateX + 4 * u, crateY - 2 * u, 2 * u, 3 * u);
}

/* ── 2. La Friche Taret & Ateliers ─────────────────────────────── */

function drawFricheTaret(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  isDark: boolean,
  now: number,
): void {
  const topY = y - h;

  // 1. Façade en briques rouges industrielles patinées
  ctx.fillStyle = PALETTE_RAMPS.brickRoof.shadow; // #8f3a34
  ctx.fillRect(x, topY, w, h);

  // Lignes de joints de briques
  ctx.fillStyle = '#6b2d28';
  for (let by = topY + 4 * u; by < y; by += 4 * u) {
    ctx.fillRect(x, by, w, u);
  }

  // 2. Grandes verrières d'atelier patinées avec carreaux réparés
  const glassW = 34 * u;
  const glassH = 16 * u;
  const glassX = x + 7 * u;
  const glassY = topY + 6 * u;

  ctx.fillStyle = OUTLINE;
  ctx.fillRect(glassX - u, glassY - u, glassW + 2 * u, glassH + 2 * u);
  ctx.fillStyle = isDark ? 'rgba(255, 217, 138, 0.75)' : '#454a59';
  ctx.fillRect(glassX, glassY, glassW, glassH);

  // Montants métalliques de verrière
  ctx.fillStyle = OUTLINE;
  for (let gx = glassX + 6 * u; gx < glassX + glassW; gx += 6 * u) {
    ctx.fillRect(gx, glassY, u, glassH);
  }
  ctx.fillRect(glassX, glassY + glassH / 2, glassW, u);

  // 3. Enseigne murale peinte patinée « TARET & FILS COOP »
  const signY = glassY + glassH + 3 * u;
  ctx.fillStyle = '#d8c49a';
  ctx.font = `bold ${Math.max(5, Math.floor(3.5 * u))}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('TARET & FILS COOP', x + w / 2, signY);

  // 4. Établi en bois d'artisan adossé au mur
  const benchW = 18 * u;
  const benchH = 6 * u;
  const benchX = x + 4 * u;
  const benchY = y - benchH;

  ctx.fillStyle = WOOD_WARM;
  ctx.fillRect(benchX, benchY, benchW, benchH);
  ctx.fillStyle = OUTLINE;
  ctx.strokeRect(benchX, benchY, benchW, benchH);

  // Étau métallique sur l'établi
  ctx.fillStyle = PALETTE_RAMPS.metal.base;
  ctx.fillRect(benchX + 2 * u, benchY - 3 * u, 4 * u, 3 * u);

  // 5. Vélo vintage appuyé contre le mur
  const bikeX = x + 30 * u;
  const bikeY = y - 8 * u;
  ctx.strokeStyle = PALETTE_RAMPS.coral.base;
  ctx.lineWidth = Math.max(1, u);
  ctx.beginPath();
  ctx.arc(bikeX, y - 4 * u, 4 * u, 0, Math.PI * 2); // roue arrière
  ctx.arc(bikeX + 10 * u, y - 4 * u, 4 * u, 0, Math.PI * 2); // roue avant
  ctx.stroke();
  // Cadre
  ctx.beginPath();
  ctx.moveTo(bikeX, y - 4 * u);
  ctx.lineTo(bikeX + 5 * u, bikeY);
  ctx.lineTo(bikeX + 10 * u, y - 4 * u);
  ctx.stroke();
}

/* ── 3. Quais du Canal & Docks ─────────────────────────────────── */

function drawQuaisCanal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  isDark: boolean,
  now: number,
): void {
  const topY = y - h;

  // 1. Berges en pierre de taille moussue
  ctx.fillStyle = PALETTE_RAMPS.wallPlaster.shadow; // #cfa97f
  ctx.fillRect(x, topY, w, h * 0.65);

  // Mousse verdoyante le long du quai
  ctx.fillStyle = PALETTE_RAMPS.foliage.shadow; // #257179
  for (let px = x; px < x + w; px += 5 * u) {
    ctx.fillRect(px, topY + h * 0.58, 4 * u, 2 * u);
  }

  // 2. Anneaux d'amarrage et bollard de fonte
  const bollardX = x + 10 * u;
  const bollardY = topY + h * 0.52;
  ctx.fillStyle = OUTLINE;
  ctx.fillRect(bollardX, bollardY, 4 * u, 6 * u);
  ctx.beginPath();
  ctx.arc(bollardX + 2 * u, bollardY, 3 * u, 0, Math.PI * 2);
  ctx.fill();

  // 3. Eau du canal avec miroitement animé
  const waterY = topY + h * 0.65;
  const waterH = h * 0.35;
  ctx.fillStyle = PALETTE_RAMPS.water.shadow; // #223852
  ctx.fillRect(x, waterY, w, waterH);

  // Vaguelettes animées
  ctx.fillStyle = PALETTE_RAMPS.water.base; // #41a6f6
  const waveShift = Math.floor((now * 0.05) % (8 * u));
  for (let wy = waterY + 3 * u; wy < y; wy += 4 * u) {
    for (let wx = x - 8 * u + waveShift; wx < x + w; wx += 12 * u) {
      ctx.fillRect(wx, wy, 5 * u, u);
    }
  }

  // 4. Péniche associative « L'Égalité Flottante »
  const boatX = x + 18 * u;
  const boatY = waterY + 2 * u;
  const boatW = 26 * u;
  const boatH = 9 * u;

  // Coque
  ctx.fillStyle = WOOD_WARM;
  ctx.beginPath();
  ctx.moveTo(boatX, boatY);
  ctx.lineTo(boatX + boatW - 4 * u, boatY);
  ctx.lineTo(boatX + boatW, boatY + boatH);
  ctx.lineTo(boatX + 2 * u, boatY + boatH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  // Cabine
  const cabX = boatX + 4 * u;
  const cabY = boatY - 5 * u;
  const cabW = 14 * u;
  const cabH = 5 * u;
  ctx.fillStyle = INK_WARM;
  ctx.fillRect(cabX, cabY, cabW, cabH);
  ctx.strokeRect(cabX, cabY, cabW, cabH);

  // Hublot rond allumé
  ctx.fillStyle = isDark ? HYGGE_1800K : '#41a6f6';
  ctx.beginPath();
  ctx.arc(cabX + 4 * u, cabY + 2.5 * u, 1.8 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cheminée fumante
  const chimX = cabX + 11 * u;
  const chimY = cabY - 3 * u;
  ctx.fillStyle = PALETTE_RAMPS.metal.shadow;
  ctx.fillRect(chimX, chimY, 2 * u, 3 * u);

  // Volutes de fumée
  ctx.fillStyle = 'rgba(249, 236, 208, 0.6)';
  const puff = Math.sin(now * 0.003) * u;
  ctx.beginPath();
  ctx.arc(chimX + u + puff, chimY - 2 * u, 1.5 * u, 0, Math.PI * 2);
  ctx.arc(chimX + 2 * u - puff, chimY - 5 * u, 2.2 * u, 0, Math.PI * 2);
  ctx.fill();
}

/* ── 4. Les Hauts de Val-Ferrand ───────────────────────────────── */

function drawHautsValFerrand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  isDark: boolean,
  now: number,
): void {
  const topY = y - h;

  // 1. Façade d'immeuble résidentiel
  ctx.fillStyle = PALETTE_RAMPS.wallPlaster.base;
  ctx.fillRect(x, topY, w, h);

  // 2. Balcon suspendu en fer forgé
  const balcY = topY + 16 * u;
  const balcH = 8 * u;
  ctx.fillStyle = PALETTE_RAMPS.metal.shadow;
  ctx.fillRect(x + 6 * u, balcY, 36 * u, u);
  ctx.fillRect(x + 6 * u, balcY + balcH, 36 * u, u);
  for (let bx = x + 8 * u; bx < x + 40 * u; bx += 3 * u) {
    ctx.fillRect(bx, balcY, u, balcH);
  }

  // 3. Toiture terrasse végétalisée (bacs potagers & ruches)
  const roofY = topY - 5 * u;
  ctx.fillStyle = PALETTE_RAMPS.foliage.base;
  ctx.fillRect(x + 4 * u, roofY, 20 * u, 5 * u);
  ctx.fillStyle = PALETTE_RAMPS.wood.base;
  ctx.strokeRect(x + 4 * u, roofY, 20 * u, 5 * u);

  // 4. Mât de radio pirate & antennes
  const antX = x + 36 * u;
  ctx.fillStyle = PALETTE_RAMPS.metal.light;
  ctx.fillRect(antX, topY - 16 * u, u, 16 * u); // mât
  // Traverse d'antenne
  ctx.fillRect(antX - 3 * u, topY - 14 * u, 7 * u, u);
  ctx.fillRect(antX - 5 * u, topY - 10 * u, 11 * u, u);

  // Fenêtres illuminées
  ctx.fillStyle = isDark ? HYGGE_1800K : '#4a5a7a';
  ctx.fillRect(x + 10 * u, topY + 6 * u, 8 * u, 8 * u);
  ctx.fillRect(x + 28 * u, topY + 6 * u, 8 * u, 8 * u);
}

/* ── 5. Bassin Industriel Nord ─────────────────────────────────── */

function drawBassinIndustriel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  isDark: boolean,
  now: number,
): void {
  const topY = y - h;

  // 1. Murs en brique sombre
  ctx.fillStyle = '#6b2d28';
  ctx.fillRect(x, topY, w, h);

  // 2. Toit en shed (dents de scie industrielles)
  ctx.fillStyle = PALETTE_RAMPS.metal.shadow;
  ctx.beginPath();
  ctx.moveTo(x, topY);
  ctx.lineTo(x + w / 2, topY - 8 * u);
  ctx.lineTo(x + w / 2, topY);
  ctx.lineTo(x + w, topY - 8 * u);
  ctx.lineTo(x + w, topY);
  ctx.closePath();
  ctx.fill();

  // Verrière de shed
  ctx.fillStyle = isDark ? HYGGE_1800K : '#7fa8c4';
  ctx.fillRect(x + w / 2 - 2 * u, topY - 7 * u, 2 * u, 7 * u);
  ctx.fillRect(x + w - 2 * u, topY - 7 * u, 2 * u, 7 * u);

  // 3. Panneaux solaires citoyens sur toiture
  ctx.fillStyle = '#243250';
  ctx.fillRect(x + 4 * u, topY + 4 * u, 16 * u, 6 * u);
  ctx.strokeStyle = '#73eff7';
  ctx.lineWidth = Math.max(1, u / 2);
  ctx.strokeRect(x + 4 * u, topY + 4 * u, 16 * u, 6 * u);

  // 4. Rails incrustés au sol devant la manufacture
  ctx.fillStyle = PALETTE_RAMPS.metal.light;
  ctx.fillRect(x, y - 2 * u, w, u);
  ctx.fillRect(x, y - 4 * u, w, u);
}

/* ── 6. Souterrains & Caves Voûtées ────────────────────────────── */

function drawSouterrainsCaves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  isDark: boolean,
  now: number,
): void {
  const topY = y - h;

  // Fond de roche / calcaire brut
  ctx.fillStyle = SHADOW_COOL; // #2c2540
  ctx.fillRect(x, topY, w, h);

  // Voûte en plein cintre en moellons de calcaire
  ctx.fillStyle = PALETTE_RAMPS.wallPlaster.shadow; // #cfa97f
  ctx.beginPath();
  ctx.arc(x + w / 2, topY + 16 * u, 18 * u, Math.PI, 0);
  ctx.lineWidth = 3 * u;
  ctx.strokeStyle = PALETTE_RAMPS.wallPlaster.base;
  ctx.stroke();

  // Niche creusée dans la pierre avec bougie cireuse
  const nicheX = x + 8 * u;
  const nicheY = topY + 18 * u;
  ctx.fillStyle = '#1c1828';
  ctx.fillRect(nicheX, nicheY, 6 * u, 8 * u);

  // Flamme de bougie vacillante
  const flicker = Math.sin(now * 0.008) * u;
  ctx.fillStyle = HYGGE_1800K;
  ctx.beginPath();
  ctx.arc(nicheX + 3 * u + flicker * 0.4, nicheY + 3 * u, 2 * u, 0, Math.PI * 2);
  ctx.fill();

  // Fûts de chêne empilés
  const barrelX = x + 30 * u;
  const barrelY = y - 10 * u;
  ctx.fillStyle = WOOD_WARM;
  ctx.fillRect(barrelX, barrelY, 12 * u, 10 * u);
  ctx.strokeStyle = PALETTE_RAMPS.metal.shadow;
  ctx.strokeRect(barrelX, barrelY, 12 * u, 10 * u);
}

/* ── 7. Place des Roses & Marché ───────────────────────────────── */

function drawPlaceRoses(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  u: number,
  isDark: boolean,
  now: number,
): void {
  const topY = y - h;

  // Façade crépi
  ctx.fillStyle = PALETTE_RAMPS.wallPlaster.base;
  ctx.fillRect(x, topY, w, h);

  // Toiture tuiles
  ctx.fillStyle = PALETTE_RAMPS.brickRoof.base;
  ctx.fillRect(x - u, topY - 4 * u, w + 2 * u, 4 * u);

  // Fenêtres avec croisillons
  const winW = 8 * u;
  const winH = 10 * u;
  for (let i = 0; i < 2; i++) {
    const wx = x + 8 * u + i * 22 * u;
    const wy = topY + 8 * u;
    ctx.fillStyle = isDark ? HYGGE_1800K : '#4a5a7a';
    ctx.fillRect(wx, wy, winW, winH);
    ctx.strokeStyle = OUTLINE;
    ctx.strokeRect(wx, wy, winW, winH);
  }

  // Lampions de fête suspendus
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(x, topY + 22 * u);
  ctx.quadraticCurveTo(x + w / 2, topY + 26 * u, x + w, topY + 22 * u);
  ctx.stroke();

  // Ampoules lampions
  const colors = [HYGGE_1800K, PALETTE_RAMPS.coral.base, PALETTE_RAMPS.foliage.light];
  for (let i = 1; i <= 5; i++) {
    const lx = x + (i * w) / 6;
    const ly = topY + 24 * u;
    ctx.fillStyle = colors[i % colors.length]!;
    ctx.beginPath();
    ctx.arc(lx, ly, 1.8 * u, 0, Math.PI * 2);
    ctx.fill();
  }
}
