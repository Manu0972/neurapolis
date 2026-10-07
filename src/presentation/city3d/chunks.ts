/**
 * Découpage de la ville en blocs de 128 m (grande carte, 2026-10-07).
 *
 * La scène est construite d'un bloc (maillages fusionnés par matériau), puis redécoupée ici :
 * chaque triangle va dans le bloc de son centre, chaque instance (arbre, banc, lampadaire) dans
 * le bloc de sa position. Chaque bloc a ses volumes englobants : la carte graphique ne dessine
 * que ceux qui sont dans le champ, et `updateChunkVisibility` masque ceux au-delà du brouillard.
 */
import * as THREE from 'three';

export const CHUNK = 128;

export interface CityChunk {
  key: string;
  cx: number;
  cz: number;
  group: THREE.Group;
}

const keyOf = (x: number, z: number): string => `${Math.floor(x / CHUNK)},${Math.floor(z / CHUNK)}`;

function chunkFor(chunks: Map<string, CityChunk>, root: THREE.Group, x: number, z: number): CityChunk {
  const key = keyOf(x, z);
  let c = chunks.get(key);
  if (!c) {
    const [i, j] = key.split(',').map(Number) as [number, number];
    const group = new THREE.Group();
    group.name = `bloc ${key}`;
    c = { key, cx: (i + 0.5) * CHUNK, cz: (j + 0.5) * CHUNK, group };
    chunks.set(key, c);
    root.add(group);
  }
  return c;
}

/**
 * Sépare une géométrie en sous-géométries par bloc (centre de chaque triangle).
 * Rapide : un sommet est réutilisé tant qu'il reste dans le même bloc (tableaux compacts,
 * aucune table de hachage par sommet) ; un sommet partagé entre deux blocs est dupliqué.
 */
function splitGeometry(geo: THREE.BufferGeometry, matrix: THREE.Matrix4): Map<string, THREE.BufferGeometry> {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const index = geo.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;
  const names = Object.keys(geo.attributes);
  const attrs = names.map((n) => geo.getAttribute(n) as THREE.BufferAttribute);
  const identity = matrix.equals(new THREE.Matrix4());
  const vChunk = new Int32Array(pos.count).fill(-1);
  const vNew = new Int32Array(pos.count);
  const keys: string[] = [];
  const keyId = new Map<string, number>();
  const outs: { idx: number[]; data: number[][]; n: number }[] = [];
  const pa = pos.array;
  const v = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    let sx = (pa[i0 * 3]! + pa[i1 * 3]! + pa[i2 * 3]!) / 3;
    let sz = (pa[i0 * 3 + 2]! + pa[i1 * 3 + 2]! + pa[i2 * 3 + 2]!) / 3;
    if (!identity) {
      v.set(sx, (pa[i0 * 3 + 1]! + pa[i1 * 3 + 1]! + pa[i2 * 3 + 1]!) / 3, sz).applyMatrix4(matrix);
      sx = v.x;
      sz = v.z;
    }
    const key = keyOf(sx, sz);
    let cid = keyId.get(key);
    if (cid === undefined) {
      cid = keys.length;
      keys.push(key);
      keyId.set(key, cid);
      outs.push({ idx: [], data: attrs.map(() => []), n: 0 });
    }
    const o = outs[cid]!;
    for (const vi of [i0, i1, i2]) {
      if (vChunk[vi] !== cid) {
        vChunk[vi] = cid;
        vNew[vi] = o.n++;
        attrs.forEach((at, ai) => {
          const arr = o.data[ai]!;
          const base = vi * at.itemSize;
          for (let c = 0; c < at.itemSize; c++) arr.push(at.array[base + c]!);
        });
      }
      o.idx.push(vNew[vi]!);
    }
  }
  const out = new Map<string, THREE.BufferGeometry>();
  outs.forEach((o, cid) => {
    const g = new THREE.BufferGeometry();
    attrs.forEach((at, ai) => g.setAttribute(names[ai]!, new THREE.Float32BufferAttribute(o.data[ai]!, at.itemSize, at.normalized)));
    g.setIndex(o.n > 65535 ? new THREE.Uint32BufferAttribute(o.idx, 1) : new THREE.Uint16BufferAttribute(o.idx, 1));
    g.computeBoundingSphere();
    out.set(keys[cid]!, g);
  });
  return out;
}

