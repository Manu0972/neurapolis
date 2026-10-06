/**
 * Locomotion continue (présentation) : le joueur se déplace en mètres, à la troisième personne,
 * relativement à la caméra. La simulation ne voit que la tuile entière (player.pos) : on ne
 * franchit une tuile que si `isWalkable` l'accepte. Logique pure, sans Three.js ni DOM.
 */

export type WalkableFn = (x: number, y: number) => boolean;

export interface BodyState {
  /** Position en mètres (x = est, z = sud). */
  x: number;
  z: number;
  /** Cap en radians (0 = regarde vers -Z, le nord). */
  heading: number;
  /** Vitesse horizontale courante (m/s), lissée. */
  speed: number;
}

export const WALK_SPEED = 3.0;
export const RUN_SPEED = 6.2;
export const BODY_RADIUS = 0.28;

/** Le disque du personnage tient-il entièrement sur des tuiles franchissables ? */
export function fits(x: number, z: number, walkable: WalkableFn, r = BODY_RADIUS): boolean {
  for (const [dx, dz] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]] as const) {
    if (!walkable(Math.floor(x + dx), Math.floor(z + dz))) return false;
  }
  return true;
}

/**
 * Direction monde d'une entrée (ix vers la droite, iy vers le bas de l'écran) pour une caméra
 * placée à l'azimut `camYaw` autour du joueur (0 = caméra au sud, regardant le nord).
 */
export function cameraRelative(ix: number, iy: number, camYaw: number): { x: number; z: number } {
  const fx = -Math.sin(camYaw);
  const fz = -Math.cos(camYaw);
  const rx = -fz;
  const rz = fx;
  let x = fx * -iy + rx * ix;
  let z = fz * -iy + rz * ix;
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return { x, z };
}

/** Cap qui fait regarder le personnage dans la direction (dx, dz). */
export function headingOf(dx: number, dz: number): number {
  return Math.atan2(-dx, -dz);
}

/**
 * Avance le corps d'un pas de temps. Les collisions sont résolues axe par axe, ce qui fait
 * glisser le personnage le long des murs au lieu de le bloquer.
 */
export function stepBody(
  body: BodyState,
  input: { x: number; y: number },
  camYaw: number,
  dt: number,
  running: boolean,
  walkable: WalkableFn,
): BodyState {
  const dir = cameraRelative(input.x, input.y, camYaw);
  const mag = Math.hypot(dir.x, dir.z);
  const targetSpeed = mag > 0.05 ? (running ? RUN_SPEED : WALK_SPEED) * Math.min(1, mag) : 0;
  const accel = targetSpeed > body.speed ? 10 : 14;
  const speed = body.speed + Math.sign(targetSpeed - body.speed) * Math.min(Math.abs(targetSpeed - body.speed), accel * dt);
  let { x, z, heading } = body;
  if (mag > 0.05) heading = headingOf(dir.x, dir.z);
  const vx = mag > 0.05 ? (dir.x / mag) * speed : -Math.sin(heading) * speed;
  const vz = mag > 0.05 ? (dir.z / mag) * speed : -Math.cos(heading) * speed;
  const nx = x + vx * dt;
  if (fits(nx, z, walkable)) x = nx;
  const nz = z + vz * dt;
  if (fits(x, nz, walkable)) z = nz;
  const moved = Math.hypot(x - body.x, z - body.z) / Math.max(dt, 1e-6);
  return { x, z, heading, speed: Math.min(speed, moved + 0.01) };
}

/** Tuile entière occupée par le centre du corps. */
export function tileOf(body: { x: number; z: number }): { x: number; y: number } {
  return { x: Math.floor(body.x), y: Math.floor(body.z) };
}

// ---------- Chemins des PNJ ----------

/**
 * Plus court chemin (8 directions, sans couper les angles) entre deux tuiles, simplifié en
 * segments droits. Renvoie les centres de tuiles à suivre, départ exclu ; [] si inaccessible.
 * Bornée (`maxNodes`) pour ne jamais bloquer une image.
 */
export function findPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  walkable: WalkableFn,
  width: number,
  height: number,
  maxNodes = 120_000,
): { x: number; z: number }[] {
  if (from.x === to.x && from.y === to.y) return [];
  if (!walkable(to.x, to.y)) return [];
  const key = (x: number, y: number): number => y * width + x;
  const prev = new Map<number, number>();
  const startK = key(from.x, from.y);
  prev.set(startK, -1);
  let frontier = [startK];
  let found = false;
  let visited = 0;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
  while (frontier.length && !found && visited < maxNodes) {
    const next: number[] = [];
    for (const k of frontier) {
      const x = k % width;
      const y = Math.floor(k / width);
      for (const [dx, dy] of DIRS) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const nk = key(nx, ny);
        if (prev.has(nk) || !walkable(nx, ny)) continue;
        if (dx !== 0 && dy !== 0 && (!walkable(x + dx, y) || !walkable(x, y + dy))) continue;
        prev.set(nk, k);
        visited++;
        if (nx === to.x && ny === to.y) { found = true; break; }
        next.push(nk);
      }
      if (found) break;
    }
    frontier = next;
  }
  if (!found) return [];
  const tiles: { x: number; y: number }[] = [];
  for (let k = key(to.x, to.y); k !== startK; k = prev.get(k)!) tiles.push({ x: k % width, y: Math.floor(k / width) });
  tiles.reverse();
  // Simplification : on saute les points intermédiaires tant que la ligne droite reste praticable.
  const out: { x: number; z: number }[] = [];
  let anchor = { x: from.x + 0.5, z: from.y + 0.5 };
  let i = 0;
  while (i < tiles.length) {
    let j = i;
    while (j + 1 < tiles.length && clearLine(anchor, { x: tiles[j + 1]!.x + 0.5, z: tiles[j + 1]!.y + 0.5 }, walkable)) j++;
    const p = { x: tiles[j]!.x + 0.5, z: tiles[j]!.y + 0.5 };
    out.push(p);
    anchor = p;
    i = j + 1;
  }
  return out;
}

/** La ligne droite entre deux points ne traverse que des tuiles franchissables (avec une marge). */
export function clearLine(a: { x: number; z: number }, b: { x: number; z: number }, walkable: WalkableFn): boolean {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.ceil(len / 0.35);
  for (let s = 1; s <= steps; s++) {
    const t = s / steps;
    if (!fits(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, walkable, 0.2)) return false;
  }
  return true;
}
