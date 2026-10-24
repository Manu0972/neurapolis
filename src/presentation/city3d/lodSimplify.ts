/**
 * Version lointaine d'un modèle Kenney (niveau de détail simplifié), calculée au chargement.
 *
 * Une simplification par fusion de sommets troue les murs de ces modèles (les murs sont découpés
 * autour des fenêtres) : on construit plutôt une maquette sans trou de quelques dizaines de
 * triangles, fidèle à la silhouette et aux teintes :
 * - murs : la boîte des faces verticales (hors marches et clôtures), teinte de mur la plus étendue ;
 * - toit : à deux pans le long du grand côté si le modèle a un toit en pente, sinon plat ;
 * - fenêtres : quelques vitres posées sur les murs (identifiants > 0 : elles s'allument la nuit
 *   comme les vraies, windows.ts), ou des murs entièrement vitrés découpés en grille (tours).
 * Les attributs sont ceux des modèles (position, normal, uv, aWin) : même matériau, même shader.
 */
import * as THREE from 'three';

export type ProxyWindows = 'discrete' | 'grid' | 'none';

/** Teinte la plus étendue (uv de la palette) parmi des faces, pondérée par l'aire. */
class UvVote {
  private areas = new Map<string, { a: number; u: number; v: number }>();
  add(u: number, v: number, area: number): void {
    const k = `${Math.round(u * 512)}:${Math.round(v * 512)}`;
    const e = this.areas.get(k);
    if (e) e.a += area;
    else this.areas.set(k, { a: area, u, v });
  }
  get total(): number { let t = 0; for (const e of this.areas.values()) t += e.a; return t; }
  best(): [number, number] | null {
    let b: { a: number; u: number; v: number } | null = null;
    for (const e of this.areas.values()) if (!b || e.a > b.a) b = e;
    return b ? [b.u, b.v] : null;
  }
}

interface Builder { pos: number[]; nrm: number[]; uv: number[]; win: number[] }

function quad(b: Builder, p: THREE.Vector3[], n: THREE.Vector3, uv: [number, number], win: [number, number]): void {
  // p : quatre coins dans l'ordre anti-horaire vu de l'extérieur.
  for (const i of [0, 1, 2, 0, 2, 3]) {
    const q = p[i]!;
    b.pos.push(q.x, q.y, q.z);
    b.nrm.push(n.x, n.y, n.z);
    b.uv.push(uv[0], uv[1]);
    b.win.push(win[0], win[1]);
  }
}

function tri(b: Builder, p: THREE.Vector3[], n: THREE.Vector3, uv: [number, number]): void {
  for (const q of p) {
    b.pos.push(q.x, q.y, q.z);
    b.nrm.push(n.x, n.y, n.z);
    b.uv.push(uv[0], uv[1]);
    b.win.push(0, -1);
  }
}

/** Plus petite valeur au-dessus du quantile `q` (pondéré) d'une liste (valeur, poids). */
function weightedQuantile(values: { v: number; w: number }[], q: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a.v - b.v);
  const total = s.reduce((t, e) => t + e.w, 0);
  let acc = 0;
  for (const e of s) {
    acc += e.w;
    if (acc >= total * q) return e.v;
  }
  return s[s.length - 1]!.v;
}

/**
 * Maquette lointaine d'un modèle (pied en y = 0). `windows` : vitres posées (maisons), murs vitrés
 * en grille (tours) ou aucune.
 */