/**
 * Redécoupe en blocs les enfants de `group` (maillages fusionnés, instances, sprites, objets).
 * `keep` : objets à laisser tels quels (eau du canal, décor lointain).
 * Renvoie les blocs et la table de correspondance ancien maillage → maillages des blocs.
 */
export function chunkify(group: THREE.Group, keep: Set<THREE.Object3D>): { chunks: CityChunk[]; remapped: Map<THREE.Mesh, THREE.Mesh[]> } {
  const chunks = new Map<string, CityChunk>();
  const remapped = new Map<THREE.Mesh, THREE.Mesh[]>();
  const children = group.children.slice();
  const m4 = new THREE.Matrix4();
  for (const child of children) {
    if (keep.has(child)) continue;
    child.updateMatrix();
    if (child instanceof THREE.InstancedMesh) {
      // Instances réparties par bloc.
      const byKey = new Map<string, number[]>();
      const p = new THREE.Vector3();
      for (let i = 0; i < child.count; i++) {
        child.getMatrixAt(i, m4);
        p.setFromMatrixPosition(m4);
        const key = keyOf(p.x, p.z);
        (byKey.get(key) ?? byKey.set(key, []).get(key)!).push(i);
      }
      for (const [key, ids] of byKey) {
        const [i0, j0] = key.split(',').map(Number) as [number, number];
        const im = new THREE.InstancedMesh(child.geometry, child.material, ids.length);
        im.castShadow = child.castShadow;
        im.receiveShadow = child.receiveShadow;
        ids.forEach((src, k) => {
          child.getMatrixAt(src, m4);
          im.setMatrixAt(k, m4);
          if (child.instanceColor) {
            const c = new THREE.Color();
            child.getColorAt(src, c);
            im.setColorAt(k, c);
          }
        });
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
        chunkFor(chunks, group, (i0 + 0.5) * CHUNK, (j0 + 0.5) * CHUNK).group.add(im);
      }
      group.remove(child);
      continue;
    }
    if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry && !child.geometry.boundingSphere?.radius) child.geometry.computeBoundingSphere();
    if (child instanceof THREE.Mesh && (child.geometry.boundingSphere?.radius ?? 0) > CHUNK) {
      // Grand maillage fusionné : découpé triangle par triangle.
      const parts = splitGeometry(child.geometry, child.matrix);
      const list: THREE.Mesh[] = [];
      for (const [key, g] of parts) {
        const [i0, j0] = key.split(',').map(Number) as [number, number];
        const m = new THREE.Mesh(g, child.material);
        m.castShadow = child.castShadow;
        m.receiveShadow = child.receiveShadow;
        m.renderOrder = child.renderOrder;
        chunkFor(chunks, group, (i0 + 0.5) * CHUNK, (j0 + 0.5) * CHUNK).group.add(m);
        list.push(m);
      }
      remapped.set(child, list);
      child.geometry.dispose();
      group.remove(child);
      continue;
    }
    // Petit objet (enseigne, sprite, fontaine…) : rangé dans le bloc de sa position.
    const wp = new THREE.Vector3();
    child.getWorldPosition(wp);
    const c = chunkFor(chunks, group, wp.x, wp.z);
    group.remove(child);
    c.group.add(child);
  }
  return { chunks: [...chunks.values()], remapped };
}

/** Masque les blocs au-delà de `radius` mètres de la caméra (le brouillard les cache déjà). */
export function updateChunkVisibility(chunks: readonly CityChunk[], camX: number, camZ: number, radius: number): void {
  const r = radius + CHUNK * 0.75;
  const r2 = r * r;
  for (const c of chunks) {
    const dx = c.cx - camX;
    const dz = c.cz - camZ;
    c.group.visible = dx * dx + dz * dz <= r2;
  }
}
