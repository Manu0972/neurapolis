/**
 * Entrées : clavier (ZQSD / WASD / flèches, E = interagir) + tactile
 * (joystick virtuel + bouton d'action). Lit l'intention, n'écrit jamais l'état.
 */
const KEY_DIRS: Record<string, readonly [number, number]> = {
  KeyW: [0, -1], KeyZ: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], KeyQ: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

export interface InputApi {
  dir(): { x: number; y: number };
  destroy(): void;
}

export function createInput(root: HTMLElement, onInteract: () => void): InputApi {
  const pressed = new Set<string>();
  let joy = { x: 0, y: 0 };

  const onDown = (e: KeyboardEvent): void => {
    if (e.code === 'KeyE') {
      onInteract();
      e.preventDefault();
      return;
    }
    if (KEY_DIRS[e.code]) {
      pressed.add(e.code);
      e.preventDefault();
    }
  };
  const onUp = (e: KeyboardEvent): void => {
    pressed.delete(e.code);
  };
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);

  const zone = root.querySelector<HTMLElement>('.joy-zone');
  const btn = root.querySelector<HTMLElement>('.action-btn');
  const detachJoy = zone
    ? attachJoystick(zone, (v) => { joy = v; })
    : () => undefined;
  const onPress = (): void => onInteract();
  btn?.addEventListener('pointerdown', onPress);

  return {
    dir: () => {
      let x = 0;
      let y = 0;
      for (const k of pressed) {
        const d = KEY_DIRS[k];
        if (d) { x += d[0]; y += d[1]; }
      }
      if (x === 0 && y === 0) { x = joy.x; y = joy.y; }
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      return { x: Math.sign(x), y: Math.sign(y) };
    },
    destroy: () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      btn?.removeEventListener('pointerdown', onPress);
      detachJoy();
    },
  };
}

/** Joystick virtuel : le vecteur est relatif au centre de la zone, zone morte intégrée. */
export function attachJoystick(
  zone: HTMLElement,
  onVector: (v: { x: number; y: number }) => void,
): () => void {
  const knob = document.createElement('div');
  knob.className = 'joy-knob';
  zone.appendChild(knob);
  let pointerId: number | null = null;
  const R = 46;

  const set = (dx: number, dy: number): void => {
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    onVector({ x: dx / R, y: dy / R });
  };
  const down = (e: PointerEvent): void => {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    zone.setPointerCapture(e.pointerId);
    zone.classList.add('active');
    set(0, 0);
  };
  const move = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    const r = zone.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2);
    let dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len < 8) { set(0, 0); return; }
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    set(dx, dy);
  };
  const up = (e: PointerEvent): void => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    zone.classList.remove('active');
    set(0, 0);
  };

  zone.addEventListener('pointerdown', down);
  zone.addEventListener('pointermove', move);
  zone.addEventListener('pointerup', up);
  zone.addEventListener('pointercancel', up);
  return () => {
    zone.removeEventListener('pointerdown', down);
    zone.removeEventListener('pointermove', move);
    zone.removeEventListener('pointerup', up);
    zone.removeEventListener('pointercancel', up);
    knob.remove();
  };
}
