/**
 * Réglage d'accessibilité « Réduire les animations » (mémorisé dans ce navigateur).
 * Par défaut, il suit la préférence du système (prefers-reduced-motion). Actif : pas de
 * secousse de caméra, pas de rebond des boutons ni de pulsation, pièces sans envol.
 */
const KEY = 'neurapolis.reduceMotion';
const listeners = new Set<(v: boolean) => void>();

function systemPrefers(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function load(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch { /* stockage indisponible */ }
  return systemPrefers();
}

let reduce = typeof window === 'undefined' ? false : load();

function apply(): void {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('reduce-motion', reduce);
}
apply();

export function reduceMotion(): boolean { return reduce; }

export function setReduceMotion(v: boolean): void {
  reduce = v;
  try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* stockage indisponible */ }
  apply();
  listeners.forEach((cb) => cb(v));
}

export function onReduceMotion(cb: (v: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Ajoute la case « Réduire les animations » au panneau Son (sous les volumes). */
export function mountMotionToggle(box: HTMLElement): HTMLElement {
  const row = document.createElement('label');
  row.className = 'mc-mute';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = reduce;
  cb.addEventListener('change', () => setReduceMotion(cb.checked));
  row.append(cb, document.createTextNode('Réduire les animations (secousses, rebonds)'));
  const now = box.querySelector('.mc-now');
  if (now) box.insertBefore(row, now);
  else box.appendChild(row);
  return box;
}