export function buildProxyGeometry(geo: THREE.BufferGeometry, windows: ProxyWindows): THREE.BufferGeometry {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute | undefined;
  const aWin = geo.getAttribute('aWin') as THREE.BufferAttribute | undefined;
  const index = geo.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;
  const wall = new UvVote();
  const glass = new UvVote();
  const roof = new UvVote();
  const flat = new UvVote();
  const roofY: { v: number; w: number }[] = [];
  let maxY = 0;
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3();
  const wallPts: { x: number; z: number; y: number }[] = [];
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
    n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
    const area = n.length() / 2;
    if (area < 1e-9) continue;
    n.normalize();
    maxY = Math.max(maxY, a.y, b.y, c.y);
    const u = uv ? uv.getX(i0) : 0;
    const v = uv ? uv.getY(i0) : 0;
    const isWin = aWin ? Math.abs(aWin.getX(i0)) > 0.5 : false;
    if (Math.abs(n.y) < 0.25) {
      if (isWin) glass.add(u, v, area);
      else wall.add(u, v, area);
      for (const p of [a, b, c]) wallPts.push({ x: p.x, z: p.z, y: p.y });
    } else if (n.y >= 0.25 && n.y < 0.97) {
      roof.add(u, v, area);
      roofY.push({ v: Math.min(a.y, b.y, c.y), w: area });
    } else if (n.y >= 0.97) {
      flat.add(u, v, area);
    }
  }
  // Emprise des murs : on écarte le bas (marches, clôtures, perrons) pour ne garder que le corps du bâtiment.
  const cut = maxY * 0.3;
  for (const p of wallPts) {
    if (p.y < cut) continue;
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z);
  }
  if (!Number.isFinite(x0)) {
    if (!geo.boundingBox) geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    x0 = bb.min.x; x1 = bb.max.x; z0 = bb.min.z; z1 = bb.max.z;
  }
  const wallUv = wall.best() ?? flat.best() ?? [0.5, 0.5];
  const glassUv = glass.best() ?? wallUv;
  const footprint = (x1 - x0) * (z1 - z0);
  const sloped = roof.total > footprint * 0.25;
  const roofUv = (sloped ? roof.best() : flat.best()) ?? wallUv;
  const eave = sloped ? Math.max(maxY * 0.35, weightedQuantile(roofY, 0.1)) : maxY;

  const B: Builder = { pos: [], nrm: [], uv: [], win: [] };
  const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);
  const wallWin: [number, number] = windows === 'grid' ? [-1, -1] : [0, -1];
  const wallTint = windows === 'grid' ? glassUv : wallUv;
  // Quatre murs (normales vers l'extérieur).
  const walls: { p: THREE.Vector3[]; n: THREE.Vector3; len: number; o: THREE.Vector3; d: THREE.Vector3 }[] = [
    { p: [V(x0, 0, z1), V(x1, 0, z1), V(x1, eave, z1), V(x0, eave, z1)], n: V(0, 0, 1), len: x1 - x0, o: V(x0, 0, z1), d: V(1, 0, 0) },
    { p: [V(x1, 0, z0), V(x0, 0, z0), V(x0, eave, z0), V(x1, eave, z0)], n: V(0, 0, -1), len: x1 - x0, o: V(x1, 0, z0), d: V(-1, 0, 0) },
    { p: [V(x1, 0, z1), V(x1, 0, z0), V(x1, eave, z0), V(x1, eave, z1)], n: V(1, 0, 0), len: z1 - z0, o: V(x1, 0, z1), d: V(0, 0, -1) },
    { p: [V(x0, 0, z0), V(x0, 0, z1), V(x0, eave, z1), V(x0, eave, z0)], n: V(-1, 0, 0), len: z1 - z0, o: V(x0, 0, z0), d: V(0, 0, 1) },
  ];
  for (const w of walls) quad(B, w.p, w.n, wallTint, wallWin);

  // Toit.
  if (sloped) {
    const alongX = x1 - x0 >= z1 - z0;
    const ridge = maxY;
    const rise = ridge - eave;
    if (alongX) {
      // Faîtage le long de x : pans sud et nord ; normale (0, demi-profondeur, ±montée).
      const zm = (z0 + z1) / 2;
      const hz = z1 - zm;
      quad(B, [V(x0, eave, z1), V(x1, eave, z1), V(x1, ridge, zm), V(x0, ridge, zm)], V(0, hz, rise).normalize(), roofUv, [0, -1]);
      quad(B, [V(x1, eave, z0), V(x0, eave, z0), V(x0, ridge, zm), V(x1, ridge, zm)], V(0, hz, -rise).normalize(), roofUv, [0, -1]);
      tri(B, [V(x1, eave, z1), V(x1, eave, z0), V(x1, ridge, zm)], V(1, 0, 0), wallUv);
      tri(B, [V(x0, eave, z0), V(x0, eave, z1), V(x0, ridge, zm)], V(-1, 0, 0), wallUv);
    } else {
      const xm = (x0 + x1) / 2;
      const hx = x1 - xm;
      quad(B, [V(x1, eave, z1), V(x1, eave, z0), V(xm, ridge, z0), V(xm, ridge, z1)], V(rise, hx, 0).normalize(), roofUv, [0, -1]);
      quad(B, [V(x0, eave, z0), V(x0, eave, z1), V(xm, ridge, z1), V(xm, ridge, z0)], V(-rise, hx, 0).normalize(), roofUv, [0, -1]);
      tri(B, [V(x0, eave, z1), V(x1, eave, z1), V(xm, ridge, z1)], V(0, 0, 1), wallUv);
      tri(B, [V(x1, eave, z0), V(x0, eave, z0), V(xm, ridge, z0)], V(0, 0, -1), wallUv);
    }
  } else {
    quad(B, [V(x0, eave, z1), V(x1, eave, z1), V(x1, eave, z0), V(x0, eave, z0)], V(0, 1, 0), roofUv, [0, -1]);
  }

  // Vitres posées sur les murs (maisons) : une ou deux rangées, légèrement en saillie.
  if (windows === 'discrete') {
    const minSide = Math.min(x1 - x0, z1 - z0);
    const rows = eave > minSide * 0.45 ? 2 : 1;
    const h = (eave / rows) * 0.38;
    const off = Math.max(x1 - x0, z1 - z0) * 0.004;
    let id = 1;
    for (const w of walls) {
      const per = Math.max(1, Math.floor(w.len / (h * 2.4)));
      const ww = Math.min(h * 0.9, (w.len / per) * 0.5);
      for (let r = 0; r < rows; r++) {
        const yc = (eave / rows) * (r + 0.55);
        for (let k = 0; k < per; k++) {
          const s = (w.len / per) * (k + 0.5);
          const c0 = w.o.clone().addScaledVector(w.d, s).addScaledVector(w.n, off);
          const p = [
            c0.clone().addScaledVector(w.d, -ww / 2).setY(yc - h / 2),
            c0.clone().addScaledVector(w.d, ww / 2).setY(yc - h / 2),
            c0.clone().addScaledVector(w.d, ww / 2).setY(yc + h / 2),
            c0.clone().addScaledVector(w.d, -ww / 2).setY(yc + h / 2),
          ];
          quad(B, p, w.n, glassUv, [id++, -1]);
        }
      }
    }
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(B.nrm, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
  out.setAttribute('aWin', new THREE.Float32BufferAttribute(B.win, 2));
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

/** Nombre de triangles d'une géométrie (indexée ou non). */
export function triangleCount(geo: THREE.BufferGeometry): number {
  const index = geo.getIndex();
  return (index ? index.count : (geo.getAttribute('position')?.count ?? 0)) / 3;
}
